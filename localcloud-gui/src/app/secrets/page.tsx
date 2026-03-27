"use client";

import {
  ArrowTopRightOnSquareIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const sdkExamples = {
  typescript: `// npm install @aws-sdk/client-secrets-manager
import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
  SecretListEntry,
} from "@aws-sdk/client-secrets-manager";

const sm = new SecretsManagerClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a secret
await sm.send(new CreateSecretCommand({
  Name: "my-app/database-password",
  SecretString: JSON.stringify({ password: "s3cr3t!" }),
  Description: "Database password for my-app",
}));

// Get a secret value
const { SecretString } = await sm.send(new GetSecretValueCommand({
  SecretId: "my-app/database-password",
}));
const secret = JSON.parse(SecretString!) as { password: string };
console.log(secret.password);

// Update a secret
await sm.send(new UpdateSecretCommand({
  SecretId: "my-app/database-password",
  SecretString: JSON.stringify({ password: "new-s3cr3t!" }),
}));

// List secrets
const { SecretList } = await sm.send(new ListSecretsCommand({}));
(SecretList ?? []).forEach((s: SecretListEntry) => console.log(s.Name, s.ARN));

// Delete a secret (ForceDeleteWithoutRecovery skips the 30-day window)
await sm.send(new DeleteSecretCommand({
  SecretId: "my-app/database-password",
  ForceDeleteWithoutRecovery: true,
}));`,
  node: `// npm install @aws-sdk/client-secrets-manager
import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
} from "@aws-sdk/client-secrets-manager";

const sm = new SecretsManagerClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a secret
await sm.send(new CreateSecretCommand({
  Name: "my-app/database-password",
  SecretString: JSON.stringify({ password: "s3cr3t!" }),
  Description: "Database password for my-app",
}));

// Get a secret value
const { SecretString } = await sm.send(new GetSecretValueCommand({
  SecretId: "my-app/database-password",
}));
const secret = JSON.parse(SecretString);
console.log(secret.password);

// Update a secret
await sm.send(new UpdateSecretCommand({
  SecretId: "my-app/database-password",
  SecretString: JSON.stringify({ password: "new-s3cr3t!" }),
}));

// List secrets
const { SecretList } = await sm.send(new ListSecretsCommand({}));
SecretList?.forEach((s) => console.log(s.Name, s.ARN));

// Delete a secret (ForceDeleteWithoutRecovery skips the 30-day window)
await sm.send(new DeleteSecretCommand({
  SecretId: "my-app/database-password",
  ForceDeleteWithoutRecovery: true,
}));`,
  python: `# pip install boto3
import boto3, json

sm = boto3.client(
    "secretsmanager",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a secret
sm.create_secret(
    Name="my-app/database-password",
    SecretString=json.dumps({"password": "s3cr3t!"}),
    Description="Database password for my-app",
)

# Get a secret value
response = sm.get_secret_value(SecretId="my-app/database-password")
secret = json.loads(response["SecretString"])
print(secret["password"])

# Update a secret
sm.update_secret(
    SecretId="my-app/database-password",
    SecretString=json.dumps({"password": "new-s3cr3t!"}),
)

# List secrets
response = sm.list_secrets()
for s in response.get("SecretList", []):
    print(s["Name"], s["ARN"])

# Delete a secret immediately
sm.delete_secret(
    SecretId="my-app/database-password",
    ForceDeleteWithoutRecovery=True,
)`,
  cli: `# Configure the AWS CLI for AWS Emulator
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a secret
awslocal secretsmanager create-secret \\
  --name "my-app/database-password" \\
  --secret-string '{"password":"s3cr3t!"}' \\
  --description "Database password for my-app"

# Get a secret value
awslocal secretsmanager get-secret-value \\
  --secret-id "my-app/database-password"

# Update a secret
awslocal secretsmanager update-secret \\
  --secret-id "my-app/database-password" \\
  --secret-string '{"password":"new-s3cr3t!"}'

# List secrets
awslocal secretsmanager list-secrets

# Delete a secret immediately
awslocal secretsmanager delete-secret \\
  --secret-id "my-app/database-password" \\
  --force-delete-without-recovery`,
};

const externalResources = [
  {
    name: "AWS Secrets Manager Documentation",
    url: "https://docs.aws.amazon.com/secretsmanager/",
    description: "Official AWS Secrets Manager docs — rotation, policies, and API reference.",
  },
  {
    name: "Secrets Manager SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/secrets-manager/",
    description: "SecretsManagerClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 Secrets Manager Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/secretsmanager.html",
    description: "Complete boto3 Secrets Manager client reference for Python.",
  },
  {
    name: "MiniStack GitHub",
    url: "https://github.com/nahuelnucera/ministack",
    description: "MiniStack AWS emulator - supported operations",
  },
];

export default function SecretsDocPage() {
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
      <DocPageNav title="LocalCloud Kit" subtitle="Secrets Manager">
        <ServiceStatusBadge service="aws-emulator" name="AWS Emulator" />
        <Link
          href="/manage/secrets"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <KeyIcon className="h-4 w-4 mr-1.5" />
          Open Manager
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Secrets Manager</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>AWS Secrets Manager</strong> via the AWS Emulator (MiniStack) — a service that
            helps you protect access to your applications, services, and IT resources. You can store
            database credentials, API keys, OAuth tokens, and other sensitive configuration values.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Secrets are accessed programmatically at runtime, so your application code never contains
            hard-coded credentials. Use the dashboard to create and inspect secrets, or connect via the
            AWS SDK at <code className="bg-gray-100 px-1 rounded font-mono text-xs">http://localhost:4566</code>.
          </p>
        </section>

        {/* Connection Settings */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Settings</h2>
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
                  <td className="px-4 py-2.5 text-gray-600">Endpoint (host)</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">http://localhost:4566</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Endpoint (Docker)</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">http://aws-emulator:4566</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Region</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">us-east-1</td>
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

        {/* SDK Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">SDK Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create, read, update, and delete secrets using any AWS SDK.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "typescript" as const, label: "TypeScript" },
              { key: "node" as const, label: "Node.js" },
              { key: "python" as const, label: "Python" },
              { key: "cli" as const, label: "AWS CLI" },
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
          {activeTab === "typescript" && (
            <ThemeableCodeBlock code={sdkExamples.typescript} language="typescript" />
          )}
          {activeTab === "node" && (
            <ThemeableCodeBlock code={sdkExamples.node} language="node" />
          )}
          {activeTab === "python" && (
            <ThemeableCodeBlock code={sdkExamples.python} language="python" />
          )}
          {activeTab === "cli" && (
            <ThemeableCodeBlock code={sdkExamples.cli} language="cli" />
          )}
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
                {externalResources.map((r, idx) => (
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
