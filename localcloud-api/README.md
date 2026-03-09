# LocalCloud Kit API Server

> **Backend API Service** by CloudStack Solutions

A robust Express.js API server for LocalCloud Kit, providing RESTful endpoints for AWS resource management in LocalStack environments.

![Express](https://img.shields.io/badge/Express-API%20Server-green?style=for-the-badge&logo=express)
![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- LocalStack setup (see main project README)

### Installation & Launch

1. **Install Dependencies**

   ```bash
   cd localcloud-api
   npm install
   ```

2. **Start the Server**

   ```bash
   npm start
   ```

3. **Development Mode** (with auto-restart)
   ```bash
   npm run dev
   ```

## 🎯 Features

- **Resource Management**: Create, list, and destroy AWS resources
- **Real-time Logging**: Live log streaming with Socket.IO
- **Health Monitoring**: LocalStack status and health checks
- **Template Support**: Predefined resource templates
- **Web GUI**: Modern Next.js interface

### LocalStack Management

- **Health Monitoring**: Real-time status checking
- **Log Management**: Comprehensive logging with Winston

### Resource Automation

- **Shell Script Support**: Fast, reliable command-line automation
- **Resource Templates**: Predefined common AWS setups
- **Environment Management**: dev, uat, prod environments
- **Real-time Operations**: Live resource creation/destruction

### API Features

- **RESTful Endpoints**: Clean, consistent API design
- **Real-time Updates**: Socket.IO for live updates
- **CORS Support**: Cross-origin resource sharing
- **Error Handling**: Comprehensive error management

### Enterprise Features

- **Professional Logging**: Structured logging with Winston
- **Security**: Input validation and sanitization
- **Monitoring**: Health checks and status endpoints
- **Scalability**: Designed for team collaboration

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
                              │
                              ▼
                    ┌─────────────────┐
                    │   Automation    │
                    │   Scripts       │
                    │                 │
                    │ • Shell Scripts │
                    └─────────────────┘
```

## 📊 API Endpoints

### Health & Status

```http
GET /health
```

Returns server health status and version information.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "LocalStack Manager API",
  "vendor": "CloudStack Solutions",
  "version": "1.0.0"
}
```

### LocalStack Management

#### Get Status

```http
GET /localstack/status
```

Returns current LocalStack status and health information.

#### Get Logs

```http
GET /localstack/logs
```

Returns application logs with filtering options.

### Resource Management

#### List Resources

```http
GET /resources/list?projectName=localstack-dev&environment=dev
```

Lists resources for a specific project and environment.

#### Create Resources

```http
POST /resources/create
Content-Type: application/json

{
  "projectName": "localstack-dev",
  "environment": "dev",
  "resources": {
    "s3": true,
    "dynamodb": true,
    "lambda": false,
    "apigateway": false
  },
  "template": "basic"
}
```

#### Destroy Resources

```http
POST /resources/destroy
Content-Type: application/json

{
  "projectName": "localstack-dev",
  "resources": ["s3-localstack-dev-bucket", "dynamodb-localstack-dev-table"]
}
```

#### Get Resource Status

```http
GET /resources/status?projectName=localstack-dev&environment=dev
```

Returns current resource status and details.

### Templates

#### Get Templates

```http
GET /config/templates
```

Returns available resource templates.

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3031
NODE_ENV=development

# LocalStack Configuration
LOCALSTACK_ENDPOINT=http://localhost:4566

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs/

# Security Configuration
CORS_ORIGIN=http://localhost:3030
```

## 📝 Logging

### Winston Configuration

The API server uses Winston for structured logging:

```javascript
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

### Log Levels

- **error**: Critical errors and failures
- **warn**: Warning messages and issues
- **info**: General information and status updates
- **debug**: Detailed debugging information

### Log Files

- `logs/error.log`: Error-level logs only
- `logs/combined.log`: All log levels
- Console: Colored output for development

## 🔒 Security

### CORS Configuration

```javascript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3030",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
```

### Input Validation

- Request body validation
- Query parameter sanitization
- File path validation
- Command injection prevention

### Best Practices

- No sensitive data in logs
- Secure command execution
- Error message sanitization
- Rate limiting (future feature)

## 🐛 Troubleshooting

### Common Issues

**Server won't start**

```bash
# Check Node.js version
node --version  # Should be 18+

# Check port availability
lsof -i :3031

# Check dependencies
npm install
```

**LocalStack operations failing**

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check logs
tail -f logs/combined.log
```

**Resource creation failing**

```bash
# Check automation script permissions
ls -la ../scripts/shell/

# Check AWS credentials
aws configure list

# Check LocalStack status
curl http://localhost:4566/_localstack/health
```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug npm start

# Check specific logs
tail -f logs/error.log
tail -f logs/combined.log
```

## 📊 Monitoring

### Health Checks

The API provides comprehensive health monitoring:

```bash
# Basic health check
curl http://localhost:3031/health

# LocalStack status
curl http://localhost:3031/localstack/status

# Resource status
curl http://localhost:3031/resources/status
```

### Metrics (Future Feature)

- Request count and response times
- Error rates and types
- Resource operation success rates
- LocalStack uptime and health

## 🔄 Real-time Updates

### Socket.IO Integration

The API server provides real-time updates via Socket.IO:

```javascript
// Client connection
io.on("connection", (socket) => {
  console.log("Client connected");

  // Send log updates
  socket.emit("log", logEntry);

  // Send status updates
  socket.emit("status", statusUpdate);
});
```

### Event Types

- **log**: New log entries
- **status**: LocalStack status changes
- **resource**: Resource operation updates
- **error**: Error notifications

## 🚀 Performance

### Optimization

- **Connection Pooling**: Efficient database connections
- **Caching**: In-memory configuration caching
- **Async Operations**: Non-blocking I/O operations
- **Resource Management**: Proper cleanup and disposal

### Scaling Considerations

- **Load Balancing**: Multiple API instances
- **Database**: Persistent configuration storage
- **Caching**: Redis for shared state
- **Monitoring**: APM integration

## 📚 Integration

### Frontend Integration

The API is designed to work seamlessly with:

- **Next.js GUI**: Web interface
- **Electron App**: Desktop application
- **Custom Clients**: Any HTTP client

### Automation Scripts

The API orchestrates automation scripts:

- **Shell Scripts**: Fast command-line automation with AWS CLI

### External Services

- **LocalStack**: AWS service emulation
- **Docker**: Container management
- **AWS CLI**: Command-line tools

## 📄 License

**LocalStack Manager API Server** by CloudStack Solutions

- **License**: MIT
- **Copyright**: © 2024 CloudStack Solutions
- **Express**: MIT License

## 🆘 Support

### Documentation

- [Express.js Documentation](https://expressjs.com/)
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

_Local AWS Development Environment_
