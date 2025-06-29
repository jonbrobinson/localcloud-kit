#!/bin/sh

# LocalStack Resource Listing Script
# Lists S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

NOW=$(date --iso-8601=seconds 2>/dev/null || date -Iseconds)

# Accumulate JSON objects as a string
RESOURCES=""

list_s3_buckets() {
    buckets=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" --output json 2>/dev/null || echo '[]')
    echo "$buckets" | jq -c '.[]' | while read row; do
        name=$(echo "$row" | jq -r '.Name')
        created=$(echo "$row" | jq -r '.CreationDate')
        id="s3-$name"
        obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type "s3" --arg status "active" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
        if [ -z "$RESOURCES" ]; then RESOURCES="$obj"; else RESOURCES="$RESOURCES,$obj"; fi
    done
}

list_dynamodb_tables() {
    tables=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json 2>/dev/null || echo '[]')
    echo "$tables" | jq -r '.[]' | while read table_name; do
        table_info=$($AWS_CMD dynamodb describe-table --table-name "$table_name" --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json 2>/dev/null || echo '{"Status":"Unknown","ItemCount":0}')
        status=$(echo "$table_info" | jq -r '.Status' | tr '[:upper:]' '[:lower:]')
        id="dynamodb-$table_name"
        obj=$(jq -nc --arg id "$id" --arg name "$table_name" --arg type "dynamodb" --arg status "$status" --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
        if [ -z "$RESOURCES" ]; then RESOURCES="$obj"; else RESOURCES="$RESOURCES,$obj"; fi
    done
}

list_lambda_functions() {
    functions=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json 2>/dev/null || echo '[]')
    echo "$functions" | jq -c '.[]' | while read row; do
        name=$(echo "$row" | jq -r '.Name')
        created=$(echo "$row" | jq -r '.LastModified')
        id="lambda-$name"
        obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type "lambda" --arg status "active" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
        if [ -z "$RESOURCES" ]; then RESOURCES="$obj"; else RESOURCES="$RESOURCES,$obj"; fi
    done
}

list_iam_roles() {
    roles=$($AWS_CMD iam list-roles --query "Roles[?starts_with(RoleName, '$NAME_PREFIX')].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json 2>/dev/null || echo '[]')
    echo "$roles" | jq -c '.[]' | while read row; do
        name=$(echo "$row" | jq -r '.Name')
        created=$(echo "$row" | jq -r '.CreateDate')
        id="iam-$name"
        obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type "iam" --arg status "active" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
        if [ -z "$RESOURCES" ]; then RESOURCES="$obj"; else RESOURCES="$RESOURCES,$obj"; fi
    done
}

list_api_gateways() {
    apis=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json 2>/dev/null || echo '[]')
    echo "$apis" | jq -c '.[]' | while read row; do
        name=$(echo "$row" | jq -r '.Name')
        created=$(echo "$row" | jq -r '.CreatedDate')
        id="apigateway-$name"
        obj=$(jq -nc --arg id "$id" --arg name "$name" --arg type "apigateway" --arg status "active" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,project:$project,createdAt:$createdAt}')
        if [ -z "$RESOURCES" ]; then RESOURCES="$obj"; else RESOURCES="$RESOURCES,$obj"; fi
    done
}

main() {
    if ! command -v aws >/dev/null 2>&1; then
        echo "AWS CLI is not installed. Please install it first." >&2
        exit 1
    fi
    if ! command -v jq >/dev/null 2>&1; then
        echo "jq is not installed. Please install it first." >&2
        exit 1
    fi
    if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
        echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
        exit 1
    fi
    list_s3_buckets
    list_dynamodb_tables
    list_lambda_functions
    list_iam_roles
    list_api_gateways
    # Output JSON array
    echo "[${RESOURCES}]"
}

main "$@" 