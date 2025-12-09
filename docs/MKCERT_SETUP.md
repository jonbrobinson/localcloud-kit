# mkcert Setup Guide

## What is mkcert?

mkcert is a tool that generates locally-trusted SSL certificates for development. It creates certificates that are automatically trusted by your browser, eliminating certificate warnings.

## Installation

### macOS

```bash
brew install mkcert
```

### Linux

```bash
# Install certutil (required for mkcert)
sudo apt install libnss3-tools  # Debian/Ubuntu
# or
sudo yum install nss-tools      # CentOS/RHEL

# Download mkcert
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

### Windows

```bash
# Using Chocolatey
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

## Setup Workflow

### Step 1: Install mkcert (One-time)

**macOS:**

```bash
brew install mkcert
```

**Verify installation:**

```bash
mkcert --version
```

### Step 2: Generate Certificates (One-time per project)

Run the setup script:

```bash
./scripts/setup-mkcert.sh
```

This script will:

1. Check if mkcert is installed (guides you if not)
2. Install mkcert CA to your system trust store (first time only)
3. Generate certificates for `app-local.localcloudkit.com`
4. Place certificates in `traefik/certs/`

**Expected output:**

```
=== LocalCloud Kit mkcert Certificate Setup ===

✓ mkcert is installed
✓ mkcert CA already installed

Certificate directory: ./traefik/certs

Generating certificate for app-local.localcloudkit.com ...
✓ Certificates generated successfully!

Generated files:
-rw-------  1 user  staff  2.1K Nov 30 10:00 traefik/certs/app-local.localcloudkit.com-key.pem
-rw-r--r--  1 user  staff  1.5K Nov 30 10:00 traefik/certs/app-local.localcloudkit.com.pem

=== Next Steps ===

1. Restart Docker services:
   docker compose down && docker compose up -d

2. Open in your browser:
   https://app-local.localcloudkit.com:3030

Both Chrome and Safari will trust these certificates automatically!
```

### Step 3: Start the Application

```bash
# Option 1: Using Make
make start

# Option 2: Using Docker Compose directly
docker compose up -d

# Option 3: Using the start script
./start-gui.sh
```

### Step 4: Access the Application

Open in your browser:

- **Chrome**: `https://app-local.localcloudkit.com:3030`
- **Safari**: `https://app-local.localcloudkit.com:3030`
- **Firefox**: `https://app-local.localcloudkit.com:3030`

**No certificate warnings!** ✅

## Complete Local Development Workflow

### First Time Setup

```bash
# 1. Install mkcert
brew install mkcert

# 2. Generate certificates
./scripts/setup-mkcert.sh

# 3. Start services
make start
```

### Daily Development Workflow

```bash
# Start services
make start

# Or if already running, just restart
make restart

# View logs
make logs

# Stop services
make stop

# Full reset (cleans volumes)
make reset
```

### Access Points

- **Main GUI**: `https://app-local.localcloudkit.com:3030`
- **API**: `https://app-local.localcloudkit.com:3030/api`
- **LocalStack (direct)**: `http://localhost:4566`
- **Express API (direct)**: `http://localhost:3031`

## Troubleshooting

### Certificate Not Trusted

If you see certificate warnings:

1. **Check certificates exist:**

   ```bash
   ls -la traefik/certs/
   ```

2. **Regenerate certificates:**

   ```bash
   ./scripts/setup-mkcert.sh
   docker compose restart traefik
   ```

3. **Verify mkcert CA is installed:**
   ```bash
   mkcert -CAROOT
   ```

### Browser Still Shows Warning

1. **Clear browser cache** and try again
2. **Check certificate is loaded in Traefik:**

   ```bash
   docker compose logs traefik | grep -i certificate
   ```

3. **Verify domain matches:**
   - Certificate is for: `app-local.localcloudkit.com`
   - You're accessing: `https://app-local.localcloudkit.com:3030` (not `http://`)

### mkcert Not Found

If the script says mkcert is not installed:

**macOS:**

```bash
brew install mkcert
```

**Then run setup again:**

```bash
./scripts/setup-mkcert.sh
```

## Certificate Files

Generated certificates are stored in:

- `traefik/certs/app-local.localcloudkit.com.pem` (certificate)
- `traefik/certs/app-local.localcloudkit.com-key.pem` (private key)

These files are:

- ✅ Git-ignored (not committed to repository)
- ✅ Generated locally per developer
- ✅ Automatically trusted by browsers

## Renewal

Certificates are valid for a long time, but if you need to regenerate:

```bash
./scripts/setup-mkcert.sh
docker compose restart traefik
```

No need to reinstall mkcert or the CA - just regenerate the domain certificate.
