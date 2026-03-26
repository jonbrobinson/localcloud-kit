#!/bin/sh
# get_lambda_code.sh — Fetch Lambda deployment package, unzip, and output file contents as JSON
# Usage: ./get_lambda_code.sh <function_name>
# Output: JSON with { "files": [{ "name": "...", "content": "..." }] }

set -e
FUNCTION_NAME="${1}"
AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://aws-emulator:4566}"
AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if [ -z "$FUNCTION_NAME" ]; then
  echo '{"error":"Function name is required"}' >&2
  exit 1
fi

FUNC_JSON=$(aws --endpoint-url="$AWS_ENDPOINT" --region="$AWS_REGION" lambda get-function --function-name "$FUNCTION_NAME" --output json 2>/dev/null) || {
  echo '{"error":"Failed to get Lambda function"}' >&2
  exit 1
}

CODE_LOCATION=$(echo "$FUNC_JSON" | jq -r '.Code.Location // empty')
if [ -z "$CODE_LOCATION" ] || [ "$CODE_LOCATION" = "null" ]; then
  echo '{"error":"No code location in response"}' >&2
  exit 1
fi

CODE_URL=$(echo "$CODE_LOCATION" | sed 's|http://localhost:|http://aws-emulator:|g' | sed 's|https://localhost:|https://aws-emulator:|g')

ZIP_FILE="$TMP_DIR/code.zip"
curl -sS -o "$ZIP_FILE" "$CODE_URL" 2>/dev/null || {
  echo '{"error":"Failed to download code package"}' >&2
  exit 1
}

mkdir -p "$TMP_DIR/extracted"
unzip -q -o "$ZIP_FILE" -d "$TMP_DIR/extracted" 2>/dev/null || {
  echo '{"error":"Failed to unzip code package"}' >&2
  exit 1
}

# Build JSON array
OUT="$TMP_DIR/out.json"
echo '{"files": [' > "$OUT"
first=1
for f in $(find "$TMP_DIR/extracted" -type f); do
  REL=$(echo "$f" | sed "s|$TMP_DIR/extracted/||")
  CONTENT=$(jq -Rs . < "$f")
  NAME=$(echo "$REL" | jq -sRr @json)
  if [ "$first" = 1 ]; then
    first=0
  else
    echo -n ',' >> "$OUT"
  fi
  printf '{"name":%s,"content":%s}' "$NAME" "$CONTENT" >> "$OUT"
done
echo ']}' >> "$OUT"
cat "$OUT"
