"use client";

import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CircleStackIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

function CodeBlock({ code }: { code: string }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy"
      >
        <ClipboardDocumentIcon className="h-4 w-4 text-gray-300" />
      </button>
    </div>
  );
}

const sdkExamples = {
  node: `// npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});
const ddb = DynamoDBDocumentClient.from(client);

// Put an item
await ddb.send(new PutCommand({
  TableName: "my-table",
  Item: { id: "user-1", name: "Alice", email: "alice@example.com" },
}));

// Get an item
const { Item } = await ddb.send(new GetCommand({
  TableName: "my-table",
  Key: { id: "user-1" },
}));
console.log(Item);

// Query items (requires index or partition key)
const { Items } = await ddb.send(new QueryCommand({
  TableName: "my-table",
  KeyConditionExpression: "id = :id",
  ExpressionAttributeValues: { ":id": "user-1" },
}));

// Delete an item
await ddb.send(new DeleteCommand({
  TableName: "my-table",
  Key: { id: "user-1" },
}));`,
  python: `# pip install boto3
import boto3

ddb = boto3.resource(
    "dynamodb",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

table = ddb.Table("my-table")

# Put an item
table.put_item(Item={"id": "user-1", "name": "Alice", "email": "alice@example.com"})

# Get an item
response = table.get_item(Key={"id": "user-1"})
item = response.get("Item")
print(item)

# Query items
response = table.query(
    KeyConditionExpression=boto3.dynamodb.conditions.Key("id").eq("user-1")
)
print(response["Items"])

# Delete an item
table.delete_item(Key={"id": "user-1"})`,
  cli: `# Configure the AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# List tables
awslocal dynamodb list-tables

# Describe a table
awslocal dynamodb describe-table --table-name my-table

# Put an item
awslocal dynamodb put-item \\
  --table-name my-table \\
  --item '{"id":{"S":"user-1"},"name":{"S":"Alice"}}'

# Get an item
awslocal dynamodb get-item \\
  --table-name my-table \\
  --key '{"id":{"S":"user-1"}}'

# Scan a table (returns all items)
awslocal dynamodb scan --table-name my-table

# Delete an item
awslocal dynamodb delete-item \\
  --table-name my-table \\
  --key '{"id":{"S":"user-1"}}'`,
};

const externalResources = [
  {
    name: "AWS DynamoDB Documentation",
    url: "https://docs.aws.amazon.com/dynamodb/",
    description: "Official AWS DynamoDB documentation — data modeling, API reference, and best practices.",
  },
  {
    name: "DynamoDB SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/",
    description: "DynamoDBClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 DynamoDB Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html",
    description: "Complete boto3 DynamoDB client and resource reference for Python.",
  },
  {
    name: "LocalStack DynamoDB Coverage",
    url: "https://docs.localstack.cloud/references/coverage/coverage_dynamodb/",
    description: "Which DynamoDB API operations are supported by LocalStack.",
  },
];

export default function DynamoDBDocPage() {
  const [activeTab, setActiveTab] = useState<"node" | "python" | "cli">("node");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <Image src="/logo.svg" alt="LocalCloud Kit" width={36} height={36} />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DynamoDB Tables</h1>
                  <p className="text-xs text-gray-500">Local NoSQL database via LocalStack</p>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
            >
              <CircleStackIcon className="h-4 w-4 mr-1.5" />
              Manage Tables
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About DynamoDB</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>Amazon DynamoDB</strong> via LocalStack — a fully managed,
            serverless, key-value NoSQL database. DynamoDB is optimized for high-performance applications
            at any scale, with single-digit millisecond performance.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Use the dashboard to create and browse tables, or connect directly via the AWS SDK using
            the local endpoint <code className="bg-gray-100 px-1 rounded font-mono text-xs">http://localhost:4566</code>.
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
            Put, get, query, and delete items using any AWS SDK.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "node" as const, label: "Node.js" },
              { key: "python" as const, label: "Python" },
              { key: "cli" as const, label: "AWS CLI" },
            ]).map(({ key, label }) => (
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
          {activeTab === "node" && <CodeBlock code={sdkExamples.node} />}
          {activeTab === "python" && <CodeBlock code={sdkExamples.python} />}
          {activeTab === "cli" && <CodeBlock code={sdkExamples.cli} />}
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
                {externalResources.map((r) => (
                  <tr key={r.url}>
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
