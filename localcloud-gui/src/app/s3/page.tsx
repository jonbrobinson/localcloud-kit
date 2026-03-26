"use client";

import {
  ArrowTopRightOnSquareIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import DocPageNav from "@/components/DocPageNav";
import { usePreferences } from "@/context/PreferencesContext";
import { useEffect, useState } from "react";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const sdkExamples = {
  typescript: `// npm install @aws-sdk/client-s3
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  _Object,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  forcePathStyle: true,
});

// Create a bucket
await s3.send(new CreateBucketCommand({ Bucket: "my-bucket" }));

// Upload an object
await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "hello.txt",
  Body: "Hello, LocalStack!",
  ContentType: "text/plain",
}));

// Download an object
const { Body } = await s3.send(new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "hello.txt",
}));
const text = await Body!.transformToString();
console.log(text);

// List objects
const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: "my-bucket" }));
(Contents ?? []).forEach((obj: _Object) => console.log(obj.Key));`,
  node: `// npm install @aws-sdk/client-s3
import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
  forcePathStyle: true,
});

// Create a bucket
await s3.send(new CreateBucketCommand({ Bucket: "my-bucket" }));

// Upload an object
await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "hello.txt",
  Body: "Hello, LocalStack!",
  ContentType: "text/plain",
}));

// Download an object
const { Body } = await s3.send(new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "hello.txt",
}));
const text = await Body.transformToString();
console.log(text);

// List objects
const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: "my-bucket" }));
Contents?.forEach((obj) => console.log(obj.Key));`,
  python: `# pip install boto3
import boto3

s3 = boto3.client(
    "s3",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a bucket
s3.create_bucket(Bucket="my-bucket")

# Upload a file
s3.upload_file("local_file.txt", "my-bucket", "remote_file.txt")

# Upload from string
s3.put_object(Bucket="my-bucket", Key="hello.txt", Body=b"Hello, LocalStack!")

# Download a file
s3.download_file("my-bucket", "remote_file.txt", "downloaded.txt")

# List objects
response = s3.list_objects_v2(Bucket="my-bucket")
for obj in response.get("Contents", []):
    print(obj["Key"])`,
  cli: `# Configure the AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Or set an alias
alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a bucket
awslocal s3 mb s3://my-bucket

# Upload a file
awslocal s3 cp local_file.txt s3://my-bucket/remote_file.txt

# List buckets
awslocal s3 ls

# List objects in a bucket
awslocal s3 ls s3://my-bucket/

# Download a file
awslocal s3 cp s3://my-bucket/remote_file.txt downloaded.txt

# Delete an object
awslocal s3 rm s3://my-bucket/remote_file.txt

# Delete a bucket (must be empty first)
awslocal s3 rb s3://my-bucket`,
};

const externalResources = [
  {
    name: "AWS S3 Documentation",
    url: "https://docs.aws.amazon.com/s3/",
    description: "Official AWS S3 documentation — concepts, API reference, and best practices.",
  },
  {
    name: "AWS SDK for JavaScript v3",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/",
    description: "S3Client API reference for the AWS SDK v3 (Node.js / browser).",
  },
  {
    name: "boto3 S3 Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html",
    description: "Complete boto3 S3 client reference for Python.",
  },
  {
    name: "LocalStack S3 Coverage",
    url: "https://docs.localstack.cloud/references/coverage/coverage_s3/",
    description: "Which S3 API operations are supported by LocalStack.",
  },
];

export default function S3DocPage() {
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
      <DocPageNav title="LocalCloud Kit" subtitle="S3">
        <ServiceStatusBadge service="aws-emulator" name="AWS Emulator" />
        <Link
          href="/manage/s3"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <FolderIcon className="h-4 w-4 mr-1.5" />
          Open Manager
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About S3</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>Amazon S3</strong> (Simple Storage Service) via LocalStack.
            S3 is an object storage service that lets you store and retrieve any amount of data — files,
            images, backups, static assets, and more.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Your local S3 endpoint is <code className="bg-gray-100 px-1 rounded font-mono text-xs">http://localhost:4566</code>.
            Use the same AWS SDK code you would in production — just point the endpoint at LocalStack.
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
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Path Style</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">enabled (required)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SDK Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">SDK Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create buckets, upload objects, and list contents using any AWS SDK.
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
