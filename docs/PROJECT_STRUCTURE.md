# Project Structure

```
localcloud-kit/
├── 📁 localcloud-gui/          # Next.js Web GUI
│   ├── 📁 src/
│   │   ├── 📁 app/             # Next.js App Router pages
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 context/         # React context providers
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 services/        # API services
│   │   └── 📁 types/           # TypeScript types
│   └── 📄 README.md            # Web GUI documentation
├── 📁 localcloud-api/          # Express API Server
│   ├── 📄 server.js            # Main API server
│   ├── 📄 db.js                # Database utilities
│   ├── 📁 routes/              # Modular API routes
│   │   ├── cache.js            # Redis cache
│   │   ├── dynamodb.js         # DynamoDB
│   │   ├── s3.js               # S3
│   │   ├── secrets.js          # Secrets Manager
│   │   ├── keycloak.js         # Keycloak health
│   │   ├── mailpit.js          # Mailpit health
│   │   ├── postgres.js         # PostgreSQL health
│   │   ├── aws-emulator.js    # AWS Emulator health
│   │   ├── projects.js         # Project management
│   │   ├── resources.js        # Resource listing
│   │   ├── savedConfigs.js     # Saved configurations
│   │   └── profile.js          # User profile
│   ├── 📁 lib/                 # Shared utilities
│   ├── 📁 logs/                # Application logs
│   └── 📄 README.md            # API documentation
├── 📁 scripts/                 # Automation scripts
│   ├── 📄 setup.sh             # One-command first-time setup
│   ├── 📄 setup-mkcert.sh      # Certificate generation
│   ├── 📄 setup-hosts.sh       # Hosts file configuration
│   ├── 📄 install-ca.sh        # CA installation
│   ├── 📄 cleanup-hosts.sh     # Remove hosts entries
│   ├── 📄 verify-setup.sh      # Verify setup
│   └── 📁 shell/               # Shell-based AWS automation
│       ├── create_resources.sh # Batch resource creation
│       ├── destroy_resources.sh
│       ├── create_secret.sh
│       ├── delete_secret.sh
│       ├── get_secret.sh
│       ├── list_secrets.sh
│       ├── list_bucket_contents.sh
│       ├── upload_s3_object.sh
│       ├── download_s3_object.sh
│       ├── delete_s3_object.sh
│       ├── list_dynamodb_tables.sh
│       ├── scan_dynamodb_table.sh
│       ├── query_dynamodb_table.sh
│       ├── put_dynamodb_item.sh
│       ├── delete_dynamodb_item.sh
│       ├── cache_set.sh
│       ├── cache_get.sh
│       ├── cache_del.sh
│       ├── cache_flush.sh
│       ├── list_cache_keys.sh
│       ├── list_cache.sh
│       └── ...                 # Additional utilities
├── 📁 docs/                    # Documentation
│   ├── 📁 screenshots/        # README screenshots
│   ├── KEYCLOAK.md
│   ├── MAILPIT.md
│   ├── PGADMIN.md
│   ├── REDIS.md
│   ├── SECRETS.md
│   ├── DOCKER.md
│   ├── CONNECT.md
│   ├── LOCAL_WORKFLOW.md
│   ├── AWS_EMULATOR.md
│   ├── MKCERT_SETUP.md
│   ├── CERTIFICATE_TROUBLESHOOTING.md
│   ├── TROUBLESHOOTING.md
│   ├── SETUP_SCRIPTS.md
│   └── PROJECT_STRUCTURE.md
├── 📁 samples/                 # Sample files for testing
│   ├── 📄 sample.py
│   ├── 📄 sample.js
│   ├── 📄 sample.ts
│   ├── 📄 sample.json
│   ├── 📄 sample.csv
│   ├── 📄 sample.txt
│   ├── 📄 Sample.java
│   ├── 📄 sample.docx
│   └── 📄 README.md
├── 📁 traefik/                 # Traefik reverse proxy config + TLS certs
├── 📄 docker-compose.yml       # Docker Compose configuration
├── 📄 Dockerfile.gui           # GUI container build
├── 📄 Dockerfile.api           # API container build
├── 📄 nginx.conf               # Reverse proxy configuration
├── 📄 Makefile                 # Build and run commands
├── 📄 env.example              # Environment variable template
├── 📄 AGENTS.md                # AI coding agent context
├── 📄 CLAUDE.md                # Claude AI context
└── 📄 README.md                # This project
```

---

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `localcloud-gui/` | Next.js 15 frontend; App Router, TypeScript, Tailwind |
| `localcloud-api/` | Express.js backend; modular routes in `routes/` |
| `scripts/` | Setup scripts (root) + AWS shell automation (`shell/`) |
| `docs/` | Extended documentation for services and workflows |
| `samples/` | Sample files for S3/DynamoDB testing |
| `traefik/` | Traefik config and TLS certificates |
