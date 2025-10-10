# LocalCloud Kit

> **Local AWS Development Environment**

Build and test cloud apps locally—no AWS account needed. Free, fast, and with full data visibility. Perfect for devs using S3, DynamoDB, and Secrets Manager.

[![Version](https://img.shields.io/badge/version-0.5.3-blue.svg)](https://github.com/jonbrobinson/localcloud-kit/releases/tag/v0.5.3)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Cloud-blue?style=for-the-badge&logo=aws)](https://localstack.cloud/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-Configured-yellow?style=for-the-badge&logo=eslint)](https://eslint.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/jonbrobinson/localcloud-kit)

## 🚀 Quick Start

### One Command Setup (Recommended)

```bash
# Start everything with one simple command
./start-gui.sh
```

This single command will:

- ✅ Install all dependencies automatically (handled by Docker)
- ✅ Start all Docker services
- ✅ Wait for services to be ready
- ✅ Display access URLs

**Access URLs:**

- **Web GUI**: http://localhost:3030
- **API Server**: http://localhost:3030/api
- **LocalStack**: http://localhost:4566

## 📸 Screenshots

### Main Dashboard

The main dashboard provides an overview of all LocalCloud Kit services and resources.

![Main Dashboard](docs/screenshots/01-main-dashboard.png)

### S3 Bucket Management

Manage S3 buckets, upload files, and view bucket contents with syntax highlighting.

![S3 Bucket Management](docs/screenshots/02-s3-bucket-management.png)

### Alternative Docker Setup

```bash
# Start everything with Docker Compose directly
docker compose up --build
```

This will start:

- **LocalCloud Kit Web GUI**: http://localhost:3030
- **LocalCloud Kit API Server**: http://localhost:3030/api
- **LocalStack**: http://localhost:4566
- **Nginx Reverse Proxy**: http://localhost:3030

### Alternative Startup Methods

#### Using Makefile

```bash
# Start all services
make start

# Start with GUI
make gui-start
```

#### Using Start Script

```bash
# Start with the original script (for development)
./start-gui.sh
```

## 🔧 Troubleshooting

### Getting "502 Bad Gateway" or "Failed to fetch" errors?

If you're seeing connection errors when accessing the GUI, it's likely because the backend services aren't running. Here's how to fix it:

#### 1. Check if Docker services are running

```bash
# Check Docker container status
docker compose ps

# If no containers are running, start them:
docker compose up -d
```

#### 2. Verify all services are healthy

```bash
# Check if the API is responding
curl http://localhost:3030/api/health

# Check if LocalStack is running
curl http://localhost:4566/_localstack/health
```

#### 3. Common Issues and Solutions

**Issue**: "Failed to fetch Geist" font error

- **Solution**: This has been fixed in the latest version. Pull the latest changes: `git pull origin main`

**Issue**: "502 Bad Gateway" when accessing GUI

- **Solution**: The API server isn't running. Start all services: `docker compose up -d`

**Issue**: GUI loads but can't connect to LocalStack

- **Solution**: Wait a moment for LocalStack to fully start, or restart: `docker compose restart localstack`

**Issue**: Port 3030 is already in use

- **Solution**: Stop other services using the port, or change the port in `docker-compose.yml`

#### 4. Development Mode

If you want to run the GUI locally (outside Docker) for development:

```bash
# Start the backend services first
docker compose up -d localstack api nginx

# Then run the GUI locally
cd localcloud-gui
npm install
npm run dev
```

The GUI will be available at http://localhost:3000 and will connect to the API at http://localhost:3030/api.

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
├── 📄 start-gui.sh             # All-in-one startup script
└── 📄 README.md                # This file
```

## 🎯 Features

### What's New in v0.5.3

- **🎨 Connection Page Navigation**: Added "Back to Dashboard" link with arrow icon to Connection Guide page for consistent navigation across all management pages
- **🐛 TypeScript Build Error Fix**: Fixed `resource.details` possibly undefined error in ResourceList component by adding proper null checking for ARN copy functionality
- **🔧 Next.js Build Warning Fix**: Removed deprecated `devIndicators.buildActivity` option from Next.js configuration to eliminate build warnings and enable successful Docker builds

### Previous Features (v0.5.2)

- **🔑 Individual Secret Resources**: Secrets now display as individual line items instead of aggregated view for better clarity and management
- **📋 Secret ARN Display & Copy**: Full ARN shown with one-click copy functionality for easy integration
- **📝 Enhanced Secret Details**: Display description, creation date, and last changed date for each secret
- **🗑️ Secret Delete Functionality**: Support for both individual and bulk secret deletion through standard resource management interface
- **🐛 Secrets Display UX Fix**: Resolved confusing aggregated view and React duplicate key errors
- **🔧 Resource Creation Fix**: Resolved issues where creating secrets would prevent creation of other resources

### Previous Features (v0.5.1)

- **🐛 DynamoDB GSI Creation and Query Fixes**: Fixed critical issues with Global Secondary Index (GSI) creation and querying in LocalStack
  - **GSI Provisioning**: Added proper `ProvisionedThroughput` settings for GSIs when using `PROVISIONED` billing mode
  - **GSI Status Checking**: Implemented waiting mechanism to ensure GSIs become `ACTIVE` before completing table creation (prevents "Index not found" errors)
  - **GSI Query Support**: Enhanced query scripts and API to support querying specific GSIs using `indexName` parameter
  - **API Integration**: Updated API server to pass GSI names to query operations, enabling frontend GSI queries
  - **Test Script**: Created comprehensive test script (`test_gsi_creation.sh`) for validating GSI functionality

### Previous Features (v0.5.0)

- **🔄 Docker Environment Reset Commands**: New Makefile commands for easy Docker environment management
- **🐛 DynamoDB GSI Creation Fix**: Fixed 500 error when creating tables with multiple Global Secondary Indexes
- **📚 Enhanced Documentation**: Comprehensive Docker management guides and troubleshooting
- **🛡️ Safety Features**: Confirmation prompts for destructive Docker operations

### Previous Features (v0.4.0)

- **🔑 AWS Secrets Manager Integration**: Complete secrets management with secure value handling
- **📊 Dynamic Resource Display**: Smart resource list that shows/hides based on actual usage
- **🎨 Enhanced UI**: Better input styling and improved user experience
- **🔧 Improved Architecture**: Clean API routing and better error handling
- **📝 Comprehensive Documentation**: Updated guides and examples

### Core Automation

- **Individual Resource Creation**: Create resources one at a time or in batches
- **Shell Script Automation**: Fast, reliable command-line automation
- **Environment Management**: dev, uat, prod environments
- **Resource Templates**: Predefined common AWS setups
- **Naming Conventions**: Consistent resource naming across environments

### GUI Management

- **Web Interface**: Modern Next.js dashboard with hot reloading
- **Individual Resource Buttons**: Quick creation of S3, DynamoDB, and Secrets Manager
- **Batch Resource Creation**: Create multiple resources at once with individual selection
- **Real-time Monitoring**: Live status and resource tracking
- **Log Viewer**: Real-time log monitoring with filtering

### Containerization

- **Docker Compose**: Single command startup
- **Hot Reloading**: Development-friendly with live code updates
- **Reverse Proxy**: Clean URL routing with Nginx
- **Network Isolation**: Secure container networking

### Enterprise Features

- **Network Accessible**: Team collaboration ready
- **Professional Branding**: CloudStack Solutions design
- **Advanced Mode**: Detailed resource management
- **Universal Access**: Shell scripts work on any system

## 🛠️ Prerequisites

- **Docker & Docker Compose**: For containerized services
- **AWS CLI**: For shell automation (optional, for local development)

## 📖 Usage

### 1. Start All Services

```bash
# Using Docker Compose (recommended)
docker compose up --build

# Or using Makefile
make start
```

### 2. Create Resources

#### Individual Resource Creation (Recommended)

Use the web GUI to create resources individually:

- **S3 Bucket**: Click the 🪣 S3 button
- **DynamoDB Table**: Click the 🗄️ DynamoDB button
- **Secrets Manager**: Click the 🔑 Secrets button

#### Batch Resource Creation

```bash
# Using shell scripts (standard approach)
./scripts/shell/create_resources.sh localcloud-kit dev --s3 --dynamodb
```

#### Via Web GUI

- Open http://localhost:3030
- Use individual resource buttons for quick creation
- Or use the resource creation modal for batch creation

### 3. Manage via GUI

- Open http://localhost:3030
- Create/destroy resources with one click

### 4. Test File Viewer

Upload sample files from the `samples/` directory to test the file viewer functionality:

```bash
# Upload sample files to test syntax highlighting
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.py s3://your-bucket-name/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.js s3://your-bucket-name/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.json s3://your-bucket-name/
aws --endpoint-url=http://localhost:4566 s3 cp samples/sample.docx s3://your-bucket-name/
```

Then view the files in the GUI to see syntax highlighting and document formatting in action.

## 🎨 GUI Features

### Web Interface (Next.js)

- **Real-time Dashboard**: Live LocalStack status
- **Resource Management**: Create/destroy with templates
- **Log Viewer**: Real-time logs with filtering
- **Network Accessible**: Team collaboration
- **Hot Reloading**: Instant code updates during development

## 🧊 Redis Cache Management

LocalCloud Kit now includes full Redis cache support for local development and testing.

### Features

- **Standalone Redis**: Runs as a container alongside LocalStack and the API
- **Full CRUD**: Set, get, delete, and flush cache keys
- **List All Keys**: View all keys and values in the cache
- **JSON-Aware**: Pretty-prints JSON values in the GUI
- **GUI Management**: Dedicated `/cache` page for full-screen cache management
- **Shell Scripts**: Automation scripts for cache operations
- **API Endpoints**: RESTful endpoints for cache management

### Docker Setup

- Redis runs as a service in `docker-compose.yml` (port 6380 on host, 6379 in container)
- No password by default (for local use)

### API Endpoints

- `GET /api/cache/status` — Check Redis status
- `POST /api/cache/set` — Set a key-value pair
- `GET /api/cache/get?key=...` — Get value by key
- `DELETE /api/cache/del` — Delete a key
- `POST /api/cache/flush` — Flush all keys
- `GET /api/cache/keys` — List all keys and values

### Shell Scripts

Located in `scripts/shell/`:

- `cache_set.sh`, `cache_get.sh`, `cache_del.sh`, `cache_flush.sh`, `list_cache.sh`, `list_cache_keys.sh`

### GUI Features

- **Dashboard**: Redis cache appears as a resource
- **Full-Page Management**: `/cache` page for all cache operations
- **Set/Get/Delete**: Action-based forms for each operation
- **Flush/Refresh**: Utility actions for cache
- **All Keys View**: See all keys/values, with pretty JSON formatting
- **Connection Info**: Shows host/port for external tools
- **Live Feedback**: Results and status are clearly displayed

### Usage Example

1. Start all services: `docker compose up --build`
2. Open the GUI: http://localhost:3030
3. Click "Redis Cache" in the dashboard or resource list
4. Use the full-page interface to set, get, delete, flush, and view all cache keys
5. Use the connection info to connect with external Redis tools (host: `localhost`, port: `6380`)

## 🔑 AWS Secrets Manager Integration

LocalCloud Kit now includes comprehensive AWS Secrets Manager support for secure secret management in local development and testing.

### Features

- **Complete CRUD Operations**: Create, read, update, and delete secrets
- **Secure Value Handling**: Mask/reveal secret values with toggle functionality
- **Rich Metadata Support**: Descriptions, tags, and KMS key encryption
- **Dynamic Resource Display**: Shows secrets count in resources list
- **Conditional Visibility**: Secrets resource only appears when secrets exist
- **GUI Management**: Dedicated Secrets Manager interface with full-screen management
- **Shell Scripts**: Automation scripts for all secrets operations
- **API Endpoints**: RESTful endpoints for programmatic access
- **Error Handling**: Comprehensive error handling and user feedback

### Docker Setup

- Secrets Manager runs as part of LocalStack services (enabled in `docker-compose.yml`)
- No additional configuration required - works out of the box

### API Endpoints

- `GET /api/secrets` — List all secrets
- `POST /api/secrets` — Create a new secret
- `GET /api/secrets/[secretName]` — Get secret details and value
- `PUT /api/secrets/[secretName]` — Update secret value and metadata
- `DELETE /api/secrets/[secretName]` — Delete a secret

### Shell Scripts

Located in `scripts/shell/`:

- `create_secret.sh` — Create a new secret with optional metadata
- `delete_secret.sh` — Delete a secret (with force delete option)
- `list_secrets.sh` — List all secrets with filtering
- `get_secret.sh` — Retrieve secret details and value

### GUI Features

- **Dashboard Integration**: Secrets Manager appears as a resource with dynamic count
- **Full-Screen Management**: Complete secrets management interface
- **Create/Edit Forms**: Rich forms with validation for secret creation and editing
- **Mask/Reveal Toggle**: Secure viewing of secret values
- **Tag Management**: Add, edit, and remove tags from secrets
- **KMS Encryption**: Support for KMS key encryption
- **Bulk Operations**: Delete multiple secrets with confirmation
- **Real-time Updates**: Live updates when secrets are modified

### Usage Example

1. Start all services: `docker compose up --build`
2. Open the GUI: http://localhost:3030
3. Click the "🔑 Secrets" button in the Resources section
4. Use the full-screen interface to:
   - Create new secrets with name, value, description, and tags
   - View existing secrets (values are masked by default)
   - Reveal/hide secret values with the eye icon
   - Edit secret values and metadata
   - Delete secrets with confirmation
   - Manage tags and KMS encryption

### Shell Script Examples

```bash
# Create a secret
./scripts/shell/create_secret.sh "my-secret" "secret-value" "My secret description" "Environment=dev,Team=backend" ""

# List all secrets
./scripts/shell/list_secrets.sh

# Get a specific secret
./scripts/shell/get_secret.sh "my-secret"

# Delete a secret
./scripts/shell/delete_secret.sh "my-secret" false
```

---

## 🔧 Configuration

### Docker Environment

The application runs entirely in containers with the following setup:

- **GUI**: Next.js app with hot reloading
- **API**: Express.js server with hot reloading
- **LocalStack**: AWS services emulation
- **Nginx**: Reverse proxy for clean routing

### URL Structure

- **Main Application**: http://localhost:3030
- **API Endpoints**: http://localhost:3030/api/\*
- **Health Check**: http://localhost:3030/health
- **LocalStack Health**: http://localhost:3030/localstack/health

> **Note**: The URLs above are for accessing the application from your host machine. Within the container network, services communicate using internal hostnames (e.g., `localstack:4566` for the API server to reach LocalStack).

### Project Configuration

- **Project Name**: Used for resource naming
- **Environment**: dev/uat/prod for isolation
- **AWS Region**: Target region for resources

## 🚀 Quick Commands

### Development

```bash
# Start all services
docker compose up --build

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Restart specific service
docker compose restart localcloud-gui
```

### Docker Environment Management

LocalCloud Kit includes powerful commands for managing your Docker environment:

```bash
# Reset Docker environment (stop services + clean volumes)
make reset

# Full environment reset (clean resources + stop services + clean all Docker resources)
make reset-env

# Clean Docker volumes only (removes all persistent data)
make clean-volumes

# Clean all Docker resources (containers, images, volumes)
make clean-all
```

#### When to Use Each Command

- **`make reset`** - Most common reset. Stops services and cleans volumes, keeping images for faster restarts
- **`make reset-env`** - Complete reset when you want to start completely fresh
- **`make clean-volumes`** - When you want to clear all data but keep services running
- **`make clean-all`** - Nuclear option - removes everything Docker-related

> **⚠️ Safety Note**: All destructive commands include confirmation prompts to prevent accidental data loss.

### Production

```bash
# Start with production settings
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker compose up -d --scale localcloud-api=3
```

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- **[Docker Guide](DOCKER.md)** - Container deployment and management
- **[Connection Guide](CONNECT.md)** - AWS SDK integration examples
- **[API Documentation](localcloud-api/README.md)** - Backend API reference
- **[GUI Documentation](localcloud-gui/README.md)** - Frontend application guide

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/jonbrobinson/localcloud-kit.git
cd localcloud-kit

# Start development environment
docker compose up --build

# Run tests
make test

# Format code
make format
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

### Shell Script Permission Denied (e.g., 'Permission denied' on create_single_resource.sh)

If you see errors like:

```
/bin/sh: ./create_single_resource.sh: Permission denied
```

This means the shell script does not have execute permissions inside the container. To fix:

1. **Grant execute permissions to all shell scripts:**
   ```sh
   chmod +x scripts/shell/*.sh
   git add scripts/shell/*.sh
   git commit -m "chore(scripts): ensure all shell scripts are executable"
   git push
   ```
2. **Rebuild your Docker containers:**
   ```sh
   docker compose build --no-cache
   docker compose up
   ```

> **Note:**
>
> - Git tracks the executable bit. If you commit scripts with `+x` permissions, they will retain those permissions across branches and repositories.
> - If you copy files outside of git (e.g., via zip or some editors), permissions may not be preserved.
> - On Windows, the executable bit may not be respected, but on macOS and Linux it is.

If you still see permission errors, you can also run this inside the running container:

```sh
docker exec localcloud-api chmod +x /app/scripts/shell/*.sh
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
