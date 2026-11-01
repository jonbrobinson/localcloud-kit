# Adminer — One Database UI for PostgreSQL, MySQL, and MariaDB

[Adminer](https://www.adminer.org/) is a lightweight, open-source (Apache-2.0 / GPL-2.0) database UI. LocalCloud Kit runs it next to pgAdmin so MySQL and MariaDB [RDS instances](./RDS.md) have a UI too, and any database is a click away.

## Access

| Interface | URL |
|-----------|-----|
| Web UI (via Traefik) | https://adminer.localcloudkit.com:3030 |
| Web UI (direct) | http://localhost:8081 (`ADMINER_PORT`) |

GUI doc page: **Services → Adminer** (`/adminer`).

## Saved Servers

The login page lists **Saved servers** above the normal form. Click one to sign in with its saved credentials:

| Server | Source |
|--------|--------|
| LocalCloud PostgreSQL | [`adminer/servers.json`](../adminer/servers.json) (bundled, always present) |
| `<id> (RDS)` | RDS instances created with **Add to Adminer**, or added later from the connection panel |

How it works: [`adminer/localcloud-servers.php`](../adminer/localcloud-servers.php) is an Adminer plugin mounted into `plugins-enabled/`. On every page load it reads `/etc/adminer/servers.json` and every JSON file in the `adminer_servers` volume. The API writes and removes those files when RDS instances are created or deleted, or when **Add to Adminer** is toggled. No sync job is involved.

Entry format (a file holds one object or an array):

```json
{
  "label": "My app MySQL",
  "engine": "MySQL",
  "driver": "server",
  "server": "my-mysql-container:3306",
  "username": "root",
  "password": "secret",
  "db": "app"
}
```

`driver` is `pgsql` for PostgreSQL and `server` for MySQL/MariaDB (Adminer's name for it). To add your own containers, edit `adminer/servers.json` and run `docker compose restart adminer`.

> Saved passwords are stored in plain text and the UI signs in without asking for them. That's fine for a local development kit, but don't run this setup on a shared host.

## Connecting Manually

Adminer runs on `lck-network`, so use container hostnames (`localhost` is the Adminer container itself):

| Database | System | Server |
|----------|--------|--------|
| Bundled PostgreSQL | PostgreSQL | `postgres:5432` (`localcloud` / `localcloud`) |
| RDS PostgreSQL | PostgreSQL | `ministack-rds-<scope>-instance-<id>:5432` |
| RDS MySQL / MariaDB | MySQL / MariaDB | `ministack-rds-<scope>-instance-<id>:3306` |

The RDS connection panel shows each instance's exact Docker host.

## Adminer vs pgAdmin

| | Adminer | pgAdmin |
|---|---|---|
| Engines | PostgreSQL, MySQL, MariaDB, SQLite, MS SQL, Oracle | PostgreSQL only |
| Footprint | Single PHP app (`adminer:6`) | Heavier Python app |
| Best for | Browsing, editing rows, SQL, import/export | Postgres-specific tooling (plans, roles, stats, ERD) |
| RDS option | **Add to Adminer** — any engine | **Register in pgAdmin** — PostgreSQL |

## Configuration

| Setting | Value |
|---------|-------|
| Image | `adminer:6` |
| Host port | `ADMINER_PORT` (default `8081`) |
| Plugins | `version-noverify` (no version check against adminer.org), `localcloud-servers.php` |
| Command | `php -S 0.0.0.0:8080` (IPv4 — the image default `[::]` fails on hosts without IPv6) |

## Make Commands

```bash
make adminer-logs   # Follow Adminer container logs
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adminer/status` | Running/stopped plus Traefik and direct URLs |
| PUT | `/api/rds/instances/:id/adminer` | `{ enabled, password? }` — add or remove an RDS instance |

## Troubleshooting

**Saved server button shows an error.** The instance may still be booting. Check its status on the dashboard. If the instance was recreated with a reused name, see [RDS troubleshooting](./RDS.md#troubleshooting).

**RDS instance missing from the list.** Open its connection panel and click **Add** next to Adminer. If the instance has no linked Secrets Manager secret, the panel asks for the master password.

**`adminer.localcloudkit.com` doesn't resolve.** Existing installs need the new hostname and certificate SAN: `sudo ./scripts/setup-hosts.sh` and `sudo ./scripts/setup-mkcert.sh`, then `make restart`.
