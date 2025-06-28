# LocalStack Manager

> **Enterprise AWS Development Tools** by CloudStack Solutions

A modern, web-based GUI for managing LocalStack resources with real-time monitoring, resource templates, and multi-environment support.

![LocalStack Manager](https://img.shields.io/badge/LocalStack-Manager-blue?style=for-the-badge&logo=aws)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Features

### Core Functionality

- **LocalStack Management**: Start, stop, restart, and monitor LocalStack status
- **Resource Management**: Create and destroy AWS resources (S3, DynamoDB, Lambda, API Gateway)
- **Multi-Environment Support**: Development, UAT, and Production environments
- **Resource Templates**: Predefined templates for common AWS setups
- **Real-time Monitoring**: Live status updates and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering capabilities

### Automation Approaches

- **Shell Scripts** (Default): Fast and reliable shell-based automation
- **Python Scripts**: Boto3-based resource management
- **Terraform**: Infrastructure as Code approach

### Enterprise Features

- **Network Accessible**: Accessible across your development team
- **Advanced Mode**: Detailed resource information and management
- **Configuration Management**: Project and environment settings
- **Professional Branding**: CloudStack Solutions enterprise design

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js GUI   │    │  Express API    │    │   LocalStack    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   (Port 4566)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • LocalStack    │    │ • S3 Buckets    │
│ • Resource List │    │   Management    │    │ • DynamoDB      │
│ • Modals        │    │ • Resource Ops  │    │ • Lambda        │
│ • Real-time     │    │ • Configuration │    │ • API Gateway   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- LocalStack setup (see main project README)

### Quick Start

1. **Install Dependencies**

   ```bash
   cd localstack-gui
   npm install
   ```

2. **Start the GUI**

   ```bash
   npm run dev
   ```

3. **Start the API Server**

   ```bash
   cd ../localstack-api
   npm install
   npm start
   ```

4. **Access the Application**
   - Web GUI: http://localhost:3000
   - API Server: http://localhost:3001

## 📖 Usage

### Getting Started

1. **Launch LocalStack**

   - Click "Start" in the LocalStack Status section
   - Wait for health check to complete

2. **Configure Project**

   - Click "Config" to set project name and environment
   - Choose your preferred AWS region

3. **Create Resources**

   - Select automation approach (Shell/Python/Terraform)
   - Choose a resource template or customize
   - Click "Create Resources"

4. **Monitor & Manage**
   - View real-time resource status
   - Check logs for detailed information
   - Destroy resources when done

### Resource Templates

| Template          | Description                  | Resources                         |
| ----------------- | ---------------------------- | --------------------------------- |
| **Basic Setup**   | S3 bucket and DynamoDB table | S3, DynamoDB                      |
| **Serverless**    | Complete serverless stack    | S3, DynamoDB, Lambda, API Gateway |
| **Storage Only**  | S3 bucket for file storage   | S3                                |
| **Database Only** | DynamoDB table for data      | DynamoDB                          |
| **API Only**      | API Gateway with Lambda      | Lambda, API Gateway               |

### Automation Approaches

#### Shell Scripts (Default)

- Fastest execution
- Minimal dependencies
- Best for quick prototyping

#### Python Scripts

- Boto3 integration
- Rich error handling
- Good for complex workflows

#### Terraform

- Infrastructure as Code
- State management
- Best for production-like environments

## 🎨 Branding

### CloudStack Solutions

- **Company**: CloudStack Solutions
- **Product**: LocalStack Manager
- **Version**: 1.0.0
- **Tagline**: Enterprise AWS Development Tools

### Design Elements

- **Primary Colors**: Blue (#2563eb) to Indigo (#4f46e5) gradient
- **Logo**: Cloud with stack elements and "CS" branding
- **Typography**: Clean, professional interface
- **Icons**: Heroicons for consistent iconography

## 🔧 Configuration

### Environment Variables

```bash
# API Server
PORT=3001
NODE_ENV=development

# Next.js GUI
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for resource isolation
- **AWS Region**: Target region for resource deployment
- **LocalStack Endpoint**: LocalStack service URL

## 📊 API Endpoints

### LocalStack Management

- `GET /localstack/status` - Get LocalStack status
- `POST /localstack/start` - Start LocalStack
- `POST /localstack/stop` - Stop LocalStack
- `POST /localstack/restart` - Restart LocalStack
- `GET /localstack/logs` - Get logs

### Resource Management

- `GET /resources/list` - List resources
- `POST /resources/create` - Create resources
- `POST /resources/destroy` - Destroy resources
- `GET /resources/status` - Get resource status

### Configuration

- `GET /config/project` - Get project config
- `PUT /config/project` - Update project config
- `GET /config/templates` - Get resource templates

## 🚀 Desktop Application

### Electron App

The GUI is also available as a desktop application:

```bash
cd localstack-desktop
npm install
npm start
```

### Features

- Native desktop experience
- System tray integration
- Offline capability
- Cross-platform support

## 🔒 Security

### Network Access

- GUI accessible on all network interfaces
- API server with CORS protection
- No sensitive data exposure

### Best Practices

- Use environment-specific configurations
- Regular resource cleanup
- Monitor resource usage
- Secure LocalStack endpoints

## 🐛 Troubleshooting

### Common Issues

**LocalStack won't start**

- Check Docker is running
- Verify port 4566 is available
- Check Docker Compose configuration

**Resources not creating**

- Verify LocalStack is healthy
- Check automation script permissions
- Review logs for specific errors

**GUI not loading**

- Ensure API server is running
- Check browser console for errors
- Verify network connectivity

### Logs

- **LocalStack Logs**: Docker container logs
- **API Logs**: `localstack-api/logs/`
- **GUI Logs**: Browser developer tools

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Prettier for formatting

## 📄 License

**LocalStack Manager** by CloudStack Solutions

- **License**: MIT
- **Copyright**: © 2024 CloudStack Solutions
- **Support**: Enterprise support available

## 🆘 Support

### Documentation

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Services Guide](https://docs.aws.amazon.com/)
- [CloudStack Solutions](https://cloudstacksolutions.com/)

### Community

- GitHub Issues for bug reports
- Feature requests welcome
- Enterprise support available

---

**Built with ❤️ by CloudStack Solutions**

_Enterprise AWS Development Tools_
