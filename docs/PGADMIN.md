# pgAdmin — PostgreSQL Database UI

pgAdmin is a web-based administration tool for PostgreSQL. In LocalCloud Kit it runs as a Docker container alongside the bundled PostgreSQL instance, and the bundled server is pre-registered — open pgAdmin and **LocalCloud Kit → LocalCloud PostgreSQL** is ready to connect, no password prompt.

## Access

| Interface | URL |
|-----------|-----|
| Web UI (via Traefik) | https://pgadmin.localcloudkit.com:3030 |
| Web UI (direct) | http://localhost:5050 |

**Default credentials:**

| Field | Value |
|-------|-------|
| Email | `admin@localcloud.dev` |
| Password | `localcloud` |

> pgAdmin is configured in `SERVER_MODE=False` with no master password required — open it and you're in.

---

## Existing Users — Required One-Time Steps

If you already have LocalCloud Kit running and are adding pgAdmin for the first time, two quick steps are needed before `make start`:

**1. Regenerate your TLS certificate** (adds `pgadmin.localcloudkit.com` to the cert's SAN list):

```bash
sudo ./scripts/setup-mkcert.sh
```

**2. Add the pgAdmin hostname to `/etc/hosts`**:

```bash
sudo ./scripts/setup-hosts.sh
```

Then restart:

```bash
make restart
```

---

## PostgreSQL Connection Details

> **pgAdmin runs inside Docker.** Whether you open it at `https://pgadmin.localcloudkit.com:3030` or `http://localhost:5050`, pgAdmin itself lives in the `localcloud-pgadmin` container on the `lck-network` Docker network, so it connects to PostgreSQL using the **Docker connection** — host `postgres`, not `localhost`. Inside the container, `localhost` points at pgAdmin itself.

### Pre-registered server

On first launch pgAdmin imports [`pgadmin/servers.json`](../pgadmin/servers.json), which registers **LocalCloud PostgreSQL** (host `postgres`, port `5432`, user/db `localcloud`) under the **LocalCloud Kit** group. The container entrypoint writes a `0600` pgpass file at startup so the connection doesn't prompt for a password.

pgAdmin only imports `servers.json` when its config database is first created. If your pgAdmin container predates this, recreate it to pick up the server:

```bash
make restart
# or just pgAdmin:
docker compose up -d --force-recreate pgadmin
```

To register another server manually: **Register → Server** → **Connection** tab, and use the *inside Docker* values below.

| Setting | Value |
|---------|-------|
| Host (inside Docker) | `postgres` |
| Host (from host machine) | `localhost` |
| Port | `5432` |
| Username | `localcloud` |
| Password | `localcloud` |
| Database | `localcloud` |

---

## Connecting from Your App

### Node.js (`pg`)

```js
import pg from "pg";

const client = new pg.Client({
  host: "localhost",      // use "postgres" inside Docker
  port: 5432,
  user: "localcloud",
  password: "localcloud",
  database: "localcloud",
});

await client.connect();
const result = await client.query("SELECT NOW()");
console.log(result.rows);
await client.end();
```

### Node.js (Prisma)

```env
# .env
DATABASE_URL="postgresql://localcloud:localcloud@localhost:5432/localcloud"
```

### Python (`psycopg2`)

```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    user="localcloud",
    password="localcloud",
    dbname="localcloud",
)
cur = conn.cursor()
cur.execute("SELECT version();")
print(cur.fetchone())
conn.close()
```

### Python (SQLAlchemy)

```python
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://localcloud:localcloud@localhost:5432/localcloud"
)
```

### Go (`pgx`)

```go
import (
    "context"
    "github.com/jackc/pgx/v5"
)

conn, err := pgx.Connect(context.Background(),
    "postgres://localcloud:localcloud@localhost:5432/localcloud")
if err != nil {
    panic(err)
}
defer conn.Close(context.Background())
```

### Java (JDBC)

```java
String url = "jdbc:postgresql://localhost:5432/localcloud";
Properties props = new Properties();
props.setProperty("user", "localcloud");
props.setProperty("password", "localcloud");
Connection conn = DriverManager.getConnection(url, props);
```

---

## Make Commands

```bash
make postgres-logs    # Tail PostgreSQL container logs
make pgadmin-logs     # Tail pgAdmin container logs
```

---

## Environment Variables

```
POSTGRES_DB=localcloud
POSTGRES_USER=localcloud
POSTGRES_PASSWORD=localcloud
PGADMIN_DEFAULT_EMAIL=admin@localcloud.dev
PGADMIN_DEFAULT_PASSWORD=localcloud
```

---

## API Endpoints

The LocalCloud API exposes two status endpoints for pgAdmin and PostgreSQL:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/postgres/status` | GET | TCP connectivity check on port 5432 |
| `/api/pgadmin/status` | GET | pgAdmin HTTP health check |

Example:

```bash
curl https://app-local.localcloudkit.com:3030/api/postgres/status
curl https://app-local.localcloudkit.com:3030/api/pgadmin/status
```
