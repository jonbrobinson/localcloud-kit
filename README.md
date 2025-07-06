# LocalCloud Kit

> **Enterprise AWS Development Tools** by CloudStack Solutions

A comprehensive LocalStack automation template with shell-based automation and a modern web GUI for resource management, all containerized with Docker.

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://github.com/jonbrobinson/localcloud-kit/releases/tag/v0.1.1)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![LocalStack](https://img.shields.io/badge/LocalStack-AWS%20Cloud-blue?style=for-the-badge&logo=aws)](https://localstack.cloud/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-Configured-yellow?style=for-the-badge&logo=eslint)](https://eslint.org/)
[![CloudStack Solutions](https://img.shields.io/badge/Powered%20by-CloudStack%20Solutions-indigo?style=for-the-badge)](https://cloudstack.solutions/)

## 🚀 Quick Start

### All-in-One Docker Setup (Recommended)

```bash
# Start everything with one command
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

### Core Automation

- **Individual Resource Creation**: Create resources one at a time or in batches
- **Shell Script Automation**: Fast, reliable command-line automation
- **Environment Management**: dev, uat, prod environments
- **Resource Templates**: Predefined common AWS setups
- **Naming Conventions**: Consistent resource naming across environments

### GUI Management

- **Web Interface**: Modern Next.js dashboard with hot reloading
- **Individual Resource Buttons**: Quick creation of S3, DynamoDB, Lambda, and API Gateway
- **Batch Resource Creation**: Create multiple resources at once with templates or individual selection
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
- **Lambda Function**: Click the ⚡ Lambda button
- **API Gateway**: Click the 🌐 API Gateway button

#### Batch Resource Creation

```bash
# Using shell scripts (standard approach)
./scripts/shell/create_resources.sh localcloud-kit dev --s3 --dynamodb

# Or use predefined templates
./scripts/shell/create_resources.sh localcloud-kit dev --template basic
```

#### Via Web GUI

- Open http://localhost:3030
- Use individual resource buttons for quick creation
- Or use the resource creation modal for batch creation with templates

### 3. Manage via GUI

- Open http://localhost:3030
- Select resource template
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

## 📊 Resource Templates

Available templates for quick resource creation via GUI or CLI:

| Template          | Description                                          | Resources                         | CLI Example           |
| ----------------- | ---------------------------------------------------- | --------------------------------- | --------------------- |
| **Basic Setup**   | S3 bucket and DynamoDB table for basic storage needs | S3, DynamoDB                      | `--template basic`    |
| **Web App**       | Full web application stack with API Gateway          | S3, DynamoDB, Lambda, API Gateway | `--template webapp`   |
| **Data Pipeline** | Data processing pipeline with S3 and DynamoDB        | S3, DynamoDB, Lambda              | `--template pipeline` |
| **Custom**        | Create resources individually or with custom config  | Any combination                   | `--s3 --dynamodb`     |

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
- **Email**: support@cloudstacksolutions.com

## 🔗 Links

- [CloudStack Solutions](https://cloudstacksolutions.com/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Contact

**LocalCloud Kit** by CloudStack Solutions

- **Email**: info@cloudstacksolutions.com
- **Website**: https://cloudstacksolutions.com/
- **GitHub**: https://github.com/jonbrobinson/localcloud-kit
- **Documentation**: [README.md](README.md)

### Support & Services

- **Enterprise Support**: Custom deployments and consulting
- **Training**: AWS and LocalStack training programs
- **Development**: Custom automation and integration services
- **Copyright**: © 2024 CloudStack Solutions

---

**Built with ❤️ by CloudStack Solutions**

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

---
