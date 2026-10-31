# RDS — Relational Databases via MiniStack

LocalCloud Kit emulates Amazon RDS through [MiniStack](https://github.com/nahuelnucera/ministack). Every DB instance is a **real database container** — PostgreSQL, MySQL, or MariaDB — created and managed through the normal RDS API, so apps use the same SDK calls and drivers they use against AWS.

SDK examples (TypeScript, Node.js, Python, CLI) and Laravel / Prisma config snippets live on the **`/rds`** doc page in the GUI.

## Supported Engines

| Engine | `--engine` | Versions | Container port | pgAdmin |
|--------|-----------|----------|----------------|---------|
| PostgreSQL | `postgres` | 17, 16, 15, 14 | 5432 | Yes |
| MySQL | `mysql` | 8.4, 8.0 | 3306 | — |
| MariaDB | `mariadb` | 11.4, 10.11, 10.6 | 3306 | — |

Aurora clusters and snapshots work through the MiniStack API but have no GUI yet.

## Creating an Instance (GUI)

**Resources → RDS** (or **Add instance** on the RDS panel) opens the create form:

| Field | Notes |
|-------|-------|
| Engine / version | Versions are limited to ones verified with MiniStack |
| Instance class | Recorded on the instance; it doesn't limit resources locally |
| DB instance identifier | Lowercase letters, numbers, hyphens; starts with a letter |
| Master username / password | Password generator, show and copy buttons. Rules match RDS: 8–41 characters, no `/ " @` or spaces |
| Initial database | Optional (`--db-name`) |
| **Register in pgAdmin** | PostgreSQL only, on by default. Adds the instance to pgAdmin under **LocalCloud RDS** with the password saved |
| **Store credentials in Secrets Manager** | Creates `rds/<id>/master` (JSON: `engine, host, port, username, password, dbname, dockerHost, dockerPort`) |
| Save as config | Saved per project; **the password is never saved** |

The instance shows **Creating** while MiniStack pulls the image and starts the database (the first instance of an engine can take a minute); the dashboard refreshes until it is **Active**.

## Connecting

| From | Host | Port |
|------|------|------|
| Your machine | `localhost` | `Endpoint.Port` — assigned from `RDS_BASE_PORT` (15432) upward |
| Containers on `lck-network` | `ministack-rds-<scope>-instance-<id>` | 5432 / 3306 |

The plug icon on an RDS row opens the connection panel: both hosts, connection strings, env vars, start / stop / reboot, and pgAdmin / Secrets Manager status.

## pgAdmin Integration

1. The API writes `<id>.json` (a one-server `servers.json`) and `<id>.pgpass` into the `pgadmin_rds_import` volume.
2. [`pgadmin/rds-sync.sh`](../pgadmin/rds-sync.sh) runs inside the pgAdmin container. Every 5 seconds it loads new or changed entries with `setup.py load-servers` and rebuilds `/var/lib/pgadmin/rds.pgpass`.
3. When the files are removed — the instance was deleted or registration was turned off — the script removes the server from pgAdmin.

pgAdmin connects over `lck-network` using the instance's container name. Registration can be toggled later from the connection panel; turning it on again uses the linked secret's password when there is one, and otherwise asks for it.

## Persistence & Cleanup

| Setting | Default | Effect |
|---------|---------|--------|
| `RDS_PERSIST` | `1` | Instance data lives in `ministack-rds-*-data` Docker volumes |
| `MINISTACK_PERSIST_STATE` | `1` | Instance records survive emulator restarts (saved to the `aws_emulator_data` volume) |

RDS containers run **outside** Docker Compose:

| Command | Effect |
|---------|--------|
| `make rds-list` | List RDS containers and data volumes |
| `make rds-prune` | Remove data volumes of deleted instances (in-use volumes are kept) |
| `make rds-clean` | Remove all RDS containers and data |
| `make reset` / `make clean-all` | Include `rds-clean` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rds/options` | Engines, versions, instance classes, deleted identifiers |
| GET | `/api/rds/instances` | List instances (prunes stale pgAdmin registrations) |
| GET | `/api/rds/instances/:id` | Describe one instance with connection details |
| POST | `/api/rds/instances` | Create — body: `projectName, engine, engineVersion, dbInstanceIdentifier, masterUsername, masterPassword, dbName?, instanceClass?, registerPgAdmin?, storeInSecretsManager?` |
| POST | `/api/rds/instances/:id/:action` | `start`, `stop`, or `reboot` |
| PUT | `/api/rds/instances/:id/pgadmin` | `{ enabled, password? }` — register in or remove from pgAdmin |
| DELETE | `/api/rds/instances/:id` | Delete the instance, its linked secret, and its pgAdmin registration |

RDS also works through the shared resource endpoints (`/api/resources/create-single` with `resourceType: "rds"` and `rdsConfig`, `/api/resources/destroy` with `rds-<id>` ids). Instances carry `lck:project`, `lck:pgadmin`, and `lck:secret` tags.

## Troubleshooting

**Instance stays in Creating / shows Error** — check `docker compose logs aws-emulator`. Common causes: the image can't be pulled, or a host port in the `RDS_BASE_PORT` range is taken (shift it with `make start RDS_BASE_PORT=15500`).

**New instance rejects the password I just set** — an earlier instance with the same identifier was deleted and MiniStack kept its data volume, so the database started with the old data and old password. The create form warns about reused names. Delete the instance, run `make rds-prune`, and create it again, or use a new name.

**Instance doesn't appear in pgAdmin** — run `docker compose logs pgadmin | grep rds-sync`. If pgAdmin's container was created before this feature, recreate it: `docker compose up -d --force-recreate pgadmin`.

**Stop doesn't free resources** — MiniStack's `StopDBInstance` only changes the status; the container keeps running. Delete the instance to remove it.
