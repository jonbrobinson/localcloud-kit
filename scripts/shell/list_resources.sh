#!/bin/sh

set -e
export AWS_PAGER=""

# LocalStack Resource Listing Script
# Lists S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Configuration
PROJECT_NAME=$1
ENVIRONMENT=$2
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

NOW=$(date -Iseconds)

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

tmp_add_resource() {
  echo "$1" >> "$TMPFILE"
}

# Parse --verbose flag and --all flag
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

list_s3_buckets() {
  if [ "$SHOW_ALL" = true ]; then
    buckets=$($AWS_CMD s3api list-buckets --query "Buckets[].{Name:Name,CreationDate:CreationDate}" --output json)
  else
    buckets=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" --output json)
  fi
  echo "$buckets" | jq -c '.[]' | while read row; do
    name=$(echo "$row" | jq -r .Name)
    created=$(echo "$row" | jq -r .CreationDate)
    id="s3-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type s3 --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    tmp_add_resource "$obj"
  done
}

list_dynamodb_tables() {
  if [ "$SHOW_ALL" = true ]; then
    tables=$($AWS_CMD dynamodb list-tables --query "TableNames[]" --output json)
  else
    tables=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json)
  fi
  echo "$tables" | jq -r '.[]' | while read table_name; do
    table_info=$($AWS_CMD dynamodb describe-table --table-name "$table_name" --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json)
    status=$(echo "$table_info" | jq -r .Status | tr '[:upper:]' '[:lower:]')
    id="dynamodb-$table_name"
    obj=$(jq -nc --arg id "$id" --arg name "$table_name" --arg type dynamodb --arg status "$status" --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    tmp_add_resource "$obj"
  done
}

list_lambda_functions() {
  if [ "$SHOW_ALL" = true ]; then
    functions=$($AWS_CMD lambda list-functions --query "Functions[].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json)
  else
    functions=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json)
  fi
  echo "$functions" | jq -c '.[]' | while read row; do
    name=$(echo "$row" | jq -r .Name)
    id="lambda-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type lambda --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    tmp_add_resource "$obj"
  done
}

list_iam_roles() {
  if [ "$SHOW_ALL" = true ]; then
    roles=$($AWS_CMD iam list-roles --query "Roles[].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json)
  else
    roles=$($AWS_CMD iam list-roles --query "Roles[?starts_with(RoleName, '$NAME_PREFIX')].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json)
  fi
  echo "$roles" | jq -c '.[]' | while read row; do
    name=$(echo "$row" | jq -r .Name)
    id="iam-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type iam --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
    tmp_add_resource "$obj"
  done
}

list_api_gateways() {
  if [ "$SHOW_ALL" = true ]; then
    apis=$($AWS_CMD apigateway get-rest-apis --query "items[].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json)
  else
    apis=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json)
  fi
  echo "$apis" | jq -c '.[]' | while read row; do
    name=$(echo "$row" | jq -r .Name)
    api_id=$(echo "$row" | jq -r .Id)
    id="apigateway-$api_id"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type apigateway --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$NOW" --arg apiId "$api_id" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt,details:{apiId:$apiId}}')
    tmp_add_resource "$obj"
  done
}

list_secrets_manager_secrets() {
  if [ "$SHOW_ALL" = true ]; then
    secrets=$($AWS_CMD secretsmanager list-secrets --query "SecretList[].{Name:Name,Description:Description,LastChangedDate:LastChangedDate,ARN:ARN,CreatedDate:CreatedDate}" --output json)
  else
    secrets=$($AWS_CMD secretsmanager list-secrets --query "SecretList[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,Description:Description,LastChangedDate:LastChangedDate,ARN:ARN,CreatedDate:CreatedDate}" --output json)
  fi
  echo "$secrets" | jq -c '.[]' | while read row; do
    name=$(echo "$row" | jq -r .Name)
    description=$(echo "$row" | jq -r '.Description // ""')
    arn=$(echo "$row" | jq -r .ARN)
    createdDate=$(echo "$row" | jq -r .CreatedDate)
    lastChangedDate=$(echo "$row" | jq -r .LastChangedDate)
    id="secretsmanager-$name"
    obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type secretsmanager --arg status active --arg project "$PROJECT_NAME" --arg createdAt "$createdDate" --arg arn "$arn" --arg description "$description" --arg lastChangedDate "$lastChangedDate" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt,details:{arn:$arn,description:$description,lastChangedDate:$lastChangedDate}}')
    tmp_add_resource "$obj"
  done
}

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first." >&2; exit 1; }
  if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  log "Listing resources for project: $PROJECT_NAME"
  list_s3_buckets
  list_dynamodb_tables
  list_lambda_functions
  list_iam_roles
  list_api_gateways
  list_secrets_manager_secrets
  # Output JSON array
  if [ -s "$TMPFILE" ]; then
    printf '[%s]\n' "$(paste -sd, "$TMPFILE")"
  else
    echo '[]'
  fi
}

main "$@" 