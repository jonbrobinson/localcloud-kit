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
  # Success shape so the GUI can explain — create-flow still uploaded a package; some emulators omit Location
  jq -nc \
    --arg msg "This emulator did not return a code download URL (Code.Location). The function may still have a deployment package from create; try update-function-code from your machine or the manage page." \
    '{files:[],unavailableReason:$msg}'
  exit 0
fi

# Rewrite URLs so curl from the API container hits the emulator on the Docker network (not localhost/127.0.0.1)
EMULATOR_HOSTPORT=$(printf '%s' "$AWS_ENDPOINT" | sed -e 's|^https\{0,1\}://||')
CODE_URL=$(printf '%s' "$CODE_LOCATION" | sed "s#http://localhost:[0-9]*/#http://${EMULATOR_HOSTPORT}/#g" | sed "s#http://127.0.0.1:[0-9]*/#http://${EMULATOR_HOSTPORT}/#g" | sed "s#https://localhost:[0-9]*/#http://${EMULATOR_HOSTPORT}/#g" | sed "s#https://127.0.0.1:[0-9]*/#http://${EMULATOR_HOSTPORT}/#g")

ZIP_FILE="$TMP_DIR/code.zip"
if ! curl -fsS -o "$ZIP_FILE" "$CODE_URL" 2>/dev/null; then
  jq -nc \
    --arg url "$CODE_URL" \
    --arg msg "Could not download the deployment package from the emulator. The URL from get-function may not be reachable from the API container." \
    '{files:[],unavailableReason:($msg + " (URL host was adjusted for Docker networking.)")}'
  exit 0
fi

mkdir -p "$TMP_DIR/extracted"
if ! unzip -t "$ZIP_FILE" >/dev/null 2>&1 || ! unzip -q -o "$ZIP_FILE" -d "$TMP_DIR/extracted" 2>/dev/null; then
  jq -nc \
    --arg msg "Downloaded payload is not a valid zip (or is empty). The emulator may return a non-standard code package format." \
    '{files:[],unavailableReason:$msg}'
  exit 0
fi

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
