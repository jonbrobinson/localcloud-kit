#!/bin/bash

# LocalStack Resource Listing Script
# Lists S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Configuration
PROJECT_NAME=${PROJECT_NAME:-"localstack-template"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo "Error: Environment must be one of: dev, uat, prod" >&2
    exit 1
fi

NAME_PREFIX="${PROJECT_NAME}-${ENVIRONMENT}"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

RESOURCES=()
NOW=$(date --iso-8601=seconds 2>/dev/null || date -Iseconds)

list_s3_buckets() {
    local buckets=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" --output json 2>/dev/null || echo '[]')
    local bucket_count=$(echo "$buckets" | jq 'length')
    if [ "$bucket_count" -gt 0 ]; then
        for row in $(echo "$buckets" | jq -c '.[]'); do
            local name=$(echo "$row" | jq -r '.Name')
            local created=$(echo "$row" | jq -r '.CreationDate')
            local id="s3-${name}"
            RESOURCES+=("$(jq -nc --arg id "$id" --arg name "$name" --arg type "s3" --arg status "active" --arg environment "$ENVIRONMENT" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,environment:$environment,project:$project,createdAt:$createdAt}')")
        done
    fi
}

list_dynamodb_tables() {
    local tables=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json 2>/dev/null || echo '[]')
    local table_count=$(echo "$tables" | jq 'length')
    if [ "$table_count" -gt 0 ]; then
        for table_name in $(echo "$tables" | jq -r '.[]'); do
            local table_info=$($AWS_CMD dynamodb describe-table --table-name "$table_name" --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json 2>/dev/null || echo '{"Status":"Unknown","ItemCount":0}')
            local status=$(echo "$table_info" | jq -r '.Status' | tr '[:upper:]' '[:lower:]')
            local id="dynamodb-${table_name}"
            RESOURCES+=("$(jq -nc --arg id "$id" --arg name "$table_name" --arg type "dynamodb" --arg status "$status" --arg environment "$ENVIRONMENT" --arg project "$PROJECT_NAME" --arg createdAt "$NOW" '{id:$id,name:$name,type:$type,status:$status,environment:$environment,project:$project,createdAt:$createdAt}')")
        done
    fi
}

list_lambda_functions() {
    local functions=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize,LastModified:LastModified}" --output json 2>/dev/null || echo '[]')
    local function_count=$(echo "$functions" | jq 'length')
    if [ "$function_count" -gt 0 ]; then
        for row in $(echo "$functions" | jq -c '.[]'); do
            local name=$(echo "$row" | jq -r '.Name')
            local created=$(echo "$row" | jq -r '.LastModified')
            local id="lambda-${name}"
            RESOURCES+=("$(jq -nc --arg id "$id" --arg name "$name" --arg type "lambda" --arg status "active" --arg environment "$ENVIRONMENT" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,environment:$environment,project:$project,createdAt:$createdAt}')")
        done
    fi
}

list_iam_roles() {
    local roles=$($AWS_CMD iam list-roles --query "Roles[?starts_with(RoleName, '$NAME_PREFIX')].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json 2>/dev/null || echo '[]')
    local role_count=$(echo "$roles" | jq 'length')
    if [ "$role_count" -gt 0 ]; then
        for row in $(echo "$roles" | jq -c '.[]'); do
            local name=$(echo "$row" | jq -r '.Name')
            local created=$(echo "$row" | jq -r '.CreateDate')
            local id="iam-${name}"
            RESOURCES+=("$(jq -nc --arg id "$id" --arg name "$name" --arg type "iam" --arg status "active" --arg environment "$ENVIRONMENT" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,environment:$environment,project:$project,createdAt:$createdAt}')")
        done
    fi
}

list_api_gateways() {
    local apis=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json 2>/dev/null || echo '[]')
    local api_count=$(echo "$apis" | jq 'length')
    if [ "$api_count" -gt 0 ]; then
        for row in $(echo "$apis" | jq -c '.[]'); do
            local name=$(echo "$row" | jq -r '.Name')
            local created=$(echo "$row" | jq -r '.CreatedDate')
            local id="apigateway-${name}"
            RESOURCES+=("$(jq -nc --arg id "$id" --arg name "$name" --arg type "apigateway" --arg status "active" --arg environment "$ENVIRONMENT" --arg project "$PROJECT_NAME" --arg createdAt "$created" '{id:$id,name:$name,type:$type,status:$status,environment:$environment,project:$project,createdAt:$createdAt}')")
        done
    fi
}

main() {
    if ! command -v aws &> /dev/null; then
        echo "AWS CLI is not installed. Please install it first." >&2
        exit 1
    fi
    if ! command -v jq &> /dev/null; then
        echo "jq is not installed. Please install it first." >&2
        exit 1
    fi
    if ! curl -s "$AWS_ENDPOINT" > /dev/null; then
        echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
        exit 1
    fi
    list_s3_buckets
    list_dynamodb_tables
    list_lambda_functions
    list_iam_roles
    list_api_gateways
    # Output JSON array
    printf '[%s]\n' "$(IFS=,; echo "${RESOURCES[*]}")"
}

main "$@" 