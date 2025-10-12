#!/bin/sh

# CloudStack Solutions - Local AWS Development Environment
# Query DynamoDB table in LocalStack

set -e

# Configuration
PROJECT_NAME=${1:-"localcloud-kit"}
TABLE_NAME=${2:-""}
PARTITION_KEY=${3:-""}
PARTITION_VALUE=${4:-""}
SORT_KEY=${5:-""}
SORT_VALUE=${6:-""}
LIMIT=${7:-"100"}
INDEX_NAME=${8:-""}  # Optional GSI name
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# If localstack hostname is not reachable, fallback to localhost
if ! curl -s --connect-timeout 1 "${AWS_ENDPOINT}" >/dev/null; then
  AWS_ENDPOINT="http://localhost:4566"
fi

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
  
  if [ -n "$INDEX_NAME" ]; then
    log "Querying DynamoDB GSI: $INDEX_NAME on table $TABLE_NAME (PK: $PARTITION_KEY = $PARTITION_VALUE, limit: $LIMIT)"
  else
    log "Querying DynamoDB table: $TABLE_NAME (PK: $PARTITION_KEY = $PARTITION_VALUE, limit: $LIMIT)"
  fi
  
  # Build the key condition expression
  KEY_CONDITION_EXPRESSION="$PARTITION_KEY = :pk"
  EXPRESSION_ATTRIBUTE_VALUES="{\":pk\":{\"S\":\"$PARTITION_VALUE\"}}"
  
  # Add sort key condition if provided
  if [ -n "$SORT_KEY" ] && [ -n "$SORT_VALUE" ]; then
    KEY_CONDITION_EXPRESSION="$KEY_CONDITION_EXPRESSION AND $SORT_KEY = :sk"
    EXPRESSION_ATTRIBUTE_VALUES=$(echo "$EXPRESSION_ATTRIBUTE_VALUES" | jq -c ". + {\":sk\":{\"S\":\"$SORT_VALUE\"}}")
    log "Adding sort key condition: $SORT_KEY = $SORT_VALUE"
  fi
  
  # Build query command with optional index name
  QUERY_CMD="$AWS_CMD dynamodb query --table-name \"$TABLE_NAME\" --key-condition-expression \"$KEY_CONDITION_EXPRESSION\" --expression-attribute-values '$EXPRESSION_ATTRIBUTE_VALUES' --limit $LIMIT"
  
  if [ -n "$INDEX_NAME" ]; then
    QUERY_CMD="$QUERY_CMD --index-name \"$INDEX_NAME\""
  fi
  
  QUERY_CMD="$QUERY_CMD --output json"
  
  # Query the table or index
  QUERY_RESULT=$(eval "$QUERY_CMD" 2>/dev/null || echo '{"Items":[],"Count":0,"ScannedCount":0}')
  
  # Return the query result as JSON
  echo "$QUERY_RESULT"
}

main "$@" 