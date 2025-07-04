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

### Added

- Enhanced file viewer with syntax highlighting support for multiple file types
- Added support for Word documents (.doc, .docx) with formatted text display
- Dynamic theme selection with persistent theme storage
- Comprehensive sample files for testing various file types
- Rebranded project from "LocalStack Manager" to "LocalCloud Kit"

### Fixed

- JSON file content display showing metadata instead of actual content
- Shell script compatibility with POSIX standards
- File viewer modal styling and layout improvements

## [0.1.0] - 2024-01-XX

### Added

- Initial release of LocalCloud Kit
- S3 bucket management and file viewing capabilities
- DynamoDB table management and data viewing
- Docker-based deployment with hot reload
- Comprehensive automation scripts
- Modern web interface with Next.js
- Express.js API server for backend operations
