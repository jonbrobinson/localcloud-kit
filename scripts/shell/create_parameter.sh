#!/bin/sh
# create_parameter.sh — Create an SSM Parameter Store parameter
# Usage: ./create_parameter.sh <name> <value> [type] [description]
#   type: String | StringList | SecureString (default: String)

PARAM_NAME="${1}"
PARAM_VALUE="${2}"
PARAM_TYPE="${3:-String}"
DESCRIPTION="${4:-}"

if [ -z "$PARAM_NAME" ] || [ -z "$PARAM_VALUE" ]; then
  echo '{"error":"Parameter name and value are required"}' >&2
  exit 1
fi

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://localstack:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

CMD="$AWS_CMD ssm put-parameter --name \"$PARAM_NAME\" --value \"$PARAM_VALUE\" --type \"$PARAM_TYPE\" --overwrite"
if [ -n "$DESCRIPTION" ]; then
  CMD="$CMD --description \"$DESCRIPTION\""
fi

eval $CMD 2>/dev/null
if [ $? -ne 0 ]; then
  echo '{"error":"Failed to create parameter"}' >&2
  exit 1
fi

echo "Parameter $PARAM_NAME created successfully"
