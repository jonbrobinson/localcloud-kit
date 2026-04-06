# AWS Emulator (MiniStack)

LocalCloud Kit uses [MiniStack](https://github.com/nahuelnucera/ministack) as its AWS emulator — a free, no-account-required, MIT-licensed alternative to LocalStack.

## Why MiniStack

LocalStack introduced mandatory account/auth token requirements in March 2026, ending its free Community Edition. MiniStack is a drop-in replacement with no account needed, compatible health endpoints, and the same `/_localstack/health` API path.

## Default Configuration

- **Default Version**: `latest` (automatically pulls newest MiniStack release)
- **Internal hostname**: `aws-emulator:4566`
- **Host port**: `4566` (configurable — see below)
- **Health endpoint**: `http://localhost:4566/_localstack/health`

## Version Pinning

```bash
# Start with latest (default)
make start

# Pin to a specific version
make start MINISTACK_VERSION=1.0.0

# Using environment variable directly
MINISTACK_VERSION=1.0.0 docker compose up

# Using a .env file
cp env.example .env
# Edit MINISTACK_VERSION in .env, then:
docker compose up
```

## Multi-Project Port Configuration

If you run multiple projects that both use MiniStack, shift the port ranges to avoid conflicts:

```bash
# Shift the main AWS emulator host port
make start EMULATOR_PORT=4567

# Shift RDS instance ports (default starts at 15432)
make start RDS_BASE_PORT=15500

# Shift ElastiCache ports (default starts at 16379)
make start ELASTICACHE_BASE_PORT=16400

# Combine overrides
make start EMULATOR_PORT=4567 RDS_BASE_PORT=15500 ELASTICACHE_BASE_PORT=16400
```

These can also be set in your `.env` file:

```
EMULATOR_PORT=4567
RDS_BASE_PORT=15500
ELASTICACHE_BASE_PORT=16400
```

## Supported AWS Services

| Service | Notes |
|---------|-------|
| S3 | Bucket management, multipart uploads up to 100MB, nested folders — GUI details in [docs/S3.md](S3.md) |
| DynamoDB | Tables, CRUD, GSI, query/scan |
| Lambda | Function management, runtime/handler config, invocation |
| API Gateway | REST endpoint creation, stage deployments |
| IAM | Roles, policies, identity management |
| Secrets Manager | Secret storage, encryption, ARN management |
| SSM Parameter Store | String, StringList, SecureString parameters |

## RDS and ElastiCache

MiniStack can spawn real sibling Docker containers for RDS and ElastiCache:

- **RDS**: Spawns actual `postgres` or `mysql` containers via the Docker socket. Ports are assigned sequentially starting from `RDS_BASE_PORT` (default: 15432).
- **ElastiCache**: Spawns actual `redis` containers via the Docker socket. Ports are assigned sequentially starting from `ELASTICACHE_BASE_PORT` (default: 16379).

The Docker socket (`/var/run/docker.sock`) is mounted into the `aws-emulator` container to enable this. This gives MiniStack full access to the host Docker daemon.

## Health Check

```bash
# Via Nginx proxy
curl -k https://app-local.localcloudkit.com:3030/aws-emulator/health

# Directly
curl http://localhost:4566/_localstack/health

# Check specific services
curl http://localhost:4566/_localstack/health | jq .
```

## Troubleshooting

**Emulator not starting:**

```bash
docker compose logs aws-emulator
docker compose restart aws-emulator
```

**AWS CLI not connecting:**

```bash
# Verify the emulator is reachable
curl http://localhost:4566/_localstack/health

# Use the correct endpoint flag
aws --endpoint-url=http://localhost:4566 s3 ls
```

**Port conflict with another project:**

```bash
# Check what is using port 4566
lsof -i :4566

# Start on an alternate port
make start EMULATOR_PORT=4567
```
