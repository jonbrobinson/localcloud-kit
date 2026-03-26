#!/bin/sh
# list_lambda_functions.sh — List Lambda functions, optionally filtered by project name prefix
# Usage: ./list_lambda_functions.sh [project_name]

PROJECT_NAME="${1:-}"
MAX_ITEMS="${2:-100}"

AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://aws-emulator:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"

AWS_CMD="aws --endpoint-url=$AWS_ENDPOINT --region=$AWS_REGION"

result=$($AWS_CMD lambda list-functions --max-items "$MAX_ITEMS" 2>/dev/null)
if [ $? -ne 0 ]; then
  echo '{"Functions":[]}'
  exit 0
fi

if [ -n "$PROJECT_NAME" ]; then
  echo "$result" | python3 -c "
import json, sys
data = json.load(sys.stdin)
prefix = '${PROJECT_NAME}-'
fns = [f for f in data.get('Functions', []) if f.get('FunctionName','').startswith(prefix)]
print(json.dumps({'Functions': fns}))
" 2>/dev/null || echo "$result"
else
  echo "$result"
fi
