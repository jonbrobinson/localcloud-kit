## Summary

<!-- What does this PR do? 1–3 bullets on the user-visible change. -->

-
-

## Type of change

<!-- Check all that apply -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code restructure, no behavior change
- [ ] `docs` — documentation only
- [ ] `build` / `chore` — infra, deps, tooling
- [ ] `BREAKING CHANGE` — existing behavior changed or removed

## Pre-merge checklist

### Code
- [ ] All commits follow Angular Conventional Commits (`<type>(<scope>): <subject>`)
- [ ] No hardcoded secrets, credentials, or localhost-only assumptions
- [ ] TypeScript strict mode — no `any` types introduced without justification

### New service (skip if not applicable — run `/verify-new-service <Name>` for full check)
- [ ] `docker-compose.yml` service block added
- [ ] Traefik router + TLS entry added
- [ ] GUI doc page uses `DocPageNav` + `ThemeableCodeBlock` + `usePreferences`
- [ ] Dashboard Resources dropdown + Docs dropdown + status bar updated
- [ ] `DocPageNav` Docs dropdown updated
- [ ] `docs/<SERVICE>.md` created with both Traefik and direct localhost URLs

### Documentation & changelog
- [ ] `CHANGELOG.md` updated under `## [Unreleased]` with user-facing summary
- [ ] `README.md` updated if access URLs or features changed
- [ ] `AGENTS.md` / IDE entry (`CLAUDE.md`) updated if architecture, services table, or conventions changed
- [ ] Relevant `docs/*.md` files updated with current domain/URL info

## CHANGELOG entry

<!-- Paste the exact lines you added to CHANGELOG.md [Unreleased] here -->

```markdown
### Added / Changed / Fixed
- **ComponentName**: ...
```
