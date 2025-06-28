# Python Scripts Approach

This directory contains Python scripts using boto3 for creating AWS resources in LocalStack.

## 🚀 Quick Start

1. **Start LocalStack:**

   ```bash
   make start
   ```

2. **Create resources:**

   ```bash
   make python-create ENV=dev
   ```

3. **Destroy resources:**

   ```bash
   make python-destroy ENV=dev
   ```

4. **List resources:**
   ```bash
   make python-list ENV=dev
   ```

## 📁 Files

- `create_resources.py` - Main script to create all resources
- `destroy_resources.py` - Script to destroy all resources
- `list_resources.py` - Script to list all resources
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

### Command Line Options

All scripts support the same command-line options:

```bash
python create_resources.py --help
```

Options:

- `--project-name` - Project name (default: from env var)
- `--environment` - Environment: dev/uat/prod (default: from env var)
- `--aws-endpoint` - LocalStack endpoint (default: from env var)
- `--aws-region` - AWS region (default: from env var)

## 🛠️ Manual Commands

### Create Resources

```bash
cd scripts/python

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
python create_resources.py

# Using command line options
python create_resources.py --project-name my-project --environment dev
```

### Destroy Resources

```bash
cd scripts/python

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
python destroy_resources.py

# Using command line options
python destroy_resources.py --project-name my-project --environment dev
```

### List Resources

```bash
cd scripts/python

# Using environment variables
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
python list_resources.py

# Using command line options
python list_resources.py --project-name my-project --environment dev
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
make python-create ENV=dev

# Resources persist across LocalStack restarts
make restart

# Resources are still available
make python-list ENV=dev
```

### Option 2: Ephemeral Resources

```bash
# Create resources for testing
make python-create ENV=dev

# Run tests
curl $(make python-list ENV=dev | grep "API URL")

# Clean up
make python-destroy ENV=dev
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

2. **Python dependencies missing**

   ```bash
   pip install -r requirements.txt
   ```

3. **Resource conflicts**

   ```bash
   make python-destroy ENV=dev
   make python-create ENV=dev
   ```

4. **Permission issues**
   - Ensure LocalStack is running
   - Check AWS endpoint URL
   - Verify region configuration

### Debug Commands

```bash
# Check LocalStack health
curl http://localhost:4566

# List all resources
make python-list ENV=dev

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

### Destroy Resources Script

- ✅ Destroys resources in reverse dependency order
- ✅ Handles missing resources gracefully
- ✅ Cleans up S3 objects before bucket deletion
- ✅ Removes IAM policies before role deletion
- ✅ Provides colored output and progress

### List Resources Script

- ✅ Lists all project resources
- ✅ Shows detailed resource information
- ✅ Filters by project and environment
- ✅ Provides resource counts and status
- ✅ Colored output for better readability

## 🔧 Customization

### Modify Lambda Function

Edit the `create_lambda_function_code()` method in `create_resources.py`:

```python
def create_lambda_function_code(self):
    lambda_code = '''
# Your custom Lambda function code here
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from custom Lambda!'
    }
'''
    # ... rest of the method
```

### Add New Resources

1. Add new methods to the `LocalStackResourceManager` class
2. Update the `create_all_resources()` method
3. Add corresponding destroy methods
4. Update the list resources script

### Environment-Specific Configuration

Create environment-specific configurations in the `config/` directory:

```python
# config/dev.py
DEV_CONFIG = {
    'lambda_timeout': 30,
    's3_versioning': True,
    'dynamodb_billing_mode': 'PAY_PER_REQUEST'
}
```

## 🤝 Team Usage

### For New Team Members:

1. Clone the repository
2. Install Python dependencies: `pip install -r requirements.txt`
3. Set your `PROJECT_NAME` environment variable
4. Run `make python-create ENV=dev`
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
