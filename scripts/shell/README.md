# Shell Scripts Automation

> **Standard Automation Approach** by CloudStack Solutions

Fast, reliable command-line automation for LocalStack resource management using AWS CLI.

![Shell](https://img.shields.io/badge/Shell-Automation-green?style=for-the-badge&logo=gnu-bash)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Quick Start

### Prerequisites

- **AWS CLI**: For AWS service interactions
- **LocalStack**: Running on localhost:4566
- **Bash**: Available on most systems

### Installation

```bash
# Ensure AWS CLI is installed
aws --version

# Configure AWS CLI for LocalStack
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region us-east-1
aws configure set output json
```

## 🎯 Features

### Standard Automation

- **Universal Access**: Works on any system with bash
- **Fast Execution**: Direct AWS CLI commands
- **Minimal Dependencies**: Only requires AWS CLI
- **No Programming Required**: Simple command-line interface
- **Reliable**: Proven AWS CLI integration

### Resource Management

- **S3 Buckets**: File storage and management
- **DynamoDB Tables**: NoSQL database setup
- **Lambda Functions**: Serverless compute
- **API Gateway**: REST API endpoints
- **Environment Support**: dev, uat, prod

### Templates

- **Basic Setup**: S3 + DynamoDB
- **Serverless**: Complete serverless stack
- **Storage Only**: S3 bucket only
- **Database Only**: DynamoDB table only
- **API Only**: Lambda + API Gateway

## 📖 Usage

### Create Resources

```bash
# Basic usage
./create_resources.sh <project-name> <environment> [options]

# Examples
./create_resources.sh my-project dev --s3 --dynamodb
./create_resources.sh my-project uat --template serverless
./create_resources.sh my-project prod --s3 --lambda --apigateway
```

### List Resources

```bash
# List all resources for a project/environment
./list_resources.sh <project-name> <environment>

# Examples
./list_resources.sh my-project dev
./list_resources.sh my-project uat
```

### Destroy Resources

```bash
# Destroy specific resources
./destroy_resources.sh <project-name> <environment> [resource-ids]

# Examples
./destroy_resources.sh my-project dev
./destroy_resources.sh my-project uat bucket-1,table-1
```

## 🔧 Configuration

### Environment Variables

```bash
# LocalStack Configuration
export LOCALSTACK_ENDPOINT="http://localhost:4566"
export AWS_DEFAULT_REGION="us-east-1"

# Project Configuration
export PROJECT_NAME="my-project"
export ENVIRONMENT="dev"
```

### Naming Convention

All resources follow this pattern:

```
{project-name}-{environment}-{resource-type}-{identifier}
```

Examples:

- `my-project-dev-s3-bucket`
- `my-project-uat-dynamodb-table`
- `my-project-prod-lambda-function`

## 📊 Resource Templates

### Basic Setup

```bash
./create_resources.sh my-project dev --template basic
```

Creates:

- S3 bucket for file storage
- DynamoDB table for data

### Serverless

```bash
./create_resources.sh my-project dev --template serverless
```

Creates:

- S3 bucket for file storage
- DynamoDB table for data
- Lambda function for compute
- API Gateway for REST API

### Storage Only

```bash
./create_resources.sh my-project dev --template storage
```

Creates:

- S3 bucket for file storage

### Database Only

```bash
./create_resources.sh my-project dev --template database
```

Creates:

- DynamoDB table for data

### API Only

```bash
./create_resources.sh my-project dev --template api
```

Creates:

- Lambda function for compute
- API Gateway for REST API

## 🛠️ Command Options

### Create Resources

```bash
./create_resources.sh <project-name> <environment> [options]

Options:
  --s3                    Create S3 bucket
  --dynamodb             Create DynamoDB table
  --lambda               Create Lambda function
  --apigateway           Create API Gateway
  --template <name>      Use predefined template
  --region <region>      AWS region (default: us-east-1)
  --help                 Show this help message

Templates:
  basic                  S3 + DynamoDB
  serverless             S3 + DynamoDB + Lambda + API Gateway
  storage                S3 only
  database               DynamoDB only
  api                    Lambda + API Gateway
```

### List Resources

```bash
./list_resources.sh <project-name> <environment>

Options:
  --region <region>      AWS region (default: us-east-1)
  --help                 Show this help message
```

### Destroy Resources

```bash
./destroy_resources.sh <project-name> <environment> [resource-ids]

Options:
  --region <region>      AWS region (default: us-east-1)
  --force                Skip confirmation prompts
  --help                 Show this help message
```

## 🔒 Security

### Best Practices

- **Environment Isolation**: Use different environments for dev/uat/prod
- **Resource Cleanup**: Regularly destroy unused resources
- **Access Control**: Limit LocalStack access to development team
- **Monitoring**: Monitor resource usage and costs

### LocalStack Security

- **Local Only**: LocalStack runs locally, no external access
- **No Real AWS**: All operations are simulated
- **Development Only**: Not for production use

## 🐛 Troubleshooting

### Common Issues

**AWS CLI not found**

```bash
# Install AWS CLI
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# Windows
# Download from https://aws.amazon.com/cli/
```

**LocalStack not responding**

```bash
# Check LocalStack status
curl http://localhost:4566/_localstack/health

# Check Docker
docker ps | grep localstack
```

**Permission denied**

```bash
# Make scripts executable
chmod +x *.sh

# Check file permissions
ls -la *.sh
```

**Resources not creating**

```bash
# Check AWS CLI configuration
aws configure list

# Test LocalStack connection
aws --endpoint-url=http://localhost:4566 s3 ls
```

### Debug Mode

```bash
# Enable debug output
export AWS_CLI_DEBUG=1

# Run with verbose output
./create_resources.sh my-project dev --s3 --verbose
```

## 📚 Examples

### Development Workflow

```bash
# 1. Start LocalStack
docker compose up -d

# 2. Create development resources
./create_resources.sh my-project dev --template basic

# 3. List resources
./list_resources.sh my-project dev

# 4. Clean up when done
./destroy_resources.sh my-project dev
```

### Testing Different Configurations

```bash
# Test basic setup
./create_resources.sh test-project dev --template basic
./list_resources.sh test-project dev
./destroy_resources.sh test-project dev

# Test serverless setup
./create_resources.sh test-project dev --template serverless
./list_resources.sh test-project dev
./destroy_resources.sh test-project dev
```

### Environment Management

```bash
# Development environment
./create_resources.sh my-project dev --template basic

# UAT environment
./create_resources.sh my-project uat --template serverless

# Production-like environment
./create_resources.sh my-project prod --template serverless
```

## 🔄 Integration

### With GUI

The shell scripts integrate seamlessly with the LocalStack Manager GUI:

- **Web Interface**: Use GUI for visual management
- **Desktop App**: Native application integration
- **API Server**: Backend orchestration
- **Shell Scripts**: Command-line automation

### With CI/CD

```bash
# Example CI/CD pipeline
#!/bin/bash
set -e

# Start LocalStack
docker compose up -d

# Wait for LocalStack to be ready
sleep 10

# Create test resources
./create_resources.sh test-project ci --template basic

# Run tests
npm test

# Clean up
./destroy_resources.sh test-project ci
```

## 📄 License

**Shell Scripts Automation** by CloudStack Solutions

- **License**: MIT
- **Copyright**: © 2024 CloudStack Solutions
- **AWS CLI**: Apache 2.0 License

## 🆘 Support

### Documentation

- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [CloudStack Solutions](https://cloudstacksolutions.com/)

### Community

- GitHub Issues for bug reports
- Feature requests welcome
- Documentation improvements

### Enterprise

- Professional support available
- Custom development services
- Training and consulting

---

**Built with ❤️ by CloudStack Solutions**

_Enterprise AWS Development Tools_
