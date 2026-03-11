# LocalCloud Kit

> **Local Cloud Development Environment**

Build and test cloud apps locally — no AWS account needed. Free, fast, and with full data visibility. Emulates S3, DynamoDB, Secrets Manager, Redis cache, and email testing with Mailpit.

[![Version](https://img.shields.io/badge/version-0.11.4-blue.svg)](https://github.com/jonbrobinson/localcloud-kit/releases/tag/v0.11.4)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[![Docker](https://img.shields.io/badge/Docker-Containerized-0db7ed?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Emulation-1a1a2e?style=for-the-badge&logo=amazon-aws&logoColor=ff9900)](https://localstack.cloud/)
[![Redis](https://img.shields.io/badge/Redis-7.x-dc382d?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Mailpit](https://img.shields.io/badge/Mailpit-Email%20Testing-e8622a?style=for-the-badge&logo=maildotru&logoColor=white)](https://mailpit.axllent.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Keycloak](https://img.shields.io/badge/Keycloak-Identity-7F4F24?style=for-the-badge&logo=keycloak&logoColor=white)](https://www.keycloak.org/)

## Table of Contents

- [Quick Start](#-quick-start)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [LocalStack Version](#-localstack-version)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Common Commands](#-common-commands)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Support](#-support)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Prerequisites

- ✅ **Docker & Docker Compose** — [Install Docker](https://docs.docker.com/get-docker/)
- **AWS CLI** — Optional, for shell automation

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
- Generates a single trusted certificate covering all LocalCloud Kit subdomains: `app-local`, `mailpit`, `pgadmin`, and `keycloak`
- Adds all four subdomains (`app-local`, `mailpit`, `pgadmin`, `keycloak`) to `/etc/hosts` (requires sudo password)

**No manual installation needed** — the script handles everything automatically. See [docs/SETUP_SCRIPTS.md](docs/SETUP_SCRIPTS.md) for individual scripts.

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

Via Traefik (TLS — trusted cert, no browser warnings):

- **Web GUI**: https://app-local.localcloudkit.com:3030
- **API Server**: https://app-local.localcloudkit.com:3030/api
- **Mailpit** (email inbox): https://mailpit.localcloudkit.com:3030
- **pgAdmin** (database UI): https://pgadmin.localcloudkit.com:3030
- **Keycloak** (identity & access): https://keycloak.localcloudkit.com:3030

Direct localhost (no TLS — always available):

- **LocalStack**: http://localhost:4566 (for AWS CLI / SDKs)
- **Mailpit UI**: http://localhost:8025 (direct, no cert required)
- **Mailpit SMTP**: localhost:1025 (point your app here to catch emails)
- **Express API**: http://localhost:3031 (bypasses Traefik)
- **PostgreSQL**: localhost:5432 (direct DB connection)
- **pgAdmin**: http://localhost:5050 (direct, no cert required)
- **Keycloak**: http://localhost:8080 (direct, no cert required)

| Service | URL | Description |
|---------|-----|--------------|
| Web GUI | https://app-local.localcloudkit.com:3030 | Main application |
| API | https://app-local.localcloudkit.com:3030/api | REST API |
| LocalStack | http://localhost:4566 | AWS emulation |
| Redis | localhost:6380 | Cache (no password) |
| Mailpit UI | https://mailpit.localcloudkit.com:3030 | Email inbox |
| Mailpit SMTP | localhost:1025 | SMTP endpoint |
| pgAdmin | https://pgadmin.localcloudkit.com:3030 | PostgreSQL UI |
| PostgreSQL | localhost:5432 | Direct DB |
| Keycloak | https://keycloak.localcloudkit.com:3030 | Identity & access |

> **Note**: Run `./scripts/setup.sh` once to add subdomains to `/etc/hosts` and generate the TLS certificate.

**📖 For detailed setup, see [GETTING_STARTED.md](GETTING_STARTED.md)**

## 📸 Screenshots

### Main Dashboard

The dashboard shows your local cloud environment at a glance:

- **Services Status Bar** — health indicators for Keycloak, LocalStack, Mailpit, PostgreSQL, and Redis. Click any service to open its management panel or docs.
- **AWS Resources** — categorized view (Storage, Database, Security & Identity) with add/destroy actions and inline inspection.

![Main Dashboard](docs/screenshots/01-main-dashboard.png)

---

### S3 Storage

#### Create S3 Bucket

Create buckets with region selection, optional versioning, encryption, and save-as-config.

![Create S3 Bucket](docs/screenshots/02-s3-bucket-configuration.png)

#### Bucket Management

Browse bucket contents, upload files, and manage objects directly from the GUI.

![Bucket Management](docs/screenshots/03-s3-bucket-management.png)

#### Empty Bucket

Empty buckets show an upload prompt. Use + Upload File to add your first object.

![Empty Bucket](docs/screenshots/06-s3-file-viewer-detail.png)

---

### DynamoDB

#### Create DynamoDB Table

Configure tables with partition key, sort key, billing mode, and Global Secondary Indexes.

![Create DynamoDB Table](docs/screenshots/05-dynamodb-table-configuration.png)

#### DynamoDB Table Data

Scan and query items, add new entries, and manage table contents from the dashboard.

![DynamoDB Table Data](docs/screenshots/04-dynamodb-table-data.png)

## 🏗️ Project Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the full project layout.

## 🎯 Features

See [CHANGELOG.md](CHANGELOG.md) for release history.

### Navigation

The header contains three primary dropdowns:

| Dropdown | Contents |
|----------|----------|
| **Resources** | AWS resources organized by category (Storage, Database, Compute, Networking, Security & Identity) — things you create and destroy in LocalStack |
| **Services** | Platform services (Keycloak, Mailpit, PostgreSQL, Redis) — always-running infrastructure managed via their own admin UIs |
| **Docs** | Reference documentation for all services and AWS resources |

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
- **Dashboard Inbox**: Click Mailpit in the status bar for a read-only recent messages preview with unread badge
- **Quick Test Button**: Send a preset test email in one click from the dashboard modal
- **Full Test Compose**: Complete compose form on the Mailpit documentation page
- **Admin UI**: Link through to the full Mailpit web interface for advanced filtering and message inspection

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

## 📌 LocalStack Version

Uses `latest` by default. Last tested: 4.14.0. See [docs/LOCALSTACK.md](docs/LOCALSTACK.md) for version pinning and the March 2026 image change.

<details>
<summary><b>Start commands</b></summary>

```bash
make start                                    # Default (latest)
make start-legacy                             # Pin to 4.14 (no auth)
make start LOCALSTACK_VERSION=4.14.0          # Any version
docker compose up --build                     # Alternative
docker compose up -d localstack api nginx     # Dev mode (GUI: cd localcloud-gui && npm run dev)
```

</details>

## 📖 Usage

### Start Services

```bash
make start
```

See [docs/LOCALSTACK.md](docs/LOCALSTACK.md) for `make start-legacy`, version pinning, and development mode.

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

- **Project Name**: Resource naming conventions
- **Environment**: dev/uat/prod isolation
- **AWS Region**: Default `us-east-1`
- **Hot Reload**: Enabled for GUI and API

Edit `docker-compose.yml` for port mappings, environment variables, resource limits, and volume mounts. Within Docker, services use internal hostnames (e.g., `localstack:4566`, `localcloud-redis:6379`).

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
make restart                       # Recommended: stop → rebuild → start (use after git pull)
docker compose restart             # Restart without rebuild
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

- **[GETTING_STARTED.md](GETTING_STARTED.md)** — Complete setup and first-time installation
- **[docs/SETUP_SCRIPTS.md](docs/SETUP_SCRIPTS.md)** — Setup and cleanup scripts
- **[docs/DOCKER.md](docs/DOCKER.md)** — Container deployment
- **[docs/CONNECT.md](docs/CONNECT.md)** — AWS SDK integration (JS, Python, Go, Java)

### Certificate & Security

- **[docs/MKCERT_SETUP.md](docs/MKCERT_SETUP.md)** — Certificate generation
- **[docs/CERTIFICATE_TROUBLESHOOTING.md](docs/CERTIFICATE_TROUBLESHOOTING.md)** — Fix certificate issues
- **[docs/LOCAL_WORKFLOW.md](docs/LOCAL_WORKFLOW.md)** — Daily development workflow

### Services

- **[docs/MAILPIT.md](docs/MAILPIT.md)** — Email testing
- **[docs/REDIS.md](docs/REDIS.md)** — Redis cache
- **[docs/SECRETS.md](docs/SECRETS.md)** — Secrets Manager
- **[docs/KEYCLOAK.md](docs/KEYCLOAK.md)** — Identity & access
- **[docs/PGADMIN.md](docs/PGADMIN.md)** — PostgreSQL UI

### Components

- **[localcloud-api/README.md](localcloud-api/README.md)** — API reference
- **[localcloud-gui/README.md](localcloud-gui/README.md)** — Frontend guide
- **[scripts/shell/README.md](scripts/shell/README.md)** — Shell automation
- **[samples/README.md](samples/README.md)** — Sample files

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

**Development setup:** `git clone` → `make start` → `make help` for commands. For GUI-only work: `make gui-start` or `cd localcloud-gui && npm run dev`.

## 📄 License

MIT License — see [LICENSE](LICENSE).

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/jonbrobinson/localcloud-kit/issues) — bug reports, feature requests
- **Discussions**: [GitHub Discussions](https://github.com/jonbrobinson/localcloud-kit/discussions) — questions, community
- **Docs**: [GETTING_STARTED.md](GETTING_STARTED.md), [docs/](docs/)

**Links:** [Repository](https://github.com/jonbrobinson/localcloud-kit) · [LocalStack](https://docs.localstack.cloud/) · [AWS](https://docs.aws.amazon.com/) · [Docker](https://docs.docker.com/)

---

**Built with ❤️ for the developer community**

## 🛠️ Troubleshooting

See **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** for:

- Connection errors (502 Bad Gateway, failed to fetch)
- Certificate and domain issues
- Docker "no space left on device" and cleanup

**Quick fixes:** `docker compose up -d` · `make restart` · `sudo ./scripts/setup-hosts.sh` · `sudo ./scripts/cleanup-hosts.sh`
