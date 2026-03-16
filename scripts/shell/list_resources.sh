#!/bin/sh

export AWS_PAGER=""

# LocalStack Resource Listing Script
# Lists S3, DynamoDB, Lambda, IAM, API Gateway, Secrets Manager, and SSM resources
# All service queries run in parallel to minimise total latency.

# Configuration
PROJECT_NAME=$1
ENVIRONMENT=$2
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

NOW=$(date -Iseconds)

# Parse --verbose and --all flags
VERBOSE=false
SHOW_ALL=false
for arg in "$@"; do
  if [ "$arg" = "--verbose" ]; then
    VERBOSE=true
  elif [ "$arg" = "--all" ]; then
    SHOW_ALL=true
  fi
done
if [ "$LOG_OUTPUT" = "1" ]; then
  VERBOSE=true
fi

log() {
  if [ "$VERBOSE" = true ]; then
    echo "$1"
  fi
}

# ---------------------------------------------------------------------------
# Per-service list functions — each writes JSON-line objects to $1 (outfile)
# ---------------------------------------------------------------------------

list_s3_buckets() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    buckets=$($AWS_CMD s3api list-buckets --query "Buckets[].{Name:Name,CreationDate:CreationDate}" --output json 2>/dev/null) || buckets="[]"
  else
    buckets=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" --output json 2>/dev/null) || buckets="[]"
  fi
  echo "$buckets" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    created=$(echo "$row" | jq -r .CreationDate)
    id="s3-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type s3 --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    echo "$obj" >> "$outfile"
  done
}

list_dynamodb_tables() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    tables=$($AWS_CMD dynamodb list-tables --query "TableNames[]" --output json 2>/dev/null) || tables="[]"
  else
    tables=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json 2>/dev/null) || tables="[]"
  fi
  echo "$tables" | jq -r '.[]' 2>/dev/null | while read table_name; do
    table_info=$($AWS_CMD dynamodb describe-table --table-name "$table_name" --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json 2>/dev/null) || table_info='{"Status":"unknown"}'
    status=$(echo "$table_info" | jq -r .Status | tr '[:upper:]' '[:lower:]')
    id="dynamodb-$table_name"
    obj=$(jq -nc --arg id "$id" --arg name "$table_name" --arg type dynamodb --arg status "$status" --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    echo "$obj" >> "$outfile"
  done
}

list_lambda_functions() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    functions=$($AWS_CMD lambda list-functions --query "Functions[].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json 2>/dev/null) || functions="[]"
  else
    functions=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json 2>/dev/null) || functions="[]"
  fi
  echo "$functions" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    id="lambda-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type lambda --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    echo "$obj" >> "$outfile"
  done
}

list_iam_roles() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    roles=$($AWS_CMD iam list-roles --query "Roles[].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json 2>/dev/null) || roles="[]"
  else
    roles=$($AWS_CMD iam list-roles --query "Roles[?starts_with(RoleName, '$NAME_PREFIX')].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json 2>/dev/null) || roles="[]"
  fi
  echo "$roles" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    id="iam-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type iam --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    echo "$obj" >> "$outfile"
  done
}

list_api_gateways() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    apis=$($AWS_CMD apigateway get-rest-apis --query "items[].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json 2>/dev/null) || apis="[]"
  else
    apis=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json 2>/dev/null) || apis="[]"
  fi
  echo "$apis" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    api_id=$(echo "$row" | jq -r .Id)
    id="apigateway-$api_id"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type apigateway --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" --arg apiId "$api_id" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt,details:{apiId:$apiId}}')
    echo "$obj" >> "$outfile"
  done
}

list_secrets_manager_secrets() {
  outfile="$1"
  if [ "$SHOW_ALL" = true ]; then
    secrets=$($AWS_CMD secretsmanager list-secrets --query "SecretList[].{Name:Name,Description:Description,LastChangedDate:LastChangedDate,ARN:ARN,CreatedDate:CreatedDate}" --output json 2>/dev/null) || secrets="[]"
  else
    secrets=$($AWS_CMD secretsmanager list-secrets --query "SecretList[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,Description:Description,LastChangedDate:LastChangedDate,ARN:ARN,CreatedDate:CreatedDate}" --output json 2>/dev/null) || secrets="[]"
  fi
  echo "$secrets" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    description=$(echo "$row" | jq -r '.Description // ""')
    arn=$(echo "$row" | jq -r .ARN)
    createdDate=$(echo "$row" | jq -r .CreatedDate)
    lastChangedDate=$(echo "$row" | jq -r .LastChangedDate)
    id="secretsmanager-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type secretsmanager --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$createdDate" --arg arn "$arn" --arg description "$description" --arg lastChangedDate "$lastChangedDate" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt,details:{arn:$arn,description:$description,lastChangedDate:$lastChangedDate}}')
    echo "$obj" >> "$outfile"
  done
}

list_ssm_parameters() {
  outfile="$1"
  params=$($AWS_CMD ssm describe-parameters --query "Parameters[].{Name:Name,Type:Type,LastModifiedDate:LastModifiedDate}" --output json 2>/dev/null) || params="[]"
  echo "$params" | jq -c '.[]' 2>/dev/null | while read row; do
    name=$(echo "$row" | jq -r .Name)
    param_type=$(echo "$row" | jq -r '.Type // "String"')
    lastModified=$(echo "$row" | jq -r '.LastModifiedDate // ""')
    if [ "$SHOW_ALL" = true ] || [ -z "$NAME_PREFIX" ] || case "$name" in "/${NAME_PREFIX}"*) true ;; *) false ;; esac; then
      id="ssm-$name"
      obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type ssm --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$lastModified" --arg paramType "$param_type" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt,details:{parameterType:$paramType}}')
      echo "$obj" >> "$outfile"
    fi
  done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first." >&2; exit 1; }
  if ! curl -s --connect-timeout 5 --max-time 10 "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  log "Listing resources for project: $PROJECT_NAME"

  # Create per-service temp files so parallel writes never collide
  TMP_S3=$(mktemp)
  TMP_DYNAMO=$(mktemp)
  TMP_LAMBDA=$(mktemp)
  TMP_IAM=$(mktemp)
  TMP_APIGW=$(mktemp)
  TMP_SECRETS=$(mktemp)
  TMP_SSM=$(mktemp)
  TMP_ALL=$(mktemp)
  trap 'rm -f "$TMP_S3" "$TMP_DYNAMO" "$TMP_LAMBDA" "$TMP_IAM" "$TMP_APIGW" "$TMP_SECRETS" "$TMP_SSM" "$TMP_ALL"' EXIT

  # Run all queries in parallel
  (list_s3_buckets      "$TMP_S3"      2>/dev/null || true) &
  (list_dynamodb_tables "$TMP_DYNAMO"  2>/dev/null || true) &
  (list_lambda_functions "$TMP_LAMBDA" 2>/dev/null || true) &
  (list_iam_roles       "$TMP_IAM"     2>/dev/null || true) &
  (list_api_gateways    "$TMP_APIGW"   2>/dev/null || true) &
  (list_secrets_manager_secrets "$TMP_SECRETS" 2>/dev/null || true) &
  (list_ssm_parameters  "$TMP_SSM"     2>/dev/null || true) &
  wait

  # Merge all results into one file and output JSON array
  cat "$TMP_S3" "$TMP_DYNAMO" "$TMP_LAMBDA" "$TMP_IAM" "$TMP_APIGW" "$TMP_SECRETS" "$TMP_SSM" > "$TMP_ALL"
  if [ -s "$TMP_ALL" ]; then
    printf '[%s]\n' "$(paste -sd, "$TMP_ALL")"
  else
    echo '[]'
  fi
}

main "$@"
