# PostHog (Optional Profile)

LocalCloud Kit includes PostHog as an **optional** platform service for local product analytics, event capture, and feature flags.

## Why optional?

PostHog requires a multi-service stack (web, worker, plugin server, ClickHouse, Kafka, Zookeeper, Redis, PostgreSQL). Keeping it optional avoids slowing down the default local workflow for teams that do not need analytics during every run.

## Isolation model

PostHog runs with **dedicated data stores** and does not reuse the primary app PostgreSQL/Redis services:

- `posthog-postgres`
- `posthog-redis`
- `posthog-clickhouse`
- `posthog-kafka`
- `posthog-zookeeper`
- `posthog-web`
- `posthog-worker`
- `posthog-plugin-server`

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

- **PostHog is stopped**: Start profile with `docker compose --profile posthog up -d`
- **Health endpoint unavailable**: Check logs with `make posthog-logs`
- **Events not appearing**: Verify API key and host match `https://posthog.localcloudkit.com:3030`
- **Domain issues**: Re-run `sudo ./scripts/setup-hosts.sh` and `./scripts/setup-mkcert.sh`
