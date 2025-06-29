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

### Development Setup

1. **Clone the repository:**

   ```bash
   git clone <repository>
   cd localstack-template
   ```

2. **Build and start all services:**

   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - **GUI**: http://localhost:3030
   - **API**: http://localhost:3030/api
   - **LocalStack**: http://localhost:4566

## URL Structure

### Development (via Nginx Proxy)

- **Main Application**: `http://localhost:3030`
- **API Endpoints**: `http://localhost:3030/api/*`
- **Health Check**: `http://localhost:3030/health`
- **LocalStack Health**: `http://localhost:3030/localstack/health`

> **Note**: The URLs above are for accessing the application from your host machine. Within the container network, services communicate using internal hostnames (e.g., `localstack:4566` for the API server to reach LocalStack).

## Services

### 1. Nginx Reverse Proxy

- **Image**: `nginx:alpine`
- **Port**: `3030:80`
- **Role**: Routes requests to appropriate services
- **Configuration**: `nginx.conf`

### 2. Next.js GUI

- **Development**: Hot reload with volume mounts
- **Port**: `3000` (internal)
- **Features**: Dashboard, resource management

### 3. Express.js API

- **Development**: Hot reload with volume mounts
- **Port**: `3031` (internal)
- **Features**: LocalStack management, resource automation

### 4. LocalStack

- **Image**: `localstack/localstack:latest`
- **Port**: `4566:4566`
- **Features**: AWS services emulation

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
docker compose up

# Make changes to code
# Changes are automatically reflected in the running containers
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check what's using port 3030
   lsof -i :3030

   # Stop conflicting services
   docker compose down
   ```

2. **Build Failures**

   ```bash
   # Clean build
   docker compose build --no-cache

   # Check logs
   docker compose logs [service-name]
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
docker compose logs

# View specific service logs
docker compose logs gui
docker compose logs api
docker compose logs nginx
docker compose logs localstack

# Follow logs in real-time
docker compose logs -f
```

## File Structure

```
localstack-template/
├── docker-compose.yml          # Development compose file
├── Dockerfile.gui              # GUI Dockerfile
├── Dockerfile.api              # API Dockerfile
├── nginx.conf                  # Nginx reverse proxy configuration
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
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop development environment
docker compose down
```

### Maintenance

```bash
# Clean up unused resources
docker system prune

# Remove all containers and volumes
docker compose down -v

# Update images
docker compose pull
docker compose up -d
```
 