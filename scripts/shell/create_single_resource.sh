#!/bin/sh

# CloudStack Solutions - Enterprise AWS Development Tools
# Create a single AWS resource in LocalStack

set -e
export AWS_PAGER=""

# Configuration
PROJECT_NAME=${1:-"localcloud-kit"}
RESOURCE_TYPE=${2:-"s3"}
AWS_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localstack:4566"}
AWS_REGION=${AWS_REGION:-"us-east-1"}

NAME_PREFIX="$PROJECT_NAME"
AWS_CMD="aws --endpoint-url=${AWS_ENDPOINT} --region=${AWS_REGION}"

# Parse --verbose flag and --config flag
VERBOSE=false
RESOURCE_CONFIG=""

while [ $# -gt 0 ]; do
  case "$1" in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --config)
      shift
      RESOURCE_CONFIG="$1"
      shift
      ;;
    *)
      shift
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
  if [ -n "$RESOURCE_CONFIG" ]; then
    # Parse S3 configuration
    S3_CONFIG="$RESOURCE_CONFIG"
    
    # Parse the JSON configuration
    echo "DEBUG: S3_CONFIG = $S3_CONFIG" >&2
    BUCKET_NAME=$(echo "$S3_CONFIG" | jq -r '.bucketName // empty' 2>/dev/null || echo "")
    BUCKET_REGION=$(echo "$S3_CONFIG" | jq -r '.region // "us-east-1"' 2>/dev/null || echo "us-east-1")
    VERSIONING=$(echo "$S3_CONFIG" | jq -r '.versioning // false' 2>/dev/null || echo "false")
    ENCRYPTION=$(echo "$S3_CONFIG" | jq -r '.encryption // false' 2>/dev/null || echo "false")
    
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
  if [ -n "$RESOURCE_CONFIG" ]; then
    # Parse the JSON configuration
    echo "DEBUG: RESOURCE_CONFIG = $RESOURCE_CONFIG" >&2
    TABLE_NAME=$(echo "$RESOURCE_CONFIG" | jq -r '.tableName // empty')
    PARTITION_KEY=$(echo "$RESOURCE_CONFIG" | jq -r '.partitionKey // "pk"')
    SORT_KEY=$(echo "$RESOURCE_CONFIG" | jq -r '.sortKey // empty')
    BILLING_MODE=$(echo "$RESOURCE_CONFIG" | jq -r '.billingMode // "PAY_PER_REQUEST"')
    READ_CAPACITY=$(echo "$RESOURCE_CONFIG" | jq -r '.readCapacity // 5')
    WRITE_CAPACITY=$(echo "$RESOURCE_CONFIG" | jq -r '.writeCapacity // 5')
    GSIS=$(echo "$RESOURCE_CONFIG" | jq -r '.gsis // []')
    
    # Use provided table name or default
    if [ -z "$TABLE_NAME" ]; then
      TABLE_NAME="${NAME_PREFIX}-table"
    fi
    
    log "Creating DynamoDB table with configuration: $TABLE_NAME"
    
    # Build attribute definitions - collect all unique attributes first
    ATTRIBUTE_NAMES="$PARTITION_KEY"
    if [ -n "$SORT_KEY" ] && [ "$SORT_KEY" != "null" ]; then
      ATTRIBUTE_NAMES="$ATTRIBUTE_NAMES $SORT_KEY"
    fi
    
    # Add GSI attributes to the list
    if [ "$GSIS" != "[]" ] && [ "$GSIS" != "null" ]; then
      GSI_COUNT=$(echo "$GSIS" | jq length)
      for i in $(seq 0 $((GSI_COUNT - 1))); do
        GSI=$(echo "$GSIS" | jq ".[$i]")
        GSI_PK=$(echo "$GSI" | jq -r '.partitionKey')
        GSI_SK=$(echo "$GSI" | jq -r '.sortKey // empty')
        
        # Add GSI attributes if not already present
        if [[ ! " $ATTRIBUTE_NAMES " =~ " $GSI_PK " ]]; then
          ATTRIBUTE_NAMES="$ATTRIBUTE_NAMES $GSI_PK"
        fi
        if [ -n "$GSI_SK" ] && [ "$GSI_SK" != "null" ] && [[ ! " $ATTRIBUTE_NAMES " =~ " $GSI_SK " ]]; then
          ATTRIBUTE_NAMES="$ATTRIBUTE_NAMES $GSI_SK"
        fi
      done
    fi
    
    # Build attribute definitions from unique names
    ATTRIBUTE_DEFS=""
    for attr in $ATTRIBUTE_NAMES; do
      if [ -n "$ATTRIBUTE_DEFS" ]; then
        ATTRIBUTE_DEFS="$ATTRIBUTE_DEFS "
      fi
      ATTRIBUTE_DEFS="$ATTRIBUTE_DEFS AttributeName=$attr,AttributeType=S"
    done
    
    # Build key schema
    KEY_SCHEMA="AttributeName=$PARTITION_KEY,KeyType=HASH"
    if [ -n "$SORT_KEY" ] && [ "$SORT_KEY" != "null" ]; then
      KEY_SCHEMA="$KEY_SCHEMA AttributeName=$SORT_KEY,KeyType=RANGE"
    fi
    
    # Build GSI configurations
    GSI_ARGS=""
    if [ "$GSIS" != "[]" ] && [ "$GSIS" != "null" ]; then
      GSI_COUNT=$(echo "$GSIS" | jq length)
      
      # Build GSI JSON array
      GSI_JSON="["
      for i in $(seq 0 $((GSI_COUNT - 1))); do
        GSI=$(echo "$GSIS" | jq ".[$i]")
        GSI_NAME=$(echo "$GSI" | jq -r '.indexName')
        GSI_PK=$(echo "$GSI" | jq -r '.partitionKey')
        GSI_SK=$(echo "$GSI" | jq -r '.sortKey // empty')
        GSI_PROJECTION=$(echo "$GSI" | jq -r '.projectionType // "ALL"')
        
        # Build GSI key schema JSON
        GSI_KEY_SCHEMA_JSON="[{\"AttributeName\":\"$GSI_PK\",\"KeyType\":\"HASH\"}"
        if [ -n "$GSI_SK" ] && [ "$GSI_SK" != "null" ]; then
          GSI_KEY_SCHEMA_JSON="$GSI_KEY_SCHEMA_JSON,{\"AttributeName\":\"$GSI_SK\",\"KeyType\":\"RANGE\"}"
        fi
        GSI_KEY_SCHEMA_JSON="$GSI_KEY_SCHEMA_JSON]"
        
        # Build projection JSON
        GSI_PROJECTION_JSON="{\"ProjectionType\":\"$GSI_PROJECTION\"}"
        
        # Add provisioned throughput for GSI if billing mode is PROVISIONED
        GSI_PROVISIONED_THROUGHPUT=""
        if [ "$BILLING_MODE" = "PROVISIONED" ]; then
          GSI_PROVISIONED_THROUGHPUT=",\"ProvisionedThroughput\":{\"ReadCapacityUnits\":$READ_CAPACITY,\"WriteCapacityUnits\":$WRITE_CAPACITY}"
        fi
        
        # Add to GSI JSON array
        if [ "$i" -gt 0 ]; then
          GSI_JSON="$GSI_JSON,"
        fi
        GSI_JSON="$GSI_JSON{\"IndexName\":\"$GSI_NAME\",\"KeySchema\":$GSI_KEY_SCHEMA_JSON,\"Projection\":$GSI_PROJECTION_JSON$GSI_PROVISIONED_THROUGHPUT}"
      done
      GSI_JSON="$GSI_JSON]"
      
      # Set the GSI args with proper JSON format
      GSI_ARGS="--global-secondary-indexes $GSI_JSON"
    fi
    
    # Build billing mode args
    BILLING_ARGS="--billing-mode $BILLING_MODE"
    if [ "$BILLING_MODE" = "PROVISIONED" ]; then
      BILLING_ARGS="$BILLING_ARGS --provisioned-throughput ReadCapacityUnits=$READ_CAPACITY,WriteCapacityUnits=$WRITE_CAPACITY"
    fi
    
    # Debug output
    echo "DEBUG: ATTRIBUTE_DEFS = $ATTRIBUTE_DEFS" >&2
    echo "DEBUG: KEY_SCHEMA = $KEY_SCHEMA" >&2
    echo "DEBUG: BILLING_ARGS = $BILLING_ARGS" >&2
    echo "DEBUG: GSI_ARGS = $GSI_ARGS" >&2
    
    # Try to create the table and capture output
    CREATE_OUTPUT=$($AWS_CMD dynamodb create-table \
      --table-name "$TABLE_NAME" \
      --attribute-definitions $ATTRIBUTE_DEFS \
      --key-schema $KEY_SCHEMA \
      $BILLING_ARGS \
      $GSI_ARGS \
      --output json 2>&1) || {
        echo "ERROR: Failed to create DynamoDB table: $CREATE_OUTPUT" >&2
        exit 1
      }
    echo "DEBUG: CREATE_OUTPUT = $CREATE_OUTPUT" >&2
    
    log "Created DynamoDB table: $TABLE_NAME with configuration"
    
    # Wait for table and GSIs to become active (important for LocalStack)
    if [ "$GSIS" != "[]" ] && [ "$GSIS" != "null" ]; then
      log "Waiting for table and GSIs to become active..."
      RETRY_COUNT=0
      MAX_RETRIES=30
      
      while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        TABLE_STATUS=$($AWS_CMD dynamodb describe-table --table-name "$TABLE_NAME" --output json 2>/dev/null | jq -r '.Table.TableStatus // "CREATING"')
        
        if [ "$TABLE_STATUS" = "ACTIVE" ]; then
          # Check GSI status - count non-active GSIs
          NON_ACTIVE_GSI_COUNT=$($AWS_CMD dynamodb describe-table --table-name "$TABLE_NAME" --output json 2>/dev/null | jq -r '.Table.GlobalSecondaryIndexes[]?.IndexStatus // "CREATING"' | grep -v "ACTIVE" | wc -l)
          
          if [ "$NON_ACTIVE_GSI_COUNT" -eq 0 ]; then
            log "Table and all GSIs are now active"
            break
          else
            log "Table active, but $NON_ACTIVE_GSI_COUNT GSIs still creating... (retry $RETRY_COUNT/$MAX_RETRIES)"
          fi
        else
          log "Table status: $TABLE_STATUS (retry $RETRY_COUNT/$MAX_RETRIES)"
        fi
        
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
      done
      
      if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "WARNING: Table creation timed out waiting for active status" >&2
      fi
    fi
    
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

create_secrets_manager_secret() {
  if [ -n "$RESOURCE_CONFIG" ]; then
    # Parse the JSON configuration
    echo "DEBUG: RESOURCE_CONFIG = $RESOURCE_CONFIG" >&2
    SECRET_NAME=$(echo "$RESOURCE_CONFIG" | jq -r '.secretName // empty')
    SECRET_VALUE=$(echo "$RESOURCE_CONFIG" | jq -r '.secretValue // "default-secret-value"')
    DESCRIPTION=$(echo "$RESOURCE_CONFIG" | jq -r '.description // empty')
    TAGS=$(echo "$RESOURCE_CONFIG" | jq -r '.tags // {}')
    KMS_KEY_ID=$(echo "$RESOURCE_CONFIG" | jq -r '.kmsKeyId // empty')
    
    # Use provided secret name or default
    if [ -z "$SECRET_NAME" ]; then
      SECRET_NAME="${NAME_PREFIX}-secret"
    fi
    
    log "Creating Secrets Manager secret with configuration: $SECRET_NAME"
    
    # Build the create-secret command
    CREATE_CMD="$AWS_CMD secretsmanager create-secret --name \"$SECRET_NAME\" --secret-string \"$SECRET_VALUE\""
    
    # Add description if provided
    if [ -n "$DESCRIPTION" ] && [ "$DESCRIPTION" != "null" ]; then
      CREATE_CMD="$CREATE_CMD --description \"$DESCRIPTION\""
    fi
    
    # Add KMS key if provided
    if [ -n "$KMS_KEY_ID" ] && [ "$KMS_KEY_ID" != "null" ]; then
      CREATE_CMD="$CREATE_CMD --kms-key-id \"$KMS_KEY_ID\""
    fi
    
    # Add tags if provided
    if [ "$TAGS" != "{}" ] && [ "$TAGS" != "null" ]; then
      TAG_ARGS=""
      echo "$TAGS" | jq -r 'to_entries[] | "Key=\(.key),Value=\(.value)"' | while read tag; do
        if [ -n "$TAG_ARGS" ]; then
          TAG_ARGS="$TAG_ARGS $tag"
        else
          TAG_ARGS="$tag"
        fi
      done
      if [ -n "$TAG_ARGS" ]; then
        CREATE_CMD="$CREATE_CMD --tags $TAG_ARGS"
      fi
    fi
    
    # Execute the command
    eval $CREATE_CMD 2>/dev/null || true
    log "Created Secrets Manager secret: $SECRET_NAME"
    
    # Build details JSON
    DETAILS_JSON=$(cat <<EOF
{
  "secretName": "$SECRET_NAME",
  "description": "$DESCRIPTION",
  "hasKmsKey": $([ -n "$KMS_KEY_ID" ] && [ "$KMS_KEY_ID" != "null" ] && echo "true" || echo "false"),
  "tags": $TAGS
}
EOF
)
    
  else
    # Default simple secret creation
    SECRET_NAME="${NAME_PREFIX}-secret"
    SECRET_VALUE="default-secret-value"
    $AWS_CMD secretsmanager create-secret --name "$SECRET_NAME" --secret-string "$SECRET_VALUE" 2>/dev/null || true
    log "Created Secrets Manager secret: $SECRET_NAME"
    
    DETAILS_JSON=$(cat <<EOF
{
  "secretName": "$SECRET_NAME",
  "description": "Default secret created by LocalCloud Kit"
}
EOF
)
  fi
  
  # Return resource info as JSON
  cat <<EOF
{
  "id": "secretsmanager-$SECRET_NAME",
  "name": "$SECRET_NAME",
  "type": "secretsmanager",
  "status": "active",
  "project": "$PROJECT_NAME",
  "createdAt": "$NOW",
  "details": $DETAILS_JSON
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
    secretsmanager)
      create_secrets_manager_secret
      ;;
    *)
      echo "Unknown resource type: $RESOURCE_TYPE" >&2
      echo "Supported types: s3, dynamodb, lambda, apigateway, secretsmanager" >&2
      exit 1
      ;;
  esac
}

main "$@" 