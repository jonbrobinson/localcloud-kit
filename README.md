# LocalStack Manager

> **Enterprise AWS Development Tools** by CloudStack Solutions

A comprehensive LocalStack automation template with shell-based automation and a modern web GUI for resource management, all containerized with Docker.

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://github.com/jonbrobinson/localstack-manager/releases/tag/v0.1.1)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Cloud-blue?style=for-the-badge&logo=aws)](https://localstack.cloud/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-Configured-yellow?style=for-the-badge&logo=eslint)](https://eslint.org/)
[![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)](https://cloudstack.solutions/)

## 🚀 Quick Start

### All-in-One Docker Setup (Recommended)

```bash
# Start everything with one command
docker compose up --build
```

This will start:

- **LocalStack Manager Web GUI**: http://localhost:3030
- **LocalStack Manager API Server**: http://localhost:3030/api
- **LocalStack**: http://localhost:4566
- **Nginx Reverse Proxy**: http://localhost:3030

### Alternative Startup Methods

#### Using Makefile

```bash
# Start all services
make start

# Start with GUI
make gui-start
```

#### Using Start Script

```bash
# Start with the original script (for development)
./start-gui.sh
```

## 🏗️ Project Structure

```
localstack-manager/
├── 📁 localstack-gui/          # Next.js Web GUI
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 services/        # API services
│   │   └── 📁 types/           # TypeScript types
│   └── 📄 README.md            # Web GUI documentation
├── 📁 localstack-api/          # Express API Server
│   ├── 📄 server.js            # API server
│   ├── 📁 logs/                # Application logs
│   └── 📄 README.md            # API documentation
├── 📁 scripts/                 # Automation scripts
│   └── 📁 shell/               # Shell-based automation
├── 📁 samples/                 # Sample files for testing
│   ├── 📄 sample.py            # Python example
│   ├── 📄 sample.js            # JavaScript example
│   ├── 📄 sample.ts            # TypeScript example
│   ├── 📄 sample.json          # JSON example
│   ├── 📄 sample.csv           # CSV example
│   ├── 📄 Sample.java          # Java example
│   └── 📄 README.md            # Samples documentation
├── 📄 docker-compose.yml       # Docker Compose configuration
├── 📄 Dockerfile.gui           # GUI container build
├── 📄 Dockerfile.api           # API container build
├── 📄 nginx.conf               # Reverse proxy configuration
├── 📄 start-gui.sh             # All-in-one startup script
└── 📄 README.md                # This file
```

## 🎯 Features

### Core Automation

- **Individual Resource Creation**: Create resources one at a time or in batches
- **Shell Script Automation**: Fast, reliable command-line automation
- **Environment Management**: dev, uat, prod environments
- **Resource Templates**: Predefined common AWS setups
- **Naming Conventions**: Consistent resource naming across environments

### GUI Management

- **Web Interface**: Modern Next.js dashboard with hot reloading
- **Individual Resource Buttons**: Quick creation of S3, DynamoDB, Lambda, and API Gateway
- **Batch Resource Creation**: Create multiple resources at once with templates or individual selection
- **Real-time Monitoring**: Live status and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering

### Containerization

- **Docker Compose**: Single command startup
- **Hot Reloading**: Development-friendly with live code updates
- **Reverse Proxy**: Clean URL routing with Nginx
- **Network Isolation**: Secure container networking

### Enterprise Features

- **Network Accessible**: Team collaboration ready
- **Professional Branding**: CloudStack Solutions design
- **Advanced Mode**: Detailed resource management
- **Universal Access**: Shell scripts work on any system

## 🛠️ Prerequisites

- **Docker & Docker Compose**: For containerized services
- **AWS CLI**: For shell automation (optional, for local development)

## 📖 Usage

### 1. Start All Services

```bash
# Using Docker Compose (recommended)
docker compose up --build

# Or using Makefile
make start
```

### 2. Create Resources

#### Individual Resource Creation (Recommended)

Use the web GUI to create resources individually:

- **S3 Bucket**: Click the 🪣 S3 button
- **DynamoDB Table**: Click the 🗄️ DynamoDB button
- **Lambda Function**: Click the ⚡ Lambda button
- **API Gateway**: Click the 🌐 API Gateway button

#### Batch Resource Creation

```bash
# Using shell scripts (standard approach)
./scripts/shell/create_resources.sh localstack-manager dev --s3 --dynamodb

# Or use predefined templates
./scripts/shell/create_resources.sh localstack-manager dev --template basic
```

#### Via Web GUI

- Open http://localhost:3030
- Use individual resource buttons for quick creation
- Or use the resource creation modal for batch creation with templates

### 3. Manage via GUI

- Open http://localhost:3030
- Select resource template
- Create/destroy resources with one click

### 4. Test File Viewer

Upload sample files from the `samples/` directory to test the file viewer functionality:

```bash
# Upload sample files to test syntax highlighting
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.py s3://your-bucket-name/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.js s3://your-bucket-name/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.json s3://your-bucket-name/
```

Then view the files in the GUI to see syntax highlighting in action.

## 🎨 GUI Features

### Web Interface (Next.js)

- **Real-time Dashboard**: Live LocalStack status
- **Resource Management**: Create/destroy with templates
- **Log Viewer**: Real-time logs with filtering
- **Network Accessible**: Team collaboration
- **Hot Reloading**: Instant code updates during development

## 🔧 Configuration

### Docker Environment

The application runs entirely in containers with the following setup:

- **GUI**: Next.js app with hot reloading
- **API**: Express.js server with hot reloading
- **LocalStack**: AWS services emulation
- **Nginx**: Reverse proxy for clean routing

### URL Structure

- **Main Application**: http://localhost:3030
- **API Endpoints**: http://localhost:3030/api/\*
- **Health Check**: http://localhost:3030/health
- **LocalStack Health**: http://localhost:3030/localstack/health

> **Note**: The URLs above are for accessing the application from your host machine. Within the container network, services communicate using internal hostnames (e.g., `localstack:4566` for the API server to reach LocalStack).

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for isolation
- **AWS Region**: Target region for resources

## 📊 Resource Templates

Available templates for quick resource creation via GUI or CLI:

| Template          | Description                                           | Resources                         | CLI Example             |
| ----------------- | ----------------------------------------------------- | --------------------------------- | ----------------------- |
| **Basic Setup**   | S3 bucket and DynamoDB table for basic storage needs  | S3, DynamoDB                      | `--template basic`      |
| **Serverless**    | Complete serverless stack with Lambda and API Gateway | S3, DynamoDB, Lambda, API Gateway | `--template serverless` |
| **Storage Only**  | S3 bucket for file storage                            | S3                                | `--template storage`    |
| **Database Only** | DynamoDB table for data storage                       | DynamoDB                          | `--template database`   |
| **API Only**      | API Gateway with Lambda function                      | Lambda, API Gateway               | `--template api`        |

### Template Usage

**Via Web GUI:**

- Open http://localhost:3030
- Use individual resource buttons for quick creation
- Or use the resource creation modal for batch creation with templates

**Via CLI:**

```bash
# Create resources using templates
./scripts/shell/create_resources.sh localstack-dev dev --template basic
./scripts/shell/create_resources.sh localstack-dev dev --template serverless
./scripts/shell/create_resources.sh localstack-dev dev --template storage
```

## 🚀 Automation

### Shell Scripts (Standard)

- **Speed**: Fastest execution
- **Dependencies**: Minimal requirements (just AWS CLI)
- **Universal**: Works on any system with bash
- **Use Case**: Quick prototyping and development
- **Accessibility**: No programming knowledge required

## 🔒 Security

### Network Access

- GUI accessible across network for team collaboration
- API server with CORS protection
- No sensitive data exposure in logs

### Best Practices

- Use environment-specific configurations
- Regular resource cleanup
- Monitor resource usage
- Secure LocalStack endpoints

## 🐛 Troubleshooting

### Common Issues

**LocalStack won't start**

```bash
# Check Docker
docker --version
docker compose version

# Check ports
netstat -an | grep 4566
```

**GUI not loading**

```bash
# Check API server
curl http://localhost:3030/api/health

# Check GUI
curl http://localhost:3030
```

**Resources not creating**

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check automation script permissions
ls -la scripts/shell/
```

### Logs

- **LocalStack**: `docker compose logs localstack`
- **API Server**: `localstack-api/logs/`
- **GUI**: Browser developer tools
- **Automation**: Script output and error logs

## 📚 Documentation

### Component Documentation

- 📖 [Web GUI Guide](localstack-gui/README.md) - Next.js interface
- 📖 [API Server Guide](localstack-api/README.md) - Express backend
- 📖 [Shell Scripts](scripts/shell/README.md) - Automation scripts
- 📖 [Connection Guide](CONNECT.md) - Connect with AWS SDKs (JavaScript, Python, Go, Java)

### External Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Services Guide](https://docs.aws.amazon.com/)
- [CloudStack Solutions](https://cloudstacksolutions.com/)

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Style

- **Frontend**: TypeScript, Tailwind CSS, ESLint
- **Backend**: Node.js, Express, Winston logging
- **Automation**: Shell scripts with best practices

## 📄 License

**LocalStack Manager** by CloudStack Solutions

- **License**: MIT
- **Copyright**: © 2024 CloudStack Solutions
- **Support**: Enterprise support available

## 🆘 Support

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
