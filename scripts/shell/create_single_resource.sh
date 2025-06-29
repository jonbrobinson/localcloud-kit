#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# LocalStack Single Resource Creation Script
# Creates individual S3, DynamoDB, Lambda, or API Gateway resources using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-manager"}
RESOURCE_TYPE=${2:-"s3"}
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

NOW=$(date -Iseconds)

create_s3_bucket() {
  BUCKET_NAME="${NAME_PREFIX}-bucket"
  $AWS_CMD s3api create-bucket --bucket "$BUCKET_NAME" 2>/dev/null || true
  log "Created S3 bucket: $BUCKET_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "s3-$BUCKET_NAME",
  "name": "$BUCKET_NAME",
  "type": "s3",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "bucketName": "$BUCKET_NAME",
    "region": "$AWS_REGION"
  }
}
EOF
}

create_dynamodb_table() {
  TABLE_NAME="${NAME_PREFIX}-table"
  $AWS_CMD dynamodb create-table --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=pk,AttributeType=S \
    --key-schema AttributeName=pk,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST 2>/dev/null || true
  log "Created DynamoDB table: $TABLE_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "dynamodb-$TABLE_NAME",
  "name": "$TABLE_NAME",
  "type": "dynamodb",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "tableName": "$TABLE_NAME",
    "billingMode": "PAY_PER_REQUEST",
    "keySchema": "pk (String)"
  }
}
EOF
}

create_lambda_function() {
  FUNCTION_NAME="${NAME_PREFIX}-lambda"
  $AWS_CMD lambda create-function --function-name "$FUNCTION_NAME" \
    --runtime python3.9 --role arn:aws:iam::000000000000:role/service-role/irrelevant \
    --handler lambda_function.lambda_handler --zip-file fileb://function.zip 2>/dev/null || true
  log "Created Lambda function: $FUNCTION_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "lambda-$FUNCTION_NAME",
  "name": "$FUNCTION_NAME",
  "type": "lambda",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "functionName": "$FUNCTION_NAME",
    "runtime": "python3.9",
    "handler": "lambda_function.lambda_handler"
  }
}
EOF
}

create_api_gateway() {
  API_NAME="${NAME_PREFIX}-api"
  $AWS_CMD apigateway create-rest-api --name "$API_NAME" 2>/dev/null || true
  log "Created API Gateway: $API_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "apigateway-$API_NAME",
  "name": "$API_NAME",
  "type": "apigateway",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "apiName": "$API_NAME",
    "type": "REST"
  }
}
EOF
}

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  
  if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  
  log "Creating single resource: $RESOURCE_TYPE for project: $PROJECT_NAME"
  
  case $RESOURCE_TYPE in
    s3)
      create_s3_bucket
      ;;
    dynamodb)
      create_dynamodb_table
      ;;
    lambda)
      create_lambda_function
      ;;
    apigateway)
      create_api_gateway
      ;;
    *)
      echo "Unknown resource type: $RESOURCE_TYPE" >&2
      echo "Supported types: s3, dynamodb, lambda, apigateway" >&2
      exit 1
      ;;
  esac
}

main "$@" 