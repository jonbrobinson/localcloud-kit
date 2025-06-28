#!/bin/bash

# LocalStack Resource Destruction Script
# Destroys S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

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

# Store destroyed resources
DESTROYED_RESOURCES=()

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

destroy_api_gateway() {
    log "Destroying API Gateway: $API_GATEWAY"
    
    # Find API by name
    local api_id=$($AWS_CMD apigateway get-rest-apis --query "items[?name=='$API_GATEWAY'].id" --output text 2>/dev/null || echo "")
    
    if [ -n "$api_id" ]; then
        # Delete the API
        $AWS_CMD apigateway delete-rest-api --rest-api-id "$api_id"
        DESTROYED_RESOURCES+=("API Gateway: $API_GATEWAY")
        log "API Gateway destroyed successfully: $API_GATEWAY" "SUCCESS"
    else
        log "API Gateway not found: $API_GATEWAY" "WARNING"
    fi
}

destroy_lambda_function() {
    log "Destroying Lambda function: $LAMBDA_FUNCTION"
    
    # Check if function exists
    if $AWS_CMD lambda get-function --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
        # Delete function
        $AWS_CMD lambda delete-function --function-name "$LAMBDA_FUNCTION"
        DESTROYED_RESOURCES+=("Lambda Function: $LAMBDA_FUNCTION")
        log "Lambda function destroyed successfully: $LAMBDA_FUNCTION" "SUCCESS"
    else
        log "Lambda function not found: $LAMBDA_FUNCTION" "WARNING"
    fi
}

destroy_iam_role() {
    log "Destroying IAM role: $IAM_ROLE"
    
    # Check if role exists
    if $AWS_CMD iam get-role --role-name "$IAM_ROLE" >/dev/null 2>&1; then
        # Delete inline policies
        local policies=$($AWS_CMD iam list-role-policies --role-name "$IAM_ROLE" --query 'PolicyNames' --output text 2>/dev/null || echo "")
        if [ -n "$policies" ]; then
            for policy in $policies; do
                $AWS_CMD iam delete-role-policy --role-name "$IAM_ROLE" --policy-name "$policy"
            done
        fi
        
        # Delete the role
        $AWS_CMD iam delete-role --role-name "$IAM_ROLE"
        DESTROYED_RESOURCES+=("IAM Role: $IAM_ROLE")
        log "IAM role destroyed successfully: $IAM_ROLE" "SUCCESS"
    else
        log "IAM role not found: $IAM_ROLE" "WARNING"
    fi
}

destroy_dynamodb_table() {
    log "Destroying DynamoDB table: $DYNAMODB_TABLE"
    
    # Check if table exists
    if $AWS_CMD dynamodb describe-table --table-name "$DYNAMODB_TABLE" >/dev/null 2>&1; then
        # Delete table
        $AWS_CMD dynamodb delete-table --table-name "$DYNAMODB_TABLE"
        
        # Wait for table to be deleted
        log "Waiting for DynamoDB table to be deleted..."
        $AWS_CMD dynamodb wait table-not-exists --table-name "$DYNAMODB_TABLE"
        
        DESTROYED_RESOURCES+=("DynamoDB Table: $DYNAMODB_TABLE")
        log "DynamoDB table destroyed successfully: $DYNAMODB_TABLE" "SUCCESS"
    else
        log "DynamoDB table not found: $DYNAMODB_TABLE" "WARNING"
    fi
}

destroy_s3_bucket() {
    log "Destroying S3 bucket: $S3_BUCKET"
    
    # Check if bucket exists
    if $AWS_CMD s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1; then
        # List and delete all objects
        local objects=$($AWS_CMD s3api list-objects-v2 --bucket "$S3_BUCKET" --query 'Contents[].Key' --output text 2>/dev/null || echo "")
        if [ -n "$objects" ]; then
            log "Deleting objects from S3 bucket..."
            for obj in $objects; do
                $AWS_CMD s3 rm "s3://$S3_BUCKET/$obj"
            done
        fi
        
        # Delete bucket
        $AWS_CMD s3 rb "s3://$S3_BUCKET"
        DESTROYED_RESOURCES+=("S3 Bucket: $S3_BUCKET")
        log "S3 bucket destroyed successfully: $S3_BUCKET" "SUCCESS"
    else
        log "S3 bucket not found: $S3_BUCKET" "WARNING"
    fi
}

print_summary() {
    echo -e "\n${CYAN}============================================================"
    echo "RESOURCE DESTRUCTION SUMMARY"
    echo "============================================================${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "LocalStack Endpoint: $AWS_ENDPOINT"
    echo -e "\n${YELLOW}Destroyed Resources:${NC}"
    
    if [ ${#DESTROYED_RESOURCES[@]} -eq 0 ]; then
        echo -e "  ${YELLOW}No resources were destroyed${NC}"
    else
        for resource in "${DESTROYED_RESOURCES[@]}"; do
            echo "  • $resource"
        done
    fi
    
    echo -e "\n${CYAN}============================================================${NC}"
}

main() {
    log "Starting resource destruction for $PROJECT_NAME in $ENVIRONMENT environment"
    
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
    
    # Destroy resources in reverse dependency order
    destroy_api_gateway
    destroy_lambda_function
    destroy_iam_role
    destroy_dynamodb_table
    destroy_s3_bucket
    
    log "All resources destroyed successfully!" "SUCCESS"
    print_summary
}

# Run main function
main "$@" 