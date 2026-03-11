# LocalCloud Kit — Agent Context

This file provides AI coding agents with project-specific context and instructions for working in this repository.

## Project Overview

**LocalCloud Kit** is a free, local AWS development environment. It emulates AWS cloud services using LocalStack, managed through a Next.js web GUI and an Express.js API backend, all orchestrated via Docker Compose. No AWS account is required.

- **Version**: 0.11.1
- **License**: MIT
- **Primary URL**: https://app-local.localcloudkit.com:3030

---

## Build & Run Commands

```bash
make start          # Start all services (Docker Compose)
make stop           # Stop all services
make restart        # Restart all services
make status         # Health check all services
make logs           # Live log tailing
make reset          # Stop + clean volumes
make clean-all      # Remove all Docker resources

./scripts/setup.sh  # One-command first-time setup (mkcert, hosts, TLS)
```

**First-time setup**: Run `./scripts/setup.sh` before `make start` to configure mkcert, hosts, and TLS certificates.

---

## Architecture

### Services (docker-compose.yml)

| Service   | Container | Port | Purpose |
|-----------|-----------|------|---------|
| traefik   | traefik   | 3030 | Reverse proxy / TLS |
| localstack| localstack| 4566 | AWS emulation |
| gui       | localcloud-gui | 3030 (internal) | Next.js frontend |
| api       | localcloud-api | 3031 | Express.js backend |
| nginx     | localstack-nginx | 80 (internal) | Internal routing |
| redis     | localcloud-redis | 6380 (host) | Cache |

### Key Directories

```
localcloud-api/     # Express.js API (server.js, Node 22)
localcloud-gui/     # Next.js 15 frontend (App Router, TypeScript, Tailwind)
scripts/            # Setup scripts + AWS shell automation
traefik/            # Traefik config + TLS certs
docs/               # Extended documentation
samples/            # Sample files for S3/DynamoDB testing
```

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript 5, Tailwind CSS, @iconify/react
- **Backend**: Express.js 4, Node.js 22, Winston, Socket.IO, aws-sdk v2
- **Infrastructure**: Docker Compose, Traefik v3, Nginx, Redis 7

---

## Code Conventions

- **API routes**: `/api/<resource>` pattern in `server.js` or `routes/`
- **GUI pages**: Next.js App Router under `localcloud-gui/src/app/`
- **Shell scripts**: POSIX-compatible, in `scripts/shell/`
- **Logging**: Winston on backend; errors → `logs/error.log`
- **Docker images**: `node:22-alpine` base for Node services
- **TypeScript**: Strict mode enabled in GUI

---

## Commit Message Standards (Required)

**All commits MUST use Angular Conventional Commits format.**

```
<type>(<scope>): <subject>

[optional body]
```

**Types**: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`

**Rules**: Subject lowercase, imperative mood, no trailing period. Scope optional (e.g. `feat(s3)`, `fix(api)`).

**Examples**:
- `feat(mailpit): add SMTP inbox modal with unread badge`
- `fix(secrets): resolve ARN format mismatch on delete`
- `docs(redis): update container hostname to localcloud-redis`

---

## Changelog Standards

- **Update CHANGELOG.md once per PR** — not per commit
- **Format**: Keep a Changelog (https://keepachangelog.com)
- **Entries**: Under `## [Unreleased]`; use `### Added`, `### Changed`, `### Fixed`, `### Removed`
- **Bold the component/scope** for traceability: `- **DocPageNav**: ...`
- **User-facing language** — describe what changed for users, not implementation

---

## Adding a New Service

When adding a new service (e.g., MailHog):

1. **docker-compose.yml** — service block, image, ports, network, restart policy
2. **traefik/dynamic.yml** — router and service entry if HTTPS routing needed
3. **nginx.conf** — upstream and location block if routing through Nginx
4. **localcloud-api** — API proxy/health-check endpoints
5. **localcloud-gui/src/** — GUI pages/components for the service
6. **docs/** — markdown doc for the service
7. **Makefile** — convenience targets if applicable
8. **README.md / CHANGELOG.md** — document the new service

---

## Dashboard UI Architecture

- **Platform Services** (Keycloak, Mailpit, PostgreSQL, Redis): Managed via their own admin UIs; not destroyable from dashboard
- **AWS Resources** (S3, DynamoDB, Secrets Manager, etc.): Managed via dashboard modals; destroyable per project
- **Resources dropdown**: AWS resources grouped by category (Storage, Database, Compute, Networking, Security & Identity)
- **Services dropdown**: Platform services only, alphabetically
- **Docs dropdown**: Documentation pages grouped by Infrastructure / AWS Resources / Platform Services

---

## Environment Variables

See `env.example`. Key ones:

```
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localstack:4566
API_URL=https://app-local.localcloudkit.com:3030/api
CORS_ORIGIN=https://app-local.localcloudkit.com:3030
```

---

## Attribution

- **Never** include `Co-Authored-By: Claude` or any Claude/Anthropic attribution in commits or PRs
- **Never** include the `🤖 Generated with [Claude Code]` line in output
