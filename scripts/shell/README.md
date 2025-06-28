# Shell Scripts Approach

This directory contains shell scripts using AWS CLI for creating AWS resources in LocalStack.

## 🚀 Quick Start

1. **Start LocalStack:**

   ```bash
   make start
   ```

2. **Create resources:**

   ```bash
   make shell-create ENV=dev
   ```

3. **Destroy resources:**

   ```bash
   make shell-destroy ENV=dev
   ```

4. **List resources:**
   ```bash
   make shell-list ENV=dev
   ```

## 📁 Files

- `create_resources.sh` - Main script to create all resources
- `destroy_resources.sh` - Script to destroy all resources
- `list_resources.sh` - Script to list all resources
- `README.md` - This documentation

## 🏗️ Resources Created

### S3 Bucket

- **Name**: `{project-name}-{environment}-s3-bucket`
- **Features**: Versioning enabled, public access blocked
- **Usage**: File storage for Lambda responses

### DynamoDB Table

- **Name**: `{project-name}-{environment}-dynamodb-table`
- **Features**: Pay-per-request billing, hash key "id"
- **Usage**: Store request data from Lambda

### Lambda Function

- **Name**: `{project-name}-{environment}-lambda-function`
- **Runtime**: Python 3.9
- **Features**:
  - IAM role with S3 and DynamoDB permissions
  - Environment variables for resource names
  - 30-second timeout
  - Auto-generated function code

### API Gateway

- **Name**: `{project-name}-{environment}-api`
- **Endpoint**: `GET /hello`
- **Features**: Lambda integration, CORS enabled

## 🔧 Configuration

### Environment Variables

| Variable           | Description                      | Default                 | Required |
| ------------------ | -------------------------------- | ----------------------- | -------- |
| `PROJECT_NAME`     | Project name for resource naming | `localstack-template`   | No       |
| `ENVIRONMENT`      | Environment (dev/uat/prod)       | `dev`                   | No       |
| `AWS_ENDPOINT_URL` | LocalStack endpoint              | `http://localhost:4566` | No       |
| `AWS_REGION`       | AWS region                       | `us-east-1`             | No       |

### Prerequisites

- **AWS CLI** - For AWS service interactions
- **jq** - For JSON parsing (required for list script)
- **zip** - For creating Lambda deployment packages
- **curl** - For health checks

Install on macOS:

```bash
brew install awscli jq
```

Install on Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install awscli jq zip curl
```

## 🛠️ Manual Commands

### Create Resources

```bash
cd scripts/shell

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
./create_resources.sh

# Or set variables inline
PROJECT_NAME=my-project ENVIRONMENT=dev ./create_resources.sh
```

### Destroy Resources

```bash
cd scripts/shell

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
./destroy_resources.sh

# Or set variables inline
PROJECT_NAME=my-project ENVIRONMENT=dev ./destroy_resources.sh
```

### List Resources

```bash
cd scripts/shell

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
./list_resources.sh

# Or set variables inline
PROJECT_NAME=my-project ENVIRONMENT=dev ./list_resources.sh
```

## 🧪 Testing

### Test API Gateway

```bash
# Get the API URL from the creation output
API_URL="http://localhost:4566/restapis/{api-id}/dev/_user_request_/hello"

# Test the endpoint
curl $API_URL
```

### Test S3

```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List objects in bucket
BUCKET_NAME="my-project-dev-s3-bucket"
aws --endpoint-url=http://localhost:4566 s3 ls s3://$BUCKET_NAME
```

### Test DynamoDB

```bash
# List tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Scan table
TABLE_NAME="my-project-dev-dynamodb-table"
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name $TABLE_NAME
```

## 🔄 Workflow Options

### Option 1: Persistent Resources

```bash
# Create resources once
make shell-create ENV=dev

# Resources persist across LocalStack restarts
make restart

# Resources are still available
make shell-list ENV=dev
```

### Option 2: Ephemeral Resources

```bash
# Create resources for testing
make shell-create ENV=dev

# Run tests
curl $(make shell-list ENV=dev | grep "API URL")

# Clean up
make shell-destroy ENV=dev
```

## 🏷️ Naming Convention

All resources follow this pattern:

```
{project-name}-{environment}-{resource-type}-{identifier}
```

Examples:

- `my-project-dev-s3-bucket`
- `my-project-dev-dynamodb-table`
- `my-project-dev-lambda-function`
- `my-project-dev-api`

## 🔍 Troubleshooting

### Common Issues

1. **LocalStack not running**

   ```bash
   make status
   make start
   ```

2. **AWS CLI not installed**

   ```bash
   # macOS
   brew install awscli

   # Ubuntu/Debian
   sudo apt-get install awscli
   ```

3. **jq not installed (for list script)**

   ```bash
   # macOS
   brew install jq

   # Ubuntu/Debian
   sudo apt-get install jq
   ```

4. **Resource conflicts**

   ```bash
   make shell-destroy ENV=dev
   make shell-create ENV=dev
   ```

5. **Permission issues**
   - Ensure LocalStack is running
   - Check AWS endpoint URL
   - Verify region configuration

### Debug Commands

```bash
# Check LocalStack health
curl http://localhost:4566

# Check AWS CLI version
aws --version

# Check jq version
jq --version

# List all resources
make shell-list ENV=dev

# View LocalStack logs
make logs
```

## 📚 Script Features

### Create Resources Script

- ✅ Creates all resources in dependency order
- ✅ Handles resource conflicts gracefully
- ✅ Provides colored output and progress
- ✅ Generates Lambda function code automatically
- ✅ Sets up proper IAM permissions
- ✅ Configures API Gateway integration
- ✅ Validates environment variables
- ✅ Checks prerequisites

### Destroy Resources Script

- ✅ Destroys resources in reverse dependency order
- ✅ Handles missing resources gracefully
- ✅ Cleans up S3 objects before bucket deletion
- ✅ Removes IAM policies before role deletion
- ✅ Provides colored output and progress
- ✅ Validates environment variables

### List Resources Script

- ✅ Lists all project resources
- ✅ Shows detailed resource information
- ✅ Filters by project and environment
- ✅ Provides resource counts and status
- ✅ Colored output for better readability
- ✅ Uses jq for JSON parsing
- ✅ Validates environment variables

## 🔧 Customization

### Modify Lambda Function

Edit the `create_lambda_function_code()` function in `create_resources.sh`:

```bash
create_lambda_function_code() {
    # ... existing code ...

    # Create Lambda function code
    cat > "$lambda_file" << 'EOF'
# Your custom Lambda function code here
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from custom Lambda!'
    }
EOF

    # ... rest of the function
}
```

### Add New Resources

1. Add new functions to the script
2. Update the main function to call them in the correct order
3. Add corresponding destroy functions
4. Update the list script

### Environment-Specific Configuration

Create environment-specific configurations:

```bash
# config/dev.sh
DEV_CONFIG="lambda_timeout=30;s3_versioning=true;dynamodb_billing_mode=PAY_PER_REQUEST"

# config/prod.sh
PROD_CONFIG="lambda_timeout=60;s3_versioning=true;dynamodb_billing_mode=PROVISIONED"
```

## 🤝 Team Usage

### For New Team Members:

1. Clone the repository
2. Install prerequisites: `brew install awscli jq` (macOS) or `sudo apt-get install awscli jq` (Ubuntu)
3. Set your `PROJECT_NAME` environment variable
4. Run `make shell-create ENV=dev`
5. Test the resources

### For Different Projects:

1. Copy this template
2. Update the `PROJECT_NAME` variable
3. Customize resource configurations
4. Deploy with your project name

### Best Practices:

- Always use environment variables for configuration
- Test resources before committing changes
- Use the list script to verify resource creation
- Clean up resources when done testing
- Keep scripts executable: `chmod +x scripts/shell/*.sh`

## 🚀 Advanced Usage

### Batch Operations

```bash
# Create resources for multiple environments
for env in dev uat prod; do
    echo "Creating resources for $env environment..."
    PROJECT_NAME=my-project ENVIRONMENT=$env ./create_resources.sh
done
```

### Custom Resource Names

```bash
# Override default naming
PROJECT_NAME=my-app ENVIRONMENT=staging ./create_resources.sh
```

### Debug Mode

```bash
# Enable debug output
set -x  # Add this to any script for debug output
PROJECT_NAME=my-project ENVIRONMENT=dev ./create_resources.sh
```
