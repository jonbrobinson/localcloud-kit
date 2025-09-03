# Changelog

All notable changes to LocalCloud Kit will be documented in this file.

## [Unreleased]

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
