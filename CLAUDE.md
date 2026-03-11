# LocalCloud Kit — CLAUDE.md

This file gives Claude Code the context needed to work effectively in this repository.

## Project Overview

**LocalCloud Kit** is a free, local AWS development environment. It emulates AWS cloud services using LocalStack, managed through a Next.js web GUI and an Express.js API backend, all orchestrated via Docker Compose. No AWS account is required.

- **Version**: 0.9.0
- **License**: MIT
- **Primary URL**: https://app-local.localcloudkit.com:3030

---

## Architecture

### Services (docker-compose.yml)

| Service | Container | Image | Port | Purpose |
|---------|-----------|-------|------|---------|
| `traefik` | traefik | traefik:v3 | 3030 (HTTPS entry) | Reverse proxy / TLS termination |
| `localstack` | localstack | localstack/localstack:latest | 4566 | AWS services emulation |
| `gui` | localcloud-gui | custom (Dockerfile.gui) | 3030 (internal) | Next.js frontend |
| `api` | localcloud-api | custom (Dockerfile.api) | 3031 | Express.js backend |
| `nginx` | localstack-nginx | nginx:alpine | 80 (internal) | Internal routing |
| `redis` | localcloud-redis | redis:7-alpine | 6380 (host) | Cache service |

All services communicate over the `localstack-network` Docker bridge network.

### Key Directories

```
localcloud-api/     # Express.js API server (server.js ~1800 lines, Node 22)
localcloud-gui/     # Next.js 15 frontend (App Router, TypeScript, Tailwind)
scripts/            # Setup scripts + 30+ AWS shell automation scripts
traefik/            # Traefik reverse proxy config + TLS certs
docs/               # Extended documentation
samples/            # Sample files for S3/DynamoDB testing
```

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript 5, Tailwind CSS
- **Backend**: Express.js 4, Node.js 22, Winston logging, Socket.IO, aws-sdk v2
- **Infrastructure**: Docker Compose, Traefik v3, Nginx (alpine), Redis 7
- **AWS Emulation**: LocalStack (S3, DynamoDB, Lambda, API Gateway, IAM, Secrets Manager)

---

## AWS Services Emulated

- **S3** — bucket management, multipart uploads (up to 100MB), nested folders
- **DynamoDB** — tables, CRUD, GSI, query/scan
- **Lambda** — function management
- **API Gateway** — REST endpoint creation
- **IAM** — identity & access management
- **Secrets Manager** — secret storage, encryption, ARN management
- **Redis** — local cache (not AWS, but integrated into the GUI)

---

## Common Commands

```bash
make start          # Start all services
make stop           # Stop all services
make restart        # Restart all services
make status         # Health check all services
make logs           # Live log tailing
make reset          # Stop + clean volumes
make clean-all      # Remove all Docker resources

./scripts/setup.sh  # One-command first-time setup
```

---

## Environment Variables

See `env.example` for all variables. Key ones:

```
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localstack:4566
API_URL=https://app-local.localcloudkit.com:3030/api
CORS_ORIGIN=https://app-local.localcloudkit.com:3030
```

---

## Networking & Routing

- Traefik listens on port 3030 (HTTPS) and routes to Nginx
- Nginx fans traffic to the GUI (port 3030) and API (port 3031)
- LocalStack is reachable at `http://localstack:4566` inside Docker, `http://localhost:4566` from the host
- Redis is at `localcloud-redis:6379` inside Docker, `localhost:6380` from the host
- TLS certificates are generated with mkcert and mounted into Traefik

---

## Adding a New Service

When adding a new service (e.g., MailHog):

1. **docker-compose.yml** — add the service block with the image, ports, network, and restart policy
2. **traefik/dynamic.yml** — add a router and service entry if it needs HTTPS routing through Traefik
3. **nginx.conf** — add an upstream and location block if it routes through Nginx
4. **localcloud-api/server.js** — add API proxy/health-check endpoints as needed
5. **localcloud-gui/src/** — add GUI pages/components for managing the service
6. **docs/** — add a markdown doc describing the service and its usage
7. **Makefile** — add convenience targets if applicable
8. **README.md / CHANGELOG.md** — update to document the new service

---

## Commit Message Standards (Angular Commit Lint)

**ALL commits MUST follow the Angular Conventional Commits format. This is a hard requirement — never deviate from it.**

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code restructure with no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system, Docker, dependencies |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks (deps, tooling) |
| `revert` | Reverts a previous commit |

### Rules

- **Subject line**: 72 characters max, lowercase, no trailing period, imperative mood ("add" not "added")
- **Scope**: optional, lowercase, describes the area changed — e.g. `feat(s3)`, `fix(api)`, `docs(redis)`
- **Body**: wrap at 100 characters; explain *why*, not *what*
- **Breaking changes**: add `BREAKING CHANGE:` in the footer, or append `!` after the type: `feat(api)!:`
- **The session URL** goes in the footer on its own line (already required by other instructions)

### Examples

```
feat(mailpit): add SMTP inbox modal with unread badge

fix(secrets): resolve ARN format mismatch on delete

docs(redis): update container hostname to localcloud-redis

build(docker): pin localstack image to 3.x for stability

refactor(nav): extract shared DocPageNav component

chore(deps): upgrade next.js to 15.2
```

---

## Code Conventions

- **API routes** follow `/api/<resource>` pattern in `server.js`
- **GUI pages** use Next.js App Router under `localcloud-gui/src/app/`
- **Shell scripts** are POSIX-compatible and live in `scripts/shell/`
- **Logging** uses Winston on the backend; errors go to `logs/error.log`
- **Docker images** use `node:22-alpine` as the base for Node services
- **TypeScript** strict mode is enabled in the GUI

---

## Current Feature Branch

- Branch: `claude/add-mailhog-integration-3TJ5B`
- Task: Add MailHog email testing integration
