# Contributing to LocalCloud Kit

Thank you for considering contributing to LocalCloud Kit! We welcome contributions that help make local AWS development easier for everyone.

## 🎯 What We're Looking For

We especially welcome:
- **🐛 Bug fixes** - Help us squash those bugs
- **🎨 UI improvements** - Make the interface better and more intuitive
- **☁️ AWS service integrations** - Add support for more AWS Emulator services

We also appreciate:
- Documentation improvements
- Performance optimizations
- Code quality enhancements

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/localcloud-kit.git
   cd localcloud-kit
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feat/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```
4. **Start the development environment**:
   ```bash
   make start
   # or
   docker compose up --build
   ```
5. **Make your changes** and test them locally
6. **Commit using Angular style** (see below)
7. **Push to your fork** and **create a Pull Request**

## 📝 Commit Message Format

We use the [Angular commit message convention](https://www.conventionalcommits.org/). This helps us automatically generate changelogs.

### Format
```
type(scope): subject

body (optional)
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **refactor**: Code refactoring (no functional changes)
- **chore**: Maintenance tasks (dependencies, build process)
- **style**: Code style changes (formatting, missing semi-colons)

### Examples
```bash
feat(s3): add support for S3 bucket versioning

fix(dynamodb): resolve GSI query pagination issue

docs(readme): update installation instructions

refactor(api): simplify error handling in cache endpoints

chore(deps): update Next.js to 15.3.4
```

### Scope
Common scopes in this project:
- `s3`, `dynamodb`, `secrets`, `cache` - AWS service features
- `api` - Backend API changes
- `gui` - Frontend/UI changes
- `docker` - Docker/containerization
- `scripts` - Shell scripts
- `readme`, `docs` - Documentation

## 🔍 Pull Request Process

1. **Ensure your code follows our standards**:
   - Run ESLint and Prettier before committing
   - Code should be clean and well-commented where necessary
   - Test your changes locally with Docker

2. **Update documentation**:
   - Update README.md if you've added features or changed functionality
   - Add entry to CHANGELOG.md under `[Unreleased]` section
   - Update relevant documentation files in `docs/` if applicable

3. **Create a clear Pull Request**:
   - Use a descriptive title (following commit message format)
   - Describe what changed and why
   - Include screenshots for UI changes
   - Reference any related issues

4. **Code Review**:
   - All PRs require review before merging
   - Address review feedback promptly
   - Be open to discussion and suggestions

## 💻 Code Standards

### JavaScript/TypeScript
- Use **ESLint** and **Prettier** for code formatting
- Run linting before committing:
  ```bash
  # In localcloud-gui/
  npm run lint
  ```

### React Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Use TypeScript for type safety

### API Endpoints
- Follow RESTful conventions
- Include proper error handling
- Return consistent response formats

### Shell Scripts
- POSIX-compliant (work on macOS, Linux, WSL)
- Include comments for complex logic
- Set executable permissions: `chmod +x script.sh`

## 🧪 Testing Your Changes

While we don't have automated tests yet, please:

1. **Test locally** with Docker:
   ```bash
   make start
   # Test your changes in the GUI at http://localhost:3030
   ```

2. **Check core functionality**:
   - Can you create/delete resources?
   - Does the UI render correctly?
   - Are API endpoints responding as expected?

3. **Test across browsers** (for UI changes):
   - Chrome/Edge
   - Firefox
   - Safari (if on macOS)

4. **Verify Docker build** succeeds:
   ```bash
   docker compose build
   ```

## 📚 Project Structure

```
localcloud-kit/
├── localcloud-gui/        # Next.js frontend
│   ├── src/components/    # React components
│   ├── src/services/      # API client functions
│   └── src/types/         # TypeScript types
├── localcloud-api/        # Express.js backend
│   └── server.js          # Main API server
├── scripts/shell/         # Shell automation scripts
├── docs/                  # Documentation files
└── samples/               # Sample test files
```

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Docker version)
- Screenshots if applicable

## 💡 Suggesting Features

Have an idea? Open an issue with:
- Description of the feature
- Use case / why it's needed
- Any implementation ideas (optional)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to:
- Open an issue for questions
- Start a discussion in GitHub Discussions
- Check existing issues and PRs for similar topics

---

**Thank you for contributing to LocalCloud Kit!** 🎉

