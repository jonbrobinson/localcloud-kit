#!/bin/sh

set -e
export AWS_PAGER=""

# S3 Bucket Contents Listing Script
# Lists files and folders in S3 buckets with metadata

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
ENVIRONMENT=${2:-"dev"}
BUCKET_NAME=${3:-""}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Function to list bucket contents
list_bucket_contents() {
    local bucket_name="$1"
    local prefix="${2:-}"
    
    if [ -z "$bucket_name" ]; then
        echo "Error: Bucket name is required" >&2
        exit 1
    fi
    
    # Check if bucket exists
    if ! $AWS_CMD s3api head-bucket --bucket "$bucket_name" >/dev/null 2>&1; then
        echo "Error: Bucket '$bucket_name' does not exist" >&2
        exit 1
    fi
    
    # List objects with details
    $AWS_CMD s3api list-objects-v2 \
        --bucket "$bucket_name" \
        --prefix "$prefix" \
        --query 'Contents[].{Key:Key,Size:Size,LastModified:LastModified,StorageClass:StorageClass}' \
        --output json 2>/dev/null || echo '[]'
}

# Function to list buckets for project
list_project_buckets() {
    $AWS_CMD s3api list-buckets \
        --query "Buckets[?starts_with(Name, '$NAME_PREFIX')].{Name:Name,CreationDate:CreationDate}" \
        --output json 2>/dev/null || echo '[]'
}

# Main execution
main() {
    if [ -z "$BUCKET_NAME" ]; then
        # List all buckets for the project
        echo "Listing buckets for project: $PROJECT_NAME"
        list_project_buckets
    else
        # List contents of specific bucket
        echo "Listing contents of bucket: $BUCKET_NAME"
        list_bucket_contents "$BUCKET_NAME"
    fi
}

# Run main function
main "$@" 