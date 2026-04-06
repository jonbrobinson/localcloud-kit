# LocalCloud Kit — AGENTS.md

This file is the single source of truth for project context and standards in
this repository. All AI coding agents read from this file.

---

## Project Overview

**LocalCloud Kit** is a free, local AWS development environment. It emulates AWS
cloud services using MiniStack (a free AWS emulator), managed through a Next.js web GUI and an
Express.js API backend, all orchestrated via Docker Compose. No AWS account is
required.

- **Version**: 0.13.3
- **License**: MIT
- **Primary URL**: https://app-local.localcloudkit.com:3030

---

## Architecture

### Services (docker-compose.yml)

| Service | Container | Image | Port | Purpose |
|---------|-----------|-------|------|---------|
| `traefik` | traefik | traefik:v3 | 3030 (HTTPS entry) | Reverse proxy / TLS termination |
| `aws-emulator` | aws-emulator | nahuelnucera/ministack:latest | 4566 | AWS services emulation (MiniStack) |
| `gui` | localcloud-gui | custom (Dockerfile.gui) | 3030 (internal) | Next.js frontend |
| `api` | localcloud-api | custom (Dockerfile.api) | 3031 | Express.js backend |
| `nginx` | localcloud-nginx | nginx:alpine | 80 (internal) | Internal routing |
| `redis` | localcloud-redis | redis:7-alpine | 6380 (host) | Cache service |
| `posthog-*` | localcloud-posthog-* | posthog/clickhouse/kafka stack | — | Product analytics stack |

All services communicate over the `lck-network` Docker bridge network.

### Key Directories

```
localcloud-api/     # Express.js API server (routes/ + server.js, Node 22)
localcloud-gui/     # Next.js 15 frontend (App Router, TypeScript, Tailwind)
scripts/            # Setup scripts + 30+ AWS shell automation scripts
traefik/            # Traefik reverse proxy config + TLS certs
docs/               # Extended documentation (one .md per service)
samples/            # Sample files for S3/DynamoDB testing
```

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript 5, Tailwind CSS, @iconify/react (AWS service icons)
- **Backend**: Express.js 4, Node.js 22, Winston logging, Socket.IO, aws-sdk v2
- **Infrastructure**: Docker Compose, Traefik v3, Nginx (alpine), Redis 7, optional PostHog profile
- **AWS Emulation**: MiniStack (S3, DynamoDB, Lambda, API Gateway, IAM, Secrets Manager)

---

## AWS Services Emulated

- **S3** — bucket management, multipart uploads (up to 100MB), nested folders
- **DynamoDB** — tables, CRUD, GSI, query/scan
- **Lambda** — function management, runtime/handler config, placeholder zip creation; upload real code via `update-function-code`
- **API Gateway** — REST endpoint creation with name and description
- **IAM** — identity & access management, roles, policies
- **STS** — temporary session credentials (GetSessionToken, AssumeRole, GetCallerIdentity)
- **Secrets Manager** — secret storage, encryption, ARN management
- **SSM Parameter Store** — parameter management (String, StringList, SecureString)
- **Redis** — local cache (not AWS, but integrated into the GUI)

### Saved Configs

All AWS resource creation modals support **saved configs**:
- Users can toggle "Save as config for future use" and give the config a name
- Saved configs are stored per-project via `savedConfigsApi` and surfaced as clickable pills in the modal
- Clicking a pill loads its values into the form
- Config data flows: modal → `usePreferences().saveConfig()` → `savedConfigsApi.create()` → backend → SQLite
- Resource types for saved configs: `s3`, `dynamodb`, `lambda`, `apigateway`, `secretsmanager`, `ssm`

---

## Common Commands

```bash
make start          # Start all services (including PostHog)
make stop           # Stop all services
make restart        # Restart all services
make status         # Health check all services
make logs           # Live log tailing
make reset          # Stop + clean volumes
make clean-all      # Remove all Docker resources

./scripts/setup.sh  # One-command first-time setup
```

---

## Environment Variables

See `env.example` for all variables. Key ones:

```
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://aws-emulator:4566
API_URL=https://app-local.localcloudkit.com:3030/api
CORS_ORIGIN=https://app-local.localcloudkit.com:3030
POSTHOG_INTERNAL_URL=http://posthog-web:8000
```

---

## Networking & Routing

- Traefik listens on port 3030 (HTTPS) and routes to Nginx
- Nginx fans traffic to the GUI (port 3030) and API (port 3031)
- AWS Emulator (MiniStack) is reachable at `http://aws-emulator:4566` inside Docker, `http://localhost:4566` from the host
- Redis is at `localcloud-redis:6379` inside Docker, `localhost:6380` from the host
- PostHog (when profile enabled) is routed via `https://posthog.localcloudkit.com:3030`
- TLS certificates are generated with mkcert and mounted into Traefik

---

## Adding a New Service

When adding a new service (e.g., Mailpit):

1. **docker-compose.yml** — add the service block with the image, ports, network, and restart policy
2. **traefik/dynamic.yml** — add a router and service entry if it needs HTTPS routing through Traefik
3. **nginx.conf** — add an upstream and location block if it routes through Nginx
4. **localcloud-api/routes/** — add an API route file; register it in `server.js`
5. **localcloud-gui/src/** — add GUI pages/components for managing the service
6. **docs/** — add a markdown doc describing the service and its usage
7. **Makefile** — add convenience targets if applicable
8. **README.md / CHANGELOG.md** — update to document the new service
9. **Dashboard.tsx** — add to Resources, Services, and Docs dropdowns as appropriate

---

## Changelog Standards

**CHANGELOG.md is updated once per PR — not per commit.**

### When to update

Update `CHANGELOG.md` as the **last step before opening a PR**, after all commits
are ready. Never update it mid-feature or on every commit.

### Format — Keep a Changelog (https://keepachangelog.com)

Entries go under `## [Unreleased]` at the top of the file. Use these subsections
(omit any that don't apply):

```markdown
## [Unreleased]

### Added
- **ComponentName**: description of new user-visible capability

### Changed
- **ComponentName**: description of changed behavior

### Fixed
- **ComponentName**: description of what was broken and is now fixed

### Removed
- **ComponentName**: what was removed and why

### Security
- description of security fix
```

### Rules

- **One entry per PR** — summarize the net user-visible effect, not the implementation steps
- **Bold the component/scope** — matches the Angular commit scope for traceability: `- **DocPageNav**: ...`
- **User-facing language** — write for someone reading the changelog to understand what changed, not how
- **Angular type → changelog section mapping**:
  - `feat` → `### Added`
  - `fix` → `### Fixed`
  - `refactor` / `perf` → `### Changed` (only if user-visible)
  - `docs` / `style` / `chore` / `build` / `ci` → omit unless user-facing
  - `revert` → `### Fixed` or `### Changed` depending on impact
- **Breaking changes** (`feat!` / `BREAKING CHANGE:`) → always appear in `### Changed` or `### Removed` with a `⚠️` prefix

### Example

```markdown
## [Unreleased]

### Added
- **IAM**: doc page with IAM roles and STS session credential examples (TypeScript, Node.js, Python, CLI)

### Fixed
- **ThemeableCodeBlock**: syntax highlighting now works for bash/CLI code blocks; theme preference is persisted to user profile
```

---

## Attribution

- **Author**: The commit author must always be a human. No automated coding tool or AI agent may appear as the commit author.
- **Co-author**: Use `Co-Authored-By:` only for human collaborators. Never include AI agents in author or co-author fields.
- **No AI attribution**: Do not add `Co-Authored-By:` lines for bots, assistants, or AI products in commit messages or footers.
- **No AI badges**: Do not add vendor AI-generation lines (for example “generated with … assistant”) in PR descriptions, commit bodies, or other output.
- **Default author**: The correct git author for this repo is `Jonathan Robinson <jonrobinson.codes@gmail.com>`. Before committing, verify `git config user.name` and `git config user.email` match this identity.

---

## Pre-Commit Checklist

Run through every applicable item before committing. Order matters: build first,
docs second, changelog last (PR step only).

### 1 — GUI Lint (required for any `localcloud-gui/` change)

```bash
cd localcloud-gui && npm run lint
```

- Must pass with **zero errors** — fix all errors before committing
- `@typescript-eslint/no-unused-vars` is set to **error**: remove every unused import, variable, and function before committing
- Warnings (e.g. `no-explicit-any`, `react-hooks/exhaustive-deps`) are acceptable; errors are not
- Skip only for backend-only or shell-script-only changes; run it when in doubt

### 2 — GUI Build (required for any `localcloud-gui/` change)

```bash
cd localcloud-gui && npm run build
```

- Must pass with **no type errors** — fix all errors before committing
- Warnings are acceptable; type errors and compile failures are not
- Skip only for backend-only or shell-script-only changes; run it when in doubt

### 3 — Documentation Update

Update the matching `docs/` markdown file whenever you change behaviour, add
endpoints, rename things, or add a new service. **If the code changed, the docs
change too.**

| Change type | Files to update |
|---|---|
| New AWS service or platform service | `docs/<SERVICE>.md` (create if missing), `README.md` features list |
| New or changed API endpoint | `docs/<SERVICE>.md` — endpoint reference table |
| New GUI page or major UI change | `docs/<SERVICE>.md` — usage section |
| Changed port, hostname, or env var | `docs/<SERVICE>.md`, `README.md` configuration section, `AGENTS.md` if it references the value |
| New or changed shell script | `docs/SETUP_SCRIPTS.md` — script inventory |
| New Docker service | `docker-compose.yml` comment block + `docs/DOCKER.md` |
| Changed Makefile target | `README.md` common commands section |

Docs live in `docs/` as plain markdown. Keep them concise: overview, connection
settings or config, common operations, troubleshooting tips. Do **not** duplicate
the SDK examples from the GUI doc pages verbatim — link to the relevant `/route`
instead.

### 4 — README Update

Update `README.md` when any of the following change:

- **Features list** — add a bullet for a new service or major capability
- **Services table** — ports, image names, or purpose text
- **Common commands** — new or renamed `make` targets
- **Documentation section** — links to new `docs/` pages
- **Version badge** — bump when the version in `docker-compose.yml` / `package.json` changes

The README is user-facing. Write in plain, direct language. Do not include
internal implementation details.

### 5 — Changelog Update (PR step only)

`CHANGELOG.md` is updated **once per PR**, as the last commit before opening the
PR — never mid-feature. See the Changelog Standards section above.

---

## Commit Message Standards (Angular Conventional Commits)

**ALL commits MUST follow the Angular Conventional Commits format. This is a hard
requirement — never deviate from it.**

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code restructure with no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system, Docker, dependencies |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks (deps, tooling) |
| `revert` | Reverts a previous commit |

### Rules

- **Subject line**: 72 characters max, lowercase, no trailing period, imperative mood ("add" not "added")
- **Scope**: optional, lowercase, describes the area changed — e.g. `feat(iam)`, `fix(api)`, `docs(redis)`
- **Body**: wrap at 100 characters; explain *why*, not *what*
- **Breaking changes**: add `BREAKING CHANGE:` in the footer, or append `!` after the type: `feat(api)!:`
- **The session URL** goes in the footer on its own line (already required by other instructions)

### Examples

```
feat(iam): add STS session credentials and IAM doc page

fix(lambda): resolve syntax highlighting failures in code blocks

docs(redis): update container hostname to localcloud-redis

build(docker): pin ministack image to 1.x for stability

refactor(nav): extract shared DocPageNav component

chore(deps): upgrade next.js to 15.2
```

---

## Dashboard UI Architecture

The dashboard (`localcloud-gui/src/components/Dashboard.tsx`) is organized around
a clear two-category model:

### Two Categories of Things

| Category | Examples | Managed via | Can destroy? |
|----------|----------|-------------|--------------|
| **Platform Services** | Keycloak, Mailpit, PostgreSQL, PostHog, Redis | Their own admin UIs | No — Docker Compose lifecycle |
| **AWS Resources** | S3, DynamoDB, Lambda, API Gateway, IAM | Dashboard modals | Yes — individually, per project |

### Navigation Structure

- **Resources** dropdown — AWS resources grouped by service category (Storage, Database, Compute, Networking, Security & Identity). Uses Iconify AWS logos (`logos:aws-s3`, `logos:aws-dynamodb`, etc.).
- **Services** dropdown — Platform services only, listed alphabetically.
- **Docs** dropdown — Documentation pages grouped as Infrastructure / AWS Resources / Platform Services.

### Status Bar

Shows health of all platform services in alphabetical order: **AWS Emulator | Keycloak | Mailpit | PostgreSQL | PostHog | Redis**. Clicking a service opens its management modal or links to its doc page.

### ResourceList Component

`localcloud-gui/src/components/ResourceList.tsx` — shows **AWS resources only** (no platform services). Resources are grouped by AWS category with official AWS SVG icons via `@iconify/react`. Supports add, destroy, and inline preview per resource type.

### Mailpit UX

- **Status bar** — click to open `MailpitModal` (read-only inbox preview + unread badge)
- **MailpitModal** — shows recent messages (read-only), stats bar, one-click "Send Test" button, links to Mailpit UI and docs
- **`/mailpit` doc page** — full test email compose form (from, to, subject, body), SMTP settings, framework integration examples


---

## Syntax Highlighting on Doc Pages

All doc pages use `ThemeableCodeBlock` (`localcloud-gui/src/components/ThemeableCodeBlock.tsx`) for syntax-highlighted code examples.

### How it works

- **Highlighting engine**: `highlight.js` via `hljs.highlight(code, { language })` — runs client-side only (`"use client"`)
- **Theme CSS**: Injected into `<head>` as a `<link>` tag pointing to `/public/hljs-themes/<file>.css`; available themes are declared in `highlightThemes.ts`
- **Language mapping**: The `languageMap` object inside `ThemeableCodeBlock` translates the `language` prop (e.g. `"cli"`, `"node"`, `"bash"`) into an `hljs` language identifier. **Always add a mapping for every language string you pass as a prop.** Missing entries fall through to `"text"` (no highlighting).

### Profile preferences

Two fields in the user profile drive this component's behaviour:

| Field | Purpose |
|---|---|
| `preferred_language` | Which SDK tab is active (e.g. `"typescript"`, `"node"`, `"python"`, `"cli"`) |
| `highlight_theme` | Which syntax theme to render (e.g. `"github"`, `"atom-one-dark"`) |

**Reading preferences** — initialise the active tab from `profile.preferred_language` inside a `useEffect` that watches that field:

```typescript
const { profile, updateProfile } = usePreferences();
const [activeTab, setActiveTab] = useState<PageTab>("typescript");

useEffect(() => {
  if (profile?.preferred_language) {
    const lang = profile.preferred_language as PageTab;
    setActiveTab(PAGE_TABS.includes(lang) ? lang : "typescript");
  }
}, [profile?.preferred_language]);
```

**Saving preferences** — call `updateProfile` whenever the user switches tabs or changes the theme. `ThemeableCodeBlock` saves `highlight_theme` automatically on theme selector change. For the language tab, the page-level handler must persist it:

```typescript
const handleTabChange = (tab: PageTab) => {
  setActiveTab(tab);
  updateProfile({ preferred_language: tab }).catch(() => {});
};
```

### Rules

- **Always** use `language` prop values that exist in `languageMap` (`"typescript"`, `"javascript"`, `"python"`, `"bash"`, `"cli"`) — do **not** invent new strings without adding them to the map first
- Pass `language="bash"` or `language="cli"` (both work) for shell/CLI examples
- Pass `language="javascript"` for Node.js examples (not `"node"`)
- Pass `showThemeSelector={false}` for inline snippets that don't need a theme picker
- When a doc page has **multiple independent code sections**, drive all tab bars from a **single shared** `activeTab` state so switching language in one section updates all others automatically

---

## Code Conventions

- **API routes** follow `/api/<resource>` pattern; route files live in `localcloud-api/routes/`
- **GUI pages** use Next.js App Router under `localcloud-gui/src/app/`
- **Shell scripts** are POSIX-compatible and live in `scripts/shell/`
- **Logging** uses Winston on the backend; errors go to `logs/error.log`
- **Docker images** use `node:22-alpine` as the base for Node services
- **TypeScript** strict mode is enabled in the GUI

---

## Git Branch Convention

- All agent work happens on branches prefixed `agents/` followed by a short description and a unique session ID suffix
- Example: `agents/add-iam-roles-emulator-OWviN`
- **Never push to `main` directly**
- Always push with `git push -u origin <branch-name>`
