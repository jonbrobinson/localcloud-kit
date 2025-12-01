# Quick Setup Guide

## 🚀 Complete Setup in 2 Steps

### Step 1: Generate Certificates

```bash
./scripts/setup-mkcert.sh
```

**What happens:**

- **Automatically downloads and installs mkcert** if not found (works on macOS, Linux, Windows)
- **No Homebrew or manual installation needed!**
- Installs mkcert CA (first time only, requires sudo password)
- Generates certificates for `localcloudkit.local`
- Creates `traefik/certs/` with trusted certificates

### Step 2: Start Services

```bash
make start
```

**That's it!** Open `https://localcloudkit.local` in your browser.

## 📋 Daily Workflow

### Start Development

```bash
make start
```

### Access Application

- **GUI**: `https://localcloudkit.local`
- **API**: `https://localcloudkit.local/api`

### Stop Development

```bash
make stop
```

## 🔧 Useful Commands

```bash
make start      # Start all services
make stop       # Stop all services
make restart    # Restart services
make logs       # View logs
make status     # Check service status
make reset      # Clean reset (removes volumes)
```

## 📚 More Information

- **Detailed mkcert setup**: See `docs/MKCERT_SETUP.md`
- **Complete workflow**: See `docs/LOCAL_WORKFLOW.md`
- **Troubleshooting**: See `docs/MKCERT_SETUP.md#troubleshooting`

## ✅ Verification

After setup, verify everything works:

```bash
# Health check
curl -k https://localcloudkit.local/health

# API check
curl -k https://localcloudkit.local/api/health
```

Both should return successful responses!
