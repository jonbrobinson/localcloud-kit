# Quick Start Guide

Get up and running with LocalStack automation in 5 minutes!

## 🚀 Prerequisites

1. **Docker and Docker Compose** (already installed)
2. **Choose your automation approach:**
   - **Terraform**: Install Terraform
   - **Python**: Install Python 3.8+ and dependencies
   - **Shell**: Install AWS CLI and jq

## 📦 Installation

### Option 1: Terraform Approach

```bash
# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io/downloads

# Set your project name
export PROJECT_NAME="my-awesome-project"
```

### Option 2: Python Approach

```bash
# Install Python dependencies
pip install -r requirements.txt

# Set your project name
export PROJECT_NAME="my-awesome-project"
```

### Option 3: Shell Approach

```bash
# Install AWS CLI and jq
brew install awscli jq  # macOS
# or: sudo apt-get install awscli jq  # Ubuntu

# Set your project name
export PROJECT_NAME="my-awesome-project"
```

## 🎯 Quick Start

### 1. Start LocalStack

```bash
make start
```

### 2. Create Resources (Choose One)

**Terraform:**

```bash
make terraform-create ENV=dev
```

**Python:**

```bash
make python-create ENV=dev
```

**Shell:**

```bash
make shell-create ENV=dev
```

### 3. Test Your Setup

```bash
# List your resources
make python-list ENV=dev  # or terraform-list, shell-list

# Test the API (get URL from the list output)
curl http://localhost:4566/restapis/{api-id}/dev/_user_request_/hello
```

### 4. Clean Up (Optional)

```bash
# Destroy resources
make python-destroy ENV=dev  # or terraform-destroy, shell-destroy

# Stop LocalStack
make stop
```

## 🧪 What You Get

After running the automation, you'll have:

- **S3 Bucket**: `my-awesome-project-dev-s3-bucket`
- **DynamoDB Table**: `my-awesome-project-dev-dynamodb-table`
- **Lambda Function**: `my-awesome-project-dev-lambda-function`
- **API Gateway**: `my-awesome-project-dev-api`

## 🔄 Workflow Examples

### Development Workflow

```bash
# Start fresh each day
make start
make python-create ENV=dev
# ... work on your code ...
make python-destroy ENV=dev
make stop
```

### Testing Workflow

```bash
# Create test environment
make start
make python-create ENV=dev
# ... run tests ...
make python-destroy ENV=dev
make stop
```

### Persistent Development

```bash
# Keep resources between sessions
make start
make python-create ENV=dev
# ... work on your code ...
make stop
# Later...
make start  # Resources are still there!
```

## 🎨 Customization

### Change Project Name

```bash
export PROJECT_NAME="my-new-project"
make python-create ENV=dev
```

### Different Environment

```bash
make python-create ENV=uat
make python-create ENV=prod
```

### Multiple Approaches

```bash
# Try different approaches
make terraform-create ENV=dev
make terraform-destroy ENV=dev

make python-create ENV=dev
make python-destroy ENV=dev

make shell-create ENV=dev
make shell-destroy ENV=dev
```

## 🆘 Need Help?

### Check Status

```bash
make status    # LocalStack status
make logs      # View logs
make help      # All available commands
```

### Common Issues

1. **Port conflicts**: Ensure ports 4566 and 4510-4559 are free
2. **Permission issues**: Check Docker permissions
3. **Resource conflicts**: Use `make clean` to reset everything

### Get Help

- Check the specific README for your approach:
  - [Terraform](./scripts/terraform/README.md)
  - [Python](./scripts/python/README.md)
  - [Shell](./scripts/shell/README.md)
- View all available commands: `make help`

## 🎉 You're Ready!

You now have a fully automated LocalStack setup with:

- ✅ Multiple automation approaches
- ✅ Environment support (dev/uat/prod)
- ✅ Consistent naming conventions
- ✅ Team-friendly documentation
- ✅ Easy cleanup and management

Choose your preferred approach and start building!
