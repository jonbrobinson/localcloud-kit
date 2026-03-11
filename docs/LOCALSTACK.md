# LocalStack Version Compatibility

LocalCloud Kit uses the latest LocalStack version by default.

## Default Configuration

- **Default Version**: `latest` (automatically pulls newest LocalStack release)
- **Last Tested**: 4.14.0 (March 11, 2026)
- **Compatibility**: Maintained and updated as LocalStack evolves

## LocalStack Image Change (March 23, 2026)

LocalStack is consolidating Community and Pro into a single image. The **Community edition remains free** — all services LocalCloud Kit uses (S3, DynamoDB, Secrets Manager, IAM) are included at no cost.

After March 23, you'll need:
- A free account at [LocalStack](https://app.localstack.cloud/sign-up)
- `LOCALSTACK_AUTH_TOKEN` set in your `.env`

To avoid this entirely, use `make start-legacy` to pin to `4.14` (no auth required for pre-consolidation versions).

## Using Specific Versions

```bash
# Start with latest (default)
make start

# Start with LocalStack 4.14 — community legacy, no auth token required
make start-legacy

# Start with any specific version
make start LOCALSTACK_VERSION=4.14.0

# Using environment variable directly
LOCALSTACK_VERSION=4.14.0 docker compose up

# Using a .env file
cp env.example .env
# Edit LOCALSTACK_VERSION in .env, then:
docker compose up
```

## Version Strategy

The `docker-compose.yml` uses `${LOCALSTACK_VERSION:-latest}` which means:

- Uses `latest` by default (automatically pulls newest LocalStack release)
- Ensures you always have the latest features and bug fixes
- Respects `LOCALSTACK_VERSION` environment variable for version pinning
- Flexibility to pin to specific versions when reproducibility is needed

**Why `latest`?**

- LocalCloud Kit is maintained to stay compatible with LocalStack updates
- Breaking changes are documented in the README when they occur
- Gives users the latest features and improvements automatically
- Can still pin to specific versions via environment variables if needed

## Troubleshooting

If you encounter compatibility issues with a new LocalStack version:

1. Pin to a known working version (e.g., `4.14.0`) using the methods above
2. Report the issue in [GitHub Issues](https://github.com/jonbrobinson/localcloud-kit/issues)
