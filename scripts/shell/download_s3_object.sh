#!/bin/sh

set -e
export AWS_PAGER=""

# S3 Object Download Script
# Downloads files from S3 buckets in LocalStack

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
BUCKET_NAME=${2:-""}
OBJECT_KEY=${3:-""}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Set dummy credentials for LocalStack
export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="${AWS_REGION}"

# Parse --verbose flag
VERBOSE=false
for arg in "$@"; do
  if [ "$arg" = "--verbose" ]; then
    VERBOSE=true
    break
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

# Function to download object
download_object() {
    local bucket_name="$1"
    local object_key="$2"
    
    if [ -z "$bucket_name" ] || [ -z "$object_key" ]; then
        echo "Error: Bucket name and object key are required" >&2
        exit 1
    fi
    
    # Check if bucket exists
    if ! $AWS_CMD s3api head-bucket --bucket "$bucket_name" >/dev/null 2>&1; then
        echo "Error: Bucket '$bucket_name' does not exist" >&2
        exit 1
    fi
    
    # Check if object exists
    if ! $AWS_CMD s3api head-object --bucket "$bucket_name" --key "$object_key" >/dev/null 2>&1; then
        echo "Error: Object '$object_key' does not exist in bucket '$bucket_name'" >&2
        exit 1
    fi
    
    # Get object content
    log "Downloading object: $object_key from bucket: $bucket_name"
    
    # Get object content
    $AWS_CMD s3api get-object \
        --bucket "$bucket_name" \
        --key "$object_key" \
        /tmp/downloaded_object > /dev/null
    
    # Get object metadata
    $AWS_CMD s3api head-object \
        --bucket "$bucket_name" \
        --key "$object_key" \
        --query '{ContentType:ContentType,ContentLength:ContentLength,LastModified:LastModified,ETag:ETag}' \
        --output json 2>/dev/null > /tmp/object_metadata.json
    
    # Read the content and metadata
    if [ -f /tmp/downloaded_object ]; then
        cat /tmp/downloaded_object
        rm -f /tmp/downloaded_object
    fi
    
    # Output metadata as JSON comment for parsing
    echo "<!--METADATA:$(cat /tmp/object_metadata.json)-->" >&2
    rm -f /tmp/object_metadata.json
}

# Main execution
main() {
    download_object "$BUCKET_NAME" "$OBJECT_KEY"
}

# Run main function
main "$@" 