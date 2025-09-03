#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# Create Secret Script
# Creates a secret in AWS Secrets Manager using LocalStack

# Configuration
SECRET_NAME=${1}
SECRET_VALUE=${2}
DESCRIPTION=${3:-""}
TAGS=${4:-""}
KMS_KEY_ID=${5:-""}

AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Validate required parameters
if [ -z "$SECRET_NAME" ]; then
  echo "Error: Secret name is required" >&2
  exit 1
fi

if [ -z "$SECRET_VALUE" ]; then
  echo "Error: Secret value is required" >&2
  exit 1
fi

# Build the create-secret command
CREATE_CMD="$AWS_CMD secretsmanager create-secret --name \"$SECRET_NAME\" --secret-string \"$SECRET_VALUE\""

# Add description if provided
if [ -n "$DESCRIPTION" ]; then
  CREATE_CMD="$CREATE_CMD --description \"$DESCRIPTION\""
fi

# Add KMS key if provided
if [ -n "$KMS_KEY_ID" ]; then
  CREATE_CMD="$CREATE_CMD --kms-key-id \"$KMS_KEY_ID\""
fi

# Add tags if provided
if [ -n "$TAGS" ]; then
  CREATE_CMD="$CREATE_CMD --tags $TAGS"
fi

# Execute the command
eval $CREATE_CMD

echo "Secret '$SECRET_NAME' created successfully"
