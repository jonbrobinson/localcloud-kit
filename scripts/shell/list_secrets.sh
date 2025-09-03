#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# List Secrets Script
# Lists all secrets in AWS Secrets Manager using LocalStack

# Configuration
MAX_RESULTS=${1:-"100"}
NEXT_TOKEN=${2:-""}

AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Build the list-secrets command
LIST_CMD="$AWS_CMD secretsmanager list-secrets --max-results $MAX_RESULTS"

# Add next token if provided
if [ -n "$NEXT_TOKEN" ]; then
  LIST_CMD="$LIST_CMD --next-token \"$NEXT_TOKEN\""
fi

# Execute the command and output JSON
eval $LIST_CMD
