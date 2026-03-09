# LocalCloud Kit

> **Local AWS Development Environment** by CloudStack Solutions

A modern Next.js web interface for LocalCloud Kit, providing a comprehensive GUI for AWS resource management in LocalStack environments.

![LocalCloud Kit](https://img.shields.io/badge/LocalCloud-Kit-blue?style=for-the-badge&logo=aws)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Features

### Core Functionality

- **LocalStack Management**: Start, stop, restart, and monitor LocalStack status
- **Resource Management**: Create and destroy AWS resources (S3, DynamoDB, Lambda, API Gateway)
- **Multi-Environment Support**: Development, UAT, and Production environments
- **Resource Templates**: Predefined templates for common AWS setups
- **Real-time Monitoring**: Live status updates and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering capabilities

### Automation

- **Shell Scripts**: Fast and reliable shell-based automation

### Enterprise Features

- **Network Accessible**: Accessible across your development team
- **Advanced Mode**: Detailed resource information and management
- **Professional Branding**: CloudStack Solutions enterprise design

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js GUI   │    │  Express API    │    │   LocalStack    │
│   (Port 3030)   │◄──►│   (Port 3031)   │◄──►│   (Port 4566)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • LocalStack    │    │ • S3 Buckets    │
│ • Resource List │    │   Management    │    │ • DynamoDB      │
│ • Modals        │    │ • Resource Ops  │    │ • Lambda        │
│ • Real-time     │    │                 │    │ • API Gateway   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The GUI will be available at http://localhost:3000

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Features

- **Real-time Dashboard**: Live LocalStack status monitoring
- **Resource Management**: Create and destroy AWS resources
- **Log Viewer**: Real-time log monitoring with filtering
- **Responsive Design**: Works on desktop and mobile
- **Hot Reloading**: Instant updates during development

## 🎨 Branding

### CloudStack Solutions

- **Company**: CloudStack Solutions
- **Product**: LocalStack Manager
- **Version**: 1.0.0
- **Tagline**: Local AWS Development Environment

### Design Elements

- **Primary Colors**: Blue (#2563eb) to Indigo (#4f46e5) gradient
- **Logo**: Cloud with stack elements and "CS" branding
- **Typography**: Clean, professional interface
- **Icons**: Heroicons for consistent iconography

## 🔧 Configuration

### Environment Variables

```bash
# API Server
PORT=3031
NODE_ENV=development

# Next.js GUI
NEXT_PUBLIC_API_URL=http://localhost:3031
```

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for resource isolation
- **AWS Region**: Target region for resource deployment
- **LocalStack Endpoint**: LocalStack service URL
- **The default project name is 'localstack-dev'.**

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

### Templates

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
- **API Logs**: `localcloud-api/logs/`
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

_Local AWS Development Environment_

### Resource Automation

- **Shell Script Support**: Fast, reliable command-line automation
- **Resource Templates**: Predefined common AWS setups
- **Environment Management**: dev, uat, prod environments
- **Real-time Operations**: Live resource creation/destruction

### Automation Scripts

The GUI orchestrates automation scripts:

- **Shell Scripts**: Fast command-line automation with AWS CLI
