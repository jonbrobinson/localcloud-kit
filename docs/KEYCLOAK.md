# Keycloak — Identity & Access Management

Keycloak is an open-source Identity Provider (IdP) for authentication and authorization. In LocalCloud Kit it runs in development mode so you can build and test OAuth 2.0, OIDC, and SSO flows locally without a cloud account.

## Access

| Interface | URL |
|-----------|-----|
| Admin Console (via Traefik) | https://keycloak.localcloudkit.com:3030 |
| Admin Console (direct) | http://localhost:8080 |

**Default admin credentials:**

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin` |

> Keycloak runs with `start-dev` — all data resets when the container restarts. For persistence, mount a volume in `docker-compose.yml`.

---

## Existing Users — Required One-Time Steps

If you already have LocalCloud Kit running and are adding Keycloak for the first time, two quick steps are needed before `make start`:

**1. Regenerate your TLS certificate** (adds `keycloak.localcloudkit.com` to the cert's SAN list):

```bash
sudo ./scripts/setup-mkcert.sh
```

**2. Add the Keycloak hostname to `/etc/hosts`**:

```bash
sudo ./scripts/setup-hosts.sh
```

Then restart:

```bash
make restart
```

---

## Key OIDC Endpoints

Replace `{realm}` with your realm name (default: `master`).

| Endpoint | URL |
|----------|-----|
| Discovery document | `http://localhost:8080/realms/{realm}/.well-known/openid-configuration` |
| Authorization | `http://localhost:8080/realms/{realm}/protocol/openid-connect/auth` |
| Token | `http://localhost:8080/realms/{realm}/protocol/openid-connect/token` |
| Userinfo | `http://localhost:8080/realms/{realm}/protocol/openid-connect/userinfo` |
| JWKS | `http://localhost:8080/realms/{realm}/protocol/openid-connect/certs` |
| Logout | `http://localhost:8080/realms/{realm}/protocol/openid-connect/logout` |

---

## Quick Setup: Create a Realm and Client

1. Open the [Admin Console](http://localhost:8080) and log in with `admin` / `admin`
2. Create a new realm (e.g. `localdev`) via the dropdown in the top-left
3. Under **Clients**, create a new client:
   - **Client ID**: `my-app`
   - **Client authentication**: On (confidential) or Off (public)
   - **Valid redirect URIs**: `http://localhost:3000/*`
4. Copy the **Client Secret** from the **Credentials** tab

---

## Integration Examples

### Node.js (`openid-client`)

```js
import { Issuer, generators } from "openid-client";

const issuer = await Issuer.discover(
  "http://localhost:8080/realms/localdev"
);

const client = new issuer.Client({
  client_id: "my-app",
  client_secret: "YOUR_CLIENT_SECRET",
  redirect_uris: ["http://localhost:3000/callback"],
  response_types: ["code"],
});

// Generate authorization URL
const codeVerifier = generators.codeVerifier();
const codeChallenge = generators.codeChallenge(codeVerifier);

const authUrl = client.authorizationUrl({
  scope: "openid email profile",
  code_challenge: codeChallenge,
  code_challenge_method: "S256",
});
```

### Node.js (`next-auth`)

```js
// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";

const handler = NextAuth({
  providers: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "oauth",
      wellKnown:
        "http://localhost:8080/realms/localdev/.well-known/openid-configuration",
      clientId: "my-app",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      profile(profile) {
        return { id: profile.sub, name: profile.name, email: profile.email };
      },
    },
  ],
});

export { handler as GET, handler as POST };
```

### Python (`python-keycloak`)

```python
from keycloak import KeycloakOpenID

keycloak_openid = KeycloakOpenID(
    server_url="http://localhost:8080/",
    client_id="my-app",
    realm_name="localdev",
    client_secret_key="YOUR_CLIENT_SECRET",
)

# Get token (resource owner password flow — for testing only)
token = keycloak_openid.token("username", "password")
print(token["access_token"])

# Decode / verify token
userinfo = keycloak_openid.userinfo(token["access_token"])
print(userinfo)
```

### cURL — Client Credentials Grant

```bash
curl -X POST http://localhost:8080/realms/localdev/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=my-app" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### Environment Variables

A common pattern for configuring apps against a local Keycloak instance:

```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=localdev
KEYCLOAK_CLIENT_ID=my-app
KEYCLOAK_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

---

## Make Commands

```bash
make keycloak-logs    # Tail Keycloak container logs
```

---

## API Endpoints

The LocalCloud API exposes a status endpoint for Keycloak:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/keycloak/status` | GET | HTTP health check with TCP fallback |

```bash
curl https://app-local.localcloudkit.com:3030/api/keycloak/status
```

The health check first tries `http://keycloak:8080/health/ready`. If unavailable (e.g. Keycloak is still starting), it falls back to a TCP port check on 8080.

---

## Notes

- Keycloak runs in **development mode** (`start-dev`) — not suitable for production use
- All realm and user data is ephemeral and resets on container restart
- For persistent data, add a volume mount to the `keycloak` service in `docker-compose.yml`
- The Keycloak Admin REST API is available at `http://localhost:8080/admin/realms/{realm}`
