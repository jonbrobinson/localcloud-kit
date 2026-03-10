# LocalCloud Kit

> **Local Cloud Development Environment**

Build and test cloud apps locally — no AWS account needed. Free, fast, and with full data visibility. Emulates S3, DynamoDB, Secrets Manager, Redis cache, and email testing with Mailpit.

[![Version](https://img.shields.io/badge/version-0.9.0-blue.svg)](https://github.com/jonbrobinson/localcloud-kit/releases/tag/v0.9.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[![Docker](https://img.shields.io/badge/Docker-Containerized-0db7ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Emulation-1a1a2e?style=for-the-badge&logo=amazon-aws&logoColor=ff9900)](https://localstack.cloud/)
[![Redis](https://img.shields.io/badge/Redis-7.x-dc382d?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Mailpit](https://img.shields.io/badge/Mailpit-Email%20Testing-e8622a?style=for-the-badge&logo=maildotru&logoColor=white)](https://mailpit.axllent.org/)

## 🚀 Quick Start

### Prerequisites

**Only one thing required:**

- ✅ **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)

Everything else is handled automatically!

### Getting Started (2 Steps)

#### Step 1: Complete Setup (First Time Only)

**Recommended: One-Command Setup**

```bash
./scripts/setup.sh
```

**What this does:**

- Automatically downloads and installs `mkcert` if not found (works on macOS, Linux, Windows)
- Installs the mkcert CA to your system trust store (requires sudo password)
- Generates trusted certificates that work in both Chrome and Safari without warnings
- Adds `app-local.localcloudkit.com` to `/etc/hosts` (requires sudo password)

**No manual installation needed** - the script handles everything automatically!

**Individual scripts available for one-off operations:**

- `./scripts/setup-mkcert.sh` - Generate certificates only
- `./scripts/install-ca.sh` - Install CA certificate only
- `./scripts/setup-hosts.sh` - Add domain to /etc/hosts only
- `./scripts/cleanup-hosts.sh` - Remove LocalCloud Kit domains from /etc/hosts (with confirmation)
- `./scripts/verify-setup.sh` - Verify setup and certificate configuration

#### Step 2: Start the Application

```bash
make start
```

This single command will:

- ✅ Install all dependencies automatically (handled by Docker)
- ✅ Start all Docker services
- ✅ Wait for services to be ready
- ✅ Display access URLs

**Access URLs:**

- **Web GUI**: https://app-local.localcloudkit.com:3030
- **API Server**: https://app-local.localcloudkit.com:3030/api
- **LocalStack**: http://localhost:4566 (direct access for AWS CLI)
- **Mailpit UI**: https://mailpit.localcloudkit.com:3030 (email testing inbox)
- **Mailpit SMTP**: localhost:1025 (point your app here to catch emails)
- **Express API (direct)**: http://localhost:3031 (direct access, bypasses Traefik)

> **Note**: Add to `/etc/hosts`: `127.0.0.1 app-local.localcloudkit.com`

**📖 For detailed getting started instructions, see [GETTING_STARTED.md](GETTING_STARTED.md)**

## 📸 Screenshots

### Main Dashboard

The main dashboard provides an overview of all services and resources with real-time status indicators.

![Main Dashboard](docs/screenshots/01-main-dashboard.png)

---

### S3 Storage

#### S3 Bucket Configuration

Create S3 buckets with optional versioning and encryption settings.

![S3 Bucket Configuration](docs/screenshots/02-s3-bucket-configuration.png)

#### S3 Bucket Management

Browse bucket contents, upload files, and manage objects directly from the GUI.

![S3 Bucket Management](docs/screenshots/03-s3-bucket-management.png)

#### S3 File Viewer

View file contents inline — raw text, syntax-highlighted code, images, and more.

![S3 File Viewer](docs/screenshots/06-s3-file-viewer-detail.png)

---

### DynamoDB

#### DynamoDB Table Configuration

Create tables with custom partition keys, sort keys, billing mode, and Global Secondary Indexes.

![DynamoDB Table Configuration](docs/screenshots/05-dynamodb-table-configuration.png)

#### DynamoDB Table Data

Scan and query table items with full CRUD support directly from the dashboard.

![DynamoDB Table Data](docs/screenshots/04-dynamodb-table-data.png)

## 🏗️ Project Structure

```
localcloud-kit/
├── 📁 localcloud-gui/          # Next.js Web GUI
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 services/        # API services
│   │   └── 📁 types/           # TypeScript types
│   └── 📄 README.md            # Web GUI documentation
├── 📁 localcloud-api/          # Express API Server
│   ├── 📄 server.js            # API server
│   ├── 📁 logs/                # Application logs
│   └── 📄 README.md            # API documentation
├── 📁 scripts/                 # Automation scripts
│   └── 📁 shell/               # Shell-based automation
│       ├── 📄 create_secret.sh # Secrets Manager creation
│       ├── 📄 delete_secret.sh # Secrets Manager deletion
│       ├── 📄 get_secret.sh    # Secrets Manager retrieval
│       └── 📄 list_secrets.sh  # Secrets Manager listing
├── 📁 samples/                 # Sample files for testing
│   ├── 📄 sample.py            # Python example
│   ├── 📄 sample.js            # JavaScript example
│   ├── 📄 sample.ts            # TypeScript example
│   ├── 📄 sample.json          # JSON example
│   ├── 📄 sample.csv           # CSV example
│   ├── 📄 Sample.java          # Java example
│   ├── 📄 sample.docx          # Word document example
│   └── 📄 README.md            # Samples documentation
├── 📄 docker-compose.yml       # Docker Compose configuration
├── 📄 Dockerfile.gui           # GUI container build
├── 📄 Dockerfile.api           # API container build
├── 📄 nginx.conf               # Reverse proxy configuration
└── 📄 README.md                # This file
```

## 🎯 Features

**Latest Release:** v0.8.0 adds Mailpit email testing (local SMTP + inbox UI), Redis cache modal, a restructured Resources navigation with labelled sections (AWS, Cache, Inbox), a comprehensive modal UX overhaul (scroll lock, Escape key, backdrop dismiss) across all viewers, DynamoDB add-item fixes (focus close, scroll, number validation), and expanded SDK connection docs with Secrets Manager examples. [View detailed changelog →](CHANGELOG.md)

### AWS Service Emulation

#### S3 Storage

- **Bucket Management**: Create, list, and delete S3 buckets with one-click operations
- **File Operations**: Upload, download, and delete objects with full GUI support
- **Multipart Uploads**: Handle large files up to 100MB with efficient memory management
- **File Viewer**: View files with syntax highlighting for 100+ languages
- **Document Support**: Preview Word documents, PDFs, images, and more
- **Nested Folders**: Full support for folder structures and nested paths

#### DynamoDB

- **Table Management**: Create and configure tables with custom schemas
- **Full CRUD Operations**: Add, view, update, and delete items
- **Global Secondary Indexes**: Complete GSI support with proper provisioning
- **Query & Scan**: Advanced querying with GSI support
- **Schema Validation**: Interactive forms for adding items with type checking

#### Secrets Manager

- **Secure Storage**: Store and manage secrets with encryption support
- **Mask/Reveal**: Toggle visibility of secret values for security
- **Rich Metadata**: Descriptions, tags, and KMS key encryption
- **ARN Management**: Copy ARNs for easy integration with applications
- **Bulk Operations**: Create, update, and delete multiple secrets

#### Redis Cache

- **Key-Value Storage**: Full Redis cache operations (set, get, delete, flush)
- **Cache Management**: View all keys and values with JSON formatting
- **Connection Info**: Easy integration with external Redis tools
- **GUI Interface**: Full-screen cache management interface

#### Mailpit Email Testing

- **Local SMTP Server**: Catch all outbound emails without sending to real addresses
- **Inbox UI**: Browse, read, and inspect emails directly from the dashboard
- **Send Test Emails**: Fire test emails from the GUI to verify templates and flows
- **Email Details**: View headers, body, recipient info, and timestamps
- **Inbox Management**: Clear all messages or delete individually

### Development Tools

#### Web Interface

- **Modern Dashboard**: Next.js-powered GUI with real-time updates
- **Resource Creation**: Individual or batch resource creation with templates
- **Live Monitoring**: Real-time status tracking and health checks
- **Log Viewer**: Stream logs with filtering and search capabilities
- **Hot Reloading**: Instant updates during development

#### Shell Automation

- **CLI Scripts**: Comprehensive shell scripts for all operations
- **Resource Templates**: Predefined configurations for common setups
- **Environment Management**: Support for dev, uat, and prod environments
- **Naming Conventions**: Consistent resource naming across environments
- **POSIX Compatible**: Works on macOS, Linux, and WSL

#### Docker Environment

- **Single Command Setup**: Start everything with `make start` (cross-platform)
- **Docker Compose**: Fully containerized with hot reload support
- **Nginx Reverse Proxy**: Clean URL routing for all services
- **Environment Reset**: Easy cleanup and fresh start commands
- **Network Isolation**: Secure container networking
- **Volume Management**: Persistent data with easy cleanup options

### Developer Experience

- **Isolated Environment**: Complete isolation from AWS cloud - no account needed
- **Zero Cost**: Free local development without AWS charges
- **Fast Iteration**: No network latency - instant feedback on changes
- **Full Visibility**: Inspect and debug all data without restrictions
- **Cross-Platform**: Works on macOS, Linux, and Windows (WSL)
- **Comprehensive Documentation**: Detailed guides and SDK examples
- **Sample Files**: Pre-configured examples for testing features

## 🛠️ Prerequisites

- **Docker & Docker Compose**: For containerized services
- **AWS CLI**: For shell automation (optional, for local development)

## 📌 LocalStack Version Compatibility

LocalCloud Kit uses the latest LocalStack version by default:

- **Default Version**: `latest` (automatically pulls newest LocalStack release)
- **Last Tested**: 4.13.0 (March 9, 2026)
- **Compatibility**: Maintained and updated as LocalStack evolves

> 📌 **LocalStack image change (March 23, 2026)**: LocalStack is consolidating Community and Pro into a single image. The **Community edition remains free** — all services LocalCloud Kit uses (S3, DynamoDB, Secrets Manager, IAM) are included at no cost. After March 23, you'll need a free account and `LOCALSTACK_AUTH_TOKEN` set in your `.env` to pull the `latest` tag. [Sign up free →](https://app.localstack.cloud/sign-up). To avoid this entirely, use `make start-legacy` to pin to `4.12` (no auth required for pre-consolidation versions).

### Using Specific LocalStack Versions

The default configuration uses `latest`, but you can pin to a specific version if needed:

```bash
# Start with latest (default)
make start

# Start with LocalStack 4.12 — community legacy, no auth token required
make start-legacy

# Start with any specific version
make start LOCALSTACK_VERSION=4.13.0

# Using environment variable directly
LOCALSTACK_VERSION=4.13.0 docker compose up

# Using a .env file
cp env.example .env
# Edit LOCALSTACK_VERSION in .env, then:
docker compose up
```

### Version Strategy

The `docker-compose.yml` uses `${LOCALSTACK_VERSION:-latest}` which means:

- Uses `latest` by default (automatically pulls newest LocalStack release)
- Ensures you always have the latest features and bug fixes
- Respects `LOCALSTACK_VERSION` environment variable for version pinning
- Flexibility to pin to specific versions when reproducibility is needed

**Why `latest`?**

- LocalCloud Kit is maintained to stay compatible with LocalStack updates
- Breaking changes are documented in the README when they occur
- Gives users the latest features and improvements automatically
- Can still pin to specific versions via environment variables if needed

> ⚠️ **Note**: If you encounter compatibility issues with a new LocalStack version, pin to a known working version (e.g., `4.13.0`) using the methods above, and report the issue in [GitHub Issues](https://github.com/jonbrobinson/localcloud-kit/issues).

## 📖 Usage

### Start Services

```bash
# Start with LocalStack latest (default)
make start

# Start with LocalStack 4.12 — community legacy, no auth token required
make start-legacy

# Start with any specific LocalStack version
make start LOCALSTACK_VERSION=4.13.0

# Alternative: Docker Compose directly
docker compose up --build

# Development mode (GUI outside Docker)
docker compose up -d localstack api nginx
cd localcloud-gui && npm install && npm run dev
```

### Create Resources

#### Via Web GUI (Recommended)

1. Open https://app-local.localcloudkit.com:3030
2. Click individual resource buttons:
   - 🪣 **S3 Bucket** - Create storage buckets
   - 🗄️ **DynamoDB Table** - Create NoSQL tables
   - 🔑 **Secrets Manager** - Store secrets
3. Or use the batch creation modal for multiple resources

#### Via Shell Scripts

```bash
# Batch resource creation
./scripts/shell/create_resources.sh localcloud-kit dev --s3 --dynamodb

# Individual resource creation
./scripts/shell/create_single_resource.sh s3 my-bucket
```

#### Via AWS CLI

```bash
# S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# DynamoDB table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name my-table \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Secrets Manager
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name my-secret \
  --secret-string "my-secret-value"
```

### Manage Resources

All resources can be managed through:

- **Web GUI**: https://app-local.localcloudkit.com:3030
- **Shell Scripts**: Located in `scripts/shell/`
- **AWS CLI**: Using `--endpoint-url=http://localhost:4566`
- **AWS SDKs**: Configure with LocalStack endpoint

### Test File Viewer

Upload sample files to test syntax highlighting:

```bash
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.py s3://your-bucket/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.js s3://your-bucket/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.json s3://your-bucket/
```

Then view files in the GUI with full syntax highlighting support.

---

## 🔧 Configuration

### Service URLs

| Service     | URL                                          | Description                     |
| ----------- | -------------------------------------------- | ------------------------------- |
| Web GUI     | https://app-local.localcloudkit.com:3030     | Main application interface      |
| API Server  | https://app-local.localcloudkit.com:3030/api | REST API endpoints              |
| LocalStack  | http://localhost:4566                        | AWS services emulation          |
| Redis Cache | localhost:6380                               | Redis cache (no password)       |
| Mailpit UI  | https://mailpit.localcloudkit.com:3030       | Email inbox and SMTP testing    |
| Mailpit SMTP| localhost:1025                               | SMTP endpoint for sending email |

> **Note**: Within Docker network, services use internal hostnames (e.g., `localstack:4566`, `redis:6379`)

### Environment Configuration

- **Project Name**: Used for resource naming conventions
- **Environment**: Supports dev/uat/prod isolation
- **AWS Region**: Default is `us-east-1`
- **Hot Reload**: Enabled for both GUI and API during development

### Customization

Edit `docker-compose.yml` to customize:

- Port mappings
- Environment variables
- Resource limits
- Volume mounts

## 🚀 Common Commands

```bash
# Start services
make start                         # Recommended: Cross-platform Make command
docker compose up --build          # Alternative: Docker Compose directly

# View logs
docker compose logs -f             # Follow all logs
docker compose logs -f api         # Follow specific service

# Stop services
docker compose down                # Stop and remove containers
docker compose stop                # Stop without removing

# Restart services
docker compose restart             # Restart all
docker compose restart api         # Restart specific service

# Environment management
make reset                         # Stop services + clean volumes
make reset-env                     # Full reset (clean everything)
make clean-volumes                 # Clean data only
make clean-all                     # Nuclear option (remove all Docker resources)

# Production
docker compose up -d --scale api=3 # Scale services
```

> **⚠️ Note**: Destructive commands include confirmation prompts to prevent accidental data loss.

## 📚 Documentation

### Getting Started

- **[Getting Started Guide](GETTING_STARTED.md)** - Complete setup and first-time installation (includes quick start, customization, and workflows)
- **[Docker Guide](docs/DOCKER.md)** - Container deployment and management
- **[Connection Guide](docs/CONNECT.md)** - AWS SDK integration examples (JS, Python, Go, Java)

### Setup & Configuration Scripts

LocalCloud Kit includes several setup and maintenance scripts:

**Setup Scripts:**

- `./scripts/setup.sh` - **Master setup script** - Runs all setup steps automatically
  - Installs mkcert (if needed)
  - Installs mkcert CA certificate
  - Generates SSL certificates
  - Adds domain to /etc/hosts
- `./scripts/setup-mkcert.sh` - Generate SSL certificates only
- `./scripts/install-ca.sh` - Install mkcert CA certificate to system trust store
- `./scripts/setup-hosts.sh` - Add `app-local.localcloudkit.com` to /etc/hosts
- `./scripts/verify-setup.sh` - Verify setup configuration
  - Checks certificate files exist and are valid
  - Verifies certificate subject matches domain
  - Checks /etc/hosts entry exists
  - Verifies mkcert CA is installed
  - Provides troubleshooting guidance

**Cleanup Scripts:**

- `./scripts/cleanup-hosts.sh` - **Interactive cleanup** of LocalCloud Kit domain entries
  - Detects all LocalCloud Kit domains in /etc/hosts (including previous versions)
  - Shows found entries before removal
  - **Interactive confirmation** - choose which domains to remove or keep
  - Creates backup before making changes
  - Supports cleaning up old domains like `localcloudkit.local`
  - Safe to run - requires confirmation for each domain

**Example cleanup usage:**

```bash
# Clean up old domain entries (interactive)
sudo ./scripts/cleanup-hosts.sh

# The script will:
# 1. Scan /etc/hosts for all LocalCloud Kit domains
#    - Detects: localcloudkit.local (old domain)
#    - Detects: app-local.localcloudkit.com (current domain)
# 2. Show all found entries before making changes
# 3. Ask for each domain individually: "Remove entries for [domain]? (y/N)"
#    - You can choose to keep or remove each domain
# 4. Show summary of what will be removed (red) and kept (green)
# 5. Final confirmation before making any changes
# 6. Create backup automatically
# 7. Remove only selected domains
# 8. Verify removal was successful
```

**Cleanup script features:**

- ✅ **Safe**: Creates backup before any changes
- ✅ **Interactive**: Choose which domains to remove or keep
- ✅ **Selective**: Remove old domains while keeping current one
- ✅ **Verification**: Confirms successful removal
- ✅ **Cancellable**: Can cancel at any confirmation prompt

### Certificate & Security

- **[mkcert Setup Guide](docs/MKCERT_SETUP.md)** - Certificate generation and installation
- **[Certificate Troubleshooting](docs/CERTIFICATE_TROUBLESHOOTING.md)** - Fix certificate issues
- **[Local Development Workflow](docs/LOCAL_WORKFLOW.md)** - Daily development workflow

### Service Documentation

- **[Mailpit Email Testing](docs/MAILPIT.md)** - Email testing guide with SMTP configuration and API examples
- **[Redis Cache Management](docs/REDIS.md)** - Complete Redis cache guide with API endpoints and examples
- **[Secrets Manager Integration](docs/SECRETS.md)** - Full Secrets Manager documentation with SDK examples

### Component Documentation

- **[API Documentation](localcloud-api/README.md)** - Backend API server reference
- **[GUI Documentation](localcloud-gui/README.md)** - Frontend application guide
- **[Shell Scripts](scripts/shell/README.md)** - Automation scripts documentation
- **[Samples](samples/README.md)** - Sample files for testing

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/jonbrobinson/localcloud-kit.git
cd localcloud-kit

# Start development environment
make start                  # Start all services with Docker
# or
docker compose up --build   # Alternative: Docker Compose directly

# View available commands
make help                   # Show all available Makefile commands

# Common development commands
make logs                   # View all service logs
make status                 # Check service health
make restart                # Restart all services

# GUI-only development (for frontend work)
make gui-start              # Start only GUI, API, and nginx
cd localcloud-gui && npm run dev  # Or run GUI locally outside Docker
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/jonbrobinson/localcloud-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jonbrobinson/localcloud-kit/discussions)
- **Repository**: [GitHub Repository](https://github.com/jonbrobinson/localcloud-kit)

## 🔗 Links

- [GitHub Repository](https://github.com/jonbrobinson/localcloud-kit)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Contact

**LocalCloud Kit** - Open Source Project

- **GitHub**: https://github.com/jonbrobinson/localcloud-kit
- **Issues**: [GitHub Issues](https://github.com/jonbrobinson/localcloud-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jonbrobinson/localcloud-kit/discussions)
- **Documentation**: [README.md](README.md)

### Getting Help

- **Report Issues**: Use GitHub Issues for bug reports and feature requests
- **Ask Questions**: Use GitHub Discussions for questions and community support
- **Contribute**: Pull requests and contributions are welcome
- **Documentation**: Check the README and inline documentation

---

**Built with ❤️ for the developer community**

## 🛠️ Troubleshooting

### Connection Errors - "502 Bad Gateway" or "Failed to fetch"

If you're seeing connection errors when accessing the GUI:

**Check if services are running:**

```bash
docker compose ps                    # Check container status
docker compose up -d                 # Start if not running
```

**Verify services are healthy:**

```bash
curl -k https://app-local.localcloudkit.com:3030/api/health           # Check API
curl http://localhost:4566/_localstack/health   # Check LocalStack
```

**Common solutions:**

- **502 Bad Gateway**: API server isn't running → `docker compose up -d`
- **Can't connect to LocalStack**: Wait for startup or restart → `docker compose restart localstack`
- **Certificate errors**: Run `./scripts/setup.sh` to generate certificates
- **Domain not resolving**: Add to `/etc/hosts` or run `sudo ./scripts/setup-hosts.sh`
- **Clean up old domain entries**: Run `sudo ./scripts/cleanup-hosts.sh` to remove previous LocalCloud Kit domains (interactive, with confirmation)

**Development mode (GUI outside Docker):**

```bash
docker compose up -d localstack api nginx
cd localcloud-gui && npm install && npm run dev
# GUI available at http://localhost:3000
```

### Docker Build Failures - "No Space Left on Device"

If you encounter build failures with errors like:

```
failed to copy files: userspace copy failed: write /app/node_modules/...: no space left on device
```

This indicates that Docker has run out of disk space. This commonly happens when:

- **Multiple Docker builds** accumulate over time
- **Large node_modules** directories from previous builds
- **Unused Docker images, containers, and volumes** taking up space
- **Build cache** growing too large

#### Quick Fix - Clean Up Docker

**Using LocalCloud Kit Commands (Recommended):**

```bash
# Reset Docker environment (stops services + cleans volumes)
make reset

# Full environment reset (clean resources + stop services + clean all Docker resources)
make reset-env

# Clean Docker volumes only (removes all persistent data)
make clean-volumes

# Clean all Docker resources (containers, images, volumes)
make clean-all
```

**Using Docker Commands Directly:**

```bash
# Check Docker disk usage
docker system df

# Clean up everything (WARNING: This removes ALL unused Docker data)
docker system prune -a --volumes -f

# Alternative: Clean up specific components
docker image prune -a -f    # Remove unused images
docker container prune -f   # Remove stopped containers
docker volume prune -f      # Remove unused volumes
docker builder prune -a -f  # Remove build cache
```

#### Prevention - Regular Maintenance

Add these commands to your regular maintenance routine:

**Using LocalCloud Kit Commands:**

```bash
# Weekly reset (stops services + cleans volumes)
make reset

# Monthly deep cleanup (removes everything unused)
make reset-env

# Check space usage
docker system df
```

**Using Docker Commands Directly:**

```bash
# Weekly cleanup (keeps recent images)
docker system prune -f

# Monthly deep cleanup (removes everything unused)
docker system prune -a --volumes -f

# Check space usage
docker system df
```

#### What Causes This Issue

This issue is particularly common with this repository because:

1. **Large Dependencies**: Next.js and Node.js applications have large `node_modules` directories
2. **Multiple Builds**: Each `docker compose up --build` creates new layers
3. **Development Workflow**: Frequent rebuilds during development accumulate layers
4. **LocalStack Images**: The LocalStack Docker image is quite large (~1GB+)
5. **Build Cache**: Docker build cache can grow significantly over time

#### Monitoring Disk Usage

```bash
# Check current Docker disk usage
docker system df

# Expected output format:
# TYPE            TOTAL     ACTIVE     SIZE      RECLAIMABLE
# Images          10        3          2.1GB     1.5GB (71%)
# Containers      5         1          0.1GB     0.1GB (100%)
# Local Volumes   3         1          0.5GB     0.3GB (60%)
# Build Cache     0         0          0B        0B
```

If **RECLAIMABLE** space is high (>50%), consider running cleanup commands.

#### Alternative Solutions

If you frequently run into space issues:

1. **Use .dockerignore**: Ensure your `.dockerignore` file excludes unnecessary files
2. **Multi-stage builds**: Optimize Dockerfiles to reduce image size
3. **Regular cleanup**: Set up automated cleanup scripts
4. **Separate development**: Use different Docker contexts for different projects

---
