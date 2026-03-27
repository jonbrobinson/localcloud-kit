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
- Start all services (Traefik, Nginx, GUI, API, AWS Emulator, Redis)
- Wait for services to be ready
- Display access URLs
- Keep optional PostHog profile stopped unless explicitly enabled

## 🔄 Daily Development Workflow

### Starting the Application

```bash
# Start all services
make start

# Start all services + optional PostHog profile
make start-posthog

# Or if already running, restart
make restart
```

### Accessing the Application

Open in your browser:

- **Main GUI**: `https://app-local.localcloudkit.com:3030`
- **API**: `https://app-local.localcloudkit.com:3030/api`
- **Health Check**: `https://app-local.localcloudkit.com:3030/health`
- **PostHog** (optional profile): `https://posthog.localcloudkit.com:3030`

### Development Features

**Hot Reload:**

- GUI changes: Edit files in `localcloud-gui/src/` → auto-reloads
- API changes: Edit files in `localcloud-api/` → auto-reloads
- No need to restart containers!

**Direct Access (for debugging):**

- Express API: `http://localhost:3031`
- AWS Emulator: `http://localhost:4566`
- Redis: `localhost:6380`
- PostHog profile control: `docker compose --profile posthog up -d`

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

### After Pulling New Code (`git pull`)

> **Important:** `make start` alone may not rebuild running containers after a pull. Always use `make restart` after pulling to ensure images are rebuilt and containers are recreated with the latest code.

```bash
git pull
make restart          # stop → rebuild images → start fresh containers
```

If the pull added new npm packages (changed `package.json`), do a clean rebuild to avoid stale `node_modules` inside the container:

```bash
git pull
make stop
docker compose build --no-cache gui api   # force clean rebuild of app images
make start
```

**Signs you need a clean rebuild after a pull:**
- App loads old UI / API behaves unexpectedly
- `docker compose logs gui` or `docker compose logs api` shows module-not-found errors
- A new feature or fix from the pull isn't appearing

### Rebuild After Local Code Changes

```bash
# Rebuild and restart (containers were stopped)
make start

# Or if containers are already running
make restart
```

### Preview AWS Resources from Dashboard

From the Dashboard **Resources** panel, you can now open resource-specific viewer modals directly for:

- S3 buckets
- DynamoDB tables
- Lambda functions (code viewer)
- API Gateway APIs (configuration viewer)
- Secrets Manager secrets
- SSM parameters
- IAM roles (role + attached policies viewer)

If no active resource exists yet for a type, create one first from **+ Add**.

When creating the first AWS resource from an empty dashboard, the resources panel now keeps the same empty-state layout and shows a **building** loading state until the new resource is available. Add/remove updates also animate smoothly to reduce jarring height jumps.

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
- Remove volumes (AWS Emulator data)
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

### After Pulling New Code

```bash
git pull && make restart
```

For dependency changes: `make stop && docker compose build --no-cache gui api && make start`

### Troubleshooting

- **Changes from `git pull` not showing**: Use `make restart` not `make start` — running containers must be stopped and recreated
- **New npm packages not found after pull**: `make stop && docker compose build --no-cache gui api && make start`
- **Certificate issues**: Run `./scripts/setup-mkcert.sh` again
- **Port conflicts**: Check `make status` or `docker compose ps`
- **Service won't start**: Check logs with `make logs`

## 🔍 Quick Reference

| Task                        | Command                                                      |
| --------------------------- | ------------------------------------------------------------ |
| Start services              | `make start`                                                 |
| Start services + PostHog    | `make start-posthog`                                         |
| Stop services               | `make stop`                                                  |
| Restart services            | `make restart`                                               |
| **After `git pull`**        | **`make restart`**                                           |
| After `git pull` (new deps) | `make stop && docker compose build --no-cache gui api && make start` |
| View logs                   | `make logs`                                                  |
| Check status                | `make status`                                                |
| Generate certificates       | `./scripts/setup-mkcert.sh`                                  |
| Full reset                  | `make reset-env`                                             |

## 🌐 Access URLs

**Via Traefik (TLS):**

| Service        | URL                                            | Description              |
| -------------- | ---------------------------------------------- | ------------------------ |
| Web GUI        | `https://app-local.localcloudkit.com:3030`     | Main application         |
| API            | `https://app-local.localcloudkit.com:3030/api` | REST API                 |
| Mailpit        | `https://mailpit.localcloudkit.com:3030`       | Email testing UI         |
| PostHog        | `https://posthog.localcloudkit.com:3030`       | Product analytics (optional profile) |

**Direct localhost (no TLS):**

| Service        | URL                        | Description              |
| -------------- | -------------------------- | ------------------------ |
| AWS Emulator   | `http://localhost:4566`    | AWS services (MiniStack) |
| Express API    | `http://localhost:3031`    | API server               |
| Mailpit UI     | `http://localhost:8025`    | Email testing (direct)   |
| Mailpit SMTP   | `localhost:1025`           | SMTP server              |
| Redis          | `localhost:6380`           | Cache                    |

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
