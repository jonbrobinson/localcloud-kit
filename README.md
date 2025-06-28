# LocalStack Template

A comprehensive LocalStack setup with multiple automation approaches for creating AWS resources locally.

## 🚀 Quick Start

1. **Start LocalStack:**

   ```bash
   make start
   ```

2. **Choose your automation approach:**
   - [Terraform](#terraform-approach) - Infrastructure as Code
   - [Python Scripts](#python-scripts-approach) - Programmatic resource creation
   - [Shell Scripts](#shell-scripts-approach) - Simple command-line automation

## 📁 Project Structure

```
localstack-template/
├── docker-compose.yml          # LocalStack container setup
├── Makefile                    # Main automation commands
├── README.md                   # This file
├── scripts/                    # Automation scripts
│   ├── python/                 # Python boto3 scripts
│   ├── shell/                  # Shell script automation
│   └── terraform/              # Terraform configurations
├── config/                     # Environment configurations
│   ├── dev/
│   ├── uat/
│   └── prod/
└── volume/                     # LocalStack persistent data
```

## 🎯 Available Resources

This template supports creating:

- **S3 Buckets** - File storage
- **DynamoDB Tables** - NoSQL database
- **Lambda Functions** - Serverless compute
- **API Gateway** - REST API endpoints

## 🔧 Environment Support

Three environments are supported:

- **dev** - Development environment
- **uat** - User Acceptance Testing
- **prod** - Production-like environment

## 📋 Prerequisites

- Docker and Docker Compose
- AWS CLI (for shell scripts)
- Python 3.8+ (for Python scripts)
- Terraform (for Terraform approach)

## 🛠️ Installation

```bash
# Install AWS CLI
brew install awscli  # macOS
# or download from https://aws.amazon.com/cli/

# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io/downloads

# Install Python dependencies
pip install -r requirements.txt
```

## 🚀 Usage

### Makefile Commands

```bash
# Start LocalStack
make start

# Stop LocalStack
make stop

# Restart LocalStack
make restart

# View logs
make logs

# Clean up all resources
make clean

# Create resources using different approaches
make terraform-create ENV=dev
make python-create ENV=dev
make shell-create ENV=dev
```

### Environment Variables

Set your project name and environment:

```bash
export PROJECT_NAME="my-project"
export ENVIRONMENT="dev"  # dev, uat, or prod
```

## 📚 Detailed Documentation

### [Terraform Approach](./scripts/terraform/README.md)

Infrastructure as Code with Terraform configurations.

### [Python Scripts Approach](./scripts/python/README.md)

Programmatic resource creation using boto3.

### [Shell Scripts Approach](./scripts/shell/README.md)

Simple command-line automation with AWS CLI.

## 🔄 Workflow Options

### Option 1: Persistent Resources

Resources persist across LocalStack restarts:

```bash
make start
make terraform-create ENV=dev
# Resources remain available after restart
```

### Option 2: Ephemeral Resources

Clean slate for each session:

```bash
make start
make terraform-create ENV=dev
make clean  # Remove all resources
```

## 🏷️ Naming Convention

All resources follow this naming pattern:

```
{project-name}-{environment}-{resource-type}-{identifier}
```

Examples:

- `my-project-dev-s3-bucket`
- `my-project-uat-dynamodb-table`
- `my-project-prod-lambda-function`

## 🤝 Team Collaboration

### For New Team Members:

1. Clone this repository
2. Set your `PROJECT_NAME` environment variable
3. Choose your preferred automation approach
4. Follow the specific README for that approach

### For Different Projects:

1. Copy this template
2. Update the `PROJECT_NAME` in your environment
3. Customize resource configurations as needed

## 🐛 Troubleshooting

### Common Issues:

- **Port conflicts**: Ensure ports 4566 and 4510-4559 are available
- **Permission issues**: Check Docker permissions
- **Resource conflicts**: Use `make clean` to reset

### Getting Help:

- Check the specific README for each approach
- Review logs with `make logs`
- Ensure LocalStack is running with `make status`

## 📝 License

This template is provided as-is for local development purposes.
