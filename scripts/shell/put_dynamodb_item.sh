#!/bin/sh
# Usage: ./put_dynamodb_item.sh <project_name> <table_name> <item_json>
set -e

PROJECT_NAME="$1"
TABLE_NAME="$2"
ITEM_JSON="$3"

if [ -z "$PROJECT_NAME" ] || [ -z "$TABLE_NAME" ] || [ -z "$ITEM_JSON" ]; then
  echo "Usage: $0 <project_name> <table_name> <item_json>"
  exit 1
fi

AWS_ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item "$ITEM_JSON" \
  --endpoint-url "$AWS_ENDPOINT_URL" \
  --region "$AWS_DEFAULT_REGION" 