#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# Delete Secret Script
# Deletes a secret from AWS Secrets Manager using LocalStack

# Configuration
SECRET_NAME=${1}
FORCE_DELETE=${2:-"false"}

AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Validate required parameters
if [ -z "$SECRET_NAME" ]; then
  echo "Error: Secret name is required" >&2
  exit 1
fi

# Build the delete-secret command
DELETE_CMD="$AWS_CMD secretsmanager delete-secret --secret-id \"$SECRET_NAME\""

# Add force delete if requested
if [ "$FORCE_DELETE" = "true" ]; then
  DELETE_CMD="$DELETE_CMD --force-delete-without-recovery"
fi

# Execute the command
eval $DELETE_CMD

echo "Secret '$SECRET_NAME' deleted successfully"
