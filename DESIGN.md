# LocalCloud Kit — DESIGN.md

This file documents the GUI's design system: the tokens, primitives, and
conventions that keep every screen visually consistent. It exists so that
**humans and AI agents can build new screens on-brand without re-deriving
these decisions from scratch** — the same idea as [Vercel's `design.md`
pattern](https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md).

`AGENTS.md` is still the single source of truth for project conventions,
commands, and architecture. This file is its design-specific companion —
read it before touching anything under `localcloud-gui/src/components/ui/`,
`globals.css`, or any screen's visual layer.

---

## Origin

The design system was introduced by implementing a Claude Design mockup
project ("LocalCloud Screens") into the real GUI. That mockup is the
visual reference this file's tokens and component patterns were extracted
from — it is not code, and isn't checked into this repo, but every
decision below traces back to it. If the visual system needs to evolve,
update the mockup first, then bring the change back here and into code
together.

Implemented screens: Dashboard, Create resource, S3 browser, DynamoDB
viewer, Redis cache, Connect, and the app header/status bar. Screens
outside that set (the per-service `/docs` pages, IAM, Lambda, API Gateway,
Secrets, SSM) still use the same shared tokens and primitives via
`ServiceStatusBadge`, `StatusCard`, and `ThemeableCodeBlock`, but haven't
had a full layout pass yet.

---

## Foundations

### Typography

- **Sans**: IBM Plex Sans, loaded via `next/font/google` in
  `src/app/layout.tsx`, exposed as `--font-plex-sans` and mapped to
  Tailwind's `font-sans` (the default).
- **Mono**: IBM Plex Mono, same mechanism, `--font-plex-mono` →
  `font-mono`.
- **Rule of thumb**: `font-mono` for anything the user would copy/paste or
  that's inherently technical — resource names, ARNs, table/bucket keys,
  endpoints, code. Plain prose and UI chrome stay `font-sans` (the
  default — you rarely need to set it explicitly).

### Color tokens

All colors are CSS custom properties in `src/app/globals.css`, bridged
into Tailwind v4 via `@theme inline` so they're usable as ordinary
utility classes (`bg-surface`, `text-ink-2`, `border-border-strong`, …).
**Never hardcode a hex value or a generic Tailwind color** (`gray-500`,
`indigo-600`) in a component — use the token so it responds to theme
changes automatically.

| Token | Light | Dark | Use for |
|---|---|---|---|
| `bg` | `#f4f4f7` | `#101014` | Page background |
| `surface` | `#ffffff` | `#18181c` | Cards, modals, the primary panel background |
| `surface-2` | `#fafafb` | `#1d1d22` | Nested panels, input backgrounds, table header rows |
| `surface-3` | `#f1f1f5` | `#232329` | Hover states, pills, segmented-control track |
| `border` | `#e6e6ec` | `#2c2c34` | Card/panel borders |
| `border-strong` | `#d9d9e0` | `#3a3a43` | Input borders, anything needing more contrast |
| `divider` | `#f2f2f5` | `#26262c` | Row separators inside a card |
| `ink` | `#18181b` | `#f4f4f5` | Primary text |
| `ink-2` | `#3f3f46` | `#d4d4d8` | Secondary text, labels |
| `muted` | `#71717a` | `#a1a1aa` | Tertiary text, help copy |
| `faint` | `#9a9aa3` | `#71717a` | Placeholder text, disabled icons |
| `primary` / `primary-hover` | `#4f46e5` / `#4338ca` | `#6366f1` / `#818cf8` | Primary actions, links, active states |
| `primary-soft` / `primary-ink` | `#eef2ff` / `#312e81` | `#282842` / `#c7d2fe` | Selected rows, active nav pills, soft badges |
| `danger` / `danger-hover` | `#dc2626` / `#b91c1c` | `#ef4444` / `#dc2626` | Destructive actions |
| `danger-soft` / `danger-ink` | `#fef2f2` / `#991b1b` | `#2a1618` / `#fca5a5` | Error banners, danger badges |
| `success` / `success-soft` / `success-ink` | `#16a34a` / `#dcfce7` / `#15803d` | `#22c55e` / `#14371f` / `#4ade80` | Healthy/active status |
| `warn` / `warn-soft` / `warn-ink` | `#d97706` / `#fef3c7` / `#92400e` | `#f59e0b` / `#3a2a10` / `#fcd34d` | Starting/pending status |
| `focus` | `rgba(79,70,229,.14)` | `rgba(99,102,241,.25)` | Focus rings (`ring-focus`) |
| `skeleton` | `#ececf1` | `#26262c` | Loading placeholders |
| `scrim` | `rgba(24,24,27,.45)` | `rgba(0,0,0,.6)` | Modal backdrops |

Every color has a `text-*`, `bg-*`, and `border-*` Tailwind utility
(e.g. `bg-danger-soft`, `text-danger-ink`, `border-primary`).

### Elevation

Three shadow tokens, `shadow-e1` / `shadow-e2` / `shadow-e3` (low → high).
`e1` is a resting card, `e2` is an open dropdown/popover, `e3` is a modal.
Don't reach for arbitrary `shadow-lg`/`shadow-xl` — pick the token that
matches the element's role.

### Theming

Three states, all driven by the same CSS tokens:

1. **No preference set** (`profile.theme === "auto"`, the default) — the
   dark palette activates via `@media (prefers-color-scheme: dark)`,
   following the OS.
2. **Explicit override** — `profile.theme` is `"light"` or `"dark"`;
   `PreferencesContext` applies `data-theme="dark"` (or removes the
   attribute for light) on `<html>`, which wins over the media query.
3. **Manual UI** — the Auto/Light/Dark `SegmentedControl` in the profile
   menu (`DashboardNavBar.tsx`), calling `updateProfile({ theme })`.

Because every component is built from tokens rather than hardcoded
colors, **no component needs its own dark-mode logic** — just use the
token classes and both themes work automatically. The one exception is
`ThemeableCodeBlock`'s syntax-highlighted `<pre>`, which follows the
user's chosen `highlight_theme` (a separate, orthogonal preference for
code coloring, not the app theme).

---

## Component primitives

`src/components/ui/` — import from `@/components/ui`. Build new UI from
these before reaching for raw `<button>`/`<input>`/`<div>` + Tailwind
classes; they're what keep spacing, radii, and states consistent across
screens.

| Component | Purpose | Key props |
|---|---|---|
| `Button` | Primary interactive element | `variant`: primary / secondary / ghost / danger · `size`: sm (28px) / md (32px) · `icon` (iconify name) · `loading` |
| `IconButton` | Icon-only square button | `variant`: outline / ghost · `size`: sm (28px) / md (32px) · `loading` (spins just the icon glyph, auto-disables) |
| `Badge` | Status pill with a colored dot | `tone`: success / danger / warn / neutral · `pulse` |
| `StatusDot` | Bare colored dot, no pill | same `tone`/`pulse` as `Badge` |
| `Input` | Text input | `mono`, `invalid` |
| `SearchInput` | Input with a baked-in search icon | — |
| `Card` | Surface panel: `bg-surface` + `border-border` + `rounded-xl` + `shadow-e1` | — |
| `SegmentedControl` | Tab-style toggle (billing mode, scan/query, theme picker) | `options`, `value`, `onChange`, `fullWidth` (stretch to fill a narrow container instead of sizing to content — required inside menu rows or anything under ~250px wide) |

**Radii**: `rounded-md` (6px) for small chrome, `rounded-lg` (8px) for
buttons/inputs/cards' default, `rounded-xl` (12px) for modals and larger
cards, `rounded-full` for pills and dots.

**Control heights**: 28px (`sm`) for dense toolbars and table-row
actions, 32px (`md`) for primary form fields and header actions. Pick one
per row — don't mix heights within the same toolbar.

---

## Icons

[`@iconify/react`](https://iconify.design)'s `<Icon icon="..." />`,
already a dependency. Two icon sets, used deliberately:

- **`lucide:*`** — all generic UI icons (search, refresh, plus, trash,
  chevrons, …). Consistent stroke weight, matches the mockup exactly.
- **`logos:aws-*`** — AWS service marks (`logos:aws-s3`,
  `logos:aws-dynamodb`, `logos:aws-lambda`, `logos:aws-api-gateway`,
  `logos:aws-secrets-manager`, `logos:aws-iam`,
  `logos:aws-systems-manager`) — always the official logo, never a
  generic `lucide:` substitute, so resource types stay visually
  identifiable at a glance.

**Trade-off worth knowing**: Iconify resolves icon SVGs from
`api.iconify.design` at runtime rather than bundling them at build time.
On a normal internet connection this is invisible, but it does mean icon
rendering depends on that endpoint being reachable — worth remembering if
this tool is ever run somewhere with restricted egress.

---

## Layout conventions

- Screen content is centered with a `max-width` (1180px for
  data-dense screens like Dashboard/S3/DynamoDB, ~1080px for
  narrower ones like Connect) and `padding: 24px`.
- Modals/dialogs sit on a `bg-scrim` backdrop, `shadow-e3`, `rounded-xl`,
  centered or top-anchored depending on expected content height (compare
  the Create Resource modal vs. a small confirm dialog).
- Tables: `grid-template-columns` with a checkbox column first, sticky
  header row on `surface-2`, `divide-y` via `border-divider`, row hover
  → `bg-surface-2`, selected row → `bg-primary-soft`.
- Status: a colored `StatusDot`/`Badge` (`success` = active/healthy,
  `warn` + `pulse` = starting/pending, `danger` = error/unreachable,
  `neutral` = stopped/unknown) is the app's one consistent way to signal
  state — don't invent a new status color scheme per screen.

---

## Adding a new screen or component

1. Reach for an existing `ui/` primitive before writing new markup.
2. Use token classes exclusively — if you need a color that isn't
   listed above, that's a sign to reconsider, not to hardcode a hex.
3. `lucide:` for UI icons, `logos:aws-*` for AWS services.
4. Pick control heights/radii from the scale above, don't introduce new
   ones for a single screen.
5. If the change is significant, mock it up first (Claude Design or
   otherwise) so the visual decision is made deliberately, then update
   this file alongside the implementation — same discipline as the
   original rollout.
