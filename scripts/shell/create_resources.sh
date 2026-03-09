#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# LocalStack Resource Creation Script
# Creates S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Parse resource flags
CREATE_S3=false
CREATE_DYNAMODB=false
CREATE_LAMBDA=false
CREATE_APIGATEWAY=false

# Parse --verbose flag
VERBOSE=false
for arg in "$@"; do
  case $arg in
    --s3) CREATE_S3=true ;;
    --dynamodb) CREATE_DYNAMODB=true ;;
    --lambda) CREATE_LAMBDA=true ;;
    --apigateway) CREATE_APIGATEWAY=true ;;
    --verbose) VERBOSE=true ;;
  esac
  shift
done
if [ "$LOG_OUTPUT" = "1" ]; then
  VERBOSE=true
fi

log() {
  if [ "$VERBOSE" = true ]; then
    echo "$1"
  fi
}

if $CREATE_S3; then
  BUCKET_NAME="${NAME_PREFIX}-bucket"
  $AWS_CMD s3api create-bucket --bucket "$BUCKET_NAME" 2>/dev/null || true
  log "Created S3 bucket: $BUCKET_NAME"
fi

if $CREATE_DYNAMODB; then
  TABLE_NAME="${NAME_PREFIX}-table"
  $AWS_CMD dynamodb create-table --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=pk,AttributeType=S \
    --key-schema AttributeName=pk,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST 2>/dev/null || true
  log "Created DynamoDB table: $TABLE_NAME"
fi

if $CREATE_LAMBDA; then
  FUNCTION_NAME="${NAME_PREFIX}-lambda"
  $AWS_CMD lambda create-function --function-name "$FUNCTION_NAME" \
    --runtime python3.9 --role arn:aws:iam::000000000000:role/service-role/irrelevant \
    --handler lambda_function.lambda_handler --zip-file fileb://function.zip 2>/dev/null || true
  log "Created Lambda function: $FUNCTION_NAME"
fi

if $CREATE_APIGATEWAY; then
  API_NAME="${NAME_PREFIX}-api"
  $AWS_CMD apigateway create-rest-api --name "$API_NAME" 2>/dev/null || true
  log "Created API Gateway: $API_NAME"
fi 