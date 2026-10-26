# Langfuse (Optional Profile)

LocalCloud Kit includes [Langfuse](https://langfuse.com) as an **optional** platform service for LLM observability: trace model calls and agent steps, version prompts, and run evaluations against your local app — no hosted account, no data leaving your machine.

GUI doc page: [`/langfuse`](https://app-local.localcloudkit.com:3030/langfuse) (connection details, SDK examples, live status).

## Why optional?

Langfuse v4 is a web + worker pair backed by Postgres, ClickHouse, Redis, and S3-compatible storage. That's six containers and roughly 2–4 GB of RAM, so it stays out of the default `make start` and runs only when you ask for it.

## Isolation model

Langfuse runs with **dedicated data stores** and does not reuse the primary app services:

| Container | Image | Role |
|---|---|---|
| `langfuse-web` | `langfuse/langfuse:4` | UI + public API (runs Postgres and ClickHouse migrations on boot) |
| `langfuse-worker` | `langfuse/langfuse-worker:4` | Async ingestion — reads events from S3, writes to ClickHouse |
| `langfuse-postgres` | `postgres:17-alpine` | Transactional data (users, projects, prompts, API keys) |
| `langfuse-clickhouse` | `clickhouse/clickhouse-server:25.12` | Traces, observations, scores |
| `langfuse-redis` | `redis:7.4-alpine` | BullMQ queues (`noeviction`, password `langfuse`) |
| `langfuse-minio` | `cgr.dev/chainguard/minio` | Raw event + media blobs (`langfuse` bucket) |

Why not the kit's shared services?

- **Redis** — Langfuse queue keys would flood the Cache viewer, and BullMQ requires `noeviction`.
- **PostgreSQL** — keeps Langfuse's 80+ Prisma tables out of your app database and pgAdmin.
- **S3 (AWS emulator)** — MiniStack keeps S3 in memory by default (`S3_PERSIST=0`); an emulator restart would delete the bucket Langfuse ingests through.

Invite and password-reset emails **are** wired to the shared **Mailpit** (`smtp://mailpit:1025`).

## Start / Stop

```bash
# Start everything plus the Langfuse profile (waits for the health check)
make start-langfuse

# Stop only Langfuse — data volumes are kept
make stop-langfuse

# Follow web + worker logs
make langfuse-logs

# Or directly with the compose profile
docker compose --profile langfuse up -d
docker compose --profile langfuse down
```

`make stop`, `make clean-volumes`, and `make clean-all` include the Langfuse profile.

The first boot takes a minute or two while migrations run; the status badge shows **Starting** until `/api/public/health` returns `OK`.

## Access & credentials

All of these are created automatically on first start (headless initialization). They are **local-only** — never reuse them outside this kit.

> **Network exposure:** like the kit's PostgreSQL, Keycloak, and pgAdmin, Langfuse's host ports (`3100` web/API, `9190` MinIO) listen on all interfaces, so other machines on your network can reach them with these default credentials. That's fine on a trusted dev machine; on shared or public Wi-Fi, stop the profile (`make stop-langfuse`) or bind the ports to `127.0.0.1` in `docker-compose.yml` (e.g. `"127.0.0.1:${LANGFUSE_PORT:-3100}:3000"`).

| Setting | Value |
|---|---|
| UI (Traefik) | `https://langfuse.localcloudkit.com:3030` |
| UI / API (direct) | `http://localhost:3100` |
| SDK base URL from containers | `http://langfuse-web:3000` |
| OTLP traces endpoint | `http://localhost:3100/api/public/otel/v1/traces` |
| Login | `admin@localcloud.dev` / `localcloud` |
| Organization / project | `LocalCloud Kit` / `localcloud-dev` |
| Public key | `pk-lf-localcloud` |
| Secret key | `sk-lf-localcloud` |
| LocalCloud Kit status endpoint | `GET /api/langfuse/status` |

## Email (Mailpit)

Langfuse sends email through the shared Mailpit (`SMTP_CONNECTION_URL=smtp://mailpit:1025`, from `langfuse@localcloud.dev`), but **only when an action triggers it — nothing is sent at startup.** The admin user and API keys are written straight to the database by headless init, so there is no welcome or "account created" email.

Emails you can trigger locally:

| Action | Where | Email |
|---|---|---|
| Invite a teammate | Organization → Settings → Members → **Add new member** | "… invited you to join the "LocalCloud Kit" organization" (sign-up link for new users) |
| Reset a password | Sign-in page → **Forgot password?** | "Your Langfuse password reset code" |
| @-mention someone in a comment | Any trace/observation comment | Mention notification |
| Batch export finishes | Project → Exports | Download link |

Open the inbox at `http://localhost:8025` (or the **Mailpit** entry in the Services menu). Links in these emails point at `NEXTAUTH_URL` (`https://langfuse.localcloudkit.com:3030`).

## Connecting your app

```bash
LANGFUSE_BASE_URL=http://localhost:3100
LANGFUSE_PUBLIC_KEY=pk-lf-localcloud
LANGFUSE_SECRET_KEY=sk-lf-localcloud
```

From another container on `lck-network`, use `LANGFUSE_BASE_URL=http://langfuse-web:3000`. Tracing works the same, but **media uploads** (images/audio attached to traces) use presigned URLs signed for `http://localhost:9190`, which only resolve from the host.

**TypeScript install:** `@langfuse/otel` 6.x targets OpenTelemetry JS 2.x, and the newest OpenTelemetry SDK (0.300+, core 3.x) is not compatible yet — npm either refuses with a peer conflict or installs an exporter that crashes on import. Pin the OpenTelemetry packages until Langfuse catches up:

```bash
npm install @langfuse/tracing @langfuse/otel \
  @opentelemetry/sdk-node@^0.223.0 @opentelemetry/exporter-trace-otlp-http@^0.223.0
```

Langfuse v4 ingests traces over **OpenTelemetry** only. The legacy `/api/public/ingestion` endpoint rejects `trace-create` events, so use the current SDKs (`@langfuse/tracing` + `@langfuse/otel` for TypeScript, `langfuse` for Python) or any OTLP/HTTP exporter. TypeScript, Python, and cURL examples live on the [`/langfuse`](https://app-local.localcloudkit.com:3030/langfuse) GUI page.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `LANGFUSE_VERSION` | `4` | Image tag for `langfuse/langfuse` and `langfuse/langfuse-worker` |
| `LANGFUSE_PORT` | `3100` | Host port for the web/API container |
| `LANGFUSE_S3_PORT` | `9190` | Host port for MinIO; presigned media uploads from host SDKs use it |
| `LANGFUSE_MINIO_IMAGE` | `cgr.dev/chainguard/minio:latest` | S3 server image (MinIO no longer publishes to Docker Hub) |
| `LANGFUSE_INTERNAL_URL` | `http://langfuse-web:3000` | Where the LocalCloud Kit API checks Langfuse health |

```bash
make start-langfuse LANGFUSE_PORT=3101 LANGFUSE_S3_PORT=9191
```

Port overrides flow through to the GUI: the API receives `LANGFUSE_PORT` and `APP_PORT`, and `/api/langfuse/status` returns the matching `baseUrl` and `uiUrl`, so the `/langfuse` page, its code examples, the Inspect panel, and the Services menu all show the URLs you actually started with. Setting them in `.env` works too.

## Troubleshooting

- **Status stays "Starting"** — migrations are still running or a store is unhealthy. Check `make langfuse-logs` and `docker compose --profile langfuse ps`.
- **`langfuse-minio` fails to pull** — your network may block `cgr.dev`. Point `LANGFUSE_MINIO_IMAGE` at another MinIO build that ships `mc` (for example a community fork on Docker Hub).
- **`https://langfuse.localcloudkit.com:3030` doesn't resolve or shows a cert warning** — re-run `./scripts/setup.sh`. It adds the hostname to `/etc/hosts` and regenerates the certificate when the `langfuse` SAN is missing.
- **Traces sent but not visible** — the worker processes events asynchronously; give it a few seconds, then check `langfuse-worker` logs.
- **Langfuse is gone after `make restart`** — `make stop`/`make restart` stop every profile, and `make start` only brings back the core stack. Run `make start-langfuse` again; your data is kept in the `langfuse_*` volumes.
- **Reset Langfuse data only** — `docker compose --profile langfuse down` then remove the `langfuse_*` volumes (`docker volume ls | grep langfuse`).
