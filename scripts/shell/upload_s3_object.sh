#!/bin/sh

set -e
export AWS_PAGER=""

# S3 Object Upload Script
# Uploads files to S3 buckets in LocalStack

# Configuration
PROJECT_NAME=${1:-"localstack-template"}
BUCKET_NAME=${2:-""}
OBJECT_KEY=${3:-""}
FILE_PATH=${4:-""}
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

# Function to upload object
upload_object() {
    local bucket_name="$1"
    local object_key="$2"
    local file_path="$3"
    
    if [ -z "$bucket_name" ] || [ -z "$object_key" ] || [ -z "$file_path" ]; then
        echo "Error: Bucket name, object key, and file path are required" >&2
        exit 1
    fi
    
    # Check if bucket exists
    if ! $AWS_CMD s3api head-bucket --bucket "$bucket_name" >/dev/null 2>&1; then
        echo "Error: Bucket '$bucket_name' does not exist" >&2
        exit 1
    fi
    
    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "Error: File '$file_path' does not exist" >&2
        exit 1
    fi
    
    # Upload object
    log "Uploading object: $object_key to bucket: $bucket_name"
    
    # Determine content type based on file extension
    content_type="application/octet-stream"
    case "$object_key" in
        *.jpg|*.jpeg) content_type="image/jpeg" ;;
        *.png) content_type="image/png" ;;
        *.gif) content_type="image/gif" ;;
        *.svg) content_type="image/svg+xml" ;;
        *.txt) content_type="text/plain" ;;
        *.json) content_type="application/json" ;;
        *.xml) content_type="application/xml" ;;
        *.html|*.htm) content_type="text/html" ;;
        *.css) content_type="text/css" ;;
        *.js) content_type="application/javascript" ;;
        *.pdf) content_type="application/pdf" ;;
        *.zip) content_type="application/zip" ;;
    esac
    
    $AWS_CMD s3api put-object \
        --bucket "$bucket_name" \
        --key "$object_key" \
        --body "$file_path" \
        --content-type "$content_type" > /dev/null
    
    # Get object metadata
    $AWS_CMD s3api head-object \
        --bucket "$bucket_name" \
        --key "$object_key" \
        --query '{ContentType:ContentType,ContentLength:ContentLength,LastModified:LastModified,ETag:ETag}' \
        --output json 2>/dev/null > /tmp/object_metadata.json
    
    # Output metadata as JSON comment for parsing
    echo "<!--METADATA:$(cat /tmp/object_metadata.json)-->" >&2
    rm -f /tmp/object_metadata.json
    
    echo "Successfully uploaded $object_key to bucket $bucket_name"
}

# Main execution
main() {
    upload_object "$BUCKET_NAME" "$OBJECT_KEY" "$FILE_PATH"
}

# Run main function
main "$@" 