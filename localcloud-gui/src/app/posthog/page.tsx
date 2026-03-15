"use client";

import {
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const POSTHOG_UI_URL = "https://posthog.localcloudkit.com:3030";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const codeExamples: Record<PageTab, string> = {
  typescript: `// npm install posthog-js
import posthog from "posthog-js";

posthog.init("<project_api_key>", {
  api_host: "https://posthog.localcloudkit.com:3030",
  person_profiles: "always",
});

posthog.capture("checkout_started", {
  cart_value: 129.99,
  currency: "USD",
  environment: "local",
});`,
  node: `// npm install posthog-node
import { PostHog } from "posthog-node";

const client = new PostHog("<project_api_key>", {
  host: "https://posthog.localcloudkit.com:3030",
});

await client.capture({
  distinctId: "local-user-123",
  event: "order_completed",
  properties: {
    amount: 129.99,
    currency: "USD",
    environment: "local",
  },
});

await client.shutdown();`,
  python: `# pip install posthog
from posthog import Posthog

client = Posthog(
    project_api_key="<project_api_key>",
    host="https://posthog.localcloudkit.com:3030",
)

client.capture(
    "local-user-123",
    "feature_flag_checked",
    {
        "flag": "new-checkout",
        "enabled": True,
        "environment": "local",
    },
)
client.flush()`,
  cli: `# 1) Start the optional PostHog profile
docker compose --profile posthog up -d

# 2) Send a test event directly to PostHog ingestion API
curl -s -X POST "https://posthog.localcloudkit.com:3030/i/v0/e/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "<project_api_key>",
    "event": "local_cli_event",
    "distinct_id": "local-cli-user",
    "properties": {
      "source": "curl",
      "environment": "local"
    }
  }'`,
};

const resources = [
  {
    name: "PostHog UI",
    url: POSTHOG_UI_URL,
    description:
      "Open the local PostHog workspace through Traefik.",
  },
  {
    name: "PostHog Self-Host Docs",
    url: "https://posthog.com/docs/self-host",
    description:
      "Official self-hosting guide and deployment documentation.",
  },
  {
    name: "PostHog Product Docs",
    url: "https://posthog.com/docs",
    description:
      "Feature docs for events, persons, feature flags, and session replay.",
  },
];

export default function PosthogPage() {
  const { profile, updateProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("typescript");

  useEffect(() => {
    if (profile?.preferred_language) {
      const lang = profile.preferred_language as PageTab;
      setActiveTab(PAGE_TABS.includes(lang) ? lang : "typescript");
    }
  }, [profile?.preferred_language]);

  const handleTabChange = (tab: PageTab) => {
    setActiveTab(tab);
    updateProfile({ preferred_language: tab }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="LocalCloud Kit" subtitle="PostHog">
        <ServiceStatusBadge service="posthog" name="PostHog" />
        <a
          href={POSTHOG_UI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
          Open PostHog
        </a>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About PostHog</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit includes <strong>PostHog</strong> as an optional platform service for local
            product analytics, event capture, and feature-flag development. The PostHog stack runs in an
            isolated profile with dedicated Postgres, Redis, ClickHouse, Kafka, and Zookeeper containers.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            This stack is intended for local service usage and is intentionally isolated from your
            application&apos;s primary PostgreSQL and Redis services.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Start / Stop</h2>
          <ThemeableCodeBlock
            code={`# Start PostHog stack (optional profile)
docker compose --profile posthog up -d

# Stop only PostHog profile services
docker compose --profile posthog down

# View status
docker compose ps`}
            language="cli"
            showThemeSelector={false}
          />
        </section>

        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">UI URL</td>
                  <td className="px-4 py-2.5">
                    <a
                      href={POSTHOG_UI_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline text-xs"
                    >
                      {POSTHOG_UI_URL}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Compose profile</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">posthog</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Isolation model</td>
                  <td className="px-4 py-2.5 text-gray-900">
                    Dedicated PostHog Postgres/Redis/ClickHouse/Kafka/Zookeeper
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Project API key</td>
                  <td className="px-4 py-2.5 text-gray-900">
                    Create or copy from <span className="font-mono">PostHog → Project Settings</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Integration Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Capture local analytics events from frontend, backend, scripts, or tests.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "typescript" as const, label: "TypeScript" },
              { key: "node" as const, label: "Node.js" },
              { key: "python" as const, label: "Python" },
              { key: "cli" as const, label: "CLI / cURL" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
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
          <ThemeableCodeBlock code={codeExamples[activeTab]} language={activeTab} />
        </section>

        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Checklist</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• PostHog status badge is Running.</li>
            <li>• You can open the PostHog UI from the Services menu or this page.</li>
            <li>• A test event sent from one of the examples appears in the Events stream.</li>
            <li>• Feature flag values resolve correctly in local environment.</li>
          </ul>
        </section>

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
