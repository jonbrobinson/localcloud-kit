#!/bin/sh

set -e  # Exit on any error
set -x  # Print each command before executing (debug)
export AWS_PAGER=""

# LocalStack Single Resource Destruction Script
# Destroys individual S3, DynamoDB, Lambda, or API Gateway resources using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-manager"}
RESOURCE_TYPE=${2:-"s3"}
RESOURCE_NAME=${3:-""}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

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

destroy_s3_bucket() {
  if [ -n "$RESOURCE_NAME" ]; then
    BUCKET_NAME="$RESOURCE_NAME"
  else
    BUCKET_NAME="${NAME_PREFIX}-bucket"
  fi
  
  log "Destroying S3 bucket: $BUCKET_NAME"
  $AWS_CMD s3 rb s3://$BUCKET_NAME --force 2>/dev/null || true
  $AWS_CMD s3api delete-bucket --bucket $BUCKET_NAME 2>/dev/null || true
  log "Deleted S3 bucket: $BUCKET_NAME"
  
  echo "{\"success\": true, \"message\": \"S3 bucket $BUCKET_NAME destroyed successfully\"}"
}

destroy_dynamodb_table() {
  if [ -n "$RESOURCE_NAME" ]; then
    TABLE_NAME="$RESOURCE_NAME"
  else
    TABLE_NAME="${NAME_PREFIX}-table"
  fi
  
  log "Destroying DynamoDB table: $TABLE_NAME"
  $AWS_CMD dynamodb delete-table --table-name $TABLE_NAME 2>/dev/null || true
  log "Deleted DynamoDB table: $TABLE_NAME"
  
  echo "{\"success\": true, \"message\": \"DynamoDB table $TABLE_NAME destroyed successfully\"}"
}

destroy_lambda_function() {
  if [ -n "$RESOURCE_NAME" ]; then
    FUNCTION_NAME="$RESOURCE_NAME"
  else
    FUNCTION_NAME="${NAME_PREFIX}-lambda"
  fi
  
  log "Destroying Lambda function: $FUNCTION_NAME"
  $AWS_CMD lambda delete-function --function-name $FUNCTION_NAME 2>/dev/null || true
  log "Deleted Lambda function: $FUNCTION_NAME"
  
  echo "{\"success\": true, \"message\": \"Lambda function $FUNCTION_NAME destroyed successfully\"}"
}

destroy_api_gateway() {
  if [ -n "$RESOURCE_NAME" ]; then
    # If resource name is provided, it could be either the API name or ID
    # First try to use it as an API ID
    API_ID="$RESOURCE_NAME"
  else
    # Find the API by name pattern
    API_ID=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].id" --output text 2>/dev/null | head -1)
    if [ -z "$API_ID" ]; then
      log "No API Gateway found for project: $PROJECT_NAME"
      echo "{\"success\": false, \"message\": \"No API Gateway found for project $PROJECT_NAME\"}"
      return
    fi
  fi
  
  log "Destroying API Gateway with ID: $API_ID"
  $AWS_CMD apigateway delete-rest-api --rest-api-id $API_ID 2>/dev/null || true
  log "Deleted API Gateway: $API_ID"
  
  echo "{\"success\": true, \"message\": \"API Gateway $API_ID destroyed successfully\"}"
}

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  
  if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  
  log "Destroying single resource: $RESOURCE_TYPE for project: $PROJECT_NAME"
  
  case $RESOURCE_TYPE in
    s3)
      destroy_s3_bucket
      ;;
    dynamodb)
      destroy_dynamodb_table
      ;;
    lambda)
      destroy_lambda_function
      ;;
    apigateway)
      destroy_api_gateway
      ;;
    *)
      echo "Unknown resource type: $RESOURCE_TYPE" >&2
      echo "Supported types: s3, dynamodb, lambda, apigateway" >&2
      exit 1
      ;;
  esac
}

main "$@" 