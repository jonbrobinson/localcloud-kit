# Troubleshooting

## Connection Errors — "502 Bad Gateway" or "Failed to fetch"

If you're seeing connection errors when accessing the GUI:

**Check if services are running:**

```bash
docker compose ps                    # Check container status
docker compose up -d                 # Start if not running
```

**Verify services are healthy:**

```bash
curl -k https://app-local.localcloudkit.com:3030/api/health           # Check API
curl http://localhost:4566/_localstack/health   # Check AWS Emulator
```

**Common solutions:**

| Symptom | Solution |
|---------|----------|
| 502 Bad Gateway | API server isn't running → `docker compose up -d` |
| Can't connect to AWS Emulator | Wait for startup or restart → `docker compose restart aws-emulator` |
| Certificate errors / "Not Secure" | Run `./scripts/setup-mkcert.sh` to regenerate |
| Subdomain cert not trusted (Mailpit, pgAdmin, Keycloak) | See [Certificate Troubleshooting](CERTIFICATE_TROUBLESHOOTING.md) |
| Domain not resolving | Run `sudo ./scripts/setup-hosts.sh` |
| Changes after `git pull` not showing | Use `make restart` not `make start` — containers must be recreated |
| Clean up old domain entries | Run `sudo ./scripts/cleanup-hosts.sh` (interactive, with confirmation) |

**Development mode (GUI outside Docker):**

```bash
docker compose up -d aws-emulator api nginx
cd localcloud-gui && npm install && npm run dev
# GUI available at http://localhost:3000
```

---

## Docker Build Failures — "No Space Left on Device"

If you encounter build failures with errors like:

```
failed to copy files: userspace copy failed: write /app/node_modules/...: no space left on device
```

Docker has run out of disk space. This commonly happens when:

- Multiple Docker builds accumulate over time
- Large node_modules directories from previous builds
- Unused Docker images, containers, and volumes
- Build cache growing too large

### Quick Fix — Clean Up Docker

**Using LocalCloud Kit Commands (Recommended):**

```bash
make reset           # Stop services + clean volumes
make reset-env       # Full reset (clean everything)
make clean-volumes   # Clean data only
make clean-all       # Nuclear option (remove all Docker resources)
```

**Using Docker Commands Directly:**

```bash
docker system df                           # Check disk usage
docker system prune -a --volumes -f        # Clean everything (WARNING: removes ALL unused Docker data)
docker image prune -a -f                   # Remove unused images
docker container prune -f                   # Remove stopped containers
docker volume prune -f                     # Remove unused volumes
docker builder prune -a -f                 # Remove build cache
```

### Prevention — Regular Maintenance

```bash
# Weekly reset
make reset

# Monthly deep cleanup
make reset-env

# Check space usage
docker system df
```

### Why This Happens

Common with this repository because:

1. **Large Dependencies**: Next.js and Node.js have large `node_modules`
2. **Multiple Builds**: Each `docker compose up --build` creates new layers
3. **AWS Emulator Image**: The MiniStack Docker image pulls on first run
4. **Build Cache**: Docker build cache can grow significantly

### Monitoring Disk Usage

```bash
docker system df
```

If **RECLAIMABLE** space is high (>50%), consider running cleanup commands.

### Alternative Solutions

1. **Use .dockerignore**: Exclude unnecessary files from builds
2. **Multi-stage builds**: Optimize Dockerfiles to reduce image size
3. **Regular cleanup**: Set up automated cleanup scripts
4. **Separate development**: Use different Docker contexts for different projects
