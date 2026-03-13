"use client";

import {
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const KEYCLOAK_TRAEFIK_URL = "https://keycloak.localcloudkit.com:3030";
const KEYCLOAK_DIRECT_URL = "http://localhost:8080";

function useKeycloakBaseUrl() {
  const [baseUrl, setBaseUrl] = useState(KEYCLOAK_TRAEFIK_URL);
  useEffect(() => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    setBaseUrl(isLocalhost ? KEYCLOAK_DIRECT_URL : KEYCLOAK_TRAEFIK_URL);
  }, []);
  return baseUrl;
}

// Maps from PreferredLanguage to Keycloak tab keys
const LANG_TO_TAB: Record<string, "nodejs" | "python" | "curl" | "envvars"> = {
  typescript: "nodejs",
  node: "nodejs",
  python: "python",
  go: "curl",
  java: "curl",
  cli: "curl",
};

const codeExamples = {
  nodejs: `// npm install openid-client
import { Issuer } from "openid-client";

async function main() {
  const issuer = await Issuer.discover(
    "http://localhost:8080/realms/master"
  );

  const client = new issuer.Client({
    client_id: "my-app",
    client_secret: "your-client-secret",
    redirect_uris: ["http://localhost:3000/callback"],
    response_types: ["code"],
  });

  // Generate auth URL
  const authUrl = client.authorizationUrl({
    scope: "openid email profile",
  });
  console.log("Auth URL:", authUrl);
}

main();`,
  python: `# pip install python-keycloak
from keycloak import KeycloakOpenID

keycloak = KeycloakOpenID(
    server_url="http://localhost:8080",
    realm_name="master",
    client_id="my-app",
    client_secret_key="your-client-secret",
)

# Get token (Resource Owner Password flow — dev only)
token = keycloak.token("admin", "admin")
print("Access token:", token["access_token"][:50], "...")

# Introspect token
userinfo = keycloak.userinfo(token["access_token"])
print("User:", userinfo)`,
  curl: `# Get an access token (Resource Owner Password — dev only)
curl -s -X POST \\
  http://localhost:8080/realms/master/protocol/openid-connect/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=admin-cli" \\
  -d "username=admin" \\
  -d "password=admin" \\
  -d "grant_type=password" | jq .access_token

# Get realm info
curl -s http://localhost:8080/realms/master | jq .

# Create a new realm (requires admin token)
curl -s -X POST \\
  http://localhost:8080/admin/realms \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"realm": "my-app", "enabled": true}'`,
  envvars: `# .env — configure your app to use local Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=my-app
KEYCLOAK_CLIENT_SECRET=your-client-secret

# OIDC discovery URL
OIDC_ISSUER=http://localhost:8080/realms/master
OIDC_JWKS_URI=http://localhost:8080/realms/master/protocol/openid-connect/certs
OIDC_TOKEN_URL=http://localhost:8080/realms/master/protocol/openid-connect/token
OIDC_AUTH_URL=http://localhost:8080/realms/master/protocol/openid-connect/auth`,
};

export default function KeycloakPage() {
  const { profile } = usePreferences();
  const [activeTab, setActiveTab] = useState<"nodejs" | "python" | "curl" | "envvars">("nodejs");
  const keycloakBaseUrl = useKeycloakBaseUrl();

  useEffect(() => {
    if (profile?.preferred_language) {
      const mapped = LANG_TO_TAB[profile.preferred_language];
      if (mapped) setActiveTab(mapped);
    }
  }, [profile?.preferred_language]);
  const keycloakAdminUrl = `${keycloakBaseUrl}/admin`;

  const resources = [
    {
      name: "Keycloak Admin Console",
      url: keycloakAdminUrl,
      description: "Access the Keycloak admin console.",
    },
    {
      name: "Keycloak Admin Console (via Traefik)",
      url: `${KEYCLOAK_TRAEFIK_URL}/admin`,
      description: "Access the admin console through the Traefik reverse proxy.",
    },
    {
      name: "Keycloak Documentation",
      url: "https://www.keycloak.org/documentation",
      description: "Official Keycloak documentation — realms, clients, flows, and more.",
    },
    {
      name: "OpenID Connect Playground",
      url: "https://openidconnect.net/",
      description: "Interactive tool for testing OIDC flows against your local Keycloak.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="LocalCloud Kit" subtitle="Identity and access management service">
        <ServiceStatusBadge service="keycloak" name="Keycloak" />
        <a
          href={keycloakAdminUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
          Open Admin Console
        </a>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Keycloak</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit includes <strong>Keycloak</strong> — an open-source Identity and Access Management
            solution that maps to <strong>AWS Cognito</strong> in production. It provides OAuth2, OpenID Connect (OIDC),
            and SAML 2.0 support out of the box. Use it to add authentication and authorization to your local
            applications without needing any cloud account or external service.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Keycloak starts in <strong>development mode</strong> with an embedded database. All configuration is
            reset when the container is recreated — persist data by uncommenting the volume in <code className="bg-gray-100 px-1 rounded">docker-compose.yml</code>.
          </p>
        </section>

        {/* Admin Credentials */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Credentials</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  { label: "Admin Console", value: keycloakAdminUrl, link: keycloakAdminUrl },
                  { label: "Admin Console (Traefik)", value: `${KEYCLOAK_TRAEFIK_URL}/admin`, link: `${KEYCLOAK_TRAEFIK_URL}/admin` },
                  { label: "Username", value: "admin", link: null },
                  { label: "Password", value: "admin", link: null },
                  { label: "Default Realm", value: "master", link: null },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-2.5 text-gray-600">{row.label}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-900">
                      {row.link ? (
                        <a href={row.link} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs">{row.value}</a>
                      ) : row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OIDC Endpoints */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">OIDC Endpoints (master realm)</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Endpoint</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  { label: "Discovery", url: `${keycloakBaseUrl}/realms/master/.well-known/openid-configuration` },
                  { label: "Authorization", url: `${keycloakBaseUrl}/realms/master/protocol/openid-connect/auth` },
                  { label: "Token", url: `${keycloakBaseUrl}/realms/master/protocol/openid-connect/token` },
                  { label: "JWKS (public keys)", url: `${keycloakBaseUrl}/realms/master/protocol/openid-connect/certs` },
                  { label: "UserInfo", url: `${keycloakBaseUrl}/realms/master/protocol/openid-connect/userinfo` },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-2.5 text-gray-600">{row.label}</td>
                    <td className="px-4 py-2.5">
                      <a href={row.url} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline text-xs break-all">{row.url}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Integration Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Integration Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect your application to the local Keycloak instance for authentication.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "nodejs", label: "Node.js" },
              { key: "python", label: "Python" },
              { key: "curl", label: "cURL / REST" },
              { key: "envvars", label: "Env Vars" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ThemeableCodeBlock
            code={codeExamples[activeTab]}
            language={activeTab === "nodejs" ? "node" : activeTab === "curl" ? "cli" : activeTab}
          />
        </section>

        {/* Resources */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Link</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {resources.map((r, idx) => (
                  <tr key={`${r.name}-${r.url}-${idx}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline font-medium"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                        {r.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
