# Local Development Workflow

Complete guide for setting up and running LocalCloud Kit locally.

## 📋 Prerequisites

- Docker and Docker Compose
- mkcert (for trusted certificates)
- macOS, Linux, or Windows

## 🚀 First Time Setup

### Step 1: Generate Certificates

Run the setup script (one-time per project):

```bash
./scripts/setup-mkcert.sh
```

**What this does:**

- **Automatically downloads and installs mkcert** if not found (works on macOS, Linux, Windows)
- **No Homebrew or manual installation needed!**
- Installs mkcert CA to system trust store (first time only, requires sudo password)
- Generates certificates for `app-local.localcloudkit.com`
- Creates `traefik/certs/` directory with certificates

**Supported platforms:**

- macOS (Intel & Apple Silicon) - tries Homebrew first, falls back to direct download
- Linux (x86_64 & ARM64) - downloads binary directly
- Windows (via Git Bash/WSL) - downloads binary directly

**Expected output:**

```
=== LocalCloud Kit mkcert Certificate Setup ===

✓ mkcert is installed
✓ mkcert CA already installed

Certificate directory: ./traefik/certs

Generating certificate for app-local.localcloudkit.com ...
✓ Certificates generated successfully!

Generated files:
-rw-------  traefik/certs/app-local.localcloudkit.com-key.pem
-rw-r--r--  traefik/certs/app-local.localcloudkit.com.pem

=== Next Steps ===

1. Restart Docker services:
   docker compose down && docker compose up -d

2. Open in your browser:
   https://app-local.localcloudkit.com:3030
```

### Step 3: Start Services

```bash
make start
```

This will:

- Build Docker images (if needed)
- Start all services (Traefik, Nginx, GUI, API, LocalStack, Redis)
- Wait for services to be ready
- Display access URLs

## 🔄 Daily Development Workflow

### Starting the Application

```bash
# Start all services
make start

# Or if already running, restart
make restart
```

### Accessing the Application

Open in your browser:

- **Main GUI**: `https://app-local.localcloudkit.com:3030`
- **API**: `https://app-local.localcloudkit.com:3030/api`
- **Health Check**: `https://app-local.localcloudkit.com:3030/health`

### Development Features

**Hot Reload:**

- GUI changes: Edit files in `localcloud-gui/src/` → auto-reloads
- API changes: Edit files in `localcloud-api/` → auto-reloads
- No need to restart containers!

**Direct Access (for debugging):**

- Express API: `http://localhost:3031`
- LocalStack: `http://localhost:4566`
- Redis: `localhost:6380`

### Viewing Logs

```bash
# All services
make logs

# Specific service
docker compose logs -f gui
docker compose logs -f api
docker compose logs -f traefik
```

### Stopping Services

```bash
# Stop services (keeps data)
make stop

# Stop and remove volumes (clean slate)
make reset
```

## 🛠️ Common Tasks

### Check Service Status

```bash
make status
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker compose up --build -d
```

### Regenerate Certificates

If certificates expire or need regeneration:

```bash
./scripts/setup-mkcert.sh
docker compose restart traefik
```

### Full Reset

Clean everything and start fresh:

```bash
make reset-env
```

This will:

- Stop all services
- Remove containers
- Remove volumes (LocalStack data)
- Clean up Docker resources

## 📝 Workflow Summary

### First Time (One-time setup)

1. `./scripts/setup-mkcert.sh` (automatically installs mkcert if needed)
2. `make start`

### Daily Development

1. `make start` (or `make restart` if already running)
2. Open `https://app-local.localcloudkit.com:3030`
3. Edit code → auto-reloads
4. `make stop` when done

### Troubleshooting

- **Certificate issues**: Run `./scripts/setup-mkcert.sh` again
- **Port conflicts**: Check `make status` or `docker compose ps`
- **Service won't start**: Check logs with `make logs`

## 🔍 Quick Reference

| Task                  | Command                     |
| --------------------- | --------------------------- |
| Start services        | `make start`                |
| Stop services         | `make stop`                 |
| Restart services      | `make restart`              |
| View logs             | `make logs`                 |
| Check status          | `make status`               |
| Generate certificates | `./scripts/setup-mkcert.sh` |
| Full reset            | `make reset-env`            |

## 🌐 Access URLs

| Service     | URL                                          | Description           |
| ----------- | -------------------------------------------- | --------------------- |
| Web GUI     | `https://app-local.localcloudkit.com:3030`   | Main application      |
| API         | `https://app-local.localcloudkit.com:3030/api` | REST API              |
| LocalStack  | `http://localhost:4566`           | AWS services (direct) |
| Express API | `http://localhost:3031`           | API server (direct)   |
| Redis       | `localhost:6380`                  | Cache (direct)        |

## ✅ Verification

After starting, verify everything works:

```bash
# Check health
curl -k https://app-local.localcloudkit.com:3030/health

# Check API
curl -k https://app-local.localcloudkit.com:3030/api/health

# Check services
make status
```

All should return successful responses!
