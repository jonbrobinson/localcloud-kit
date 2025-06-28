# LocalStack Template

> **Enterprise AWS Development Tools** by CloudStack Solutions

A comprehensive LocalStack automation template with multiple approaches (Terraform, Python, Shell) and a modern GUI for resource management.

![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Cloud-blue?style=for-the-badge&logo=aws)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Quick Start

### Option 1: All-in-One Startup (Recommended)

```bash
# Start everything with one command
./start-gui.sh
```

This will start:

- LocalStack Manager Web GUI (http://localhost:3030)
- LocalStack Manager API Server (http://localhost:3031)
- LocalStack (http://localhost:4566)

### Option 2: Individual Components

#### Web GUI

```bash
cd localstack-gui
npm install
npm run dev
```

📖 [Web GUI Documentation](localstack-gui/README.md)

#### Desktop Application

```bash
cd localstack-desktop
npm install
npm start
```

📖 [Desktop App Documentation](localstack-desktop/README.md)

#### API Server

```bash
cd localstack-api
npm install
npm start
```

📖 [API Server Documentation](localstack-api/README.md)

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
│   ├── 📁 shell/               # Shell-based automation
│   ├── 📁 python/              # Python-based automation
│   └── 📁 terraform/           # Terraform-based automation
├── 📄 docker-compose.yml       # LocalStack configuration
├── 📄 start-gui.sh             # All-in-one startup script
└── 📄 README.md                # This file
```

## 🎯 Features

### Core Automation

- **Multi-Approach Support**: Terraform, Python (boto3), Shell scripts
- **Environment Management**: dev, uat, prod environments
- **Resource Templates**: Predefined common AWS setups
- **Naming Conventions**: Consistent resource naming across environments

### GUI Management

- **Web Interface**: Modern Next.js dashboard
- **Desktop App**: Native Electron application
- **Real-time Monitoring**: Live status and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering
- **Configuration Management**: Project and environment settings

### Enterprise Features

- **Network Accessible**: Team collaboration ready
- **Professional Branding**: CloudStack Solutions design
- **Advanced Mode**: Detailed resource management
- **Automation Choice**: User-selectable automation approach

## 🛠️ Prerequisites

- **Docker & Docker Compose**: For LocalStack
- **Node.js 18+**: For GUI and API server
- **Python 3.8+**: For Python automation scripts
- **Terraform**: For Terraform automation (optional)
- **AWS CLI**: For shell automation (optional)

## 📖 Usage

### 1. Start LocalStack

```bash
# Using Docker Compose
docker-compose up -d

# Or using the GUI
./start-gui.sh
```

### 2. Create Resources

```bash
# Using shell scripts (default)
./scripts/shell/create_resources.sh my-project dev --s3 --dynamodb

# Using Python scripts
python3 scripts/python/create_resources.py --project my-project --environment dev --s3 --dynamodb

# Using Terraform
cd scripts/terraform
terraform apply -var="project_name=my-project" -var="environment=dev"
```

### 3. Manage via GUI

- Open http://localhost:3030 (Web) or launch desktop app
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

### Desktop Application (Electron)

- **Native Experience**: Desktop app with system tray
- **Offline Capability**: Works without internet
- **Cross-platform**: Windows, macOS, Linux
- **Professional UI**: Enterprise-grade interface

## 🔧 Configuration

### Environment Variables

```bash
# LocalStack
LOCALSTACK_HOST=localhost
LOCALSTACK_PORT=4566

# GUI
NEXT_PUBLIC_API_URL=http://localhost:3031

# API Server
PORT=3031
NODE_ENV=development
```

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for isolation
- **AWS Region**: Target region for resources
- **Automation Approach**: Shell/Python/Terraform

## 📊 Resource Templates

| Template          | Description                  | Resources                         |
| ----------------- | ---------------------------- | --------------------------------- |
| **Basic Setup**   | S3 bucket and DynamoDB table | S3, DynamoDB                      |
| **Serverless**    | Complete serverless stack    | S3, DynamoDB, Lambda, API Gateway |
| **Storage Only**  | S3 bucket for file storage   | S3                                |
| **Database Only** | DynamoDB table for data      | DynamoDB                          |
| **API Only**      | API Gateway with Lambda      | Lambda, API Gateway               |

## 🚀 Automation Approaches

### Shell Scripts (Default)

- **Speed**: Fastest execution
- **Dependencies**: Minimal requirements
- **Use Case**: Quick prototyping and development

### Python Scripts

- **Integration**: Full boto3 support
- **Error Handling**: Rich error management
- **Use Case**: Complex workflows and automation

### Terraform

- **Infrastructure as Code**: Declarative configuration
- **State Management**: Resource state tracking
- **Use Case**: Production-like environments

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
docker-compose --version

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

- **LocalStack**: `docker-compose logs localstack`
- **API Server**: `localstack-api/logs/`
- **GUI**: Browser developer tools
- **Automation**: Script output and error logs

## 📚 Documentation

### Component Documentation

- 📖 [Web GUI Guide](localstack-gui/README.md) - Next.js interface
- 📖 [Desktop App Guide](localstack-desktop/README.md) - Electron application
- 📖 [API Server Guide](localstack-api/README.md) - Express backend
- 📖 [Automation Scripts](scripts/README.md) - Shell, Python, Terraform

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
- **Automation**: Shell, Python, Terraform best practices

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
