# Changelog

All notable changes to LocalCloud Kit will be documented in this file.

## [Unreleased]

## [0.13.1] - 2026-03-13

### Changed
- **CLAUDE.md**: Require reading AGENTS.md before executing any action
- **AGENTS.md**: Attribution section expanded — commit author must always be human; no AI agents (Claude, Copilot, Cursor, etc.) in author or co-author fields; Co-Authored-By reserved for human collaborators only

## [0.13.0] - 2026-03-13

### Added
- **Manage pages**: Dedicated `/manage/[service]` pages for all AWS services — S3, DynamoDB, Secrets Manager, Lambda, API Gateway, IAM, and SSM Parameter Store — each with full CRUD, list view, inline detail/edit, and delete confirmation
- **SecretsDetailModal**: Clicking a secret in the resource list now opens a focused single-secret modal showing name, ARN, masked value with reveal toggle, inline edit (value + description), and delete with confirmation; includes "Open in Secrets Manager →" link to the full manage page
- **Manage links**: "Open Manager →" links added to all existing service viewer modals (BucketViewer, DynamoDBViewer, SecretsManagerViewer, LambdaCodeModal, SSMEditModal, APIGatewayConfigViewer) and to the Resources dropdown in the Dashboard
- **Docs Hub**: New `/docs` page that centralizes all documentation links, quick verification checklists, and direct manager/admin tool links
- **IAMRolePoliciesModal**: Added a dashboard IAM role viewer modal that shows role metadata and attached policies with copy-ARN support
- **docs/LOCAL_WORKFLOW.md**: Added a dashboard preview section listing viewer modals for all supported AWS resource types

### Changed
- **Dashboard + ResourceList**: Added smooth empty→building→list transitions, including a first-resource loading state that keeps the empty panel shape while provisioning and animated add/remove row layout updates
- **ResourceList**: Empty resources view now includes quick-create cards for S3 and DynamoDB (plus other available AWS resource actions)
- **DocPageNav**: Dashboard link now appears to the right of the page title and subtitle in the nav header
- **Non-dashboard headers**: Title next to the logo is now consistent as "LocalCloud Kit" and subtitles now use short service labels
- **Dashboard menus**: Resources and Services dropdowns now include an **Inspect** option that opens a quick modal with verification checks plus docs/manager/admin links, with full desktop + mobile parity
- **Dashboard + ResourceList**: Docs dropdown is now grouped into three columns, resource dropdown rows have roomier spacing with icon-first preview/manage controls, and AWS resource rows show less text truncation
- **Dashboard actions**: Resource dropdown icons now map by intent — eye opens viewers (where available), checklist opens inspect checks, and external-link opens full manage pages
- **Dashboard resources**: Added viewer action wiring for Lambda, API Gateway, Secrets Manager, SSM, and IAM from the Resources dropdown and resource list

### Fixed
- **SecretsDetailModal**: Clicking a secret from the resource list previously opened all secrets; now correctly opens only the clicked secret

## [0.12.0] - 2026-03-09

### Added
- **Parameter Store**: Edit action — SSMEditModal to view/edit parameter value, type, description
- **Lambda**: Code action — LambdaCodeModal to unzip and view deployment package contents with syntax highlighting
- **API Gateway**: Config action — APIGatewayConfigViewer to add path, method (MOCK), deploy to stage
- **GUI**: Next.js rewrites to proxy /api to backend when running standalone dev (fixes 404/Network Error)
- **Lambda**: Lambda function management — create modal with runtime/handler selection, dedicated `/lambda` doc page with SDK examples (TypeScript, Node.js, Python, CLI), API routes (`/api/lambda/functions`), and shell script (`list_lambda_functions.sh`)
- **API Gateway**: API Gateway management — create modal, dedicated `/apigateway` doc page with full REST API walkthrough (resources, methods, mock/Lambda integrations, stage deployment), API routes (`/api/apigateway/apis`), and shell script (`list_apis.sh`)
- **Parameter Store**: SSM Parameter Store service — create modal with String / StringList / SecureString type selection, dedicated `/ssm` doc page with SDK examples, API routes (`/api/ssm/parameters` CRUD), and shell scripts (`list_parameters.sh`, `create_parameter.sh`, `get_parameter.sh`, `delete_parameter.sh`)
- **ResourceList**: Lambda, API Gateway, and Parameter Store entries in the `+ Add` dropdown under Compute, Networking, and Security & Identity sections
- **Dashboard**: Resources dropdown now includes Compute (Lambda), Networking (API Gateway), and Parameter Store sections; Docs dropdown updated with Lambda, API Gateway, and Parameter Store links; mobile menu updated accordingly
- **docs/LAMBDA.md**: Lambda integration reference — runtimes, API endpoints, SDK examples, CLI usage, troubleshooting
- **docs/API_GATEWAY.md**: API Gateway integration reference — REST API creation, resource/method/integration setup, stage deployment, Lambda proxy
- **docs/SSM.md**: Parameter Store integration reference — parameter types, hierarchical paths, SDK examples, best practices

### Fixed
- **Lambda create**: Build placeholder zip with Python when `zip` is unavailable (fixes "zip not found"); function is created with minimal placeholder and code can be uploaded later via `update-function-code`
- **API image**: Add `zip` package to Dockerfile.api so Lambda placeholder fallback works in all environments
- **GUI**: React duplicate key warnings — use unique keys for API endpoint tables (method+endpoint), ResourceList categories/details, BucketViewer objects/buckets, DynamoDBViewer rows/headers, SecretsManagerViewer secrets, LambdaCodeModal files, and external resource tables across all service pages
- **Dashboard**: Show backend error messages in toasts when creating single resources (Lambda, API Gateway, Parameter Store) instead of generic AxiosError 500 messages
- **API Gateway create**: Pass config to create_single_resource.sh; capture API ID from create-rest-api output for correct destroy; escape JSON config for shell
- **SSM create**: Add ssmConfig handling in resources.js createSingleResource (was missing)
- **SSM list**: Add list_ssm_parameters to list_resources.sh so SSM parameters appear in dashboard
- **SSM destroy**: Add SSM parameter deletion to destroy_resources.sh (specific and bulk)
- **LocalStack**: Enable SSM service in docker-compose SERVICES
- **Docker**: Add `.dockerignore` to exclude `node_modules` and build artifacts — prevents host `node_modules` from being copied into Docker builds so `npm ci` runs fresh
- **API**: Replace Express 4 `:name(*)` route syntax with Express 5–compatible `*name` splat in SSM and S3 routes — fixes path-to-regexp v8 TypeError with parameter names containing slashes

## [0.11.5] - 2026-03-11

### Changed
- **Cache page**: Redesign — DocPageNav, Connection dropdown in header, standardized Key/Value labels, equal-height Operations and All Keys panels, Set pre-selected on load, Framer Motion transitions when switching operations
- **Cache page**: Title "Cache", subtitle "Redis"; Connection details in card-style dropdown; status moved to Operations header

## [0.11.4] - 2026-03-11

### Changed
- **docs/screenshots/01-main-dashboard.png**: Updated main dashboard screenshot with current UI (2 resources, service status bar)

## [0.11.3] - 2026-03-11

### Added
- **docs/LOCALSTACK.md**: LocalStack version strategy, pinning, March 2026 image change
- **docs/TROUBLESHOOTING.md**: Connection errors, certificate issues, Docker disk space cleanup
- **docs/SETUP_SCRIPTS.md**: Setup and cleanup script reference
- **README**: Table of contents, PostgreSQL and Keycloak badges

### Changed
- **README**: Major overhaul — merged Prerequisites/Support/Contact, consolidated start commands, moved long sections to docs, added Service URLs table in Quick Start, collapsible LocalStack section
- **docs/screenshots/01-main-dashboard.png**: Restored main dashboard screenshot (was Create Secret modal)
- **docs/PROJECT_STRUCTURE.md**: Added LOCALSTACK, TROUBLESHOOTING, SETUP_SCRIPTS to docs list

## [0.11.2] - 2026-03-11

### Added
- **AGENTS.md**: AI coding agent context file — build commands, conventions, commit standards, architecture

### Changed
- **docs/screenshots/01-main-dashboard.png**: Main dashboard screenshot now shows Create Secret modal
- **README**: Removed Create Secret section from screenshots

### Removed
- **docs/screenshots/07-create-secret.png**: Removed; Create Secret flow no longer has dedicated screenshot section

## [0.11.1] - 2026-03-11

### Added
- **docs/screenshots/07-create-secret.png**: Create Secret modal screenshot for Secrets Manager flow

### Changed
- **docs/screenshots**: Replaced all screenshots with new flow captures (dashboard, S3, DynamoDB, Secrets Manager)
- **README**: Updated screenshot descriptions to match current UI; added Secrets Manager section

### Fixed
- **Dashboard**: Single-shell loading, status bar, Services categories
- **DashboardSkeleton**: Match layout, real logo and service names
- **DynamoDBAddItemModal**: Consistent dropdown styling with ChevronDownIcon

## [0.11.0] - 2026-03-11

### Added
- **Dashboard**: "What's new" version dot on profile icon — red badge appears when app version changes, reveals changelog link in profile dropdown, clears on open
- **Dashboard**: LocalStack stopped state inside AWS Resources panel — consistent panel layout with start command hint instead of hiding the section
- **Dashboard**: Project switcher badge — active project shown as a styled `bg-blue-50` pill for clear environment context

### Changed
- **Dashboard**: Service status bar pills now have explicit `hover:bg-gray-50 rounded-lg` hover states instead of `opacity-75` fade
- **Dashboard**: Nav buttons are now ghost/alpha style — removed borders and white backgrounds, consistent `rounded-lg` across all nav items
- **Dashboard**: Toast notifications moved to `bottom-right` to avoid collision with the fixed header
- **DashboardSkeleton**: Real logo, title, version subtitle, and service names shown immediately; only status badges pulse during load
- **DashboardSkeleton**: Framer Motion entry/exit animation for smooth crossfade transition to loaded dashboard
- **DocPageNav**: Nav buttons updated to ghost/alpha style matching Dashboard; page action buttons standardised to `indigo-50` fill, no border
- **DynamoDBViewer**: Table selector uses `appearance-none` + custom `ChevronDownIcon` for aligned dropdown arrow; all buttons standardised to `py-1.5 rounded-md`
- **SecretsConfigModal / DynamoDBConfigModal**: Saved config flow updated — pill buttons at top, "Save as config" checkbox at bottom, matching S3 flow

### Fixed
- **Dashboard**: Dropdown toggles now close all other menus (previously Resources/Docs/Services didn't close Project or Profile)

## [0.10.1] - 2026-03-11

### Changed
- **Makefile**: `make start-legacy` now pins LocalStack to `4.14` (previously `4.12`)
- **README**: Updated last-tested LocalStack version to `4.14.0` and all legacy pinned version references

### Fixed
- **Keycloak page**: Duplicate React key warning — resources table now uses `name` as key instead of `url` (two entries shared the same admin URL)

## [0.10.0] - 2026-03-10

### Added
- **PostgreSQL**: Full PostgreSQL service integration — container managed via Docker Compose with status monitoring, connection info, and pgAdmin support
- **Keycloak**: Identity and access management service — HTTPS routing via Traefik, status page with admin console link, and dedicated docs (`docs/KEYCLOAK.md`)
- **DocPageNav**: Persistent top navigation bar on all doc pages with profile icon, docs dropdown, and per-page language selector
- **verify-new-service**: Claude command skill for verifying new service integrations end-to-end
- **`/api/postgres`**: Backend route for PostgreSQL health-check and connection status
- **`/api/keycloak`**: Backend route for Keycloak health-check and status
- **docs/KEYCLOAK.md**: Documentation for Keycloak setup, configuration, and usage
- **docs/PGADMIN.md**: Documentation for pgAdmin access and PostgreSQL administration

### Changed
- **docker-compose.yml**: Added PostgreSQL and Keycloak service blocks; configured `KC_HOSTNAME` and `KC_PROXY_HEADERS` for correct Traefik HTTPS routing
- **localcloud-api**: Refactored into modular route files (`routes/`) and shared lib (`lib/`) — separates concerns from the monolithic `server.js`
- **Dashboard**: Updated to display PostgreSQL and Keycloak status alongside existing services
- **ResourceList**: Updated to handle `postgres` and `keycloak` resource types
- **useServicesData**: Extended to fetch PostgreSQL and Keycloak status
- **next.config.ts**: Added CSP and frame-ancestors config to resolve Keycloak HTTPS mixed-content blocking

### Fixed
- **Keycloak**: Resolved HTTPS mixed content errors and `frame-sec` blocking when embedding Keycloak admin console
- **Keycloak**: Fixed `KC_HOSTNAME` and `KC_PROXY_HEADERS` so the admin console is reachable through Traefik without redirect loops
- **Mailpit**: Fixed subdomain TLS cert generation and hosts file verification in setup scripts
- **Language preferences**: Fixed language selector on doc pages not persisting the user's chosen SDK language

## [0.9.0] - 2026-03-10

### Added
- **ThemeableCodeBlock**: Reusable code block component with highlight.js syntax highlighting and theme selector for SDK samples across S3, DynamoDB, Secrets, Redis, Mailpit, and LocalStack doc pages
- **DashboardSkeleton**: Skeleton loading component with animated pulse placeholders for the dashboard header, services bar, and resource list
- **GET /api/dashboard**: Batched backend endpoint that aggregates LocalStack status, project config, Mailpit stats, resources, and Redis status in a single round-trip

### Changed
- **ConnectionGuide**: Respects profile highlight_theme preference for SDK code examples
- **docker-compose.yml**: Updated Traefik image from `traefik:v3.0` to `traefik:v3` (floating latest v3 — currently v3.6.10)
- **README**: Updated LocalStack last-tested version from 4.9 to 4.13.0 (March 9, 2026); added notice about LocalStack's upcoming authentication requirement (March 23, 2026) with link to free plan signup
- **Dashboard**: Replaced full-screen spinner with DashboardSkeleton during initial load; data is lazy-loaded only when visiting the dashboard
- **useServicesData**: Refactored to use the new batched `/api/dashboard` endpoint (single API call instead of multiple parallel requests)
- **ResourceList**: Cache resource label changed from "Redis Cache" to "Cache" (type remains "Redis" in the subtitle)
- **DynamoDBViewer**: Tighter row padding (`px-3 py-2`), auto-sizing columns (`table-auto`), inline JSON expand button with `ArrowsPointingOutIcon`, and fixed vertical + horizontal scroll in the items table

### Fixed
- **SecretsManagerViewer**: Sub-modals (Create, Edit, Delete) no longer close when focusing inputs — added stopPropagation to prevent backdrop click bubbling
- **Dashboard**: Fixed projectName self-reference that caused TypeScript build error (fallback to config.projectName)
- **DynamoDBAddItemModal**: Empty attributes are now filtered before submission — prevents partial items from being saved to DynamoDB
- **DynamoDBAddItemModal**: Form state (keys, attributes, errors) is reset each time the modal is opened so stale data from a previous submission is not shown

## [0.8.0] - 2026-03-09

### Added
- **Mailpit**: Full email testing integration — local SMTP server (port 1025) with web inbox at `https://mailpit.localcloudkit.com:3030`
- **MailpitModal**: In-dashboard modal for browsing the inbox, reading emails, sending test messages, and clearing all messages
- **RedisModal**: New Redis status modal with key browser and connection info, accessible from the dashboard Resources menu and resource card
- **Dashboard**: Redis and Mailpit status pills in the services bar, clickable to open their modals

### Changed
- **Dashboard navigation**: Standalone Logs button folded into a "Resources" dropdown (renamed from "Tools") with labelled sections — AWS (DynamoDB Tables, S3 Buckets, Secrets Manager), Cache (Redis Cache), Inbox (Mailpit) — and alphabetised entries within each section
- **ResourceList**: Unified all "Open" action buttons to indigo-50/indigo-600 for visual consistency
- **Modal UX**: Standardised shell across all modals — `bg-black/50` backdrop, `rounded-xl shadow-2xl`, `max-h-[90vh]`, backdrop click-to-close, Escape key dismiss, and body scroll lock
- **Modal sizing**: Right-sized all viewers — SecretsManagerViewer (`max-w-6xl` → `max-w-2xl`), LogViewer (`max-w-6xl` → `max-w-4xl`), DynamoDBConfigModal (`max-w-4xl` → `max-w-xl`)
- **Modal headers**: Consistent `text-lg font-semibold` title + `text-xs text-gray-500` subtitle + `p-1.5 rounded-md hover:bg-gray-100` close button across all modals
- **DynamoDBAddItemModal**: Scrollable body with pinned footer so the submit button is always visible when adding large items
- **DynamoDBAddItemModal**: Sub-modals (Delete, JSON Viewer) moved outside the parent backdrop to prevent click-event bubbling

### Fixed
- **DynamoDBAddItemModal**: Modal no longer closes on field focus — sub-modals rendered outside backdrop div
- **DynamoDBAddItemModal**: Number (`N`) type fields now use `type="number"` input, preventing non-numeric values being sent to DynamoDB
- **DynamoDBAddItemModal**: Boolean (`BOOL`) type fields replaced with a true/false dropdown instead of free-text
- **DynamoDBAddItemModal**: Recursive pre-submit validator catches invalid number values in nested Maps and Lists before the request is sent
- **BucketViewer**: FileViewerModal and UploadFileModal moved outside backdrop div — fixes S3 file upload being dismissed on click
- **BucketViewer**: Added missing closing div for flex-1 content wrapper
- **LogViewer**: Collapsed double-wrapper into single `flex-1 min-h-0 overflow-y-auto` container — fixes scroll and modal overflowing viewport
- **LogViewer**: Fixed invisible "All Sources" select text; `lastUpdated` tracked in state to stop footer flickering on auto-refresh
- **RedisModal**: Replaced broken `redis.localcloudkit.com` link with `/cache` route

### Docs
- **README**: Updated tagline to "Local Cloud Development Environment"; added Mailpit and Redis badges; added Mailpit feature section, access URLs, and service table rows; linked `docs/MAILPIT.md`
- **docs/CONNECT.md**: Moved from root `CONNECT.md` to `docs/`; added Secrets Manager SDK examples for JS, Python, Go, and Java; fixed deprecated Go `EndpointResolverWithOptions` API to use per-service `BaseEndpoint`; added troubleshooting table and per-language debug logging snippets
- **GETTING_STARTED.md**, **README.md**: Updated Connection Guide link to `docs/CONNECT.md`
- **docs/screenshots**: Replaced outdated screenshots with 6 new v0.8.0 captures — main dashboard, S3 bucket configuration, S3 bucket management, S3 file viewer, DynamoDB table configuration, and DynamoDB table data; grouped in README by resource (S3, DynamoDB)

## [0.7.1] - 2025-12-09

### Added

- **Enhanced Cleanup Script**: Interactive cleanup of LocalCloud Kit domain entries
  - Detects all LocalCloud Kit domains in /etc/hosts (including previous versions)
  - Interactive confirmation for each domain (choose to remove or keep)
  - Shows summary of domains to be removed/kept before making changes
  - Supports cleaning up old domains like `localcloudkit.local`
  - Creates backup automatically before any changes
  - Safe and cancellable at any confirmation prompt

### Changed

- **Branding Update**: Updated tagline from "Local AWS Development Environment" to "Local Cloud Development Environment"
  - Better reflects that the platform includes AWS services and Redis cache
  - Removed AWS-specific wording while maintaining cloud service focus
  - Updated in GUI metadata, dashboard header, and footer
- **Documentation**: Enhanced README with comprehensive cleanup script documentation
  - Added detailed setup and configuration scripts section
  - Documented cleanup script features and usage examples
  - Updated all script descriptions to match actual functionality

### Removed

- **Obsolete Script**: Removed `start-gui.sh` in favor of cross-platform Make commands
  - `make start` provides better cross-platform support (macOS, Linux, Windows)
  - Make commands have correct URLs and health checks
  - All references updated to use `make start` instead

## [0.7.0] - 2025-12-09

### Changed

- **BREAKING: Domain and Port Configuration**: Updated local development domain and port to avoid blocking standard HTTP/HTTPS ports

  - Changed domain from `localcloudkit.local` to `app-local.localcloudkit.com`
  - Changed HTTPS port from `443` to `3030` (frees up standard ports 80/443 for other applications)
  - Removed HTTP redirect on port 80 (port 80 is now completely free)
  - Updated all configuration files, scripts, and documentation to reflect new domain and port
  - Updated Traefik entry point from port 443 to 3030
  - Removed HTTP to HTTPS redirect (direct HTTPS access only)
  - Updated certificate generation scripts for new domain
  - Updated `/etc/hosts` setup scripts for new domain
  - Updated CORS and Socket.IO origins in API server
  - Updated all documentation references (README, GETTING_STARTED, docs/)
  - New access URL: `https://app-local.localcloudkit.com:3030`

  **Migration Notes:**

  - Existing users must regenerate certificates: `./scripts/setup-mkcert.sh`
  - Update `/etc/hosts`: `sudo ./scripts/setup-hosts.sh`
  - Update access URLs to use new domain and port
  - Ports 80 and 443 are now available for other local applications

## [0.6.2] - 2025-11-30

### Fixed

- **Docker Architecture Documentation**: Corrected Redis cache architecture representation
  - Updated architecture diagram to show Redis as standalone service (not connected through LocalStack)
  - Clarified that Redis is independent of LocalStack and accessible by any service on the network
  - Updated Redis service description to reflect standalone nature
  - Fixed service discovery documentation to accurately represent Redis connectivity

## [0.6.1] - 2025-11-30

### Changed

- **Documentation Consolidation**: Streamlined documentation structure
  - Moved `DOCKER.md` to `docs/DOCKER.md` with updated Traefik architecture documentation
  - Consolidated `SETUP.md` and `QUICKSTART.md` into `GETTING_STARTED.md` for single source of truth
  - Updated all documentation references to reflect new structure
  - Removed redundant documentation files
- **Package Version Alignment**: Updated package.json versions to match release tags
  - Updated `localcloud-gui/package.json` to version 0.6.1
  - Updated `localcloud-api/package.json` to version 0.6.1

### Removed

- **Obsolete Files**: Removed unused and redundant files
  - Removed `letsencrypt/acme.json` (no longer used with mkcert setup)
  - Removed `TRAEFIK_PLAN.md` (implementation complete)

## [0.6.0] - 2025-11-30

### Added

- **Traefik Routing with HTTPS**: Implemented Traefik as edge router with HTTPS support
  - Added Traefik service with automatic HTTPS for `localcloudkit.local`
  - Configured HTTP to HTTPS redirect
  - Added WebSocket support for Socket.IO through Traefik
  - Updated all services to use new domain routing structure
- **Master Setup Script**: One-command setup for complete installation
  - Added `scripts/setup.sh` - Master script that runs all setup steps
  - Automatically installs mkcert, CA certificate, generates certificates, and sets up /etc/hosts
  - Individual scripts available for one-off operations
- **Automatic mkcert Setup**: Cross-platform certificate generation script
  - Automatically downloads and installs mkcert if not found (macOS, Linux, Windows)
  - No Homebrew or manual installation required
  - Supports Intel and Apple Silicon architectures
  - Generates trusted certificates with clean subject (CN=localcloudkit.local)
  - Wildcard certificate support (\*.localcloudkit.local) for subdomain access
  - Handles root-owned CA files with automatic permission fixes
- **Certificate Management Scripts**:
  - Added `scripts/setup-mkcert.sh` - Automatic mkcert installation and certificate generation
  - Added `scripts/install-ca.sh` - Dedicated CA certificate installation
  - Added `scripts/setup-hosts.sh` - Automatic /etc/hosts entry management
  - Added `scripts/verify-setup.sh` - Setup verification and troubleshooting
  - Added `scripts/cleanup-hosts.sh` - Cleanup script for `/etc/hosts` entries
- **Documentation Enhancements**:
  - Added `GETTING_STARTED.md` - Complete getting started guide
  - Added `docs/LOCAL_WORKFLOW.md` - Detailed local development workflow
  - Added `docs/MKCERT_SETUP.md` - mkcert setup documentation
  - Added `docs/CERTIFICATE_TROUBLESHOOTING.md` - Certificate troubleshooting guide
  - Added `SETUP.md` - Quick setup guide

### Changed

- **BREAKING: Domain Routing**: Updated from `localhost:3030` to `localcloudkit.local` with HTTPS
  - All services now accessible via `https://localcloudkit.local`
  - API endpoints use relative paths (`/api/*`) for Traefik routing
  - Updated CORS configuration for new domain
  - Updated Socket.IO path to `/ws/socket.io`
  - Requires `/etc/hosts` entry or mDNS/Bonjour for domain resolution
- **Docker Compose**: Added Traefik service and updated Nginx labels
- **Makefile**: Updated health checks and URLs to use new domain
- **Documentation**: Updated README, QUICKSTART, and DOCKER docs with new setup workflow
- **Certificate Generation**: Improved with custom subject and wildcard support
  - Certificates now have clean subject (CN=localcloudkit.local only)
  - Wildcard support for subdomain access
  - Better error handling and debugging output

### Fixed

- **Certificate Generation**: Fixed issues with root-owned CA files
  - Automatic detection and handling of root-owned CA files
  - Uses sudo for certificate signing when CA files are not readable
  - Improved error messages and troubleshooting guidance
- **Error Handling**: Enhanced error messages throughout setup scripts
  - Removed silent error suppression to show actual errors
  - Added step-by-step progress messages
  - Better debugging information for troubleshooting

## [0.5.10] - 2025-11-29

### Changed

- **Volume Directory Management**: Removed runtime-generated volume files from git tracking
  - Removed `volume/cache/machine.json` and SSL certificate files from git history
  - Updated `make start` command to automatically create volume directory structure
  - Volume files are now properly ignored by git (already in `.gitignore`)
  - Ensures unique, generated files (certificates, machine IDs) are not shared between developers

## [0.5.9] - 2025-10-12

### Changed

- **LocalStack Version Strategy**: Updated default version from pinned `4.0` to `latest`
  - Changed `docker-compose.yml` to use `${LOCALSTACK_VERSION:-latest}` for automatic updates
  - Updated `Makefile` default to `LOCALSTACK_VERSION ?= latest`
  - Updated `env.example` to use `LOCALSTACK_VERSION=latest`
  - Adopts "rolling release" approach for LocalStack - always use newest version by default
  - Users can still pin to specific versions via environment variables when needed
  - Updated README with comprehensive version strategy documentation and rationale
- **LocalStack Compatibility Documentation**: Updated tested version information
  - Last tested with LocalStack 4.9 (October 12, 2025)
  - Clarified that LocalCloud Kit is maintained to stay compatible with LocalStack updates
  - Breaking changes will be documented in README when they occur

## [0.5.8] - 2025-10-12

### Added

- **LocalStack Version Pinning**: Implemented version pinning with flexible override support
  - Pin LocalStack to version 4.0 by default in `docker-compose.yml`
  - Added `LOCALSTACK_VERSION` environment variable with default fallback (`${LOCALSTACK_VERSION:-4.0}`)
  - Support for version override via Makefile: `make start LOCALSTACK_VERSION=4.1`
  - Added `LOCALSTACK_VERSION` to `env.example` for easy configuration
  - Comprehensive LocalStack Version Compatibility section in README
  - Documented 4 methods to override LocalStack version (env var, Makefile, .env file, env.example)
  - Protection against breaking changes in future LocalStack updates
  - Ensures stability while maintaining flexibility for testing

### Changed

- **Makefile Enhancement**: Added version display when starting services
  - Shows "Using LocalStack version: X.X" on startup
  - Better visibility of which LocalStack version is being used

## [0.5.7] - 2025-10-12

### Changed

- **Branding Consistency**: Replaced all "Enterprise AWS Development Tools" references with "Local AWS Development Environment"
  - Updated 12 files across the codebase (shell scripts, documentation, metadata)
  - Changed page metadata in `localcloud-gui/src/app/layout.tsx` for better SEO
  - Updated all README files and documentation footers
  - Better reflects the local, isolated nature of the tool

### Fixed

- **Dynamic Version Display**: GUI now imports version from `package.json` instead of hardcoding
  - Single source of truth for version number
  - Eliminates need for manual version updates in Dashboard component
  - Fixed outdated hardcoded v0.5.3 reference in Dashboard header

## [0.5.6] - 2025-10-12

### Added

- **Contributing Guide**: Created comprehensive CONTRIBUTING.md with guidelines for contributors
  - Angular commit message format with examples and common scopes
  - Focus on bug fixes, UI improvements, and AWS service integrations
  - Code review requirements and PR process
  - ESLint and Prettier formatting standards
  - Manual testing guidelines

### Fixed

- **Development Setup Documentation**: Corrected Development Setup section with actual Makefile commands
  - Replaced non-existent `make test` and `make format` with real commands
  - Added `make start`, `make help`, `make logs`, `make status`, `make restart`
  - Included GUI-only development workflow
- **README Cleanup**: Removed obsolete Shell Script Permission Denied troubleshooting section (36 lines)

## [0.5.5] - 2025-10-12

### Added

- **Comprehensive Service Documentation**: Created dedicated documentation files for Redis Cache and Secrets Manager
  - Added `docs/REDIS.md` with complete Redis cache management guide including API endpoints, shell scripts, and SDK examples
  - Added `docs/SECRETS.md` with full Secrets Manager documentation including AWS SDK integration examples

### Changed

- **README Restructure**: Reorganized README for better scannability and maintainability (reduced from 760 to 576 lines)
  - Replaced version-specific patch notes with timeless feature descriptions organized by category
  - Moved detailed Redis and Secrets Manager documentation to separate files with links
  - Consolidated duplicate sections (troubleshooting, startup methods, configuration)
  - Simplified Usage section with clear examples for GUI, shell scripts, and AWS CLI
  - Updated Features section to focus on capabilities rather than version history
  - Renamed "Enterprise Ready" to "Developer Experience" to better reflect local development focus
- **Documentation Organization**: Improved documentation structure with clear Getting Started, Service, and Component sections

### Fixed

- **Misleading Enterprise Claims**: Removed incorrect references to team collaboration and production use - LocalCloud Kit is designed for isolated local development only

## [0.5.4] - 2025-10-12

### Added

- **Multipart File Upload**: Implemented proper multipart file uploads using multer for handling files of any size
  - New `/s3/bucket/:bucketName/upload-multipart` endpoint for efficient file uploads
  - Supports files up to 100MB (configurable)
  - Better memory management and performance for large files
  - Legacy JSON upload endpoint maintained for backward compatibility

### Changed

- **Upload Functionality**: File uploads now use FormData and multipart encoding instead of base64 JSON
- **File Size Limit**: Increased JSON body limit from 100KB to 50MB for legacy uploads
- **Upload Preview**: Binary files now show size preview instead of attempting to display content
- **Toast Notifications**: Upload success messages now include file size information

### Fixed

- **Large File Upload Errors**: Fixed "array null" and JSON parsing errors when uploading files larger than 100KB
- **Memory Issues**: Resolved memory problems caused by loading entire files into JavaScript strings
- **Upload Performance**: Dramatically improved upload speed and reliability for large files

## [0.5.3] - 2025-10-10

### Added

- **Connection Page Navigation**: Added "Back to Dashboard" link with arrow icon to Connection Guide page for consistent navigation across all pages

### Fixed

- **TypeScript Build Error**: Fixed `resource.details` possibly undefined error in ResourceList component by adding proper null checking for ARN copy functionality
- **Next.js Build Warning**: Removed deprecated `devIndicators.buildActivity` option from Next.js configuration to eliminate build warnings

## [0.5.2] - 2025-10-09

### Added

- **Individual Secret Resources**: Secrets now display as individual line items instead of aggregated view for better clarity and management
- **Secret ARN Display & Copy**: Full ARN shown with one-click copy functionality for easy integration
- **Enhanced Secret Details**: Display description, creation date, and last changed date for each secret
- **Secret Delete Functionality**: Support for both individual and bulk secret deletion through standard resource management interface

### Fixed

- **Secrets Display UX**: Resolved confusing aggregated "Secrets Manager (X secrets)" view that expanded to show individual secrets
- **Secret Deletion Issues**: Fixed missing delete functionality for secrets - now works with both checkboxes and bulk operations
- **React Duplicate Key Errors**: Eliminated "Encountered two children with the same key" errors caused by duplicate secret loading
- **jq Syntax Error in Scripts**: Fixed shell interpretation error in `list_resources.sh` that prevented resource listing after secret creation
- **Resource Creation Blocking**: Resolved issue where creating secrets would prevent creation of other resources

### Changed

- **Secrets Management**: Secrets now follow the same UI patterns as other resources (S3, DynamoDB, etc.)
- **Resource Loading**: Streamlined secret loading to use single source of truth (list_resources.sh script)
- **UI Consistency**: Improved overall resource management experience with consistent patterns across all resource types

## [0.5.1] - 2025-09-18

### Fixed

- **DynamoDB GSI Creation and Query Issues**: Fixed critical issues with Global Secondary Index (GSI) creation and querying in LocalStack:
  - **GSI Provisioning**: Added proper `ProvisionedThroughput` settings for GSIs when using `PROVISIONED` billing mode
  - **GSI Status Checking**: Implemented waiting mechanism to ensure GSIs become `ACTIVE` before completing table creation (prevents "Index not found" errors)
  - **GSI Query Support**: Enhanced query scripts and API to support querying specific GSIs using `indexName` parameter
  - **API Integration**: Updated API server to pass GSI names to query operations, enabling frontend GSI queries
  - **Test Script**: Created comprehensive test script (`test_gsi_creation.sh`) for validating GSI functionality

## [0.4.0] - 2025-09-03

### Added

- **AWS Secrets Manager Integration**:
  - Added full Secrets Manager support to LocalStack services
  - Created comprehensive UI for managing secrets with create, read, update, delete operations
  - Implemented secure secret value handling with mask/reveal functionality
  - Added support for secret metadata including descriptions, tags, and KMS key encryption
  - Created REST API endpoints for secrets management (`/api/secrets`, `/api/secrets/[secretName]`)
  - Added shell scripts for secrets operations (create, delete, list, get)
  - Integrated Secrets Manager as a standalone resource type in the dashboard
  - Added Secrets Manager option to resource creation modal
  - Implemented proper error handling and user feedback for all secrets operations
- **Enhanced Secrets Manager Features**:
  - Added dynamic secrets count display in resources list
  - Implemented conditional display - secrets resource only appears when secrets exist
  - Added proper input styling for better readability in secret forms
  - Improved API architecture by routing secrets through Express API server
  - Added comprehensive error handling and user feedback

### Changed

- Renamed directories for better branding consistency:
  - `localstack-gui` → `localcloud-gui`
  - `localstack-api` → `localcloud-api`
- Updated all references in documentation, Docker files, and configuration files
- Updated container names in docker-compose.yml and Makefile
- Updated package.json names for both GUI and API components

### Fixed

- **Fixed LocalStack health check showing as unhealthy**:
  - Resolved cron job logic that prevented health checks from running when LocalStack was initially unhealthy
  - Added proper port mapping (3031:3031) for API container to make it accessible from host machine
  - Enhanced health check logging for better debugging
  - Health check now runs every 30 seconds regardless of current status
- **Fixed S3 file viewing with nested folder paths**:
  - Updated Express.js routes to use wildcard patterns (`/*`) for object keys to handle nested folder structures
  - Fixed Next.js API configuration to properly route to backend API server
  - File viewer now correctly displays files in subfolders (e.g., `documents/sample.docx`, `code/sample.py`)

### Added

- Enhanced file viewer with syntax highlighting support for multiple file types
- Added support for Word documents (.doc, .docx) with formatted text display
- Dynamic theme selection with persistent theme storage
- Comprehensive sample files for testing various file types
- Rebranded project from "LocalStack Manager" to "LocalCloud Kit"
- **Created sample-files S3 bucket** with comprehensive test files including:
  - Text files (sample.txt, nested-file.txt)
  - Code files (sample.js, sample.py, sample.ts, Sample.java)
  - Data files (sample.csv, sample.json)
  - Document files (sample.docx)
  - Organized folder structure (code/, documents/) for testing navigation

### Fixed

- JSON file content display showing metadata instead of actual content
- Shell script compatibility with POSIX standards
- File viewer modal styling and layout improvements
- **Fixed binary file download corruption issue**: Updated S3 download script to output binary files as base64 instead of raw binary data to prevent corruption when captured by Node.js
- **Fixed image and PDF display**: Binary files now properly display in the file viewer without corruption
- **Fixed file download functionality**: Download now correctly handles both text and binary files

## [0.2.0] - 2025-08-02

### Added

- **Delete item functionality** for DynamoDB tables with confirmation modal
- **JSON viewer modal** with syntax highlighting for better data visualization
- **Enhanced table scrolling** with proper sticky headers and overflow handling
- **Improved refresh functionality** that reloads both table list and current table contents
- **Plus icon** for expandable JSON objects instead of text
- **Better null value handling** - displays empty cells instead of "null" text
- **Z-index fixes** to prevent table header interference with modals

### Changed

- **Table layout improvements** for better responsiveness and user experience
- **JSON formatting** for more readable object display in table cells
- **Modal positioning** to ensure proper layering and visibility

### Fixed

- **Refresh button** now properly refreshes table contents, not just the table list
- **Table scrolling** issues when items exceed viewport height
- **Modal display** problems with z-index conflicts

## [0.1.0] - 2025-07-01

### Added

- Initial release of LocalCloud Kit
- S3 bucket management and file viewing capabilities
- DynamoDB table management and data viewing
- Docker-based deployment with hot reload
- Comprehensive automation scripts
- Modern web interface with Next.js
- Express.js API server for backend operations
