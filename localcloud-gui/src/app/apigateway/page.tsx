"use client";

import { ArrowTopRightOnSquareIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const sdkExamples = {
  typescript: `// npm install @aws-sdk/client-api-gateway
import {
  APIGatewayClient,
  CreateRestApiCommand,
  GetRestApisCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  DeleteRestApiCommand,
} from "@aws-sdk/client-api-gateway";

const apigw = new APIGatewayClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a REST API
const { id: apiId } = await apigw.send(new CreateRestApiCommand({
  name: "my-api",
  description: "My test API",
}));

// Get the root resource
const { items } = await apigw.send(new GetResourcesCommand({ restApiId: apiId! }));
const rootId = items?.[0].id!;

// Create a resource (path)
const { id: resourceId } = await apigw.send(new CreateResourceCommand({
  restApiId: apiId!,
  parentId: rootId,
  pathPart: "hello",
}));

// Add a GET method
await apigw.send(new PutMethodCommand({
  restApiId: apiId!,
  resourceId: resourceId!,
  httpMethod: "GET",
  authorizationType: "NONE",
}));

// Add a mock integration
await apigw.send(new PutIntegrationCommand({
  restApiId: apiId!,
  resourceId: resourceId!,
  httpMethod: "GET",
  type: "MOCK",
  requestTemplates: { "application/json": '{"statusCode": 200}' },
}));

// Deploy to a stage
await apigw.send(new CreateDeploymentCommand({
  restApiId: apiId!,
  stageName: "dev",
}));

// Invoke: http://localhost:4566/restapis/{apiId}/dev/_user_request_/hello

// List all APIs
const { items: apis } = await apigw.send(new GetRestApisCommand({}));
apis?.forEach((a) => console.log(a.id, a.name));

// Delete an API
await apigw.send(new DeleteRestApiCommand({ restApiId: apiId! }));`,

  node: `// npm install @aws-sdk/client-api-gateway
import {
  APIGatewayClient,
  CreateRestApiCommand,
  GetRestApisCommand,
  GetResourcesCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  DeleteRestApiCommand,
} from "@aws-sdk/client-api-gateway";

const apigw = new APIGatewayClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a REST API
const { id: apiId } = await apigw.send(new CreateRestApiCommand({ name: "my-api" }));

// Get the root resource
const { items } = await apigw.send(new GetResourcesCommand({ restApiId: apiId }));
const rootId = items[0].id;

// Create a /hello resource
const { id: resourceId } = await apigw.send(new CreateResourceCommand({
  restApiId: apiId,
  parentId: rootId,
  pathPart: "hello",
}));

// Add GET method + mock integration
await apigw.send(new PutMethodCommand({
  restApiId: apiId,
  resourceId,
  httpMethod: "GET",
  authorizationType: "NONE",
}));
await apigw.send(new PutIntegrationCommand({
  restApiId: apiId,
  resourceId,
  httpMethod: "GET",
  type: "MOCK",
  requestTemplates: { "application/json": '{"statusCode": 200}' },
}));

// Deploy
await apigw.send(new CreateDeploymentCommand({ restApiId: apiId, stageName: "dev" }));

// List APIs
const { items: apis } = await apigw.send(new GetRestApisCommand({}));
apis.forEach((a) => console.log(a.id, a.name));`,

  python: `# pip install boto3
import boto3

apigw = boto3.client(
    "apigateway",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Create a REST API
api = apigw.create_rest_api(name="my-api", description="My test API")
api_id = api["id"]

# Get the root resource
resources = apigw.get_resources(restApiId=api_id)
root_id = resources["items"][0]["id"]

# Create a /hello resource
resource = apigw.create_resource(
    restApiId=api_id,
    parentId=root_id,
    pathPart="hello",
)
resource_id = resource["id"]

# Add GET method
apigw.put_method(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod="GET",
    authorizationType="NONE",
)

# Mock integration
apigw.put_integration(
    restApiId=api_id,
    resourceId=resource_id,
    httpMethod="GET",
    type="MOCK",
    requestTemplates={"application/json": '{"statusCode": 200}'},
)

# Deploy to dev stage
apigw.create_deployment(restApiId=api_id, stageName="dev")
print(f"Invoke at: http://localhost:4566/restapis/{api_id}/dev/_user_request_/hello")

# List all APIs
for a in apigw.get_rest_apis()["items"]:
    print(a["id"], a["name"])

# Delete an API
apigw.delete_rest_api(restApiId=api_id)`,

  cli: `# Configure the AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a REST API
API_ID=$(awslocal apigateway create-rest-api \\
  --name my-api \\
  --query 'id' --output text)
echo "API ID: $API_ID"

# Get the root resource ID
ROOT_ID=$(awslocal apigateway get-resources \\
  --rest-api-id $API_ID \\
  --query 'items[0].id' --output text)

# Create a resource at /hello
RESOURCE_ID=$(awslocal apigateway create-resource \\
  --rest-api-id $API_ID \\
  --parent-id $ROOT_ID \\
  --path-part hello \\
  --query 'id' --output text)

# Add a GET method
awslocal apigateway put-method \\
  --rest-api-id $API_ID \\
  --resource-id $RESOURCE_ID \\
  --http-method GET \\
  --authorization-type NONE

# Add a mock integration
awslocal apigateway put-integration \\
  --rest-api-id $API_ID \\
  --resource-id $RESOURCE_ID \\
  --http-method GET \\
  --type MOCK \\
  --request-templates '{"application/json":"{\"statusCode\":200}"}'

# Deploy to dev stage
awslocal apigateway create-deployment \\
  --rest-api-id $API_ID \\
  --stage-name dev

# Invoke the endpoint
curl http://localhost:4566/restapis/$API_ID/dev/_user_request_/hello

# List all APIs
awslocal apigateway get-rest-apis

# Delete an API
awslocal apigateway delete-rest-api --rest-api-id $API_ID`,
};

const externalResources = [
  {
    name: "AWS API Gateway Documentation",
    url: "https://docs.aws.amazon.com/apigateway/",
    description: "Official AWS API Gateway docs — routing, stages, and authorizers.",
  },
  {
    name: "API Gateway SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/api-gateway/",
    description: "APIGatewayClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 API Gateway Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/apigateway.html",
    description: "Complete boto3 API Gateway client reference for Python.",
  },
  {
    name: "LocalStack API Gateway Coverage",
    url: "https://docs.localstack.cloud/references/coverage/coverage_apigateway/",
    description: "Which API Gateway operations are supported by LocalStack.",
  },
];

export default function APIGatewayDocPage() {
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
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <DocPageNav title="API Gateway" subtitle="REST API management via LocalStack">
        <ServiceStatusBadge service="localstack" name="LocalStack" />
        <Link
          href="/"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-pink-700 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
        >
          <GlobeAltIcon className="h-4 w-4 mr-1.5" />
          Manage APIs
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About API Gateway</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>AWS API Gateway</strong> via LocalStack — a fully managed
            service for creating, publishing, and managing REST APIs. You can define resources, methods,
            integrations (including Lambda proxy), and deploy to stages — all locally without an AWS account.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            APIs are accessible at{" "}
            <code className="bg-gray-100 px-1 rounded font-mono text-xs">
              http://localhost:4566/restapis/&#123;apiId&#125;/&#123;stage&#125;/_user_request_/&#123;path&#125;
            </code>
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
                  <td className="px-4 py-2.5 text-gray-600">Management endpoint</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">http://localhost:4566</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Invoke URL pattern</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900 text-xs">http://localhost:4566/restapis/{"{apiId}"}/{"{stage}"}/_user_request_/{"{path}"}</td>
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
            Create REST APIs, define resources, and deploy to stages.
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
                    ? "border-pink-600 text-pink-600"
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
                  ["GET", "/api/apigateway/apis", "List all REST APIs"],
                  ["GET", "/api/apigateway/apis/:apiId", "Get API details"],
                  ["DELETE", "/api/apigateway/apis/:apiId", "Delete a REST API"],
                ].map(([method, endpoint, desc]) => (
                  <tr key={`${method}-${endpoint}`}>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono ${
                        method === "GET" ? "bg-green-50 text-green-700" :
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
