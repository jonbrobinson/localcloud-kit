"use client";

import { ArrowTopRightOnSquareIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const sdkExamples = {
  typescript: `// npm install @aws-sdk/client-ssm
import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
  GetParametersByPathCommand,
  DeleteParameterCommand,
  DescribeParametersCommand,
} from "@aws-sdk/client-ssm";

const ssm = new SSMClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a String parameter
await ssm.send(new PutParameterCommand({
  Name: "/my-app/database/host",
  Value: "localhost",
  Type: "String",
  Description: "Database hostname",
  Overwrite: true,
}));

// Create a SecureString parameter
await ssm.send(new PutParameterCommand({
  Name: "/my-app/database/password",
  Value: "s3cr3t!",
  Type: "SecureString",
  Description: "Database password",
  Overwrite: true,
}));

// Get a parameter value
const { Parameter } = await ssm.send(new GetParameterCommand({
  Name: "/my-app/database/host",
  WithDecryption: true,
}));
console.log(Parameter?.Value);

// Get all parameters under a path
const { Parameters } = await ssm.send(new GetParametersByPathCommand({
  Path: "/my-app/",
  Recursive: true,
  WithDecryption: true,
}));
Parameters?.forEach((p) => console.log(p.Name, p.Value));

// Delete a parameter
await ssm.send(new DeleteParameterCommand({ Name: "/my-app/database/host" }));`,

  node: `// npm install @aws-sdk/client-ssm
import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
  GetParametersByPathCommand,
  DeleteParameterCommand,
  DescribeParametersCommand,
} from "@aws-sdk/client-ssm";

const ssm = new SSMClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create / update a parameter
await ssm.send(new PutParameterCommand({
  Name: "/my-app/config/api-url",
  Value: "https://api.example.com",
  Type: "String",
  Overwrite: true,
}));

// Read a parameter
const { Parameter } = await ssm.send(new GetParameterCommand({
  Name: "/my-app/config/api-url",
}));
console.log(Parameter?.Value);

// Read all parameters under a path
const { Parameters } = await ssm.send(new GetParametersByPathCommand({
  Path: "/my-app/",
  Recursive: true,
}));
Parameters?.forEach((p) => console.log(p.Name, "=", p.Value));

// Delete a parameter
await ssm.send(new DeleteParameterCommand({ Name: "/my-app/config/api-url" }));`,

  python: `# pip install boto3
import boto3

ssm = boto3.client(
    "ssm",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a String parameter
ssm.put_parameter(
    Name="/my-app/database/host",
    Value="localhost",
    Type="String",
    Description="Database hostname",
    Overwrite=True,
)

# Create a SecureString parameter
ssm.put_parameter(
    Name="/my-app/database/password",
    Value="s3cr3t!",
    Type="SecureString",
    Description="Database password",
    Overwrite=True,
)

# Get a parameter value
response = ssm.get_parameter(
    Name="/my-app/database/host",
    WithDecryption=True,
)
print(response["Parameter"]["Value"])

# Get all parameters under a path
response = ssm.get_parameters_by_path(
    Path="/my-app/",
    Recursive=True,
    WithDecryption=True,
)
for p in response.get("Parameters", []):
    print(f"{p['Name']} = {p['Value']}")

# Delete a parameter
ssm.delete_parameter(Name="/my-app/database/host")`,

  cli: `# Configure the AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a String parameter
awslocal ssm put-parameter \\
  --name "/my-app/database/host" \\
  --value "localhost" \\
  --type String \\
  --description "Database hostname" \\
  --overwrite

# Create a SecureString parameter
awslocal ssm put-parameter \\
  --name "/my-app/database/password" \\
  --value "s3cr3t!" \\
  --type SecureString \\
  --overwrite

# Get a parameter value
awslocal ssm get-parameter \\
  --name "/my-app/database/host" \\
  --with-decryption

# Get all parameters under a path
awslocal ssm get-parameters-by-path \\
  --path "/my-app/" \\
  --recursive \\
  --with-decryption

# List all parameters
awslocal ssm describe-parameters

# Delete a parameter
awslocal ssm delete-parameter --name "/my-app/database/host"`,
};

const externalResources = [
  {
    name: "AWS Systems Manager Parameter Store",
    url: "https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html",
    description: "Official AWS SSM Parameter Store docs — hierarchy, encryption, and versioning.",
  },
  {
    name: "SSM SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/",
    description: "SSMClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 SSM Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/ssm.html",
    description: "Complete boto3 SSM client reference for Python.",
  },
  {
    name: "LocalStack SSM Coverage",
    url: "https://docs.localstack.cloud/references/coverage/coverage_ssm/",
    description: "Which SSM API operations are supported by LocalStack.",
  },
];

export default function SSMDocPage() {
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
    <main className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <DocPageNav title="LocalCloud Kit" subtitle="SSM Parameter Store configuration service">
        <ServiceStatusBadge service="localstack" name="LocalStack" />
        <Link
          href="/manage/ssm"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1.5" />
          Open Manager
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Parameter Store</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>AWS Systems Manager Parameter Store</strong> via LocalStack —
            a secure, hierarchical storage for configuration data and secrets. Unlike Secrets Manager,
            Parameter Store is free for standard parameters and integrates with most AWS services via
            native parameter resolution.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Use <code className="bg-gray-100 px-1 rounded font-mono text-xs">/</code>-delimited paths
            to organise parameters (e.g.{" "}
            <code className="bg-gray-100 px-1 rounded font-mono text-xs">/my-app/prod/db/host</code>).
            Store plain strings, comma-separated lists, or encrypted <code className="bg-gray-100 px-1 rounded font-mono text-xs">SecureString</code> values.
          </p>
        </section>

        {/* Parameter Types */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Parameter Types</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Use Case</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-teal-700 font-medium">String</td>
                  <td className="px-4 py-2.5 text-gray-600">Any plain-text value</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">localhost:5432</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-teal-700 font-medium">StringList</td>
                  <td className="px-4 py-2.5 text-gray-600">Comma-separated values</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">us-east-1,eu-west-1</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-teal-700 font-medium">SecureString</td>
                  <td className="px-4 py-2.5 text-gray-600">Sensitive data, encrypted at rest</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">password / API key</td>
                </tr>
              </tbody>
            </table>
          </div>
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
                  <td className="px-4 py-2.5 font-mono text-gray-900">http://localstack:4566</td>
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
            Store, retrieve, and manage configuration parameters using any AWS SDK.
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
                    ? "border-teal-600 text-teal-600"
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
            <ThemeableCodeBlock code={sdkExamples.node} language="javascript" />
          )}
          {activeTab === "python" && (
            <ThemeableCodeBlock code={sdkExamples.python} language="python" />
          )}
          {activeTab === "cli" && (
            <ThemeableCodeBlock code={sdkExamples.cli} language="bash" />
          )}
        </section>

        {/* API Endpoints */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">LocalCloud Kit API</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Method</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Endpoint</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  ["GET", "/api/ssm/parameters", "List all parameters"],
                  ["POST", "/api/ssm/parameters", "Create / update a parameter"],
                  ["GET", "/api/ssm/parameters/:name", "Get parameter value"],
                  ["PUT", "/api/ssm/parameters/:name", "Update a parameter"],
                  ["DELETE", "/api/ssm/parameters/:name", "Delete a parameter"],
                ].map(([method, endpoint, desc]) => (
                  <tr key={`${method}-${endpoint}`}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${
                        method === "GET" ? "bg-green-50 text-green-700" :
                        method === "POST" ? "bg-blue-50 text-blue-700" :
                        method === "PUT" ? "bg-yellow-50 text-yellow-700" :
                        method === "DELETE" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                      }`}>{method}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-gray-900 text-xs">{endpoint}</td>
                    <td className="px-4 py-2.5 text-gray-600">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
