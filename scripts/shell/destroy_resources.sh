#!/bin/sh

set -e
export AWS_PAGER=""

# LocalStack Resource Destruction Script
# Destroys specific S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
ENVIRONMENT=${2:-"dev"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Get specific resource IDs to destroy (shift past project and environment)
shift 2
SPECIFIC_RESOURCES="$@"

# Parse --verbose flag
VERBOSE=false
for arg in "$@"; do
  if [ "$arg" = "--verbose" ]; then
    VERBOSE=true
    break
  fi
done
if [ "$LOG_OUTPUT" = "1" ]; then
  VERBOSE=true
fi

log() {
  if [ "$VERBOSE" = true ]; then
    echo "$1"
  fi
}

# Function to extract resource name from resource ID
extract_resource_name() {
    local resource_id="$1"
    # Remove prefix like "s3-" or "dynamodb-" from resource ID
    echo "$resource_id" | sed 's/^[^-]*-//'
}

# Function to get resource type from resource ID
get_resource_type() {
    local resource_id="$1"
    # Extract the type prefix (e.g., "s3", "dynamodb")
    echo "$resource_id" | cut -d'-' -f1
}

# If specific resources are provided, destroy only those
if [ -n "$SPECIFIC_RESOURCES" ]; then
    log "Destroying specific resources: $SPECIFIC_RESOURCES"
    
    for resource_id in $SPECIFIC_RESOURCES; do
        resource_type=$(get_resource_type "$resource_id")
        resource_name=$(extract_resource_name "$resource_id")
        
        case $resource_type in
            "s3")
                log "Destroying S3 bucket: $resource_name"
                $AWS_CMD s3 rb s3://$resource_name --force 2>/dev/null || true
                $AWS_CMD s3api delete-bucket --bucket $resource_name 2>/dev/null || true
                log "Deleted S3 bucket: $resource_name"
                ;;
            "dynamodb")
                log "Destroying DynamoDB table: $resource_name"
                $AWS_CMD dynamodb delete-table --table-name $resource_name 2>/dev/null || true
                log "Deleted DynamoDB table: $resource_name"
                ;;
            "lambda")
                log "Destroying Lambda function: $resource_name"
                $AWS_CMD lambda delete-function --function-name $resource_name 2>/dev/null || true
                log "Deleted Lambda function: $resource_name"
                ;;
            "apigateway")
                log "Destroying API Gateway: $resource_name"
                $AWS_CMD apigateway delete-rest-api --rest-api-id $resource_name 2>/dev/null || true
                log "Deleted API Gateway: $resource_name"
                ;;
            *)
                log "Unknown resource type: $resource_type for resource: $resource_id"
                ;;
        esac
    done
else
    log "No specific resources provided, destroying all resources for project: $PROJECT_NAME"
    
    # Destroy S3 Buckets
    BUCKETS=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].Name" --output text 2>/dev/null || true)
    for BUCKET in $BUCKETS; do
        $AWS_CMD s3 rb s3://$BUCKET --force 2>/dev/null || true
        $AWS_CMD s3api delete-bucket --bucket $BUCKET 2>/dev/null || true
        log "Deleted S3 bucket: $BUCKET"
    done

    # Destroy DynamoDB Tables
    TABLES=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output text 2>/dev/null || true)
    for TABLE in $TABLES; do
        $AWS_CMD dynamodb delete-table --table-name $TABLE 2>/dev/null || true
        log "Deleted DynamoDB table: $TABLE"
    done

    # Destroy Lambda Functions
    FUNCTIONS=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].FunctionName" --output text 2>/dev/null || true)
    for FUNCTION in $FUNCTIONS; do
        $AWS_CMD lambda delete-function --function-name $FUNCTION 2>/dev/null || true
        log "Deleted Lambda function: $FUNCTION"
    done

    # Destroy API Gateways
    APIS=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].id" --output text 2>/dev/null || true)
    for API_ID in $APIS; do
        $AWS_CMD apigateway delete-rest-api --rest-api-id $API_ID 2>/dev/null || true
        log "Deleted API Gateway: $API_ID"
    done
fi

log "Resource destruction completed for project: $PROJECT_NAME" 