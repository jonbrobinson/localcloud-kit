#!/bin/sh

# LocalStack Resource Destruction Script
# Destroys S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Destroy S3 Buckets
BUCKETS=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].Name" --output text 2>/dev/null || true)
for BUCKET in $BUCKETS; do
  $AWS_CMD s3 rb s3://$BUCKET --force 2>/dev/null || true
  $AWS_CMD s3api delete-bucket --bucket $BUCKET 2>/dev/null || true
  echo "Deleted S3 bucket: $BUCKET"
done

# Destroy DynamoDB Tables
TABLES=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output text 2>/dev/null || true)
for TABLE in $TABLES; do
  $AWS_CMD dynamodb delete-table --table-name $TABLE 2>/dev/null || true
  echo "Deleted DynamoDB table: $TABLE"
done

# Destroy Lambda Functions
FUNCTIONS=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].FunctionName" --output text 2>/dev/null || true)
for FUNCTION in $FUNCTIONS; do
  $AWS_CMD lambda delete-function --function-name $FUNCTION 2>/dev/null || true
  echo "Deleted Lambda function: $FUNCTION"
done

# Destroy API Gateways
APIS=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].id" --output text 2>/dev/null || true)
for API_ID in $APIS; do
  $AWS_CMD apigateway delete-rest-api --rest-api-id $API_ID 2>/dev/null || true
  echo "Deleted API Gateway: $API_ID"
done

echo "Resources destroyed for project: $PROJECT_NAME" 