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
   - Generate SSL certificates for LocalCloud Kit subdomains
   - Add LocalCloud Kit domains to `/etc/hosts`

3. **Start all services:**

   ```bash
   make start
   ```

   Or manually:

   ```bash
   docker compose up --build -d
   ```

4. **Access the application:**

   Via Traefik (TLS):
   - **GUI**: https://app-local.localcloudkit.com:3030
   - **API**: https://app-local.localcloudkit.com:3030/api
   - **Mailpit**: https://mailpit.localcloudkit.com:3030
   - **PostHog** (optional profile): https://posthog.localcloudkit.com:3030

   Direct localhost (no TLS):
   - **LocalStack**: http://localhost:4566
   - **Express API**: http://localhost:3031
   - **Mailpit UI**: http://localhost:8025

## URL Structure

### External Access (via Traefik)

- **Main Application**: `https://app-local.localcloudkit.com:3030`
- **API Endpoints**: `https://app-local.localcloudkit.com:3030/api/*`
- **WebSocket (Socket.IO)**: `wss://app-local.localcloudkit.com:3030/ws/socket.io`
- **Health Check**: `https://app-local.localcloudkit.com:3030/health`
- **LocalStack Health**: `https://app-local.localcloudkit.com:3030/localstack/health`
- **PostHog** (optional profile): `https://posthog.localcloudkit.com:3030`

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

### 7. PostHog (optional profile)

- **Profile**: `posthog`
- **URL**: `https://posthog.localcloudkit.com:3030`
- **Role**: Local product analytics, event capture, and feature flags
- **Isolation**:
  - Dedicated `posthog-postgres`
  - Dedicated `posthog-redis`
  - Dedicated `posthog-clickhouse`
  - Dedicated `posthog-kafka`
- **Start**: `docker compose --profile posthog up -d`

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

- **SANs**: `app-local.localcloudkit.com`, `*.app-local.localcloudkit.com`, `mailpit.localcloudkit.com`, `pgadmin.localcloudkit.com`, `keycloak.localcloudkit.com`, `posthog.localcloudkit.com`
- **Validity**: 825 days
- **Trust**: Trusted by Chrome, Safari, and other browsers (after CA installation)
- **Single cert** covers both the main app and the Mailpit subdomain

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

## Docker Resource Management

LocalCloud Kit runs 10+ containers simultaneously. Without occasional maintenance, Docker's virtual disk fills up and causes cryptic container failures (most commonly seen as Keycloak crashing with "No space left on device").

### Understanding Docker Disk Usage

```bash
docker system df
```

| TYPE | What it is |
|---|---|
| **Images** | Pulled/built images. Safe to prune untagged ones. |
| **Containers** | Writable layers for running/stopped containers. |
| **Local Volumes** | Named volumes (LocalStack data, postgres data, etc.). **Accumulate silently.** |
| **Build Cache** | Layer cache from `docker build`. Speeds up rebuilds but can grow large. |

### Why Volumes Accumulate

Every `make reset`, `docker compose down -v`, or abandoned compose session can leave orphaned volumes. A volume is only deleted when explicitly pruned — Docker never auto-removes them even if no container references them.

```bash
# See all volumes (including orphaned ones)
docker volume ls

# See how much is reclaimable
docker system df
```

### Keycloak `/tmp` — tmpfs Mount

Keycloak (Quarkus / Vert.x) writes worker caches to `/tmp/vertx-cache` at startup. By default, `/tmp` inside a container is disk-backed (part of the container's writable overlay layer on the Docker host VM). When the VM disk is under pressure, this causes:

```
ERROR: Unable to create folder at path '/tmp/vertx-cache/-xxx'
ERROR: /tmp/vertx-cache: No space left on device
```

**Fix applied in `docker-compose.yml`:**

```yaml
keycloak:
  tmpfs:
    - /tmp
```

This mounts `/tmp` in RAM (tmpfs) instead of disk. It is:
- **Faster** — RAM I/O vs. overlay disk
- **Safe** — `/tmp` is always ephemeral; nothing in `/tmp` should survive a restart
- **Disk-neutral** — does not consume the Docker VM disk quota

### Routine Maintenance Commands

Run these periodically (monthly, or when Docker feels slow / containers crash unexpectedly):

```bash
# 1. Remove stopped containers + dangling images + danielle build cache
#    Does NOT remove volumes — safe to run anytime
docker system prune -f

# 2. Remove unused volumes (check first what will be deleted)
docker volume ls --filter dangling=true
docker volume prune -f            # frees the most space

# 3. Remove unused images (untagged + not referenced by any container)
docker image prune -a -f          # aggressive: removes all unused images

# 4. Nuclear option — removes everything except running container data
docker system prune -af --volumes
# ⚠️  This deletes ALL volumes including LocalStack data. Run make reset first.
```

### Recommendations

**1. Increase Docker Desktop disk size (if you hit limits)**

Docker Desktop → Settings → Resources → Virtual disk limit
Default is 64 GB. Increase to 128 GB+ if you work across multiple projects.

**2. Monitor live resource usage**

```bash
docker stats                     # live CPU/mem per container
docker stats --no-stream         # one-shot snapshot
```

**3. Set memory limits on heavy containers**

LocalStack and Keycloak are the heaviest. You can cap them in `docker-compose.yml`:

```yaml
localstack:
  deploy:
    resources:
      limits:
        memory: 1g
```

**4. Check what's eating disk before pruning**

```bash
docker system df -v              # verbose: per-image and per-volume breakdown
docker volume inspect <name>    # see where a specific volume's data lives on disk
```

**5. Add a cleanup alias to your shell**

```bash
# Add to ~/.zshrc or ~/.bashrc
alias docker-clean='docker system prune -f && docker volume prune -f'
```

---

## Troubleshooting

### Common Issues

1. **Keycloak Keeps Restarting / Crashing on Startup**

   **Symptom:** `localcloud-keycloak` shows `Restarting (1)` in `docker ps`. Logs show:
   ```
   ERROR: Unable to create folder at path '/tmp/vertx-cache/-xxx'
   ERROR: /tmp/vertx-cache: No space left on device
   ```

   **Cause:** Docker's virtual disk (on macOS, the Docker Desktop VM) is full. Keycloak writes startup caches to `/tmp` which is disk-backed by default.

   **Fix:**
   ```bash
   # 1. Free up Docker disk space
   docker volume prune -f            # removes unused volumes (often 10–30 GB)
   docker system prune -f            # removes dangling images + stopped containers

   # 2. Verify the tmpfs mount is in docker-compose.yml
   grep -A2 "tmpfs" docker-compose.yml
   # Expected output:
   #     tmpfs:
   #       - /tmp

   # 3. Restart
   make restart
   ```

   If the error persists, increase Docker Desktop's disk limit:
   **Docker Desktop → Settings → Resources → Virtual disk limit** (increase to 128 GB+).

2. **"Uncaught SyntaxError: Invalid or unexpected token" in Browser Console**

   **Symptom:** Browser console shows a SyntaxError on a script file after running `make restart`.

   **Cause:** The browser has cached stale JS chunk filenames from the previous build. After a new build, those chunk URLs no longer exist and the server returns an HTML 404 page, which the browser tries to parse as JavaScript.

   **Fix:**
   ```bash
   # Hard refresh — clears cached JS chunks
   Cmd + Shift + R    # macOS
   Ctrl + Shift + R   # Windows/Linux
   ```

   For a persistent fix, clear site data:
   **DevTools → Application → Storage → Clear site data → Reload**

3. **Code Changes Not Appearing After `git pull`**

   `make start` rebuilds images but does **not** stop and recreate already-running containers. Use `make restart` instead:

   ```bash
   git pull
   make restart
   ```

   If you pulled changes that include new npm packages and the app shows module errors:

   ```bash
   make stop
   docker compose build --no-cache gui api
   make start
   ```

   To confirm a container is running the new image after a rebuild:

   ```bash
   docker compose ps        # check status
   docker compose logs api  # check for startup errors
   ```

3. **Port Conflicts**

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

4. **Certificate Issues**

   ```bash
   # Regenerate certificates
   ./scripts/setup-mkcert.sh

   # Reinstall CA
   sudo ./scripts/install-ca.sh

   # Restart Traefik
   docker compose restart traefik
   ```

5. **Build Failures**

   ```bash
   # Clean build
   docker compose build --no-cache

   # Check logs
   docker compose logs [service-name]
   ```

6. **Permission Issues**

   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./volume ./logs ./traefik/certs
   ```

7. **Domain Not Resolving**

   ```bash
   # Add both domains to /etc/hosts
   sudo ./scripts/setup-hosts.sh

   # Or manually
   echo "127.0.0.1 app-local.localcloudkit.com" | sudo tee -a /etc/hosts
   echo "127.0.0.1 mailpit.localcloudkit.com" | sudo tee -a /etc/hosts
   echo "127.0.0.1 posthog.localcloudkit.com" | sudo tee -a /etc/hosts
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

# Check PostHog (optional profile)
curl -k https://posthog.localcloudkit.com:3030/_health
```

### Diagnosing a Crashing Container

When a container is in a restart loop (`Restarting (1)` in `docker ps`):

```bash
# 1. Identify the crashing container
docker ps -a

# 2. Read its last crash logs
docker logs <container-name> --tail=50

# 3. Check its exit code (non-zero = crashed)
docker inspect <container-name> | grep -A5 '"State"'

# 4. Common exit codes
#    Exit 1  — application error (check logs for ERROR lines)
#    Exit 137 — OOM killed (container ran out of memory)
#    Exit 139 — segfault

# 5. Enter the container for live debugging (if it stays up long enough)
docker exec -it <container-name> sh

# 6. Check disk pressure on the Docker VM
docker system df
docker volume prune -f    # if volumes are consuming most space
```

### Service-Specific Debug Commands

```bash
# --- LocalStack ---
# Check which AWS services are healthy
curl http://localhost:4566/_localstack/health | jq .

# List all S3 buckets
aws --endpoint-url=http://localhost:4566 --region=us-east-1 s3 ls

# List all DynamoDB tables
aws --endpoint-url=http://localhost:4566 --region=us-east-1 dynamodb list-tables

# --- Keycloak ---
# Check if Keycloak HTTP is up (bypassing Traefik)
curl -s http://localhost:8080/health/ready | jq .

# Get an admin token directly
curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli&grant_type=password&username=admin&password=admin" | jq .access_token

# --- PostgreSQL ---
# Connect directly
psql -h localhost -p 5432 -U postgres

# --- Redis ---
redis-cli -h localhost -p 6380 ping
redis-cli -h localhost -p 6380 info memory

# --- Mailpit ---
# Check API
curl -s http://localhost:8025/api/v1/messages | jq .total
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

### After Pulling New Code

After `git pull`, running containers must be stopped and recreated — `make start` alone won't update already-running containers:

```bash
git pull
make restart          # recommended: stop → rebuild → start
```

If the pull added new npm dependencies:

```bash
git pull
make stop
docker compose build --no-cache gui api   # clean rebuild avoids stale node_modules
make start
```

### Maintenance

```bash
# Clean up unused resources
docker system prune

# Remove all containers and volumes
make reset-env
docker compose down -v

# Pull updated third-party images (LocalStack, Redis, Traefik)
docker compose pull
make restart          # rebuild custom images + recreate all containers

# Rebuild a specific custom service (clean)
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
