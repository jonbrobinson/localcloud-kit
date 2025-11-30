# Getting Started with LocalCloud Kit

Get up and running in **2 simple steps** - no manual installation required!

## 📋 Prerequisites

**Only one thing is required:**

- ✅ **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)

That's it! Everything else (mkcert, Node.js, dependencies) is handled automatically.

## 🚀 Quick Start (2 Steps)

### Step 1: Generate Certificates (First Time Only)

```bash
./scripts/setup-mkcert.sh
```

**What happens:**
- Automatically downloads and installs `mkcert` if needed (works on macOS, Linux, Windows)
- Installs the mkcert CA to your system (prompts for sudo password)
- Generates trusted certificates for `localcloudkit.localhost`
- No Homebrew, manual installation, or prerequisites needed!

**Expected output:**
```
=== LocalCloud Kit mkcert Certificate Setup ===

mkcert not found. Installing automatically...
Detected: macOS
Downloading mkcert...
✓ mkcert downloaded and installed
✓ mkcert CA installed
✓ Certificates generated successfully!
```

### Step 2: Start the Application

```bash
make start
```

**What happens:**
- Builds Docker images (if needed)
- Starts all services (Traefik, Nginx, GUI, API, LocalStack, Redis)
- Waits for services to be ready
- Displays access URLs

**Expected output:**
```
Starting LocalStack Template with Docker...
Waiting for services to be ready...
All services are ready! Access them via Traefik:
GUI: https://localcloudkit.localhost
API: https://localcloudkit.localhost/api
LocalStack: http://localhost:4566
```

### Step 3: Open in Your Browser

Open **https://localcloudkit.localhost** in your browser.

You should see the LocalCloud Kit dashboard! 🎉

## ✅ Verify Everything Works

```bash
# Check service status
make status

# Test health endpoint
curl -k https://localcloudkit.localhost/health

# Test API endpoint
curl -k https://localcloudkit.localhost/api/health
```

## 📍 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web GUI** | `https://localcloudkit.localhost` | Main application dashboard |
| **API** | `https://localcloudkit.localhost/api` | REST API endpoints |
| **LocalStack** | `http://localhost:4566` | Direct AWS services access |
| **Express API** | `http://localhost:3031` | API server (direct) |

> **Note**: The `.localhost` domain auto-resolves to `127.0.0.1` - no `/etc/hosts` configuration needed!

## 🔄 Daily Workflow

### Start Development
```bash
make start
```

### Stop Development
```bash
make stop
```

### Restart Services
```bash
make restart
```

### View Logs
```bash
make logs
```

## 🛠️ Common Commands

| Task | Command |
|------|---------|
| Start services | `make start` |
| Stop services | `make stop` |
| Restart services | `make restart` |
| View logs | `make logs` |
| Check status | `make status` |
| Generate certificates | `./scripts/setup-mkcert.sh` |
| Full reset | `make reset-env` |

## 🐛 Troubleshooting

### Certificate Issues
```bash
# Regenerate certificates
./scripts/setup-mkcert.sh
docker compose restart traefik
```

### Port Conflicts
```bash
# Check what's using the ports
make status
docker compose ps
```

### Services Won't Start
```bash
# Check logs
make logs

# Check specific service
docker compose logs -f traefik
docker compose logs -f gui
docker compose logs -f api
```

### Clean Slate
```bash
# Stop and remove everything
make reset-env

# Then start fresh
make start
```

## 📚 Next Steps

- **Detailed Workflow**: See `docs/LOCAL_WORKFLOW.md`
- **Certificate Setup**: See `docs/MKCERT_SETUP.md`
- **Docker Guide**: See `DOCKER.md`
- **API Documentation**: See `localcloud-api/README.md`
- **GUI Documentation**: See `localcloud-gui/README.md`

## 🎯 What You Get

- ✅ **Local AWS Environment** - S3, DynamoDB, Secrets Manager
- ✅ **Web Dashboard** - Visual resource management
- ✅ **REST API** - Programmatic access
- ✅ **Hot Reload** - Automatic code reloading
- ✅ **HTTPS** - Secure local development
- ✅ **Zero Configuration** - Works out of the box

## 💡 Tips

- **First time?** The certificate setup only needs to run once
- **Hot reload enabled** - Edit code and see changes instantly
- **No AWS account needed** - Everything runs locally
- **Data persists** - LocalStack data is saved in `volume/` directory

---

**That's it!** You're ready to start developing with LocalCloud Kit. 🚀

