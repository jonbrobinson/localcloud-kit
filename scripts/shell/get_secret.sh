#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# Get Secret Script
# Retrieves a secret value from AWS Secrets Manager using LocalStack

# Configuration
SECRET_NAME=${1}
VERSION_ID=${2:-""}
VERSION_STAGE=${3:-"AWSCURRENT"}

AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Validate required parameters
if [ -z "$SECRET_NAME" ]; then
  echo "Error: Secret name is required" >&2
  exit 1
fi

# Build the get-secret-value command
GET_CMD="$AWS_CMD secretsmanager get-secret-value --secret-id \"$SECRET_NAME\" --version-stage \"$VERSION_STAGE\""

# Add version ID if provided
if [ -n "$VERSION_ID" ]; then
  GET_CMD="$GET_CMD --version-id \"$VERSION_ID\""
fi

# Execute the command and output JSON
eval $GET_CMD
