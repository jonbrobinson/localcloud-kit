"use client";

import { useLocalStackStatus } from "@/hooks/useLocalStackStatus";
import StatusCard from "@/components/StatusCard";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

type PageTab = "node" | "python" | "cli";

// Maps PreferredLanguage → localstack tab (no typescript tab here — node is equivalent)
const LANG_TO_TAB: Record<string, PageTab> = {
  typescript: "node",
  node: "node",
  python: "python",
  go: "node",
  java: "node",
  cli: "cli",
};

export default function LocalStackIntegrationPage() {
  const { status, projectConfig } = useLocalStackStatus();
  const { profile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("node");

  useEffect(() => {
    if (profile?.preferred_language) {
      const mapped = LANG_TO_TAB[profile.preferred_language];
      if (mapped) setActiveTab(mapped);
    }
  }, [profile?.preferred_language]);

  const tabs: { id: PageTab; label: string }[] = [
    { id: "node", label: "Node.js" },
    { id: "python", label: "Python" },
    { id: "cli", label: "AWS CLI" },
  ];

  const nodeExample = `import { S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "${projectConfig.awsRegion}",
  endpoint: "${projectConfig.awsEndpoint}",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true, // required for LocalStack
});`;

  const pythonExample = `import boto3

client = boto3.client(
    "s3",
    region_name="${projectConfig.awsRegion}",
    endpoint_url="${projectConfig.awsEndpoint}",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)`;

  const cliExample = `# Configure AWS CLI profile for LocalStack
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region ${projectConfig.awsRegion}

# Use --endpoint-url with every command
aws s3 ls --endpoint-url ${projectConfig.awsEndpoint}

# Or set an alias
alias awslocal='aws --endpoint-url ${projectConfig.awsEndpoint}'`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="LocalCloud Kit" subtitle="LocalStack">
        <ServiceStatusBadge service="localstack" name="LocalStack" />
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Live Status */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <StatusCard status={status} />
        </section>

        {/* Configuration */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
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
                  <td className="px-4 py-2.5 text-gray-600">Project</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">{projectConfig.projectName}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Endpoint (host)</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">{projectConfig.awsEndpoint}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Endpoint (Docker)</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">http://localstack:4566</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Region</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">{projectConfig.awsRegion}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Access Key ID</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">test</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Secret Access Key</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">test</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SDK Integration Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SDK Integration</h2>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "node" && <ThemeableCodeBlock code={nodeExample} language="node" />}
          {activeTab === "python" && <ThemeableCodeBlock code={pythonExample} language="python" />}
          {activeTab === "cli" && <ThemeableCodeBlock code={cliExample} language="cli" />}
        </section>

        {/* Quick Commands */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Commands</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1.5">Start LocalStack</p>
              <ThemeableCodeBlock code="docker compose up -d localstack" language="cli" showThemeSelector={false} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1.5">Stop LocalStack</p>
              <ThemeableCodeBlock code="docker compose stop localstack" language="cli" showThemeSelector={false} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1.5">Check health</p>
              <ThemeableCodeBlock code={`curl ${projectConfig.awsEndpoint}/_localstack/health`} language="cli" showThemeSelector={false} />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
