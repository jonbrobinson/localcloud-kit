"use client";

import { ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

// ── IAM Roles examples ────────────────────────────────────────────────────────

const roleExamples = {
  typescript: `// npm install @aws-sdk/client-iam
import {
  IAMClient,
  CreateRoleCommand,
  GetRoleCommand,
  ListRolesCommand,
  DeleteRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";

const iam = new IAMClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a role that Lambda can assume
const trustPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Service: "lambda.amazonaws.com" },
    Action: "sts:AssumeRole",
  }],
});

const { Role } = await iam.send(new CreateRoleCommand({
  RoleName: "my-lambda-execution-role",
  AssumeRolePolicyDocument: trustPolicy,
  Description: "Execution role for my Lambda function",
}));
console.log(Role?.Arn);

// Attach a managed policy
await iam.send(new AttachRolePolicyCommand({
  RoleName: "my-lambda-execution-role",
  PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
}));

// List attached policies
const { AttachedPolicies } = await iam.send(new ListAttachedRolePoliciesCommand({
  RoleName: "my-lambda-execution-role",
}));
AttachedPolicies?.forEach((p) => console.log(p.PolicyName, p.PolicyArn));

// List all roles
const { Roles } = await iam.send(new ListRolesCommand({}));
Roles?.forEach((r) => console.log(r.RoleName, r.Arn));

// Delete a role (detach policies first)
await iam.send(new DetachRolePolicyCommand({
  RoleName: "my-lambda-execution-role",
  PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
}));
await iam.send(new DeleteRoleCommand({ RoleName: "my-lambda-execution-role" }));`,

  node: `// npm install @aws-sdk/client-iam
import {
  IAMClient,
  CreateRoleCommand,
  ListRolesCommand,
  DeleteRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
} from "@aws-sdk/client-iam";

const iam = new IAMClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

const trustPolicy = JSON.stringify({
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Service: "lambda.amazonaws.com" },
    Action: "sts:AssumeRole",
  }],
});

// Create role
const { Role } = await iam.send(new CreateRoleCommand({
  RoleName: "my-lambda-execution-role",
  AssumeRolePolicyDocument: trustPolicy,
}));
console.log(Role.Arn);

// Attach policy
await iam.send(new AttachRolePolicyCommand({
  RoleName: "my-lambda-execution-role",
  PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
}));

// List roles
const { Roles } = await iam.send(new ListRolesCommand({}));
console.log(Roles.map((r) => r.RoleName));`,

  python: `# pip install boto3
import boto3
import json

iam = boto3.client(
    "iam",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

trust_policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole",
    }],
})

# Create a role
response = iam.create_role(
    RoleName="my-lambda-execution-role",
    AssumeRolePolicyDocument=trust_policy,
    Description="Execution role for my Lambda function",
)
print(response["Role"]["Arn"])

# Attach a managed policy
iam.attach_role_policy(
    RoleName="my-lambda-execution-role",
    PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
)

# List roles
roles = iam.list_roles()["Roles"]
for r in roles:
    print(r["RoleName"], r["Arn"])

# Delete a role (detach policies first)
iam.detach_role_policy(
    RoleName="my-lambda-execution-role",
    PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
)
iam.delete_role(RoleName="my-lambda-execution-role")`,

  cli: `# Create a role (save trust policy to a file)
cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

aws --endpoint-url=http://localhost:4566 \\
  iam create-role \\
  --role-name my-lambda-execution-role \\
  --assume-role-policy-document file:///tmp/trust-policy.json \\
  --description "Execution role for my Lambda function"

# Attach a managed policy
aws --endpoint-url=http://localhost:4566 \\
  iam attach-role-policy \\
  --role-name my-lambda-execution-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# List attached policies
aws --endpoint-url=http://localhost:4566 \\
  iam list-attached-role-policies \\
  --role-name my-lambda-execution-role

# List all roles
aws --endpoint-url=http://localhost:4566 iam list-roles

# Delete a role
aws --endpoint-url=http://localhost:4566 \\
  iam detach-role-policy \\
  --role-name my-lambda-execution-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws --endpoint-url=http://localhost:4566 \\
  iam delete-role \\
  --role-name my-lambda-execution-role`,
};

// ── STS Session Credentials examples ─────────────────────────────────────────

const sessionExamples = {
  typescript: `// npm install @aws-sdk/client-sts
import { STSClient, GetSessionTokenCommand, AssumeRoleCommand, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const sts = new STSClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Get temporary session credentials
const { Credentials } = await sts.send(new GetSessionTokenCommand({
  DurationSeconds: 3600, // 1 hour
}));
console.log(Credentials?.AccessKeyId);
console.log(Credentials?.SecretAccessKey);
console.log(Credentials?.SessionToken);
console.log(Credentials?.Expiration);

// Assume a role and get temporary credentials
const result = await sts.send(new AssumeRoleCommand({
  RoleArn: "arn:aws:iam::000000000000:role/my-lambda-execution-role",
  RoleSessionName: "my-session",
  DurationSeconds: 3600,
}));
const { AccessKeyId, SecretAccessKey, SessionToken } = result.Credentials!;

// Use the temporary credentials with another client
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
const s3AsRole = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: AccessKeyId!, secretAccessKey: SecretAccessKey!, sessionToken: SessionToken },
});
const { Buckets } = await s3AsRole.send(new ListBucketsCommand({}));
console.log(Buckets);

// Get the current caller identity
const identity = await sts.send(new GetCallerIdentityCommand({}));
console.log(identity.Account, identity.UserId, identity.Arn);`,

  node: `// npm install @aws-sdk/client-sts
import { STSClient, GetSessionTokenCommand, AssumeRoleCommand } from "@aws-sdk/client-sts";

const sts = new STSClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Get temporary session credentials (valid for 1 hour)
const { Credentials } = await sts.send(new GetSessionTokenCommand({ DurationSeconds: 3600 }));
console.log("AccessKeyId:", Credentials.AccessKeyId);
console.log("Expires:", Credentials.Expiration);

// Assume a role
const { Credentials: roleCreds, AssumedRoleUser } = await sts.send(new AssumeRoleCommand({
  RoleArn: "arn:aws:iam::000000000000:role/my-lambda-execution-role",
  RoleSessionName: "my-session",
}));
console.log("Assumed role ARN:", AssumedRoleUser.Arn);
console.log("Session AccessKeyId:", roleCreds.AccessKeyId);`,

  python: `# pip install boto3
import boto3

sts = boto3.client(
    "sts",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# Get temporary session credentials
response = sts.get_session_token(DurationSeconds=3600)
creds = response["Credentials"]
print("AccessKeyId:", creds["AccessKeyId"])
print("SecretAccessKey:", creds["SecretAccessKey"])
print("SessionToken:", creds["SessionToken"])
print("Expiration:", creds["Expiration"])

# Assume a role
response = sts.assume_role(
    RoleArn="arn:aws:iam::000000000000:role/my-lambda-execution-role",
    RoleSessionName="my-session",
    DurationSeconds=3600,
)
role_creds = response["Credentials"]
assumed_user = response["AssumedRoleUser"]
print("Assumed role ARN:", assumed_user["Arn"])

# Use the temporary credentials
s3_as_role = boto3.client(
    "s3",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id=role_creds["AccessKeyId"],
    aws_secret_access_key=role_creds["SecretAccessKey"],
    aws_session_token=role_creds["SessionToken"],
)
buckets = s3_as_role.list_buckets()["Buckets"]
print(buckets)

# Get caller identity
identity = sts.get_caller_identity()
print(identity["Account"], identity["UserId"], identity["Arn"])`,

  cli: `# Get temporary session credentials
aws --endpoint-url=http://localhost:4566 \\
  sts get-session-token \\
  --duration-seconds 3600

# Output:
# {
#   "Credentials": {
#     "AccessKeyId": "...",
#     "SecretAccessKey": "...",
#     "SessionToken": "...",
#     "Expiration": "2026-01-01T00:00:00+00:00"
#   }
# }

# Assume a role and get temporary credentials
aws --endpoint-url=http://localhost:4566 \\
  sts assume-role \\
  --role-arn arn:aws:iam::000000000000:role/my-lambda-execution-role \\
  --role-session-name my-session \\
  --duration-seconds 3600

# Use assumed-role credentials in subsequent commands
export AWS_ACCESS_KEY_ID=<AccessKeyId from above>
export AWS_SECRET_ACCESS_KEY=<SecretAccessKey from above>
export AWS_SESSION_TOKEN=<SessionToken from above>

aws --endpoint-url=http://localhost:4566 s3 ls

# Verify caller identity
aws --endpoint-url=http://localhost:4566 sts get-caller-identity

# LocalCloud Kit API endpoints
# GET  session credentials: POST /api/iam/sessions/token
# Assume role credentials:  POST /api/iam/sessions/assume-role
# Caller identity:          GET  /api/iam/sessions/identity`,
};

const externalResources = [
  { name: "AWS IAM Docs", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/", description: "Official IAM user guide" },
  { name: "AWS STS Docs", url: "https://docs.aws.amazon.com/STS/latest/APIReference/", description: "Security Token Service API reference" },
  { name: "LocalStack IAM", url: "https://docs.localstack.cloud/references/coverage/coverage_iam/", description: "LocalStack IAM feature coverage" },
  { name: "LocalStack STS", url: "https://docs.localstack.cloud/references/coverage/coverage_sts/", description: "LocalStack STS feature coverage" },
  { name: "@aws-sdk/client-iam", url: "https://www.npmjs.com/package/@aws-sdk/client-iam", description: "AWS SDK v3 IAM client" },
  { name: "@aws-sdk/client-sts", url: "https://www.npmjs.com/package/@aws-sdk/client-sts", description: "AWS SDK v3 STS client" },
];

export default function IAMDocPage() {
  const { profile, updateProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("typescript");
  const [activeSessionTab, setActiveSessionTab] = useState<PageTab>("typescript");

  useEffect(() => {
    if (profile?.preferred_language) {
      const lang = profile.preferred_language as PageTab;
      const resolved = PAGE_TABS.includes(lang) ? lang : "typescript";
      setActiveTab(resolved);
      setActiveSessionTab(resolved);
    }
  }, [profile?.preferred_language]);

  const handleTabChange = (tab: PageTab) => {
    setActiveTab(tab);
    setActiveSessionTab(tab);
    updateProfile({ preferred_language: tab }).catch(() => {});
  };

  const tabBar = (current: PageTab, onChange: (t: PageTab) => void) => (
    <div className="flex space-x-1 mb-4 border-b border-gray-200">
      {([
        { key: "typescript" as const, label: "TypeScript" },
        { key: "node" as const, label: "Node.js" },
        { key: "python" as const, label: "Python" },
        { key: "cli" as const, label: "AWS CLI" },
      ]).map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            current === key
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <DocPageNav title="IAM & STS" subtitle="Roles, policies, and session credentials via LocalStack">
        <ServiceStatusBadge service="localstack" name="LocalStack" />
        <Link
          href="/"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
          Manage IAM
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About IAM &amp; STS</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit emulates <strong>AWS Identity and Access Management (IAM)</strong> and
            the <strong>Security Token Service (STS)</strong> via LocalStack. IAM lets you create
            roles and attach policies that define what AWS services and resources can be accessed.
            STS lets you generate temporary, short-lived credentials for those roles.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Use IAM roles when you need to delegate access between services — for example, granting
            a Lambda function permission to read from S3 or write to DynamoDB. Use STS to assume
            those roles programmatically and receive temporary credentials with a configurable
            expiry.
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
                <tr><td className="px-4 py-2.5 text-gray-600">Endpoint (host)</td><td className="px-4 py-2.5 font-mono text-gray-900">http://localhost:4566</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Endpoint (Docker)</td><td className="px-4 py-2.5 font-mono text-gray-900">http://localstack:4566</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Region</td><td className="px-4 py-2.5 font-mono text-gray-900">us-east-1</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Access Key ID</td><td className="px-4 py-2.5 font-mono text-gray-900">test</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Secret Access Key</td><td className="px-4 py-2.5 font-mono text-gray-900">test</td></tr>
                <tr><td className="px-4 py-2.5 text-gray-600">Account ID (LocalStack)</td><td className="px-4 py-2.5 font-mono text-gray-900">000000000000</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* IAM Roles */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">IAM Roles</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create roles with trust policies, attach managed policies, and delete roles.
          </p>
          {tabBar(activeTab, handleTabChange)}
          {activeTab === "typescript" && <ThemeableCodeBlock code={roleExamples.typescript} language="typescript" />}
          {activeTab === "node" && <ThemeableCodeBlock code={roleExamples.node} language="javascript" />}
          {activeTab === "python" && <ThemeableCodeBlock code={roleExamples.python} language="python" />}
          {activeTab === "cli" && <ThemeableCodeBlock code={roleExamples.cli} language="bash" />}
        </section>

        {/* STS Session Credentials */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Session Credentials</h2>
          <p className="text-sm text-gray-500 mb-4">
            Use STS to get temporary credentials via <code className="bg-gray-100 px-1 rounded font-mono text-xs">GetSessionToken</code> or
            assume an IAM role with <code className="bg-gray-100 px-1 rounded font-mono text-xs">AssumeRole</code>.
          </p>
          {tabBar(activeSessionTab, handleTabChange)}
          {activeSessionTab === "typescript" && <ThemeableCodeBlock code={sessionExamples.typescript} language="typescript" />}
          {activeSessionTab === "node" && <ThemeableCodeBlock code={sessionExamples.node} language="javascript" />}
          {activeSessionTab === "python" && <ThemeableCodeBlock code={sessionExamples.python} language="python" />}
          {activeSessionTab === "cli" && <ThemeableCodeBlock code={sessionExamples.cli} language="bash" />}
        </section>

        {/* LocalCloud Kit API Endpoints */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">LocalCloud Kit API</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Method</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Path</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white font-mono text-xs">
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/roles</td><td className="px-4 py-2.5 font-sans text-gray-600">List all IAM roles</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/roles/:roleName</td><td className="px-4 py-2.5 font-sans text-gray-600">Get a single IAM role</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-blue-700 font-semibold">POST</span></td><td className="px-4 py-2.5">/api/iam/roles</td><td className="px-4 py-2.5 font-sans text-gray-600">Create an IAM role</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-red-700 font-semibold">DELETE</span></td><td className="px-4 py-2.5">/api/iam/roles/:roleName</td><td className="px-4 py-2.5 font-sans text-gray-600">Delete an IAM role (auto-detaches policies)</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/roles/:roleName/policies</td><td className="px-4 py-2.5 font-sans text-gray-600">List attached policies on a role</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-blue-700 font-semibold">POST</span></td><td className="px-4 py-2.5">/api/iam/roles/:roleName/policies</td><td className="px-4 py-2.5 font-sans text-gray-600">Attach a managed policy to a role</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-red-700 font-semibold">DELETE</span></td><td className="px-4 py-2.5">/api/iam/roles/:roleName/policies/:name</td><td className="px-4 py-2.5 font-sans text-gray-600">Detach a managed policy from a role</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/users</td><td className="px-4 py-2.5 font-sans text-gray-600">List IAM users</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/policies</td><td className="px-4 py-2.5 font-sans text-gray-600">List managed policies</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-blue-700 font-semibold">POST</span></td><td className="px-4 py-2.5">/api/iam/sessions/token</td><td className="px-4 py-2.5 font-sans text-gray-600">Get temporary session credentials (GetSessionToken)</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-blue-700 font-semibold">POST</span></td><td className="px-4 py-2.5">/api/iam/sessions/assume-role</td><td className="px-4 py-2.5 font-sans text-gray-600">Assume a role and get credentials (AssumeRole)</td></tr>
                <tr><td className="px-4 py-2.5"><span className="text-green-700 font-semibold">GET</span></td><td className="px-4 py-2.5">/api/iam/sessions/identity</td><td className="px-4 py-2.5 font-sans text-gray-600">Get caller identity (GetCallerIdentity)</td></tr>
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
                  <tr key={`${r.name}-${idx}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-red-600 hover:underline font-medium"
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
