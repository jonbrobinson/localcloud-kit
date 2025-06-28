#!/bin/bash

# LocalStack Resource Creation Script
# Creates S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=${PROJECT_NAME:-"localstack-template"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be one of: dev, uat, prod${NC}"
    exit 1
fi

# Resource names
NAME_PREFIX="${PROJECT_NAME}-${ENVIRONMENT}"
S3_BUCKET="${NAME_PREFIX}-s3-bucket"
DYNAMODB_TABLE="${NAME_PREFIX}-dynamodb-table"
LAMBDA_FUNCTION="${NAME_PREFIX}-lambda-function"
IAM_ROLE="${NAME_PREFIX}-lambda-role"
API_GATEWAY="${NAME_PREFIX}-api"

# AWS CLI base command
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Store created resources
CREATED_RESOURCES=()

log() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ✗ ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] ⚠ ${message}${NC}"
            ;;
        *)
            echo -e "${BLUE}[${timestamp}] ℹ ${message}${NC}"
            ;;
    esac
}

create_lambda_function_code() {
    log "Creating Lambda function code..."
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    local lambda_file="${temp_dir}/index.py"
    
    # Create Lambda function code
    cat > "$lambda_file" << 'EOF'
import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    """
    Lambda function handler that responds to API Gateway requests
    and demonstrates interaction with S3 and DynamoDB
    """
    
    # Get environment variables
    s3_bucket_name = os.environ.get('S3_BUCKET_NAME')
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    environment = os.environ.get('ENVIRONMENT')
    
    # Initialize AWS clients
    s3_client = boto3.client('s3')
    dynamodb_client = boto3.client('dynamodb')
    
    try:
        # Create a simple response
        response_data = {
            'message': f'Hello from {environment} environment!',
            'timestamp': datetime.now().isoformat(),
            'resources': {
                's3_bucket': s3_bucket_name,
                'dynamodb_table': dynamodb_table
            },
            'event': event
        }
        
        # Store some data in DynamoDB
        item = {
            'id': {'S': f"request-{datetime.now().isoformat()}"},
            'message': {'S': response_data['message']},
            'timestamp': {'S': response_data['timestamp']},
            'environment': {'S': environment}
        }
        
        dynamodb_client.put_item(
            TableName=dynamodb_table,
            Item=item
        )
        
        # Store response in S3
        s3_client.put_object(
            Bucket=s3_bucket_name,
            Key=f"responses/{datetime.now().isoformat()}.json",
            Body=json.dumps(response_data, indent=2),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data, indent=2)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            }, indent=2)
        }
EOF
    
    # Create zip file
    local zip_file="${temp_dir}/lambda_function.zip"
    cd "$temp_dir"
    zip -q "$zip_file" index.py
    
    echo "$zip_file"
}

create_s3_bucket() {
    log "Creating S3 bucket: $S3_BUCKET"
    
    # Check if bucket already exists
    if $AWS_CMD s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1; then
        log "S3 bucket already exists: $S3_BUCKET" "WARNING"
        CREATED_RESOURCES+=("S3 Bucket: $S3_BUCKET")
        return
    fi
    
    # Create bucket
    $AWS_CMD s3 mb "s3://$S3_BUCKET"
    
    # Enable versioning
    $AWS_CMD s3api put-bucket-versioning \
        --bucket "$S3_BUCKET" \
        --versioning-configuration Status=Enabled
    
    # Block public access
    $AWS_CMD s3api put-public-access-block \
        --bucket "$S3_BUCKET" \
        --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    CREATED_RESOURCES+=("S3 Bucket: $S3_BUCKET")
    log "S3 bucket created successfully: $S3_BUCKET" "SUCCESS"
}

create_dynamodb_table() {
    log "Creating DynamoDB table: $DYNAMODB_TABLE"
    
    # Check if table already exists
    if $AWS_CMD dynamodb describe-table --table-name "$DYNAMODB_TABLE" >/dev/null 2>&1; then
        log "DynamoDB table already exists: $DYNAMODB_TABLE" "WARNING"
        CREATED_RESOURCES+=("DynamoDB Table: $DYNAMODB_TABLE")
        return
    fi
    
    # Create table
    $AWS_CMD dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=id,AttributeType=S \
        --key-schema AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --tags Key=Project,Value="$PROJECT_NAME" Key=Environment,Value="$ENVIRONMENT" Key=ManagedBy,Value=shell-script
    
    # Wait for table to be active
    log "Waiting for DynamoDB table to be active..."
    $AWS_CMD dynamodb wait table-exists --table-name "$DYNAMODB_TABLE"
    
    CREATED_RESOURCES+=("DynamoDB Table: $DYNAMODB_TABLE")
    log "DynamoDB table created successfully: $DYNAMODB_TABLE" "SUCCESS"
}

create_iam_role() {
    log "Creating IAM role: $IAM_ROLE"
    
    # Check if role already exists
    if $AWS_CMD iam get-role --role-name "$IAM_ROLE" >/dev/null 2>&1; then
        log "IAM role already exists: $IAM_ROLE" "WARNING"
        CREATED_RESOURCES+=("IAM Role: $IAM_ROLE")
        return
    fi
    
    # Create trust policy
    local trust_policy='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }'
    
    # Create role
    $AWS_CMD iam create-role \
        --role-name "$IAM_ROLE" \
        --assume-role-policy-document "$trust_policy" \
        --tags Key=Project,Value="$PROJECT_NAME" Key=Environment,Value="$ENVIRONMENT" Key=ManagedBy,Value=shell-script
    
    # Create policy
    local policy_name="${NAME_PREFIX}-lambda-policy"
    local policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": "arn:aws:s3:::'$S3_BUCKET'/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": "arn:aws:dynamodb:'$AWS_REGION':*:table/'$DYNAMODB_TABLE'"
            }
        ]
    }'
    
    $AWS_CMD iam put-role-policy \
        --role-name "$IAM_ROLE" \
        --policy-name "$policy_name" \
        --policy-document "$policy_document"
    
    CREATED_RESOURCES+=("IAM Role: $IAM_ROLE")
    log "IAM role created successfully: $IAM_ROLE" "SUCCESS"
}

create_lambda_function() {
    log "Creating Lambda function: $LAMBDA_FUNCTION"
    
    # Check if function already exists
    if $AWS_CMD lambda get-function --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
        log "Lambda function already exists: $LAMBDA_FUNCTION" "WARNING"
        CREATED_RESOURCES+=("Lambda Function: $LAMBDA_FUNCTION")
        return
    fi
    
    # Create function code
    local zip_file=$(create_lambda_function_code)
    
    # Create function
    $AWS_CMD lambda create-function \
        --function-name "$LAMBDA_FUNCTION" \
        --runtime python3.9 \
        --role "arn:aws:iam::000000000000:role/$IAM_ROLE" \
        --handler index.handler \
        --zip-file "fileb://$zip_file" \
        --timeout 30 \
        --environment Variables="S3_BUCKET_NAME=$S3_BUCKET,DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT" \
        --tags Project="$PROJECT_NAME",Environment="$ENVIRONMENT",ManagedBy=shell-script
    
    # Clean up
    rm -rf "$(dirname "$zip_file")"
    
    CREATED_RESOURCES+=("Lambda Function: $LAMBDA_FUNCTION")
    log "Lambda function created successfully: $LAMBDA_FUNCTION" "SUCCESS"
}

create_api_gateway() {
    log "Creating API Gateway: $API_GATEWAY"
    
    # Check if API already exists
    local api_id=$($AWS_CMD apigateway get-rest-apis --query "items[?name=='$API_GATEWAY'].id" --output text 2>/dev/null || echo "")
    
    if [ -n "$api_id" ]; then
        log "API Gateway already exists: $API_GATEWAY" "WARNING"
        CREATED_RESOURCES+=("API Gateway: $API_GATEWAY")
        return
    fi
    
    # Create REST API
    api_id=$($AWS_CMD apigateway create-rest-api \
        --name "$API_GATEWAY" \
        --description "API Gateway for $NAME_PREFIX" \
        --tags Project="$PROJECT_NAME",Environment="$ENVIRONMENT",ManagedBy=shell-script \
        --query 'id' --output text)
    
    # Get root resource
    local root_resource_id=$($AWS_CMD apigateway get-resources \
        --rest-api-id "$api_id" \
        --query 'items[?path==`/`].id' --output text)
    
    # Create resource
    local resource_id=$($AWS_CMD apigateway create-resource \
        --rest-api-id "$api_id" \
        --parent-id "$root_resource_id" \
        --path-part "hello" \
        --query 'id' --output text)
    
    # Create method
    $AWS_CMD apigateway put-method \
        --rest-api-id "$api_id" \
        --resource-id "$resource_id" \
        --http-method GET \
        --authorization-type NONE
    
    # Create integration
    $AWS_CMD apigateway put-integration \
        --rest-api-id "$api_id" \
        --resource-id "$resource_id" \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:000000000000:function:$LAMBDA_FUNCTION/invocations"
    
    # Add Lambda permission
    $AWS_CMD lambda add-permission \
        --function-name "$LAMBDA_FUNCTION" \
        --statement-id AllowExecutionFromAPIGateway \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$AWS_REGION:000000000000:$api_id/*/*" 2>/dev/null || true
    
    # Deploy API
    $AWS_CMD apigateway create-deployment \
        --rest-api-id "$api_id" \
        --stage-name "$ENVIRONMENT"
    
    local api_url="http://localhost:4566/restapis/$api_id/$ENVIRONMENT/_user_request_/hello"
    CREATED_RESOURCES+=("API Gateway: $API_GATEWAY")
    CREATED_RESOURCES+=("API URL: $api_url")
    
    log "API Gateway created successfully: $API_GATEWAY" "SUCCESS"
    log "API URL: $api_url" "SUCCESS"
}

print_summary() {
    echo -e "\n${CYAN}============================================================"
    echo "RESOURCE CREATION SUMMARY"
    echo "============================================================${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "LocalStack Endpoint: $AWS_ENDPOINT"
    echo -e "\n${YELLOW}Created Resources:${NC}"
    
    for resource in "${CREATED_RESOURCES[@]}"; do
        echo "  • $resource"
    done
    
    echo -e "\n${CYAN}============================================================${NC}"
}

main() {
    log "Starting resource creation for $PROJECT_NAME in $ENVIRONMENT environment"
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log "AWS CLI is not installed. Please install it first." "ERROR"
        exit 1
    fi
    
    # Check if LocalStack is running
    if ! curl -s "$AWS_ENDPOINT" > /dev/null; then
        log "LocalStack is not running at $AWS_ENDPOINT. Please start it first." "ERROR"
        exit 1
    fi
    
    # Create resources in dependency order
    create_s3_bucket
    create_dynamodb_table
    create_iam_role
    create_lambda_function
    create_api_gateway
    
    log "All resources created successfully!" "SUCCESS"
    print_summary
}

# Run main function
main "$@" 