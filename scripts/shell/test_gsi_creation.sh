#!/bin/sh

# Test script for GSI creation and querying
# Usage: ./test_gsi_creation.sh [project_name]

set -e

PROJECT_NAME=${1:-"localcloud-kit"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

echo "Testing DynamoDB GSI creation and queries..."

# Create a table with GSI using the configuration
GSI_CONFIG='{
  "tableName": "test-gsi-table",
  "partitionKey": "pk",
  "sortKey": "sk",
  "billingMode": "PAY_PER_REQUEST",
  "gsis": [
    {
      "indexName": "gsi-1",
      "partitionKey": "gsi_pk",
      "sortKey": "gsi_sk",
      "projectionType": "ALL"
    }
  ]
}'

echo "Creating table with GSI configuration..."
export RESOURCE_CONFIG="$GSI_CONFIG"
./create_single_resource.sh "$PROJECT_NAME" dynamodb test-gsi

# Wait a moment for table to be fully ready
sleep 3

# Verify table exists and GSI is created
echo "Verifying table and GSI creation..."
TABLE_INFO=$($AWS_CMD dynamodb describe-table --table-name "test-gsi-table" --output json)
echo "$TABLE_INFO" | jq '.Table.GlobalSecondaryIndexes[].IndexName'

# Add test data
echo "Adding test data..."
$AWS_CMD dynamodb put-item \
  --table-name "test-gsi-table" \
  --item '{
    "pk": {"S": "user#123"},
    "sk": {"S": "profile"},
    "gsi_pk": {"S": "status#active"},
    "gsi_sk": {"S": "user#123"},
    "name": {"S": "John Doe"},
    "email": {"S": "john@example.com"}
  }'

$AWS_CMD dynamodb put-item \
  --table-name "test-gsi-table" \
  --item '{
    "pk": {"S": "user#456"},
    "sk": {"S": "profile"},
    "gsi_pk": {"S": "status#active"},
    "gsi_sk": {"S": "user#456"},
    "name": {"S": "Jane Smith"},
    "email": {"S": "jane@example.com"}
  }'

# Test main table query
echo "Testing main table query..."
./query_dynamodb_table.sh "$PROJECT_NAME" "test-gsi-table" "pk" "user#123" "sk" "profile"

# Test GSI query
echo "Testing GSI query..."
./query_dynamodb_table.sh "$PROJECT_NAME" "test-gsi-table" "gsi_pk" "status#active" "" "" "100" "gsi-1"

echo "GSI test completed successfully!"

# Optional cleanup
read -p "Delete test table? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  $AWS_CMD dynamodb delete-table --table-name "test-gsi-table"
  echo "Test table deleted."
fi
