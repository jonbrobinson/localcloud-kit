# Verify New Service Checklist

Run this command after adding a new service to LocalCloud Kit to verify it meets all project standards.

Usage: `/verify-new-service <ServiceName>`

---

You are performing a structured verification of a newly added service in LocalCloud Kit. Work through every item below. Report PASS ✅, FAIL ❌, or N/A for each item.

## Service Name

The service being verified is: **$ARGUMENTS**

---

## 1. Docker Compose (`docker-compose.yml`)

- [ ] Service block defined with correct `image`, `container_name`, `restart` policy
- [ ] Connected to `lck-network` bridge network
- [ ] Ports mapped correctly (host:container)
- [ ] Health check defined (if applicable)
- [ ] Environment variables use `.env` / `env.example` pattern (no hardcoded secrets)

## 2. Traefik Routing (`traefik/dynamic.yml`)

- [ ] Router entry added with rule `Host(\`<service>.localcloudkit.com\`) && PathPrefix(\`/\`)`
- [ ] TLS enabled via the existing `localcloud-cert` cert resolver
- [ ] Service entry points to correct internal port
- [ ] Entry point set to `localcloud` (port 3030)

## 3. Nginx (`nginx.conf`)

- [ ] Upstream block added: `upstream <service> { server <container>:<port>; }`
- [ ] Location block routes `/api/<service>/` to the upstream (if API-proxied)
- [ ] Or subdomain routing handled via Traefik (no Nginx change needed)

## 4. Hosts & Certificates

- [ ] Subdomain `<service>.localcloudkit.com` added to `scripts/setup-hosts.sh`
- [ ] Subdomain added to the mkcert SAN list in `scripts/setup-mkcert.sh`
- [ ] `MAILPIT.md` / relevant doc updated with "Existing Users — Required One-Time Steps" if the cert must be regenerated

## 5. API Server (`localcloud-api/server.js`)

- [ ] Status/health endpoint added: `GET /api/<service>/status`
- [ ] Any required proxy endpoints added under `/api/<service>/`
- [ ] Winston logging used for errors
- [ ] Endpoint documented inline with a short comment

## 6. GUI — Doc Page (`localcloud-gui/src/app/<service>/page.tsx`)

- [ ] `"use client"` directive present
- [ ] Uses `DocPageNav` component (not a custom header)
- [ ] `DocPageNav` receives correct `title` and `subtitle` props
- [ ] Service-specific action button passed as `children` to `DocPageNav`
- [ ] Connection settings table present (Host, Port, credentials, Web UI URLs)
- [ ] SDK/integration examples use `ThemeableCodeBlock` (not a custom CodeBlock)
- [ ] Language tabs default to `profile?.preferred_language` via `usePreferences()`
- [ ] Tab changes call `updateProfile({ preferred_language: tab })` to persist preference
- [ ] External resources table present with links to official docs
- [ ] Both Traefik URL (`https://<service>.localcloudkit.com:3030`) and direct URL (`http://localhost:<port>`) shown in the settings table

## 7. GUI — Dashboard Nav (`localcloud-gui/src/components/Dashboard.tsx`)

- [ ] Service added to the **Resources** dropdown (under appropriate section heading)
- [ ] Service added to the **Docs** dropdown linking to `/‌<service>`
- [ ] Service status badge added to the dashboard status bar

## 8. GUI — Docs Dropdown (`localcloud-gui/src/components/DocPageNav.tsx`)

- [ ] New service link added to the Docs dropdown in `DocPageNav`
- [ ] Placed under the correct section (Infrastructure / AWS Resources / Services)

## 9. Markdown Documentation (`docs/<SERVICE>.md`)

- [ ] File exists at `docs/<SERVICE>.md`
- [ ] Access table includes both Traefik URL and direct localhost URL
  - Traefik: `https://<service>.localcloudkit.com:3030`
  - Direct: `http://localhost:<port>`
- [ ] SMTP / connection settings listed (if applicable)
- [ ] API endpoints table included
- [ ] Make commands listed (e.g. `make <service>-logs`)
- [ ] "Existing Users — Required One-Time Steps" section included if new subdomain is added
- [ ] GUI URL references use `https://app-local.localcloudkit.com:3030` (not `http://localhost:3030`) for the main dashboard

## 10. Makefile

- [ ] `make <service>-logs` target added (tails container logs)
- [ ] Any other relevant targets added (restart, clear, etc.)

## 11. README.md & CHANGELOG.md

- [ ] New service listed in README.md features section
- [ ] Access URL added to README.md "Access URLs" table (both Traefik HTTPS and direct localhost)
- [ ] `CHANGELOG.md` has an entry under `## [Unreleased]` → `### Added` summarizing the new service
- [ ] CHANGELOG entry uses bold component name format: `- **ServiceName**: description`
- [ ] CHANGELOG entry is user-facing language (not implementation details)

## 12. CLAUDE.md

- [ ] Service added to the **Services** table in the Architecture section
- [ ] Subdomain listed in the Networking & Routing section
- [ ] "Adding a New Service" checklist still accurate (update if steps changed)

---

## Verification Summary

After checking all items, provide:

1. **Overall status**: PASS / FAIL / PARTIAL
2. **Failed items**: List each ❌ item with a brief explanation
3. **Recommended fixes**: Ordered list of changes needed to reach full compliance
4. **Auto-fix offer**: Ask the user if they want you to fix any failing items automatically
