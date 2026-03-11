"use client";

import { ArrowTopRightOnSquareIcon, BoltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const sdkExamples = {
  typescript: `// npm install @aws-sdk/client-lambda
import {
  LambdaClient,
  CreateFunctionCommand,
  InvokeCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { readFileSync } from "fs";

const lambda = new LambdaClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a Lambda function (requires a zip file)
const zipBuffer = readFileSync("function.zip");
await lambda.send(new CreateFunctionCommand({
  FunctionName: "my-function",
  Runtime: "python3.12",
  Role: "arn:aws:iam::000000000000:role/irrelevant",
  Handler: "lambda_function.lambda_handler",
  Code: { ZipFile: zipBuffer },
  Description: "My test function",
}));

// Invoke a function
const response = await lambda.send(new InvokeCommand({
  FunctionName: "my-function",
  Payload: JSON.stringify({ key: "value" }),
}));
const result = JSON.parse(Buffer.from(response.Payload!).toString());
console.log(result);

// List functions
const { Functions } = await lambda.send(new ListFunctionsCommand({}));
Functions?.forEach((f) => console.log(f.FunctionName, f.Runtime));

// Delete a function
await lambda.send(new DeleteFunctionCommand({ FunctionName: "my-function" }));`,

  node: `// npm install @aws-sdk/client-lambda
import {
  LambdaClient,
  CreateFunctionCommand,
  InvokeCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
} from "@aws-sdk/client-lambda";
import { readFileSync } from "fs";

const lambda = new LambdaClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a function
const zipBuffer = readFileSync("function.zip");
await lambda.send(new CreateFunctionCommand({
  FunctionName: "my-function",
  Runtime: "nodejs20.x",
  Role: "arn:aws:iam::000000000000:role/irrelevant",
  Handler: "index.handler",
  Code: { ZipFile: zipBuffer },
}));

// Invoke and read response
const res = await lambda.send(new InvokeCommand({
  FunctionName: "my-function",
  Payload: JSON.stringify({ message: "hello" }),
}));
console.log(JSON.parse(Buffer.from(res.Payload).toString()));

// List all functions
const { Functions } = await lambda.send(new ListFunctionsCommand({}));
Functions?.forEach((f) => console.log(f.FunctionName));

// Delete a function
await lambda.send(new DeleteFunctionCommand({ FunctionName: "my-function" }));`,

  python: `# pip install boto3
import boto3, json, zipfile, io

lambda_client = boto3.client(
    "lambda",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a minimal zip in-memory for testing
code = b"""
def lambda_handler(event, context):
    return {"statusCode": 200, "body": json.dumps({"message": "Hello!"})}
"""
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as z:
    z.writestr("lambda_function.py", code)
zip_bytes = buf.getvalue()

# Create function
lambda_client.create_function(
    FunctionName="my-function",
    Runtime="python3.12",
    Role="arn:aws:iam::000000000000:role/irrelevant",
    Handler="lambda_function.lambda_handler",
    Code={"ZipFile": zip_bytes},
)

# Invoke function
response = lambda_client.invoke(
    FunctionName="my-function",
    Payload=json.dumps({"key": "value"}),
)
result = json.loads(response["Payload"].read())
print(result)

# List functions
response = lambda_client.list_functions()
for fn in response.get("Functions", []):
    print(fn["FunctionName"], fn["Runtime"])

# Delete function
lambda_client.delete_function(FunctionName="my-function")`,

  cli: `# Configure the AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a minimal zip for testing
echo 'def lambda_handler(e,c): return {"statusCode":200}' > lambda_function.py
zip function.zip lambda_function.py

# Create a Lambda function
awslocal lambda create-function \\
  --function-name my-function \\
  --runtime python3.12 \\
  --role arn:aws:iam::000000000000:role/irrelevant \\
  --handler lambda_function.lambda_handler \\
  --zip-file fileb://function.zip

# Invoke a function
awslocal lambda invoke \\
  --function-name my-function \\
  --payload '{"key":"value"}' \\
  response.json
cat response.json

# List functions
awslocal lambda list-functions

# Update function code
zip function.zip lambda_function.py
awslocal lambda update-function-code \\
  --function-name my-function \\
  --zip-file fileb://function.zip

# Delete a function
awslocal lambda delete-function --function-name my-function`,
};

const externalResources = [
  {
    name: "AWS Lambda Documentation",
    url: "https://docs.aws.amazon.com/lambda/",
    description: "Official AWS Lambda docs — triggers, runtimes, and deployment.",
  },
  {
    name: "Lambda SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/",
    description: "LambdaClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 Lambda Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/lambda.html",
    description: "Complete boto3 Lambda client reference for Python.",
  },
  {
    name: "LocalStack Lambda Coverage",
    url: "https://docs.localstack.cloud/references/coverage/coverage_lambda/",
    description: "Which Lambda API operations are supported by LocalStack.",
  },
];

export default function LambdaDocPage() {
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
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <DocPageNav title="Lambda" subtitle="Serverless functions via LocalStack">
        <ServiceStatusBadge service="localstack" name="LocalStack" />
        <Link
          href="/"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <BoltIcon className="h-4 w-4 mr-1.5" />
          Manage Functions
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Lambda</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>AWS Lambda</strong> via LocalStack — a serverless compute
            service that runs your code in response to events. You can create functions in any supported
            runtime, invoke them manually or via triggers, and update your code without any deployment
            pipeline.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Functions are accessible at <code className="bg-gray-100 px-1 rounded font-mono text-xs">http://localhost:4566</code> using
            any AWS SDK or the AWS CLI. Use the dashboard to create and manage functions, or interact
            directly via SDK.
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

        {/* Supported Runtimes */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Supported Runtimes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "python3.12", "python3.11", "python3.10", "python3.9",
              "nodejs20.x", "nodejs18.x",
              "java21", "java17",
              "go1.x",
              "dotnet8",
            ].map((r) => (
              <span key={r} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-orange-50 text-orange-800 border border-orange-200">
                {r}
              </span>
            ))}
          </div>
        </section>

        {/* SDK Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">SDK Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create, invoke, and manage Lambda functions using any AWS SDK.
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
                    ? "border-orange-600 text-orange-600"
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

        {/* Uploading Function Code */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Uploading Function Code</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            When you create a Lambda function from the dashboard, LocalStack provisions it with a
            minimal placeholder zip. To run real code, upload your own deployment package using the
            AWS CLI or any AWS SDK.
          </p>

          <h3 className="text-sm font-semibold text-gray-800 mb-2">Step 1 — Package your code</h3>
          <ThemeableCodeBlock
            language="bash"
            code={`# Python example
echo 'def lambda_handler(event, context):
    return {"statusCode": 200, "body": "Hello!"}' > lambda_function.py
zip function.zip lambda_function.py

# Node.js example
echo 'exports.handler = async (event) => ({ statusCode: 200, body: "Hello!" });' > index.js
zip function.zip index.js`}
          />

          <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">Step 2 — Upload to LocalStack</h3>
          <ThemeableCodeBlock
            language="bash"
            code={`export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Replace YOUR_FUNCTION_NAME with your function name shown on the dashboard
awslocal='aws --endpoint-url http://localhost:4566'

$awslocal lambda update-function-code \\
  --function-name YOUR_FUNCTION_NAME \\
  --zip-file fileb://function.zip`}
          />

          <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-2">Step 3 — Verify and invoke</h3>
          <ThemeableCodeBlock
            language="bash"
            code={`# Check the function is updated
$awslocal lambda get-function --function-name YOUR_FUNCTION_NAME

# Invoke it
$awslocal lambda invoke \\
  --function-name YOUR_FUNCTION_NAME \\
  --payload '{"key":"value"}' \\
  response.json
cat response.json`}
          />

          <div className="mt-4 rounded-md bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
            <strong>Tip:</strong> Use <code className="font-mono">update-function-code</code> (not{" "}
            <code className="font-mono">create-function</code>) to push new code to an existing function.
            The function ARN and configuration stay the same.
          </div>
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
                  ["GET", "/api/lambda/functions", "List all Lambda functions"],
                  ["GET", "/api/lambda/functions/:name", "Get function details"],
                  ["DELETE", "/api/lambda/functions/:name", "Delete a function"],
                  ["POST", "/api/lambda/functions/:name/invoke", "Invoke a function"],
                ].map(([method, endpoint, desc]) => (
                  <tr key={endpoint}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${
                        method === "GET" ? "bg-green-50 text-green-700" :
                        method === "POST" ? "bg-blue-50 text-blue-700" :
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
