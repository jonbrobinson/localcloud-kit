#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# LocalStack DynamoDB Table Query Script
# Queries DynamoDB table contents using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-manager"}
TABLE_NAME=${2:-""}
PARTITION_KEY=${3:-""}
PARTITION_VALUE=${4:-""}
SORT_KEY=${5:-""}
SORT_VALUE=${6:-""}
LIMIT=${7:-"100"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

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

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first." >&2; exit 1; }
  
  if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  
  if [ -z "$TABLE_NAME" ]; then
    echo "Table name is required" >&2
    exit 1
  fi
  
  if [ -z "$PARTITION_KEY" ] || [ -z "$PARTITION_VALUE" ]; then
    echo "Partition key and value are required" >&2
    exit 1
  fi
  
  log "Querying DynamoDB table: $TABLE_NAME (PK: $PARTITION_KEY = $PARTITION_VALUE, limit: $LIMIT)"
  
  # Build the key condition expression
  KEY_CONDITION_EXPRESSION="$PARTITION_KEY = :pk"
  EXPRESSION_ATTRIBUTE_VALUES="{\":pk\":{\"S\":\"$PARTITION_VALUE\"}}"
  
  # Add sort key condition if provided
  if [ -n "$SORT_KEY" ] && [ -n "$SORT_VALUE" ]; then
    KEY_CONDITION_EXPRESSION="$KEY_CONDITION_EXPRESSION AND $SORT_KEY = :sk"
    EXPRESSION_ATTRIBUTE_VALUES=$(echo "$EXPRESSION_ATTRIBUTE_VALUES" | jq -c ". + {\":sk\":{\"S\":\"$SORT_VALUE\"}}")
    log "Adding sort key condition: $SORT_KEY = $SORT_VALUE"
  fi
  
  # Query the table
  QUERY_RESULT=$($AWS_CMD dynamodb query \
    --table-name "$TABLE_NAME" \
    --key-condition-expression "$KEY_CONDITION_EXPRESSION" \
    --expression-attribute-values "$EXPRESSION_ATTRIBUTE_VALUES" \
    --limit "$LIMIT" \
    --output json 2>/dev/null || echo '{"Items":[],"Count":0,"ScannedCount":0}')
  
  # Return the query result as JSON
  echo "$QUERY_RESULT"
}

main "$@" 