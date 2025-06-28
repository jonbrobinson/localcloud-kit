#!/bin/bash

# LocalStack Resource Listing Script
# Lists S3, DynamoDB, Lambda, and API Gateway resources using AWS CLI

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME=${PROJECT_NAME:-"localstack-template"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|uat|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be one of: dev, uat, prod${NC}"
    exit 1
fi

# Resource names
NAME_PREFIX="${PROJECT_NAME}-${ENVIRONMENT}"

# AWS CLI base command
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Store found resources
FOUND_RESOURCES=()

log() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "SUCCESS")
            echo -e "${GREEN}[${timestamp}] ✓ ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ✗ ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[${timestamp}] ⚠ ${message}${NC}"
            ;;
        *)
            echo -e "${BLUE}[${timestamp}] ℹ ${message}${NC}"
            ;;
    esac
}

list_s3_buckets() {
    log "Listing S3 buckets..."
    
    local buckets=$($AWS_CMD s3api list-buckets --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" --output json 2>/dev/null || echo '[]')
    local bucket_count=$(echo "$buckets" | jq 'length')
    
    if [ "$bucket_count" -gt 0 ]; then
        echo "$buckets" | jq -r '.[] | "  • \(.Name) (Created: \(.CreationDate))"' | while read -r line; do
            FOUND_RESOURCES+=("$line")
        done
        log "Found $bucket_count S3 bucket(s)" "SUCCESS"
    else
        log "No S3 buckets found for this project and environment" "WARNING"
    fi
}

list_dynamodb_tables() {
    log "Listing DynamoDB tables..."
    
    local tables=$($AWS_CMD dynamodb list-tables --query "TableNames[?starts_with(@, '$NAME_PREFIX')]" --output json 2>/dev/null || echo '[]')
    local table_count=$(echo "$tables" | jq 'length')
    
    if [ "$table_count" -gt 0 ]; then
        echo "$tables" | jq -r '.[]' | while read -r table_name; do
            # Get table details
            local table_info=$($AWS_CMD dynamodb describe-table --table-name "$table_name" --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json 2>/dev/null || echo '{"Status":"Unknown","ItemCount":0}')
            local status=$(echo "$table_info" | jq -r '.Status')
            local item_count=$(echo "$table_info" | jq -r '.ItemCount')
            FOUND_RESOURCES+=("  • $table_name (Status: $status, Items: $item_count)")
        done
        log "Found $table_count DynamoDB table(s)" "SUCCESS"
    else
        log "No DynamoDB tables found for this project and environment" "WARNING"
    fi
}

list_lambda_functions() {
    log "Listing Lambda functions..."
    
    local functions=$($AWS_CMD lambda list-functions --query "Functions[?starts_with(FunctionName, '$NAME_PREFIX')].{Name:FunctionName,Runtime:Runtime,Handler:Handler,CodeSize:CodeSize}" --output json 2>/dev/null || echo '[]')
    local function_count=$(echo "$functions" | jq 'length')
    
    if [ "$function_count" -gt 0 ]; then
        echo "$functions" | jq -r '.[] | "  • \(.Name) (\(.Runtime), Handler: \(.Handler))"' | while read -r line; do
            FOUND_RESOURCES+=("$line")
        done
        log "Found $function_count Lambda function(s)" "SUCCESS"
    else
        log "No Lambda functions found for this project and environment" "WARNING"
    fi
}

list_iam_roles() {
    log "Listing IAM roles..."
    
    local roles=$($AWS_CMD iam list-roles --query "Roles[?starts_with(RoleName, '$NAME_PREFIX')].{Name:RoleName,Arn:Arn,CreateDate:CreateDate}" --output json 2>/dev/null || echo '[]')
    local role_count=$(echo "$roles" | jq 'length')
    
    if [ "$role_count" -gt 0 ]; then
        echo "$roles" | jq -r '.[] | "  • \(.Name) (Created: \(.CreateDate))"' | while read -r line; do
            FOUND_RESOURCES+=("$line")
        done
        log "Found $role_count IAM role(s)" "SUCCESS"
    else
        log "No IAM roles found for this project and environment" "WARNING"
    fi
}

list_api_gateways() {
    log "Listing API Gateways..."
    
    local apis=$($AWS_CMD apigateway get-rest-apis --query "items[?starts_with(name, '$NAME_PREFIX')].{Name:name,Id:id,Description:description,CreatedDate:createdDate}" --output json 2>/dev/null || echo '[]')
    local api_count=$(echo "$apis" | jq 'length')
    
    if [ "$api_count" -gt 0 ]; then
        echo "$apis" | jq -r '.[] | "  • \(.Name) (ID: \(.Id), Created: \(.CreatedDate))"' | while read -r line; do
            FOUND_RESOURCES+=("$line")
        done
        log "Found $api_count API Gateway(s)" "SUCCESS"
    else
        log "No API Gateways found for this project and environment" "WARNING"
    fi
}

print_summary() {
    echo -e "\n${CYAN}============================================================"
    echo "RESOURCE LISTING SUMMARY"
    echo "============================================================${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Environment: $ENVIRONMENT"
    echo "LocalStack Endpoint: $AWS_ENDPOINT"
    echo "Name Prefix: $NAME_PREFIX"
    
    local total_resources=${#FOUND_RESOURCES[@]}
    
    if [ "$total_resources" -eq 0 ]; then
        echo -e "\n${YELLOW}No resources found for this project and environment.${NC}"
    else
        echo -e "\n${YELLOW}Found Resources:${NC}"
        for resource in "${FOUND_RESOURCES[@]}"; do
            echo "$resource"
        done
        echo -e "\n${GREEN}Total resources found: $total_resources${NC}"
    fi
    
    echo -e "\n${CYAN}============================================================${NC}"
}

main() {
    log "Listing resources for $PROJECT_NAME in $ENVIRONMENT environment"
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log "AWS CLI is not installed. Please install it first." "ERROR"
        exit 1
    fi
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        log "jq is not installed. Please install it first." "ERROR"
        exit 1
    fi
    
    # Check if LocalStack is running
    if ! curl -s "$AWS_ENDPOINT" > /dev/null; then
        log "LocalStack is not running at $AWS_ENDPOINT. Please start it first." "ERROR"
        exit 1
    fi
    
    # List all resources
    list_s3_buckets
    list_dynamodb_tables
    list_lambda_functions
    list_iam_roles
    list_api_gateways
    
    print_summary
}

# Run main function
main "$@" 