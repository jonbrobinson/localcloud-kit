# PostHog (Optional Profile)

LocalCloud Kit includes PostHog as an **optional** platform service for local product analytics, event capture, and feature flags.

## Why optional?

PostHog requires a multi-service stack (web, worker, plugin server, ClickHouse, Kafka, Redis, PostgreSQL). Keeping it optional avoids slowing down the default local workflow for teams that do not need analytics during every run.

## Isolation model

PostHog runs with **dedicated data stores** and does not reuse the primary app PostgreSQL/Redis services:

- `posthog-postgres`
- `posthog-redis`
- `posthog-clickhouse` (ClickHouse 25.x)
- `posthog-kafka` (Redpanda v25.1.9, Kafka-compatible; ZooKeeper-free)
- `posthog-kafka-init` (one-shot topic provisioner; exits after creating required topics)
- `posthog-web`
- `posthog-worker`

This keeps PostHog analytics data isolated from application data.

## Start / Stop

```bash
# Start LocalCloud Kit (default stack)
make start

# Start with PostHog profile enabled
make start-posthog

# Or directly with compose profile
docker compose --profile posthog up -d

# Stop PostHog profile containers
docker compose --profile posthog down
```

## Access URLs

- **PostHog UI (Traefik)**: `https://posthog.localcloudkit.com:3030`
- **API health**: `https://posthog.localcloudkit.com:3030/_health`
- **LocalCloud Kit API status endpoint**: `GET /api/posthog/status`

## Integration examples

### TypeScript (Browser)

```ts
import posthog from "posthog-js";

posthog.init("<project_api_key>", {
  api_host: "https://posthog.localcloudkit.com:3030",
});

posthog.capture("local_event", { source: "browser" });
```

### Node.js (Server)

```ts
import { PostHog } from "posthog-node";

const posthog = new PostHog("<project_api_key>", {
  host: "https://posthog.localcloudkit.com:3030",
});

await posthog.capture({
  distinctId: "local-user-1",
  event: "server_event",
  properties: { source: "node" },
});

await posthog.shutdown();
```

### Python

```python
from posthog import Posthog

client = Posthog(
    project_api_key="<project_api_key>",
    host="https://posthog.localcloudkit.com:3030",
)
client.capture("local-user-1", "python_event", {"source": "python"})
client.flush()
```

### CLI (cURL)

```bash
curl -s -X POST "https://posthog.localcloudkit.com:3030/i/v0/e/" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "<project_api_key>",
    "event": "local_cli_event",
    "distinct_id": "local-cli-user"
  }'
```

## Verification checklist

1. Dashboard service badge for PostHog is **Running**
2. PostHog UI opens successfully
3. Test events appear in the PostHog events stream
4. Feature flags evaluate correctly in local requests

## Troubleshooting

- **PostHog is stopped**: Start with `docker compose up -d posthog-web posthog-worker` (and all dependencies)
- **Health endpoint unavailable**: Check logs with `make posthog-logs`
- **Events not appearing**: Verify API key and host match `https://posthog.localcloudkit.com:3030`
- **Domain issues**: Re-run `sudo ./scripts/setup-hosts.sh` and `./scripts/setup-mkcert.sh`
- **ClickHouse migration fails with "TTL expression result column should have DateTime or Date type, but has DateTime64"**: PostHog’s document_embeddings migration needs DateTime64-in-TTL (25.x+). We pin to `clickhouse/clickhouse-server:25.10`.
- **ClickHouse migration fails with "Unknown table expression identifier ‘system.crash_log’"**: PostHog creates a view on `system.crash_log`; ClickHouse 26.x removed or renamed it. Use 25.10 (or another 25.x) instead of `latest`. We pin to 25.10 for compatibility.
- **ClickHouse or Kafka startup failures after an upgrade**: Wipe PostHog volumes to force a clean init:
  ```bash
  docker compose down posthog-web posthog-worker posthog-clickhouse posthog-kafka posthog-kafka-init posthog-postgres posthog-redis
  docker volume rm localcloud-kit_posthog_clickhouse_data localcloud-kit_posthog_kafka_data localcloud-kit_posthog_postgres_data localcloud-kit_posthog_redis_data
  docker compose up -d
  ```
