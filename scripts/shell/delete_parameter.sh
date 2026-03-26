#!/bin/sh
# delete_parameter.sh — Delete an SSM Parameter Store parameter
# Usage: ./delete_parameter.sh <name>

PARAM_NAME="${1}"

if [ -z "$PARAM_NAME" ]; then
  echo '{"error":"Parameter name is required"}' >&2
  exit 1
fi

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://aws-emulator:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

$AWS_CMD ssm delete-parameter --name "$PARAM_NAME" 2>/dev/null
if [ $? -ne 0 ]; then
  echo '{"error":"Failed to delete parameter or parameter not found"}' >&2
  exit 1
fi

echo "Parameter $PARAM_NAME deleted successfully"
