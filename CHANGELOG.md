# Changelog

All notable changes to LocalCloud Kit will be documented in this file.

## [Unreleased]

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
  - Wildcard certificate support (*.localcloudkit.local) for subdomain access
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
