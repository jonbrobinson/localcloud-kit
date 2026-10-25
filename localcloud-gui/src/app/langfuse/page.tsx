"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import AppNavBar from "@/components/AppNavBar";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import { Card } from "@/components/ui";
import { usePreferences } from "@/context/PreferencesContext";
import { useAdminUrl } from "@/hooks/useAdminUrl";

const LANGFUSE_TRAEFIK_URL = "https://langfuse.localcloudkit.com:3030";
const LANGFUSE_DIRECT_URL = "http://localhost:3100";

const PAGE_TABS = ["typescript", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const envVars = `# .env — point the Langfuse SDKs at your local instance
LANGFUSE_BASE_URL=http://localhost:3100
LANGFUSE_PUBLIC_KEY=pk-lf-localcloud
LANGFUSE_SECRET_KEY=sk-lf-localcloud
LANGFUSE_TRACING_ENVIRONMENT=local`;

const codeExamples: Record<PageTab, string> = {
  typescript: `// npm install @langfuse/tracing @langfuse/otel \\
//   @opentelemetry/sdk-node@^0.223.0 @opentelemetry/exporter-trace-otlp-http@^0.223.0
// (@langfuse/otel 6.x targets OpenTelemetry JS 2.x — the 0.300+ SDK line is not compatible yet)

// instrumentation.ts — import this first (reads LANGFUSE_* from the environment)
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

export const sdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()],
});
sdk.start();

// routes/chat.ts — trace an LLM call inside an Express handler
import { startActiveObservation, propagateAttributes } from "@langfuse/tracing";

app.post("/chat", async (req, res) => {
  const answer = await startActiveObservation("chat-request", async (span) => {
    span.update({ input: req.body });

    // userId / sessionId are trace attributes — propagate them to every child observation
    return propagateAttributes({ userId: req.body.userId }, async () => {
      const generation = span.startObservation(
        "llm-call",
        { model: "claude-sonnet-5-5", input: req.body.messages },
        { asType: "generation" }
      );
      const reply = await callYourModel(req.body.messages);
      generation.update({ output: reply }).end();

      span.update({ output: reply });
      return reply;
    });
  });

  res.json({ answer });
});

// On shutdown, flush pending spans
process.on("SIGTERM", () => sdk.shutdown());`,
  python: `# pip install langfuse  (reads LANGFUSE_* from the environment)
from langfuse import get_client, observe

langfuse = get_client()

# Option 1: decorator — nested calls become child observations
@observe()
def answer_question(question: str) -> str:
    return call_your_model(question)

# Option 2: context managers for explicit spans and generations
with langfuse.start_as_current_observation(as_type="span", name="chat-request") as span:
    span.update(input={"question": "What is LocalCloud Kit?"})

    with langfuse.start_as_current_observation(
        as_type="generation", name="llm-call", model="claude-sonnet-5-5"
    ) as generation:
        reply = call_your_model("What is LocalCloud Kit?")
        generation.update(output=reply)

    span.update(output=reply)

# Short-lived scripts: flush before exit
langfuse.flush()`,
  cli: `# Health check
curl -s http://localhost:3100/api/public/health

# Send a test span over OTLP/HTTP (the v4 ingestion path)
TRACE_ID=$(openssl rand -hex 16)
SPAN_ID=$(openssl rand -hex 8)
NOW=$(date +%s)000000000

curl -s -u pk-lf-localcloud:sk-lf-localcloud \\
  -X POST http://localhost:3100/api/public/otel/v1/traces \\
  -H "Content-Type: application/json" \\
  -d '{
    "resourceSpans": [{
      "resource": { "attributes": [{ "key": "service.name", "value": { "stringValue": "local-cli" } }] },
      "scopeSpans": [{
        "scope": { "name": "cli" },
        "spans": [{
          "traceId": "'"$TRACE_ID"'",
          "spanId": "'"$SPAN_ID"'",
          "name": "local-cli-test",
          "kind": 1,
          "startTimeUnixNano": "'"$NOW"'",
          "endTimeUnixNano": "'"$NOW"'",
          "attributes": [
            { "key": "langfuse.observation.input", "value": { "stringValue": "hello" } },
            { "key": "langfuse.observation.output", "value": { "stringValue": "world" } }
          ]
        }]
      }]
    }]
  }'

# Read it back (a few seconds after ingestion)
curl -s -u pk-lf-localcloud:sk-lf-localcloud \\
  "http://localhost:3100/api/public/v2/observations?traceId=$TRACE_ID"`,
};

const resources = [
  {
    name: "Langfuse UI (via Traefik)",
    url: LANGFUSE_TRAEFIK_URL,
    description: "Open the local Langfuse workspace through Traefik.",
  },
  {
    name: "Langfuse Docs",
    url: "https://langfuse.com/docs",
    description: "Tracing, prompt management, evaluations, and datasets.",
  },
  {
    name: "SDK Overview",
    url: "https://langfuse.com/docs/observability/sdk/overview",
    description: "TypeScript and Python SDK setup and API reference.",
  },
  {
    name: "Self-Hosting Docs",
    url: "https://langfuse.com/self-hosting",
    description: "Configuration reference for the Langfuse web and worker containers.",
  },
];

const thClass = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-faint";
const tdLabelClass = "px-4 py-2.5 text-ink-2";
const tdValueClass = "px-4 py-2.5 font-mono text-xs text-ink";
const linkClass = "font-mono text-xs text-primary hover:underline break-all";

export default function LangfusePage() {
  const { profile, updateProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("typescript");
  const langfuseUrl = useAdminUrl(LANGFUSE_TRAEFIK_URL, LANGFUSE_DIRECT_URL);

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

  const connectionRows: { label: string; value: string; link?: string }[] = [
    { label: "UI", value: langfuseUrl, link: langfuseUrl },
    { label: "SDK base URL (from host)", value: LANGFUSE_DIRECT_URL },
    { label: "SDK base URL (from containers)", value: "http://langfuse-web:3000" },
    { label: "OTLP traces endpoint", value: `${LANGFUSE_DIRECT_URL}/api/public/otel/v1/traces` },
    { label: "Public key", value: "pk-lf-localcloud" },
    { label: "Secret key", value: "sk-lf-localcloud" },
    { label: "Login", value: "admin@localcloud.dev / localcloud" },
    { label: "Organization / project", value: "LocalCloud Kit / localcloud-dev" },
    { label: "Compose profile", value: "langfuse" },
  ];

  return (
    <main className="min-h-screen bg-bg">
      <AppNavBar pageLabel="Langfuse">
        <ServiceStatusBadge service="langfuse" name="Langfuse" />
        <a
          href={langfuseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-ink-2 bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Open Langfuse
        </a>
      </AppNavBar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-2">About Langfuse</h2>
          <p className="text-sm text-muted leading-relaxed">
            LocalCloud Kit includes <strong className="text-ink-2">Langfuse</strong> as an optional platform
            service for LLM observability — trace model calls and agent steps, version prompts, and run
            evaluations against your local app without sending data to a hosted service.
          </p>
          <p className="text-sm text-muted leading-relaxed mt-2">
            The stack runs in the <code className="font-mono text-ink-2">langfuse</code> Compose profile with
            dedicated Postgres, ClickHouse, Redis, and MinIO containers, isolated from your app&apos;s PostgreSQL,
            Redis, and emulator S3. An organization, project, API keys, and an owner login are created
            automatically on first start. Invite and password-reset emails are delivered to Mailpit.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Start / Stop</h2>
          <ThemeableCodeBlock
            code={`# Start everything plus the Langfuse profile (first boot runs migrations)
make start-langfuse

# Stop only Langfuse (data volumes are kept)
make stop-langfuse

# Follow web + worker logs
make langfuse-logs`}
            language="cli"
            showThemeSelector={false}
          />
        </Card>

        <Card>
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-semibold text-ink">Connection Details</h2>
            <p className="text-sm text-muted mt-1">Local-only defaults — never reuse these keys outside this kit.</p>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 border-y border-divider">
              <tr>
                <th className={thClass}>Setting</th>
                <th className={thClass}>Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {connectionRows.map((row) => (
                <tr key={row.label}>
                  <td className={tdLabelClass}>{row.label}</td>
                  <td className={tdValueClass}>
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">Environment Variables</h2>
          <p className="text-sm text-muted mb-4">
            Both SDKs read these automatically. From another container on <code className="font-mono">lck-network</code>,
            use <code className="font-mono">http://langfuse-web:3000</code> as the base URL.
          </p>
          <ThemeableCodeBlock code={envVars} language="bash" showThemeSelector={false} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">Integration Examples</h2>
          <p className="text-sm text-muted mb-4">
            Langfuse v4 ingests traces over OpenTelemetry — use the current SDKs or any OTLP exporter.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-border">
            {([
              { key: "typescript" as const, label: "TypeScript" },
              { key: "python" as const, label: "Python" },
              { key: "cli" as const, label: "CLI / cURL" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-ink-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ThemeableCodeBlock code={codeExamples[activeTab]} language={activeTab} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink mb-4">Verification Checklist</h2>
          <ul className="space-y-2 text-sm text-ink-2">
            <li>• Langfuse status badge is Running.</li>
            <li>• You can sign in with admin@localcloud.dev / localcloud.</li>
            <li>• A span sent from one of the examples appears under Tracing in the localcloud-dev project.</li>
            <li>• Inviting a teammate delivers an email to Mailpit.</li>
          </ul>
        </Card>

        <Card>
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-semibold text-ink">Resources</h2>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 border-y border-divider">
              <tr>
                <th className={thClass}>Link</th>
                <th className={thClass}>Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {resources.map((r) => (
                <tr key={r.url}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      {r.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  );
}
