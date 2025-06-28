# Terraform Approach

This directory contains Terraform configurations for creating AWS resources in LocalStack.

## 🚀 Quick Start

1. **Start LocalStack:**

   ```bash
   make start
   ```

2. **Create resources:**

   ```bash
   make terraform-create ENV=dev
   ```

3. **Destroy resources:**
   ```bash
   make terraform-destroy ENV=dev
   ```

## 📁 Files

- `main.tf` - Main Terraform configuration
- `index.py` - Lambda function code
- `lambda_function.zip` - Zipped Lambda function
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

### API Gateway

- **Name**: `{project-name}-{environment}-api`
- **Endpoint**: `GET /hello`
- **Features**: Lambda integration, CORS enabled

## 🔧 Configuration

### Variables

| Variable       | Description                      | Default                 | Required |
| -------------- | -------------------------------- | ----------------------- | -------- |
| `project_name` | Project name for resource naming | `localstack-template`   | No       |
| `environment`  | Environment (dev/uat/prod)       | `dev`                   | No       |
| `aws_region`   | AWS region                       | `us-east-1`             | No       |
| `aws_endpoint` | LocalStack endpoint              | `http://localhost:4566` | No       |

### Environment Variables

Set these before running Terraform:

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export PROJECT_NAME=my-project
export ENVIRONMENT=dev
```

## 🛠️ Manual Commands

### Initialize Terraform

```bash
cd scripts/terraform
terraform init
```

### Plan Changes

```bash
terraform plan -var="project_name=my-project" -var="environment=dev"
```

### Apply Changes

```bash
terraform apply -auto-approve -var="project_name=my-project" -var="environment=dev"
```

### Destroy Resources

```bash
terraform destroy -auto-approve -var="project_name=my-project" -var="environment=dev"
```

### View Outputs

```bash
terraform output
```

## 🧪 Testing

### Test API Gateway

```bash
# Get the API URL from terraform output
API_URL=$(terraform output -raw api_gateway_url)

# Test the endpoint
curl $API_URL
```

### Test S3

```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List objects in bucket
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
aws --endpoint-url=http://localhost:4566 s3 ls s3://$BUCKET_NAME
```

### Test DynamoDB

```bash
# List tables
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Scan table
TABLE_NAME=$(terraform output -raw dynamodb_table_name)
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name $TABLE_NAME
```

## 🔄 Workflow Options

### Option 1: Persistent Resources

```bash
# Create resources once
make terraform-create ENV=dev

# Resources persist across LocalStack restarts
make restart

# Resources are still available
curl $(terraform output -raw api_gateway_url)
```

### Option 2: Ephemeral Resources

```bash
# Create resources for testing
make terraform-create ENV=dev

# Run tests
curl $(terraform output -raw api_gateway_url)

# Clean up
make terraform-destroy ENV=dev
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

2. **Terraform state issues**

   ```bash
   terraform init -reconfigure
   ```

3. **Resource conflicts**

   ```bash
   terraform destroy -auto-approve
   terraform apply -auto-approve
   ```

4. **Permission issues**
   - Ensure LocalStack is running
   - Check AWS endpoint URL
   - Verify region configuration

### Debug Commands

```bash
# Check LocalStack health
curl http://localhost:4566

# View Terraform state
terraform show

# View LocalStack logs
make logs
```

## 📚 Next Steps

1. **Customize Lambda function** - Edit `index.py`
2. **Add more resources** - Extend `main.tf`
3. **Create different environments** - Use different `ENVIRONMENT` values
4. **Add monitoring** - Integrate with CloudWatch
5. **Add security** - Implement IAM policies and VPC

## 🤝 Team Usage

### For New Team Members:

1. Clone the repository
2. Set your `PROJECT_NAME` environment variable
3. Run `make terraform-create ENV=dev`
4. Test the resources

### For Different Projects:

1. Copy this template
2. Update the `PROJECT_NAME` variable
3. Customize resource configurations
4. Deploy with your project name
