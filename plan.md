# Plan: Management Pages + Secrets Modal Fix

## Decision: Doc pages
Keep `/s3`, `/secrets`, etc. as pure documentation. Each will gain a prominent
"Open Manager →" button in its header that links to `/manage/[service]`.
This separates SDK reference (docs) from live resource management (manage pages).

---

## Summary of Changes

### New files (9)
1. `src/components/SecretsDetailModal.tsx` — single-secret lightweight modal
2. `src/app/manage/secrets/page.tsx` — full secrets management page
3. `src/app/manage/s3/page.tsx` — S3 management page
4. `src/app/manage/dynamodb/page.tsx` — DynamoDB management page
5. `src/app/manage/lambda/page.tsx` — Lambda management page
6. `src/app/manage/apigateway/page.tsx` — API Gateway management page
7. `src/app/manage/iam/page.tsx` — IAM management page
8. `src/app/manage/ssm/page.tsx` — SSM Parameter Store management page
9. `src/app/manage/layout.tsx` — shared management page wrapper (back link + consistent header)

### Modified files (13)
- `ResourceList.tsx` — change `onViewSecretsManager` signature to pass `secretName`; add "Manage →" navigation button to each resource type
- `Dashboard.tsx` — add `selectedSecretName` state; route secret clicks to SecretsDetailModal
- `SecretsManagerViewer.tsx` — add "Open full manager →" link to `/manage/secrets`
- `BucketViewer.tsx` — add "Open S3 Manager →" link to `/manage/s3`
- `DynamoDBViewer.tsx` — add "Open DynamoDB Manager →" link to `/manage/dynamodb`
- `LambdaCodeModal.tsx` — add "Open Lambda Manager →" link
- `SSMEditModal.tsx` — add "Open SSM Manager →" link
- `APIGatewayConfigViewer.tsx` — add "Open API Gateway Manager →" link
- `IAMConfigModal.tsx` — add "Open IAM Manager →" link
- `src/app/secrets/page.tsx` — add "Open Manager →" button in header
- `src/app/s3/page.tsx` — add "Open Manager →" button in header
- `src/app/dynamodb/page.tsx` — add "Open Manager →" button in header
- `src/app/lambda/page.tsx`, `apigateway/page.tsx`, `iam/page.tsx`, `ssm/page.tsx` — same

---

## Step-by-Step Implementation

### Step 1 — SecretsDetailModal (new component)
**File:** `src/components/SecretsDetailModal.tsx`

Props: `{ isOpen, onClose, secretName, projectName }`

Layout (lightweight preview + inline edit):
- Header: secret name + close button
- Metadata row: ARN (copy button), description, last changed date
- Secret value row: masked `••••••••` + eye-toggle button (calls GET ?includeValue=true)
- Inline edit section (collapsible): textarea for value + description field + Save/Cancel
- Footer: "Delete" (red, with confirmation) | "Open in Secrets Manager →" (links to /manage/secrets)

API usage:
- `GET /api/secrets/:secretName?includeValue=false` on open (metadata)
- `GET /api/secrets/:secretName?includeValue=true` on reveal
- `PUT /api/secrets/:secretName` on save
- `DELETE /api/secrets/:secretName?forceDelete=true` on delete

### Step 2 — Fix ResourceList.tsx
- Change `onViewSecretsManager?: () => void` → `onViewSecretsManager?: (secretName: string) => void`
- Change onClick in the secretsmanager button: `onClick={() => onViewSecretsManager(resource.name)}`
- Add "Manage →" secondary button for each resource type (small, right-arrow icon, navigates via `window.location.href` or `router.push` to `/manage/[type]`)

### Step 3 — Fix Dashboard.tsx
- Add state: `const [selectedSecretName, setSelectedSecretName] = useState<string>("")`
- Change handler: `onViewSecretsManager={(name) => { setSelectedSecretName(name); setShowSecretsManager(true); }}`
- Replace `SecretsManagerViewer` render with `SecretsDetailModal` when `selectedSecretName` is set:
  ```tsx
  {showSecretsManager && selectedSecretName && (
    <SecretsDetailModal
      isOpen={showSecretsManager}
      onClose={() => { setShowSecretsManager(false); setSelectedSecretName(""); }}
      secretName={selectedSecretName}
      projectName={projectName}
    />
  )}
  ```
- Keep `SecretsManagerViewer` for the "view all" case (no secretName), but this is now only reachable from the manage page

### Step 4 — /manage/secrets/page.tsx
Full-page Secrets Manager with:
- Page header: AWS Secrets Manager icon, "Secrets Manager" title, breadcrumb, "+ Create Secret" button
- Full CRUD list (reuse SecretsManagerViewer inner logic — not as a modal, as a page section)
- List of secrets with name, description, last changed, ARN
- Inline detail/edit panel when a secret is selected (same UI as SecretsDetailModal but without the modal chrome)
- Pagination support (nextToken)

### Step 5 — /manage/s3/page.tsx
- Fetch bucket list via GET /api/s3/buckets
- Sidebar or top-level list: bucket name, creation date, "Select" button
- Selected bucket: inline object browser (BucketViewer inner content — list files, upload, delete)
- "+ Create Bucket" button → opens S3ConfigModal

### Step 6 — /manage/dynamodb/page.tsx
- Fetch tables via GET /api/dynamodb/tables
- Table list with name, status, item count
- Selected table: inline DynamoDB item browser (scan, query, add item, delete item)
- "+ Create Table" button → opens DynamoDBConfigModal

### Step 7 — /manage/lambda/page.tsx
- Fetch functions via GET /api/lambda/functions
- List: function name, runtime, memory, timeout, last modified
- Selected function: inline detail showing handler, env vars, code size
- "+ Create Function" button → opens LambdaConfigModal
- "View Code" action → opens LambdaCodeModal inline

### Step 8 — /manage/apigateway/page.tsx
- Fetch APIs via GET /api/apigateway/apis
- List: API name, ID, description, created date
- Selected API: inline APIGatewayConfigViewer content (resources, methods, deploy)
- "+ Create API" button → opens APIGatewayConfigModal

### Step 9 — /manage/iam/page.tsx
- Fetch roles via GET /api/iam/roles
- List: role name, ARN, created date, assumed-by principal
- Selected role: inline policies panel (list attached/inline policies)
- "+ Create Role" button → opens IAMConfigModal

### Step 10 — /manage/ssm/page.tsx
- Fetch parameters via GET /api/ssm/parameters
- List: parameter name, type (String/SecureString/StringList), last modified
- Selected parameter: inline edit panel (SSMEditModal content without modal chrome)
- "+ Create Parameter" button → opens SSMConfigModal
- Inline delete with confirmation

### Step 11 — /manage/layout.tsx
Shared wrapper:
```tsx
export default function ManageLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
```

### Step 12 — Add "Open Manager →" to existing modals
For each of these, add a small link/button in the modal header or footer:
- `BucketViewer` header → "Open S3 Manager →" → `/manage/s3`
- `DynamoDBViewer` header → "Open DynamoDB Manager →" → `/manage/dynamodb`
- `SecretsManagerViewer` header → "Open Secrets Manager →" → `/manage/secrets`
- `LambdaCodeModal` header → "Open Lambda Manager →" → `/manage/lambda`
- `SSMEditModal` header → "Open SSM Manager →" → `/manage/ssm`
- `APIGatewayConfigViewer` header → "Open API Gateway Manager →" → `/manage/apigateway`
- `IAMConfigModal` header → "Open IAM Manager →" → `/manage/iam`

### Step 13 — Add "Open Manager →" to each doc page header
For each doc page (`/s3`, `/secrets`, `/dynamodb`, `/lambda`, `/apigateway`, `/iam`, `/ssm`):
Add a `Link` component button near the existing action button:
```tsx
<Link href="/manage/secrets" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
  Open Manager →
</Link>
```

### Step 14 — Update Resources dropdown in Dashboard nav
For each service in the Resources dropdown, add a "Manage →" link alongside the existing Create action. This gives users direct access to management pages from the top nav.

### Step 15 — GUI build + verify
```bash
cd localcloud-gui && npm run build
```
Fix any TypeScript errors before committing.

### Step 16 — Update CHANGELOG.md (PR step)
Single entry under `## [Unreleased]`:
```markdown
### Added
- **Manage Pages**: dedicated /manage/[service] pages for all AWS resources (S3, DynamoDB, Secrets Manager, Lambda, API Gateway, IAM, SSM Parameter Store) — list + full CRUD + inline detail/edit view
- **SecretsDetailModal**: clicking a secret on the dashboard now opens a single-secret detail modal (name, ARN, masked value with reveal toggle, inline edit, delete) instead of the full secrets list

### Fixed
- **SecretsManagerViewer**: clicking a secret from the resource list no longer opens all secrets; the correct single secret is shown
```

---

## Architecture Notes

**Modal role after this change:**
- Dashboard modals = lightweight preview of the specific resource clicked, plus "Manage →" link
- `/manage/[service]` pages = full list + CRUD + detail/edit view
- Doc pages = SDK reference only; "Open Manager →" button at top

**Navigation paths to management pages:**
1. Dashboard resource list → click resource → lightweight modal → "Open in Manager →" link
2. Dashboard nav Resources dropdown → "Manage →" link per service (new)
3. Doc pages → "Open Manager →" button in header
