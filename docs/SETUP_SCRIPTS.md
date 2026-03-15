# Setup & Configuration Scripts

LocalCloud Kit includes several setup and maintenance scripts.

## Setup Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/setup.sh` | **Master setup** — runs all setup steps automatically |
| `./scripts/setup-mkcert.sh` | Generate SSL certificates only |
| `./scripts/install-ca.sh` | Install mkcert CA certificate to system trust store |
| `./scripts/setup-hosts.sh` | Add subdomains (`app-local`, `mailpit`, `pgadmin`, `keycloak`, `posthog`) to /etc/hosts |
| `./scripts/verify-setup.sh` | Verify setup configuration |
| `./scripts/cleanup-hosts.sh` | **Interactive cleanup** of LocalCloud Kit domain entries |

## Master Setup (`setup.sh`)

Runs automatically:
- Installs mkcert (if needed)
- Installs mkcert CA certificate
- Generates SSL certificates covering all five subdomains
- Adds all five subdomains to /etc/hosts

**Usage:** `./scripts/setup.sh` (run once, first time only)

## Verify Setup (`verify-setup.sh`)

Checks:
- Certificate files exist and are valid
- Certificate SANs cover all five subdomains
- `/etc/hosts` entries for all subdomains
- mkcert CA is installed
- HTTPS connectivity for app and platform subdomains (Mailpit, pgAdmin, Keycloak, PostHog)
- Provides troubleshooting guidance

**Usage:** `./scripts/verify-setup.sh`

## Cleanup Hosts (`cleanup-hosts.sh`)

**Interactive cleanup** of LocalCloud Kit domain entries:

- Detects all LocalCloud Kit domains in /etc/hosts (including previous versions)
- Shows found entries before removal
- **Interactive confirmation** — choose which domains to remove or keep
- Creates backup before making changes
- Supports cleaning up old domains like `localcloudkit.local`
- Safe to run — requires confirmation for each domain

**Usage:** `sudo ./scripts/cleanup-hosts.sh`

**Example flow:**

1. Scans /etc/hosts for all LocalCloud Kit domains
2. Shows all found entries before making changes
3. Asks for each domain individually: "Remove entries for [domain]? (y/N)"
4. Shows summary of what will be removed (red) and kept (green)
5. Final confirmation before any changes
6. Creates backup automatically
7. Removes only selected domains
8. Verifies removal was successful

**Features:**
- ✅ Safe: Creates backup before any changes
- ✅ Interactive: Choose which domains to remove or keep
- ✅ Selective: Remove old domains while keeping current one
- ✅ Verifiable: Confirms successful removal
- ✅ Cancellable: Can cancel at any confirmation prompt
