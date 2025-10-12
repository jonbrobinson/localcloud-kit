# Changelog

All notable changes to LocalCloud Kit will be documented in this file.

## [Unreleased]

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
