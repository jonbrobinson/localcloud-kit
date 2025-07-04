#!/bin/sh

# CloudStack Solutions - Enterprise AWS Development Tools
# List DynamoDB tables in LocalStack

set -e

# Configuration
PROJECT_NAME=${1:-"localcloud-kit"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# If localstack hostname is not reachable, fallback to localhost
if ! curl -s --connect-timeout 1 "${AWS_ENDPOINT}" >/dev/null; then
  AWS_ENDPOINT="http://localhost:4566"
fi

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Parse --verbose flag and --all flag
VERBOSE=false
SHOW_ALL=false
for arg in "$@"; do
  if [ "$arg" = "--verbose" ]; then
    VERBOSE=true
  elif [ "$arg" = "--all" ]; then
    SHOW_ALL=true
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
  
  log "Listing DynamoDB tables for project: $PROJECT_NAME"
  
  # List tables with optional prefix filtering
  if [ "$SHOW_ALL" = true ]; then
    TABLES_JSON=$($AWS_CMD dynamodb list-tables --query "TableNames[]" --output json 2>/dev/null || echo "[]")
  else
    TABLES_JSON=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json 2>/dev/null || echo "[]")
  fi
  
  # Return the tables as a JSON array
  echo "$TABLES_JSON"
}

main "$@" 