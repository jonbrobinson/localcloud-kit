#!/bin/sh

# CloudStack Solutions - Local AWS Development Environment
# Delete a DynamoDB item from a table

set -e

# Configuration
PROJECT_NAME=${1:-"localcloud-kit"}
TABLE_NAME=${2:-""}
PARTITION_KEY=${3:-""}
PARTITION_VALUE=${4:-""}
SORT_KEY=${5:-""}
SORT_VALUE=${6:-""}
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

# Validate required parameters
if [ -z "$TABLE_NAME" ]; then
  echo "{\"success\": false, \"error\": \"Table name is required\"}"
  exit 1
fi

if [ -z "$PARTITION_KEY" ] || [ -z "$PARTITION_VALUE" ]; then
  echo "{\"success\": false, \"error\": \"Partition key and value are required\"}"
  exit 1
fi

log "Deleting item from DynamoDB table: $TABLE_NAME"
log "Partition Key: $PARTITION_KEY = $PARTITION_VALUE"

# Build the delete-item command
DELETE_CMD="$AWS_CMD dynamodb delete-item --table-name $TABLE_NAME --key"

# Create the key JSON structure
if [ -n "$SORT_KEY" ] && [ -n "$SORT_VALUE" ]; then
  log "Sort Key: $SORT_KEY = $SORT_VALUE"
  KEY_JSON="{\"$PARTITION_KEY\":{\"S\":\"$PARTITION_VALUE\"},\"$SORT_KEY\":{\"S\":\"$SORT_VALUE\"}}"
else
  KEY_JSON="{\"$PARTITION_KEY\":{\"S\":\"$PARTITION_VALUE\"}}"
fi

# Execute the delete command
log "Executing: $DELETE_CMD '$KEY_JSON'"
RESULT=$($DELETE_CMD "$KEY_JSON" 2>&1)

if [ $? -eq 0 ]; then
  log "Successfully deleted item from table: $TABLE_NAME"
  echo "{\"success\": true, \"message\": \"Item deleted successfully from table $TABLE_NAME\"}"
else
  log "Failed to delete item: $RESULT"
  echo "{\"success\": false, \"error\": \"Failed to delete item: $RESULT\"}"
  exit 1
fi 