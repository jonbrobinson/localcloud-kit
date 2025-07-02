# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-07-01

### Added

- **feat**: Support deep nested Map/List attributes in DynamoDB Add Item modal
- **feat**: Increase GSI limit to 5 in DynamoDB table creation
- **feat**: Add Map attribute support to DynamoDB Add Item form
- **feat**: Implement dynamic DynamoDB Add Item with schema-aware form
- **feat**: Add comprehensive DynamoDB table viewer with scan and query capabilities
- **feat**: Add custom S3 bucket creation with configuration modal
- **feat**: Add advanced DynamoDB table creation with composite primary keys and GSIs
- **feat**: Add individual resource creation functionality
- **feat**: Add "View" buttons for S3 and DynamoDB resources in resource list
- **feat**: Add inline resource viewing without dropdown selection
- **feat**: Add syntax highlighting with highlight.js themes for code examples in Connection Guide

### Changed

- **refactor**: Simplify interface to focus on S3 and DynamoDB resources
- **refactor**: Update Docker setup to Node 22-slim and simplify to Docker-only workflow
- **style**: Match DynamoDB viewer select and limit input styling to other forms
- **style**: Fix DynamoDB table column order to show primary keys first
- **style**: Match input, select, and checkbox stylings across all forms for consistency
- **docs**: Rename project from LocalStack Template to LocalStack Manager
- **style(eslint):** Clean up code to resolve ESLint warnings and set `no-explicit-any` to `warn` for practical AWS usage. Improved code quality and maintainability.

### Fixed

- **fix**: S3 bucket listing issues - ensure dummy AWS credentials, clean JSON output, and Dockerfile permissions
- **fix**: Add backend debug logging for bucket listing output
- **fix**: Remove reference to undefined showCreateModal variable
- **fix**: Shell script fallback to localhost:4566 if localstack hostname is unreachable
- **fix**: Robust argument parsing for --config and --verbose flags in create_single_resource.sh
- **fix**: Resolve API Gateway deletion issue
- **fix**: Resolve delete resources API issue
- **fix**: Remove set -x debug mode from shell scripts to eliminate warning spam
- **fix**: Add highlight.js theme files to git tracking by removing 'public' from .gitignore

### Removed

- **refactor**: Remove Lambda and API Gateway resource features temporarily
- **refactor**: Remove "Create Multiple" button from interface
- **refactor**: Remove unnecessary root-level package.json and package-lock.json files to clean up project structure

### Documentation

- **docs**: Add comprehensive changelog with Angular commit standards
- **docs**: Update changelog dates to reflect actual commit timeline
- **docs**: Improve README resource templates section with accurate descriptions and CLI examples
- **docs**: Update GUI references to reflect current interface

### Infrastructure

- **chore**: Release v0.1.1 patch update with root package file cleanup
- **chore**: Update README version badge to v0.1.1

## [0.1.1] - 2025-07-01

### Removed

- **refactor**: Remove unnecessary root-level package.json and package-lock.json files to clean up project structure

## [0.1.0] - 2025-06-28

### Added

- **feat**: Initial LocalStack Manager project setup
- **feat**: Docker Compose configuration for LocalStack, API, and GUI
- **feat**: Express.js backend API with resource management
- **feat**: Next.js frontend with React components
- **feat**: Shell script automation for AWS resource creation and management
- **feat**: Real-time log viewing capabilities
- **feat**: Resource status monitoring and health checks
- **feat**: Project configuration management
- **feat**: S3 bucket management and content viewing
- **feat**: DynamoDB table management and data viewing
- **feat**: Resource creation and destruction workflows
- **feat**: Docker-based development environment

### Technical Details

#### Backend Improvements

- **fix**: Endpoint URL handling - use internal Docker networking (`localstack:4566`) for backend operations while displaying user-friendly URLs (`localhost:4566`) in GUI
- **fix**: Shell script execution permissions in Docker containers
- **fix**: AWS credentials handling for LocalStack operations
- **fix**: JSON output cleaning and error handling

#### Frontend Enhancements

- **feat**: Dynamic form generation based on DynamoDB table schemas
- **feat**: Nested attribute support (Map, List) in DynamoDB item creation
- **feat**: Resource-specific viewing without additional selection steps
- **style**: Consistent UI/UX across all modals and forms
- **fix**: Primary key highlighting and column ordering in data tables

#### Infrastructure

- **refactor**: Docker-only workflow for simplified development
- **fix**: Node.js version update to 22-slim for better performance
- **fix**: Shell script debugging and error handling improvements

## Fixes

- fix(file-viewer): Register highlight.js languages and improve language detection for Python, JavaScript, TypeScript, and Java in FileViewerModal. Syntax highlighting now works for these languages based on file extension or content type.

---

## Angular Commit Standards

This project follows [Angular commit message conventions](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format):

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples

- `feat(dynamodb): add comprehensive table viewer with scan and query capabilities`
- `fix(shell): robust argument parsing for --config and --verbose flags`
- `style(forms): match input styling across all modals for consistency`
- `refactor(docker): simplify to Docker-only setup and update to Node 22`
- `docs: rename project from LocalStack Template to LocalStack Manager`
