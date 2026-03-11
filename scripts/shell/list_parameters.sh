#!/bin/sh
# list_parameters.sh — List SSM Parameter Store parameters, optionally filtered by path prefix
# Usage: ./list_parameters.sh [path_prefix]

PATH_PREFIX="${1:-/}"
MAX_RESULTS="${2:-50}"

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://localstack:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

result=$($AWS_CMD ssm describe-parameters --max-results "$MAX_RESULTS" 2>/dev/null)
if [ $? -ne 0 ]; then
  echo '{"Parameters":[]}'
  exit 0
fi

echo "$result"
