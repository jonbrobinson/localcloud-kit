#!/bin/sh

# CloudStack Solutions - Enterprise AWS Development Tools
# Scan DynamoDB table in LocalStack

set -e

# Configuration
PROJECT_NAME=${1:-"localcloud-kit"}
TABLE_NAME=${2:-""}
LIMIT=${3:-"100"}
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
  
  log "Scanning DynamoDB table: $TABLE_NAME (limit: $LIMIT)"
  
  # Scan the table
  SCAN_RESULT=$($AWS_CMD dynamodb scan \
    --table-name "$TABLE_NAME" \
    --limit "$LIMIT" \
    --output json 2>/dev/null || echo '{"Items":[],"Count":0,"ScannedCount":0}')
  
  # Return the scan result as JSON
  echo "$SCAN_RESULT"
}

main "$@" 