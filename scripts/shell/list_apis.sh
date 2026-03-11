#!/bin/sh
# list_apis.sh — List API Gateway REST APIs, optionally filtered by project name prefix
# Usage: ./list_apis.sh [project_name]

PROJECT_NAME="${1:-}"

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://localstack:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

result=$($AWS_CMD apigateway get-rest-apis 2>/dev/null)
if [ $? -ne 0 ]; then
  echo '{"items":[]}'
  exit 0
fi

if [ -n "$PROJECT_NAME" ]; then
  echo "$result" | python3 -c "
import json, sys
data = json.load(sys.stdin)
prefix = '${PROJECT_NAME}-'
apis = [a for a in data.get('items', []) if a.get('name','').startswith(prefix)]
print(json.dumps({'items': apis}))
" 2>/dev/null || echo "$result"
else
  echo "$result"
fi
