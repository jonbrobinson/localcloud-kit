# LocalStack Template

> **Enterprise AWS Development Tools** by CloudStack Solutions

A comprehensive LocalStack automation template with shell-based automation and a modern GUI for resource management, all containerized with Docker.

![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Cloud-blue?style=for-the-badge&logo=aws)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

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
localstack-template/
├── 📁 localstack-gui/          # Next.js Web GUI
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 services/        # API services
│   │   └── 📁 types/           # TypeScript types
│   └── 📄 README.md            # Web GUI documentation
├── 📁 localstack-desktop/      # Electron Desktop App
│   ├── 📄 main.js              # Electron main process
│   └── 📄 README.md            # Desktop app documentation
├── 📁 localstack-api/          # Express API Server
│   ├── 📄 server.js            # API server
│   ├── 📁 logs/                # Application logs
│   └── 📄 README.md            # API documentation
├── 📁 scripts/                 # Automation scripts
│   └── 📁 shell/               # Shell-based automation
├── 📄 docker-compose.yml       # Docker Compose configuration
├── 📄 Dockerfile.gui           # GUI container build
├── 📄 Dockerfile.api           # API container build
├── 📄 nginx.conf               # Reverse proxy configuration
├── 📄 start-gui.sh             # All-in-one startup script
└── 📄 README.md                # This file
```

## 🎯 Features

### Core Automation

- **Shell Script Automation**: Fast, reliable command-line automation
- **Environment Management**: dev, uat, prod environments
- **Resource Templates**: Predefined common AWS setups
- **Naming Conventions**: Consistent resource naming across environments

### GUI Management

- **Web Interface**: Modern Next.js dashboard with hot reloading
- **Desktop App**: Native Electron application
- **Real-time Monitoring**: Live status and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering
- **Configuration Management**: Project and environment settings

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

```bash
# Using shell scripts (standard approach)
./scripts/shell/create_resources.sh my-project dev --s3 --dynamodb
```

### 3. Manage via GUI

- Open http://localhost:3030
- Configure project settings
- Select resource template
- Create/destroy resources with one click

## 🎨 GUI Features

### Web Interface (Next.js)

- **Real-time Dashboard**: Live LocalStack status
- **Resource Management**: Create/destroy with templates
- **Log Viewer**: Real-time logs with filtering
- **Configuration**: Project and environment settings
- **Network Accessible**: Team collaboration
- **Hot Reloading**: Instant code updates during development

### Desktop Application (Electron)

- **Native Experience**: Desktop app with system tray
- **Offline Capability**: Works without internet
- **Cross-platform**: Windows, macOS, Linux
- **Professional UI**: Enterprise-grade interface

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

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for isolation
- **AWS Region**: Target region for resources

## 📊 Resource Templates

| Template          | Description                  | Resources                         |
| ----------------- | ---------------------------- | --------------------------------- |
| **Basic Setup**   | S3 bucket and DynamoDB table | S3, DynamoDB                      |
| **Serverless**    | Complete serverless stack    | S3, DynamoDB, Lambda, API Gateway |
| **Storage Only**  | S3 bucket for file storage   | S3                                |
| **Database Only** | DynamoDB table for data      | DynamoDB                          |
| **API Only**      | API Gateway with Lambda      | Lambda, API Gateway               |

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
curl http://localhost:3031/health

# Check GUI
curl http://localhost:3030
```

**Resources not creating**

```bash
# Check LocalStack health
curl http://localhost:4566/health

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
- 📖 [Desktop App Guide](localstack-desktop/README.md) - Electron application
- 📖 [API Server Guide](localstack-api/README.md) - Express backend
- 📖 [Shell Scripts](scripts/shell/README.md) - Automation scripts

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

**LocalStack Template** by CloudStack Solutions

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
