# Docker Deployment Guide

This guide explains how to run the LocalCloud Kit using Docker containers with Traefik as the edge router and Nginx as the internal reverse proxy.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Browser                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (443) / HTTP (80 → 443)
                             ▼
                    ┌─────────────────┐
                    │  Traefik Edge  │
                    │  Router (3030) │
                    │                │
                    │ • HTTPS/TLS    │
                    │ • Domain-based │
                    │   routing      │
                    └────────┬───────┘
                             │
                             │ HTTP (80) - Internal
                             ▼
                    ┌─────────────────┐
                    │  Nginx Proxy    │
                    │  (Internal)     │
                    │                 │
                    │ • / → GUI       │
                    │ • /api → API    │
                    │ • /ws → API     │
                    │ • /health       │
                    └─────┬───────┬───┘
                          │       │
            ┌─────────────┘       └─────────────┐
            │                                   │
            ▼                                   ▼
    ┌─────────────────┐              ┌─────────────────┐
    │   Next.js GUI   │              │  Express API    │
    │   (Port 3030)   │              │   (Port 3031)   │
    │                 │              │                 │
    │ • Dashboard     │              │ • LocalStack    │
    │ • Resource List │              │   Management    │
    │ • Modals        │              │ • Resource Ops  │
    │ • Hot Reload    │              │ • Socket.IO     │
    └─────────────────┘              └───────┬─────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
                          ▼                  ▼                  ▼
                ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                │   LocalStack    │ │   Redis Cache   │ │   Shell Scripts │
                │   (Port 4566)   │ │   (Port 6379)   │ │                 │
                │                 │ │                 │ │ • Cache ops     │
                │ • S3 Buckets    │ │ • Standalone    │ │ • Resource mgmt │
                │ • DynamoDB      │ │   cache service │ │                 │
                │ • Lambda        │ │ • Independent   │ └─────────────────┘
                │ • Secrets Mgr   │ │   of LocalStack │
                └─────────────────┘ └─────────────────┘
```

## Quick Start

### Prerequisites

- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **mkcert** (optional) - Automatically installed by setup script

### Development Setup

1. **Clone the repository:**

   ```bash
   git clone <repository>
   cd localcloud-kit
   ```

2. **Complete first-time setup:**

   ```bash
   ./scripts/setup.sh
   ```

   This will:

   - Install mkcert (if needed)
   - Install mkcert CA certificate
   - Generate SSL certificates for `app-local.localcloudkit.com`
   - Add domain to `/etc/hosts`

3. **Start all services:**

   ```bash
   make start
   ```

   Or manually:

   ```bash
   docker compose up --build -d
   ```

4. **Access the application:**
   - **GUI**: https://app-local.localcloudkit.com:3030
   - **API**: https://app-local.localcloudkit.com:3030/api
   - **LocalStack**: http://localhost:4566 (direct access for AWS CLI)
   - **Express API (direct)**: http://localhost:3031 (bypasses Traefik)

## URL Structure

### External Access (via Traefik)

- **Main Application**: `https://app-local.localcloudkit.com:3030`
- **API Endpoints**: `https://app-local.localcloudkit.com:3030/api/*`
- **WebSocket (Socket.IO)**: `wss://app-local.localcloudkit.com:3030/ws/socket.io`
- **Health Check**: `https://app-local.localcloudkit.com:3030/health`
- **LocalStack Health**: `https://app-local.localcloudkit.com:3030/localstack/health`

### Direct Access (bypassing Traefik)

- **LocalStack**: `http://localhost:4566` (for AWS CLI)
- **Express API**: `http://localhost:3031` (for direct API access)
- **Redis**: `localhost:6380` (for direct Redis access)

> **Note**: The URLs above are for accessing the application from your host machine. Within the container network, services communicate using internal hostnames (e.g., `localstack:4566` for the API server to reach LocalStack).

## Services

### 1. Traefik Edge Router

- **Image**: `traefik:v3.0`
- **Ports**:
  - `3030:3030` (HTTPS - port 80 is free for other applications)
  - `8080:8080` (Dashboard, disabled by default)
- **Role**: Edge router, HTTPS termination, domain-based routing
- **Configuration**:
  - `traefik/traefik.yml` - Main configuration
  - `traefik/dynamic.yml` - TLS certificates
- **Certificates**: Mounted from `traefik/certs/` (generated by mkcert)

**Key Features:**

- Direct HTTPS access (port 80 is free for other applications)
- TLS/SSL termination
- Domain-based routing (`app-local.localcloudkit.com`)
- Docker service discovery via labels

### 2. Nginx Internal Reverse Proxy

- **Image**: `nginx:alpine`
- **Port**: `80` (internal only, not exposed to host)
- **Role**: Internal routing to GUI, API, and LocalStack
- **Configuration**: `nginx.conf`

**Routing Rules:**

- `/` → Next.js GUI (port 3030)
- `/api/*` → Express API (port 3031)
- `/ws/*` → Express API WebSocket (port 3031)
- `/health` → Health check endpoint
- `/localstack/health` → LocalStack health check

### 3. Next.js GUI

- **Build**: `Dockerfile.gui`
- **Port**: `3030` (internal)
- **Development**: Hot reload with volume mounts
- **Features**:
  - Dashboard
  - Resource management (S3, DynamoDB, Secrets Manager)
  - Real-time updates via Socket.IO

### 4. Express.js API

- **Build**: `Dockerfile.api`
- **Ports**:
  - `3031:3031` (exposed for direct access)
  - `3031` (internal)
- **Development**: Hot reload with volume mounts
- **Features**:
  - LocalStack management
  - Resource automation
  - Socket.IO WebSocket server
  - REST API endpoints

### 5. LocalStack

- **Image**: `localstack/localstack:${LOCALSTACK_VERSION:-latest}`
- **Port**: `4566:4566`
- **Features**: AWS services emulation
  - S3
  - DynamoDB
  - Lambda
  - API Gateway
  - IAM
  - Secrets Manager

### 6. Redis Cache

- **Image**: `redis:7-alpine`
- **Port**: `6380:6379` (exposed for direct access)
- **Role**: Standalone cache service (independent of LocalStack)
- **Features**:
  - Independent caching layer accessible by any service on the network
  - API provides endpoints for cache management via shell scripts
  - No password required (local development)
  - Can be accessed directly via `redis:6379` from any container on the network

## Volume Mounts

### Application Code (Hot Reload)

- `./localcloud-gui:/app` - Next.js GUI source code
- `./localcloud-api:/app` - Express API source code
- `/app/node_modules` - Node modules (excluded from host)
- `/app/.next` - Next.js build cache (excluded from host)

### Configuration

- `./traefik/traefik.yml:/etc/traefik/traefik.yml:ro` - Traefik config
- `./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro` - Traefik dynamic config
- `./traefik/certs:/certs:ro` - SSL certificates
- `./nginx.conf:/etc/nginx/nginx.conf:ro` - Nginx config
- `./scripts:/app/scripts` - Shell scripts (for API)

### Data & Logs

- `./volume:/var/lib/localstack` - LocalStack persistent data
- `./logs:/app/logs` - Application logs
- `/var/run/docker.sock:/var/run/docker.sock` - Docker socket (for LocalStack)

## Network Architecture

All services run on the `localstack-network` bridge network:

- **Network Name**: `localstack-network`
- **Driver**: `bridge`
- **Internal Communication**: Services communicate using service names (e.g., `gui`, `api`, `localstack`)

**Service Discovery:**

- `traefik` → `nginx` (via Docker labels)
- `nginx` → `gui` (via `gui:3030`)
- `nginx` → `api` (via `api:3031`)
- `nginx` → `localstack` (via `localstack:4566`)
- `api` → `localstack` (via `localstack:4566`)
- `api` → `redis` (via `redis:6379`)

## SSL/TLS Certificates

### Certificate Generation

Certificates are generated using `mkcert` for local development:

```bash
./scripts/setup-mkcert.sh
```

This generates:

- `traefik/certs/app-local.localcloudkit.com.pem` - Certificate
- `traefik/certs/app-local.localcloudkit.com-key.pem` - Private key

### Certificate Installation

The mkcert CA must be installed in your system trust store:

```bash
sudo ./scripts/install-ca.sh
```

This allows browsers to trust the certificates without warnings.

### Certificate Features

- **Domain**: `app-local.localcloudkit.com`
- **Wildcard**: `*.app-local.localcloudkit.com` (for subdomains)
- **Validity**: 825 days
- **Trust**: Trusted by Chrome, Safari, and other browsers (after CA installation)

## Development Workflow

### Hot Reloading

The development setup includes hot reloading for both GUI and API:

```bash
# Start development environment
make start

# Make changes to code
# Changes are automatically reflected in the running containers
```

**Hot Reload:**

- **GUI**: Next.js dev server automatically reloads on file changes
- **API**: Nodemon automatically restarts on file changes

### Viewing Logs

```bash
# View all logs
make logs

# View specific service logs
docker compose logs -f traefik
docker compose logs -f nginx
docker compose logs -f gui
docker compose logs -f api
docker compose logs -f localstack
docker compose logs -f redis
```

### Restarting Services

```bash
# Restart all services
make restart

# Restart specific service
docker compose restart traefik
docker compose restart gui
docker compose restart api
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check what's using the ports
   lsof -i :80
   lsof -i :443
   lsof -i :4566
   lsof -i :3031
   lsof -i :6380

   # Stop conflicting services
   docker compose down
   ```

2. **Certificate Issues**

   ```bash
   # Regenerate certificates
   ./scripts/setup-mkcert.sh

   # Reinstall CA
   sudo ./scripts/install-ca.sh

   # Restart Traefik
   docker compose restart traefik
   ```

3. **Build Failures**

   ```bash
   # Clean build
   docker compose build --no-cache

   # Check logs
   docker compose logs [service-name]
   ```

4. **Permission Issues**

   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./volume ./logs ./traefik/certs
   ```

5. **Domain Not Resolving**

   ```bash
   # Add to /etc/hosts
   sudo ./scripts/setup-hosts.sh

   # Or manually
   echo "127.0.0.1 app-local.localcloudkit.com" | sudo tee -a /etc/hosts
   ```

### Health Checks

```bash
# Check all services via Traefik
curl -k https://app-local.localcloudkit.com:3030/health

# Check API
curl -k https://app-local.localcloudkit.com:3030/api/health

# Check LocalStack
curl -k https://app-local.localcloudkit.com:3030/localstack/health

# Check LocalStack directly
curl http://localhost:4566/_localstack/health

# Check Redis
redis-cli -h localhost -p 6380 ping
```

### Service Status

```bash
# Check service status
make status

# Or manually
docker compose ps

# Check specific service
docker compose ps traefik
docker compose ps nginx
docker compose ps gui
docker compose ps api
docker compose ps localstack
docker compose ps redis
```

## File Structure

```
localcloud-kit/
├── 📁 localcloud-gui/          # Next.js Web GUI
│   ├── 📁 src/                 # Source code
│   └── 📄 README.md            # GUI documentation
├── 📁 localcloud-api/          # Express API Server
│   ├── 📄 server.js            # API server
│   ├── 📁 logs/                # Application logs
│   └── 📄 README.md            # API documentation
├── 📁 traefik/                 # Traefik configuration
│   ├── 📄 traefik.yml          # Main Traefik config
│   ├── 📄 dynamic.yml          # Dynamic TLS config
│   └── 📁 certs/               # SSL certificates (generated)
├── 📁 scripts/                 # Automation scripts
│   ├── 📄 setup.sh             # Master setup script
│   ├── 📄 setup-mkcert.sh      # Certificate generation
│   ├── 📄 install-ca.sh        # CA installation
│   ├── 📄 setup-hosts.sh       # /etc/hosts setup
│   └── 📁 shell/                # Shell-based automation
├── 📁 docs/                    # Documentation
│   └── 📄 DOCKER.md            # This file
├── 📄 docker-compose.yml       # Docker Compose configuration
├── 📄 Dockerfile.gui           # GUI container build
├── 📄 Dockerfile.api           # API container build
├── 📄 nginx.conf               # Nginx reverse proxy configuration
├── 📄 Makefile                 # Make commands
└── 📄 README.md                # Project README
```

## Commands Reference

### Development

```bash
# Start development environment
make start

# Start in background
docker compose up -d

# View logs
make logs
docker compose logs -f

# Stop development environment
make stop
docker compose down

# Restart services
make restart
docker compose restart
```

### Maintenance

```bash
# Clean up unused resources
docker system prune

# Remove all containers and volumes
make reset-env
docker compose down -v

# Update images
docker compose pull
docker compose up -d

# Rebuild specific service
docker compose build --no-cache gui
docker compose build --no-cache api
```

### Certificate Management

```bash
# Complete setup (first time)
./scripts/setup.sh

# Generate certificates only
./scripts/setup-mkcert.sh

# Install CA only
sudo ./scripts/install-ca.sh

# Setup /etc/hosts only
sudo ./scripts/setup-hosts.sh

# Verify setup
./scripts/verify-setup.sh
```

## Advanced Configuration

### Custom Domain

To use a different domain:

1. Update `docker-compose.yml` Traefik labels:

   ```yaml
   - "traefik.http.routers.localcloud.rule=Host(`yourdomain.local`)"
   ```

2. Regenerate certificates:

   ```bash
   # Edit scripts/setup-mkcert.sh to change DOMAIN variable
   ./scripts/setup-mkcert.sh
   ```

3. Update `/etc/hosts`:
   ```bash
   sudo ./scripts/setup-hosts.sh
   ```

### Traefik Dashboard

To enable the Traefik dashboard (for debugging):

1. Edit `traefik/traefik.yml`:

   ```yaml
   api:
     dashboard: true
     insecure: true
   ```

2. Access at: `http://localhost:8080`

> **Warning**: Only enable in local development. Never expose the dashboard in production.

### Custom Nginx Configuration

Edit `nginx.conf` and restart Nginx:

```bash
docker compose restart nginx
```

Changes are automatically picked up by Nginx.

## Production Considerations

This setup is designed for **local development only**. For production:

1. **Use a real domain** (not `.local`)
2. **Use Let's Encrypt** or another trusted CA (not mkcert)
3. **Disable Traefik dashboard** (already disabled)
4. **Use environment variables** for sensitive configuration
5. **Implement proper authentication** and authorization
6. **Use Docker secrets** or external secret management
7. **Set up proper logging** and monitoring
8. **Use production-grade images** (not `-alpine` or `:latest` tags)
9. **Implement health checks** and auto-restart policies
10. **Use a reverse proxy** in front of Traefik (e.g., Cloudflare, AWS ALB)

---

**For more information:**

- [Getting Started Guide](../GETTING_STARTED.md)
- [Local Development Workflow](LOCAL_WORKFLOW.md)
- [Certificate Setup](MKCERT_SETUP.md)
- [API Documentation](../localcloud-api/README.md)
- [GUI Documentation](../localcloud-gui/README.md)
