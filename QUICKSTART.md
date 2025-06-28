# Quick Start Guide

Get up and running with LocalStack automation in 5 minutes!

## 🚀 Prerequisites

1. **Docker and Docker Compose** (already installed)
2. **AWS CLI**: For shell script automation
3. **Node.js 18+**: For GUI system (optional)

## 📦 Installation

### Install AWS CLI

```bash
# macOS
brew install awscli

# Ubuntu/Debian
sudo apt-get install awscli

# Windows
# Download from https://aws.amazon.com/cli/

# Configure for LocalStack
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region us-east-1
aws configure set output json
```

### Set Your Project Name

```bash
export PROJECT_NAME="my-awesome-project"
```

## 🎯 Quick Start

### Option 1: All-in-One GUI (Recommended)

```bash
# Start everything with one command
./start-gui.sh
```

This starts:

- LocalStack Manager Web GUI (http://localhost:3030)
- LocalStack Manager API Server (http://localhost:3031)
- LocalStack (http://localhost:4566)

### Option 2: Command Line

#### 1. Start LocalStack

```bash
make start
```

#### 2. Create Resources

```bash
make shell-create ENV=dev
```

#### 3. Test Your Setup

```bash
# List your resources
make shell-list ENV=dev

# Test the API (get URL from the list output)
curl http://localhost:4566/restapis/{api-id}/dev/_user_request_/hello
```

#### 4. Clean Up (Optional)

```bash
# Destroy resources
make shell-destroy ENV=dev

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
make shell-create ENV=dev
# ... work on your code ...
make shell-destroy ENV=dev
make stop
```

### Testing Workflow

```bash
# Create test environment
make start
make shell-create ENV=dev
# ... run tests ...
make shell-destroy ENV=dev
make stop
```

### Persistent Development

```bash
# Keep resources between sessions
make start
make shell-create ENV=dev
# ... work on your code ...
make stop
# Later...
make start  # Resources are still there!
```

### GUI Workflow

```bash
# Start GUI system
./start-gui.sh

# Open browser to http://localhost:3030
# Use the web interface to manage resources
# Press Ctrl+C to stop GUI
```

## 🎨 Customization

### Change Project Name

```bash
export PROJECT_NAME="my-new-project"
make shell-create ENV=dev
```

### Different Environment

```bash
make shell-create ENV=uat
make shell-create ENV=prod
```

### Resource Templates

```bash
# Basic setup (S3 + DynamoDB)
./scripts/shell/create_resources.sh my-project dev --template basic

# Serverless setup (S3 + DynamoDB + Lambda + API Gateway)
./scripts/shell/create_resources.sh my-project dev --template serverless

# Storage only (S3 bucket)
./scripts/shell/create_resources.sh my-project dev --template storage

# Database only (DynamoDB table)
./scripts/shell/create_resources.sh my-project dev --template database

# API only (Lambda + API Gateway)
./scripts/shell/create_resources.sh my-project dev --template api
```

## 🆘 Need Help?

### Check Status

```bash
make status    # LocalStack status
make logs      # View logs
make help      # All available commands
```

### GUI Status

```bash
# Check if GUI is running
curl http://localhost:3031/health
curl http://localhost:3030

# Start GUI if needed
make gui-start
```

### Common Issues

1. **Port conflicts**: Ensure ports 4566, 3030, and 3031 are free
2. **Permission issues**: Check Docker permissions
3. **Resource conflicts**: Use `make clean` to reset everything
4. **AWS CLI not found**: Install AWS CLI and configure for LocalStack

### Get Help

- Check the shell scripts documentation: [Shell Scripts](./scripts/shell/README.md)
- View all available commands: `make help`
- GUI documentation: [Web GUI](./localstack-gui/README.md)

## 🎉 You're Ready!

You now have a fully automated LocalStack setup with:

- ✅ Fast shell script automation
- ✅ Modern GUI management
- ✅ Environment support (dev/uat/prod)
- ✅ Consistent naming conventions
- ✅ Resource templates
- ✅ Universal compatibility

## 🚀 Next Steps

1. **Explore the GUI**: Open http://localhost:3030
2. **Try different templates**: Use the template options
3. **Set up your project**: Configure your project name
4. **Automate your workflow**: Integrate with your development process

---

**Built with ❤️ by CloudStack Solutions**

_Enterprise AWS Development Tools_
