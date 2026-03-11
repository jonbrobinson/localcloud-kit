#!/bin/sh
# get_parameter.sh — Get an SSM Parameter Store parameter value
# Usage: ./get_parameter.sh <name> [with_decryption]

PARAM_NAME="${1}"
WITH_DECRYPTION="${2:-false}"

if [ -z "$PARAM_NAME" ]; then
  echo '{"error":"Parameter name is required"}' >&2
  exit 1
fi

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://localstack:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

if [ "$WITH_DECRYPTION" = "true" ]; then
  $AWS_CMD ssm get-parameter --name "$PARAM_NAME" --with-decryption 2>/dev/null
else
  $AWS_CMD ssm get-parameter --name "$PARAM_NAME" 2>/dev/null
fi

if [ $? -ne 0 ]; then
  echo '{"error":"Parameter not found"}' >&2
  exit 1
fi
