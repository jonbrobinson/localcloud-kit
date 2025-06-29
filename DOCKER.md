# Docker Containerization Guide

This guide explains how to run the LocalStack Manager using Docker containers with a reverse proxy setup.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Next.js GUI   │    │  Express API    │
│   (Port 3030)   │◄──►│   (Port 3000)   │◄──►│   (Port 3031)   │
│                 │    │                 │    │                 │
│ • / → GUI       │    │ • Dashboard     │    │ • LocalStack    │
│ • /api → API    │    │ • Resource List │    │   Management    │
│ • /health       │    │ • Modals        │    │ • Resource Ops  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   LocalStack    │    │   Shell Scripts │
                    │   (Port 4566)   │    │                 │
                    │                 │    │ • create_resources.sh
                    │ • S3 Buckets    │    │ • destroy_resources.sh
                    │ • DynamoDB      │    │ • list_resources.sh
                    │ • Lambda        │    └─────────────────┘
                    │ • API Gateway   │
                    └─────────────────┘
```

## Quick Start

### Production Setup

1. **Clone and setup environment:**

   ```bash
   git clone <repository>
   cd localstack-template
   cp env.example .env
   # Edit .env if needed
   ```

2. **Build and start all services:**

   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **GUI**: http://localhost:3030
   - **API**: http://localhost:3030/api
   - **LocalStack**: http://localhost:4566

### Development Setup

1. **Start development environment:**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Access development services:**
   - **GUI**: http://localhost:3000 (with hot reload)
   - **API**: http://localhost:3031 (with hot reload)
   - **LocalStack**: http://localhost:4566

## URL Structure

### Production (via Nginx Proxy)

- **Main Application**: `http://localhost:3030`
- **API Endpoints**: `http://localhost:3030/api/*`
- **Health Check**: `http://localhost:3030/health`
- **LocalStack Health**: `http://localhost:3030/localstack/health`

### Development (Direct Access)

- **GUI**: `http://localhost:3000`
- **API**: `http://localhost:3031`
- **LocalStack**: `http://localhost:4566`

## Services

### 1. Nginx Reverse Proxy

- **Image**: `nginx:alpine`
- **Port**: `3030:80`
- **Role**: Routes requests to appropriate services
- **Configuration**: `nginx.conf`

### 2. Next.js GUI

- **Production**: Multi-stage build with standalone output
- **Development**: Hot reload with volume mounts
- **Port**: `3000` (internal)
- **Features**: Dashboard, resource management, configuration

### 3. Express.js API

- **Production**: Optimized build
- **Development**: Hot reload with volume mounts
- **Port**: `3031` (internal)
- **Features**: LocalStack management, resource automation

### 4. LocalStack

- **Image**: `localstack/localstack:latest`
- **Port**: `4566:4566`
- **Features**: AWS services emulation

## Environment Variables

### Core Configuration

```bash
# LocalStack
LOCALSTACK_VOLUME_DIR=./volume
DEBUG=1

# AWS
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Application
NODE_ENV=production
PORT=3031
NEXT_PUBLIC_API_URL=http://localhost:3030/api
```

## Volume Mounts

### Configuration

- `./config:/app/config:ro` - Read-only configuration files

### Logs

- `./logs:/app/logs` - Application logs

### LocalStack Data

- `./volume:/var/lib/localstack` - LocalStack persistent data

## Development Workflow

### Hot Reloading

The development setup includes hot reloading for both GUI and API:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Make changes to code
# Changes are automatically reflected in the running containers
```

### Building for Production

```bash
# Build production images
docker-compose build

# Start production environment
docker-compose up
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check what's using port 3030
   lsof -i :3030

   # Stop conflicting services
   docker-compose down
   ```

2. **Build Failures**

   ```bash
   # Clean build
   docker-compose build --no-cache

   # Check logs
   docker-compose logs [service-name]
   ```

3. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./volume ./logs
   ```

### Health Checks

```bash
# Check all services
curl http://localhost:3030/health

# Check LocalStack
curl http://localhost:3030/localstack/health

# Check API
curl http://localhost:3030/api/health
```

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs gui
docker-compose logs api
docker-compose logs nginx
docker-compose logs localstack

# Follow logs in real-time
docker-compose logs -f
```

## Production Deployment

### Environment Setup

1. Copy `env.example` to `.env`
2. Update environment variables for production
3. Ensure proper file permissions

### Security Considerations

- Use proper AWS credentials in production
- Configure firewall rules
- Use HTTPS in production (add SSL certificate)
- Set appropriate resource limits

### Scaling

- Use Docker Swarm or Kubernetes for multi-node deployment
- Configure load balancing for high availability
- Set up monitoring and alerting

## File Structure

```
localstack-template/
├── docker-compose.yml          # Production compose file
├── docker-compose.dev.yml      # Development compose file
├── Dockerfile.gui              # Production GUI Dockerfile
├── Dockerfile.gui.dev          # Development GUI Dockerfile
├── Dockerfile.api              # Production API Dockerfile
├── Dockerfile.api.dev          # Development API Dockerfile
├── nginx.conf                  # Nginx reverse proxy configuration
├── env.example                 # Environment variables template
├── .env                        # Environment variables (create from example)
├── localstack-gui/             # Next.js GUI application
├── localstack-api/             # Express.js API server
├── scripts/shell/              # Automation scripts
├── config/                     # Configuration files
├── logs/                       # Application logs
└── volume/                     # LocalStack persistent data
```

## Commands Reference

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and start production
docker-compose up --build

# Start in background
docker-compose up -d

# Stop production
docker-compose down

# Rebuild specific service
docker-compose build gui
docker-compose build api
```

### Maintenance

```bash
# Clean up unused resources
docker system prune

# Remove all containers and volumes
docker-compose down -v

# Update images
docker-compose pull
docker-compose up -d
```
