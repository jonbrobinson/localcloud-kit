#!/bin/sh

set -e  # Exit on any error
export AWS_PAGER=""

# LocalStack Single Resource Creation Script
# Creates individual S3, DynamoDB, Lambda, or API Gateway resources using AWS CLI

# Configuration
PROJECT_NAME=${1:-"localstack-manager"}
RESOURCE_TYPE=${2:-"s3"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Parse --verbose flag and --config flag
VERBOSE=false
DYNAMODB_CONFIG=""
for i in "$@"; do
  case $i in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --config)
      DYNAMODB_CONFIG="$3"
      shift 2
      ;;
  esac
done

if [ "$LOG_OUTPUT" = "1" ]; then
  VERBOSE=true
fi

log() {
  if [ "$VERBOSE" = true ]; then
    echo "$1"
  fi
}

NOW=$(date -Iseconds)

create_s3_bucket() {
  if [ -n "$DYNAMODB_CONFIG" ]; then
    # This is actually S3 config, but we're reusing the variable name for simplicity
    S3_CONFIG="$DYNAMODB_CONFIG"
    
    # Parse the JSON configuration
    BUCKET_NAME=$(echo "$S3_CONFIG" | jq -r '.bucketName // empty')
    BUCKET_REGION=$(echo "$S3_CONFIG" | jq -r '.region // "us-east-1"')
    VERSIONING=$(echo "$S3_CONFIG" | jq -r '.versioning // false')
    ENCRYPTION=$(echo "$S3_CONFIG" | jq -r '.encryption // false')
    
    # Use provided bucket name or default
    if [ -z "$BUCKET_NAME" ]; then
      BUCKET_NAME="${NAME_PREFIX}-bucket"
    fi
    
    log "Creating S3 bucket with configuration: $BUCKET_NAME"
    
    # Create the bucket
    if [ "$BUCKET_REGION" != "us-east-1" ]; then
      $AWS_CMD s3api create-bucket --bucket "$BUCKET_NAME" --region "$BUCKET_REGION" --create-bucket-configuration LocationConstraint="$BUCKET_REGION" 2>/dev/null || true
    else
      $AWS_CMD s3api create-bucket --bucket "$BUCKET_NAME" --region "$BUCKET_REGION" 2>/dev/null || true
    fi
    
    # Enable versioning if requested
    if [ "$VERSIONING" = "true" ]; then
      $AWS_CMD s3api put-bucket-versioning --bucket "$BUCKET_NAME" --versioning-configuration Status=Enabled 2>/dev/null || true
      log "Enabled versioning for bucket: $BUCKET_NAME"
    fi
    
    # Enable encryption if requested
    if [ "$ENCRYPTION" = "true" ]; then
      $AWS_CMD s3api put-bucket-encryption --bucket "$BUCKET_NAME" --server-side-encryption-configuration '{
        "Rules": [
          {
            "ApplyServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }
        ]
      }' 2>/dev/null || true
      log "Enabled encryption for bucket: $BUCKET_NAME"
    fi
    
    log "Created S3 bucket: $BUCKET_NAME with configuration"
    
    # Build details JSON
    DETAILS_JSON=$(cat <<EOF
{
  "bucketName": "$BUCKET_NAME",
  "region": "$BUCKET_REGION",
  "versioning": $VERSIONING,
  "encryption": $ENCRYPTION
}
EOF
)
    
  else
    # Default simple bucket creation
    BUCKET_NAME="${NAME_PREFIX}-bucket"
    $AWS_CMD s3api create-bucket --bucket "$BUCKET_NAME" 2>/dev/null || true
    log "Created S3 bucket: $BUCKET_NAME"
    
    DETAILS_JSON=$(cat <<EOF
{
  "bucketName": "$BUCKET_NAME",
  "region": "$AWS_REGION"
}
EOF
)
  fi
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "s3-$BUCKET_NAME",
  "name": "$BUCKET_NAME",
  "type": "s3",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": $DETAILS_JSON
}
EOF
}

create_dynamodb_table() {
  if [ -n "$DYNAMODB_CONFIG" ]; then
    # Parse the JSON configuration
    TABLE_NAME=$(echo "$DYNAMODB_CONFIG" | jq -r '.tableName // empty')
    PARTITION_KEY=$(echo "$DYNAMODB_CONFIG" | jq -r '.partitionKey // "pk"')
    SORT_KEY=$(echo "$DYNAMODB_CONFIG" | jq -r '.sortKey // empty')
    BILLING_MODE=$(echo "$DYNAMODB_CONFIG" | jq -r '.billingMode // "PAY_PER_REQUEST"')
    READ_CAPACITY=$(echo "$DYNAMODB_CONFIG" | jq -r '.readCapacity // 5')
    WRITE_CAPACITY=$(echo "$DYNAMODB_CONFIG" | jq -r '.writeCapacity // 5')
    GSIS=$(echo "$DYNAMODB_CONFIG" | jq -r '.gsis // []')
    
    # Use provided table name or default
    if [ -z "$TABLE_NAME" ]; then
      TABLE_NAME="${NAME_PREFIX}-table"
    fi
    
    log "Creating DynamoDB table with configuration: $TABLE_NAME"
    
    # Build attribute definitions
    ATTRIBUTE_DEFS="AttributeName=$PARTITION_KEY,AttributeType=S"
    KEY_SCHEMA="AttributeName=$PARTITION_KEY,KeyType=HASH"
    
    if [ -n "$SORT_KEY" ] && [ "$SORT_KEY" != "null" ]; then
      ATTRIBUTE_DEFS="$ATTRIBUTE_DEFS AttributeName=$SORT_KEY,AttributeType=S"
      KEY_SCHEMA="$KEY_SCHEMA AttributeName=$SORT_KEY,KeyType=RANGE"
    fi
    
    # Build GSI configurations
    GSI_ARGS=""
    if [ "$GSIS" != "[]" ] && [ "$GSIS" != "null" ]; then
      GSI_COUNT=$(echo "$GSIS" | jq length)
      for i in $(seq 0 $((GSI_COUNT - 1))); do
        GSI=$(echo "$GSIS" | jq ".[$i]")
        GSI_NAME=$(echo "$GSI" | jq -r '.indexName')
        GSI_PK=$(echo "$GSI" | jq -r '.partitionKey')
        GSI_SK=$(echo "$GSI" | jq -r '.sortKey // empty')
        GSI_PROJECTION=$(echo "$GSI" | jq -r '.projectionType // "ALL"')
        
        # Add GSI attributes to attribute definitions
        ATTRIBUTE_DEFS="$ATTRIBUTE_DEFS AttributeName=$GSI_PK,AttributeType=S"
        if [ -n "$GSI_SK" ] && [ "$GSI_SK" != "null" ]; then
          ATTRIBUTE_DEFS="$ATTRIBUTE_DEFS AttributeName=$GSI_SK,AttributeType=S"
        fi
        
        # Build GSI key schema
        GSI_KEY_SCHEMA="AttributeName=$GSI_PK,KeyType=HASH"
        if [ -n "$GSI_SK" ] && [ "$GSI_SK" != "null" ]; then
          GSI_KEY_SCHEMA="$GSI_KEY_SCHEMA AttributeName=$GSI_SK,KeyType=RANGE"
        fi
        
        # Build projection
        GSI_PROJECTION_SPEC="ProjectionType=$GSI_PROJECTION"
        
        # Add to GSI args
        if [ -n "$GSI_ARGS" ]; then
          GSI_ARGS="$GSI_ARGS "
        fi
        GSI_ARGS="${GSI_ARGS}--global-secondary-indexes IndexName=$GSI_NAME,KeySchema=[$GSI_KEY_SCHEMA],Projection=[$GSI_PROJECTION_SPEC]"
      done
    fi
    
    # Build billing mode args
    BILLING_ARGS="--billing-mode $BILLING_MODE"
    if [ "$BILLING_MODE" = "PROVISIONED" ]; then
      BILLING_ARGS="$BILLING_ARGS --provisioned-throughput ReadCapacityUnits=$READ_CAPACITY,WriteCapacityUnits=$WRITE_CAPACITY"
    fi
    
    # Create the table
    $AWS_CMD dynamodb create-table \
      --table-name "$TABLE_NAME" \
      --attribute-definitions "$ATTRIBUTE_DEFS" \
      --key-schema "$KEY_SCHEMA" \
      $BILLING_ARGS \
      $GSI_ARGS 2>/dev/null || true
    
    log "Created DynamoDB table: $TABLE_NAME with configuration"
    
    # Build details JSON
    DETAILS_JSON=$(cat <<EOF
{
  "tableName": "$TABLE_NAME",
  "billingMode": "$BILLING_MODE",
  "partitionKey": "$PARTITION_KEY",
  "sortKey": "$SORT_KEY",
  "gsiCount": $(echo "$GSIS" | jq length)
}
EOF
)
    
  else
    # Default simple table creation
    TABLE_NAME="${NAME_PREFIX}-table"
    $AWS_CMD dynamodb create-table --table-name "$TABLE_NAME" \
      --attribute-definitions AttributeName=pk,AttributeType=S \
      --key-schema AttributeName=pk,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST 2>/dev/null || true
    log "Created DynamoDB table: $TABLE_NAME"
    
    DETAILS_JSON=$(cat <<EOF
{
  "tableName": "$TABLE_NAME",
  "billingMode": "PAY_PER_REQUEST",
  "keySchema": "pk (String)"
}
EOF
)
  fi
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "dynamodb-$TABLE_NAME",
  "name": "$TABLE_NAME",
  "type": "dynamodb",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": $DETAILS_JSON
}
EOF
}

create_lambda_function() {
  FUNCTION_NAME="${NAME_PREFIX}-lambda"
  $AWS_CMD lambda create-function --function-name "$FUNCTION_NAME" \
    --runtime python3.9 --role arn:aws:iam::000000000000:role/service-role/irrelevant \
    --handler lambda_function.lambda_handler --zip-file fileb://function.zip 2>/dev/null || true
  log "Created Lambda function: $FUNCTION_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "lambda-$FUNCTION_NAME",
  "name": "$FUNCTION_NAME",
  "type": "lambda",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "functionName": "$FUNCTION_NAME",
    "runtime": "python3.9",
    "handler": "lambda_function.lambda_handler"
  }
}
EOF
}

create_api_gateway() {
  API_NAME="${NAME_PREFIX}-api"
  $AWS_CMD apigateway create-rest-api --name "$API_NAME" 2>/dev/null || true
  log "Created API Gateway: $API_NAME"
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "apigateway-$API_NAME",
  "name": "$API_NAME",
  "type": "apigateway",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": {
    "apiName": "$API_NAME",
    "type": "REST"
  }
}
EOF
}

main() {
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is not installed. Please install it first." >&2; exit 1; }
  command -v jq >/dev/null 2>&1 || { echo "jq is not installed. Please install it first." >&2; exit 1; }
  
  if ! curl -s "$AWS_ENDPOINT" >/dev/null; then
    echo "LocalStack is not running at $AWS_ENDPOINT. Please start it first." >&2
    exit 1
  fi
  
  log "Creating single resource: $RESOURCE_TYPE for project: $PROJECT_NAME"
  
  case $RESOURCE_TYPE in
    s3)
      create_s3_bucket
      ;;
    dynamodb)
      create_dynamodb_table
      ;;
    lambda)
      create_lambda_function
      ;;
    apigateway)
      create_api_gateway
      ;;
    *)
      echo "Unknown resource type: $RESOURCE_TYPE" >&2
      echo "Supported types: s3, dynamodb, lambda, apigateway" >&2
      exit 1
      ;;
  esac
}

main "$@" 