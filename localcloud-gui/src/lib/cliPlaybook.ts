import type {
  APIGatewayConfig,
  DynamoDBTableConfig,
  IAMRoleConfig,
  LambdaFunctionConfig,
  Resource,
  S3BucketConfig,
  SavedConfig,
  SecretsManagerConfig,
  SSMParameterConfig,
} from "@/types";

export type CliPreambleMode = "local" | "aws";

export interface CliPlaybookEntry {
  id: string;
  label: string;
  resourceType: string;
  resourceName: string;
  source: "saved-config" | "live-only" | "matched";
  savedConfigId?: number;
  savedConfigName?: string;
  command: string;
  isLive: boolean;
  note?: string;
}

export const LOCAL_ENV_PREAMBLE = `# LCK AWS CLI — LocalCloud Kit / MiniStack (run once per shell)
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_ENDPOINT_URL=http://localhost:4566
# Optional for some S3 emulator setups:
# export AWS_S3_FORCE_PATH_STYLE=true`;

export const AWS_ENV_PREAMBLE = `# AWS CLI (run once per shell — use your profile, SSO, or role)
export AWS_DEFAULT_REGION=us-east-1
# If AWS_ENDPOINT_URL is set from a prior LCK session, unset it before targeting real AWS:
# unset AWS_ENDPOINT_URL
# aws sso login
# or: export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...`;

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function normalizeResourceType(type: string): string {
  if (type === "secrets") return "secretsmanager";
  return type;
}

/** Resolve the AWS resource name from a saved config payload. */
export function resourceNameFromConfig(
  resourceType: string,
  config: Record<string, unknown>
): string | null {
  const t = normalizeResourceType(resourceType);
  switch (t) {
    case "s3":
      return (config.bucketName as string) || null;
    case "dynamodb":
      return (config.tableName as string) || null;
    case "lambda":
      return (config.functionName as string) || null;
    case "apigateway":
      return (config.apiName as string) || null;
    case "secretsmanager":
      return (config.secretName as string) || null;
    case "ssm":
      return (config.parameterName as string) || null;
    case "iam":
      return (config.roleName as string) || null;
    default:
      return null;
  }
}

function lines(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join("\n");
}

export function configToAwsCli(
  resourceType: string,
  config: Record<string, unknown>
): { command: string; note?: string } {
  const t = normalizeResourceType(resourceType);

  switch (t) {
    case "s3":
      return s3Command(config as unknown as S3BucketConfig);
    case "dynamodb":
      return dynamodbCommand(config as unknown as DynamoDBTableConfig);
    case "lambda":
      return lambdaCommand(config as unknown as LambdaFunctionConfig);
    case "apigateway":
      return apigatewayCommand(config as unknown as APIGatewayConfig);
    case "secretsmanager":
      return secretsCommand(config as unknown as SecretsManagerConfig);
    case "ssm":
      return ssmCommand(config as unknown as SSMParameterConfig);
    case "iam":
      return iamCommand(config as unknown as IAMRoleConfig);
    default:
      return { command: `# Unsupported resource type: ${resourceType}` };
  }
}

function s3Command(config: S3BucketConfig): { command: string } {
  const bucket = config.bucketName;
  const region = config.region || "us-east-1";
  const parts: string[] = [];

  if (region !== "us-east-1") {
    parts.push(
      `aws s3api create-bucket --bucket ${shellQuote(bucket)} --region ${region} \\`,
      `  --create-bucket-configuration LocationConstraint=${region}`
    );
  } else {
    parts.push(`aws s3api create-bucket --bucket ${shellQuote(bucket)}`);
  }

  if (config.versioning) {
    parts.push(
      `aws s3api put-bucket-versioning --bucket ${shellQuote(bucket)} \\`,
      `  --versioning-configuration Status=Enabled`
    );
  }

  if (config.encryption) {
    parts.push(
      `aws s3api put-bucket-encryption --bucket ${shellQuote(bucket)} \\`,
      `  --server-side-encryption-configuration '${JSON.stringify({
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
          },
        ],
      })}'`
    );
  }

  return { command: parts.join("\n\n") };
}

function dynamodbCommand(config: DynamoDBTableConfig): { command: string } {
  const attrNames = new Set<string>();
  attrNames.add(config.partitionKey);
  if (config.sortKey) attrNames.add(config.sortKey);
  for (const gsi of config.gsis || []) {
    attrNames.add(gsi.partitionKey);
    if (gsi.sortKey) attrNames.add(gsi.sortKey);
  }

  const attributeDefinitions = [...attrNames].map((name) => ({
    AttributeName: name,
    AttributeType: "S",
  }));

  const keySchema: { AttributeName: string; KeyType: string }[] = [
    { AttributeName: config.partitionKey, KeyType: "HASH" },
  ];
  if (config.sortKey) {
    keySchema.push({ AttributeName: config.sortKey, KeyType: "RANGE" });
  }

  const billingMode = config.billingMode || "PAY_PER_REQUEST";
  const gsis = config.gsis || [];
  const cmdParts = [
    `aws dynamodb create-table \\`,
    `  --table-name ${shellQuote(config.tableName)} \\`,
    `  --attribute-definitions '${JSON.stringify(attributeDefinitions)}' \\`,
    `  --key-schema '${JSON.stringify(keySchema)}' \\`,
    `  --billing-mode ${billingMode}`,
  ];

  if (billingMode === "PROVISIONED") {
    const last = cmdParts.length - 1;
    cmdParts[last] = `${cmdParts[last]} \\`;
    cmdParts.push(
      `  --provisioned-throughput ReadCapacityUnits=${config.readCapacity ?? 5},WriteCapacityUnits=${config.writeCapacity ?? 5}`
    );
  }

  if (gsis.length > 0) {
    const last = cmdParts.length - 1;
    if (!cmdParts[last].endsWith(" \\")) {
      cmdParts[last] = `${cmdParts[last]} \\`;
    }
    const globalSecondaryIndexes = gsis.map((gsi) => {
      const gsiKeySchema: { AttributeName: string; KeyType: string }[] = [
        { AttributeName: gsi.partitionKey, KeyType: "HASH" },
      ];
      if (gsi.sortKey) {
        gsiKeySchema.push({ AttributeName: gsi.sortKey, KeyType: "RANGE" });
      }
      const index: Record<string, unknown> = {
        IndexName: gsi.indexName,
        KeySchema: gsiKeySchema,
        Projection: { ProjectionType: gsi.projectionType || "ALL" },
      };
      if (gsi.projectionType === "INCLUDE" && gsi.nonKeyAttributes?.length) {
        (index.Projection as Record<string, unknown>).NonKeyAttributes =
          gsi.nonKeyAttributes;
      }
      if (billingMode === "PROVISIONED") {
        index.ProvisionedThroughput = {
          ReadCapacityUnits: config.readCapacity ?? 5,
          WriteCapacityUnits: config.writeCapacity ?? 5,
        };
      }
      return index;
    });
    cmdParts.push(`  --global-secondary-indexes '${JSON.stringify(globalSecondaryIndexes)}'`);
  }

  return { command: cmdParts.join(" \\\n") };
}

function lambdaCommand(config: LambdaFunctionConfig): { command: string; note?: string } {
  const name = config.functionName;
  const runtime = config.runtime || "python3.12";
  const handler = config.handler || "lambda_function.lambda_handler";
  const desc =
    config.description && config.description.trim()
      ? ` \\\n  --description ${shellQuote(config.description)}`
      : "";

  return {
    command: lines(
      "# Package your handler first, e.g.: zip -j function.zip lambda_function.py",
      `aws lambda create-function \\`,
      `  --function-name ${shellQuote(name)} \\`,
      `  --runtime ${runtime} \\`,
      `  --role arn:aws:iam::000000000000:role/service-role/placeholder \\`,
      `  --handler ${handler} \\`,
      `  --zip-file fileb://function.zip${desc}`
    ),
    note: "Replace the IAM role ARN and function.zip path for your environment.",
  };
}

function apigatewayCommand(config: APIGatewayConfig): { command: string } {
  const name = shellQuote(config.apiName);
  if (config.description?.trim()) {
    return {
      command: `aws apigateway create-rest-api --name ${name} --description ${shellQuote(config.description)}`,
    };
  }
  return { command: `aws apigateway create-rest-api --name ${name}` };
}

function secretsCommand(config: SecretsManagerConfig): { command: string; note?: string } {
  const parts = [
    `aws secretsmanager create-secret \\`,
    `  --name ${shellQuote(config.secretName)} \\`,
    `  --secret-string ${shellQuote("<your-secret-value>")}`,
  ];
  if (config.description?.trim()) {
    parts.push(`  --description ${shellQuote(config.description)}`);
  }
  if (config.kmsKeyId?.trim()) {
    parts.push(`  --kms-key-id ${shellQuote(config.kmsKeyId)}`);
  }
  if (config.tags && Object.keys(config.tags).length > 0) {
    const tagPairs = Object.entries(config.tags)
      .map(([k, v]) => `Key=${k},Value=${v}`)
      .join(" ");
    parts.push(`  --tags ${tagPairs}`);
  }
  return {
    command: parts.join(" \\\n"),
    note: config.secretValue
      ? "Secret value is not shown in the playbook. Set --secret-string or use a env var."
      : undefined,
  };
}

function ssmCommand(config: SSMParameterConfig): { command: string } {
  const parts = [
    `aws ssm put-parameter \\`,
    `  --name ${shellQuote(config.parameterName)} \\`,
    `  --value ${shellQuote(config.parameterValue)} \\`,
    `  --type ${config.parameterType || "String"} \\`,
    `  --overwrite`,
  ];
  if (config.description?.trim()) {
    parts.push(`  --description ${shellQuote(config.description)}`);
  }
  return { command: parts.join(" \\\n") };
}

function iamCommand(config: IAMRoleConfig): { command: string } {
  const trustPolicy =
    config.trustPolicy?.trim() ||
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "lambda.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    });

  const parts = [
    `aws iam create-role \\`,
    `  --role-name ${shellQuote(config.roleName)} \\`,
    `  --assume-role-policy-document ${shellQuote(trustPolicy)}`,
  ];
  if (config.description?.trim()) {
    parts.push(`  --description ${shellQuote(config.description)}`);
  }
  if (config.path && config.path !== "/") {
    parts.push(`  --path ${shellQuote(config.path)}`);
  }
  return { command: parts.join(" \\\n") };
}

export function minimalCliForResource(resource: Resource): { command: string; note?: string } {
  const name = shellQuote(resource.name);
  switch (resource.type) {
    case "s3":
      return { command: `aws s3api create-bucket --bucket ${name}` };
    case "dynamodb":
      return {
        command: lines(
          `aws dynamodb create-table \\`,
          `  --table-name ${name} \\`,
          `  --attribute-definitions AttributeName=pk,AttributeType=S \\`,
          `  --key-schema AttributeName=pk,KeyType=HASH \\`,
          `  --billing-mode PAY_PER_REQUEST`
        ),
        note: "Minimal schema only. Save a config when creating for full CLI.",
      };
    case "lambda":
      return {
        command: lines(
          "# Package code: zip -j function.zip lambda_function.py",
          `aws lambda create-function \\`,
          `  --function-name ${name} \\`,
          `  --runtime python3.12 \\`,
          `  --role arn:aws:iam::000000000000:role/service-role/placeholder \\`,
          `  --handler lambda_function.lambda_handler \\`,
          `  --zip-file fileb://function.zip`
        ),
        note: "Save a config when creating for runtime/handler details.",
      };
    case "apigateway":
      return { command: `aws apigateway create-rest-api --name ${name}` };
    case "secretsmanager":
      return {
        command: `aws secretsmanager create-secret --name ${name} --secret-string ${shellQuote("<your-secret-value>")}`,
        note: "Secret value is not recoverable from the emulator. Set your own --secret-string.",
      };
    case "ssm":
      return {
        command: lines(
          `aws ssm put-parameter \\`,
          `  --name ${name} \\`,
          `  --value ${shellQuote("<value>")} \\`,
          `  --type String \\`,
          `  --overwrite`
        ),
        note: "Save a config when creating for type and value.",
      };
    case "iam":
      return {
        command: lines(
          `aws iam create-role \\`,
          `  --role-name ${name} \\`,
          `  --assume-role-policy-document '${JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Service: "lambda.amazonaws.com" },
                Action: "sts:AssumeRole",
              },
            ],
          })}'`
        ),
        note: "Save a config when creating for trust policy details.",
      };
    default:
      return { command: `# No CLI template for ${resource.type}` };
  }
}

export function buildPlaybookEntries(
  savedConfigs: SavedConfig[],
  liveResources: Resource[],
  projectId: number | null
): CliPlaybookEntry[] {
  const projectConfigs = savedConfigs.filter((c) => c.project_id === projectId);
  const liveByName = new Map<string, Resource>();
  for (const r of liveResources) {
    liveByName.set(`${r.type}:${r.name}`, r);
  }

  const entries: CliPlaybookEntry[] = [];
  const coveredLive = new Set<string>();

  for (const cfg of projectConfigs) {
    const normalizedType = normalizeResourceType(cfg.resource_type);
    const config = cfg.config as Record<string, unknown>;
    const resourceName = resourceNameFromConfig(cfg.resource_type, config);
    const { command, note } = configToAwsCli(cfg.resource_type, config);
    const liveKey =
      resourceName != null ? `${normalizedType}:${resourceName}` : null;
    const isLive = liveKey != null && liveByName.has(liveKey);
    if (isLive && liveKey) coveredLive.add(liveKey);

    entries.push({
      id: `config-${cfg.id}`,
      label: cfg.name,
      resourceType: normalizedType,
      resourceName: resourceName || cfg.name,
      source: isLive ? "matched" : "saved-config",
      savedConfigId: cfg.id,
      savedConfigName: cfg.name,
      command,
      isLive,
      note,
    });
  }

  for (const resource of liveResources) {
    const key = `${resource.type}:${resource.name}`;
    if (coveredLive.has(key)) continue;
    const { command, note } = minimalCliForResource(resource);
    entries.push({
      id: resource.id,
      label: resource.name,
      resourceType: resource.type,
      resourceName: resource.name,
      source: "live-only",
      command,
      isLive: true,
      note,
    });
  }

  const typeOrder = [
    "s3",
    "dynamodb",
    "lambda",
    "apigateway",
    "secretsmanager",
    "ssm",
    "iam",
  ];
  entries.sort((a, b) => {
    const ta = typeOrder.indexOf(a.resourceType);
    const tb = typeOrder.indexOf(b.resourceType);
    if (ta !== tb) return (ta === -1 ? 99 : ta) - (tb === -1 ? 99 : tb);
    return a.resourceName.localeCompare(b.resourceName);
  });

  return entries;
}

export function buildFullScript(
  preambleMode: CliPreambleMode,
  entries: CliPlaybookEntry[],
  projectLabel: string
): string {
  const preamble = preambleMode === "local" ? LOCAL_ENV_PREAMBLE : AWS_ENV_PREAMBLE;
  const header = `#!/usr/bin/env bash
# LocalCloud Kit CLI playbook — ${projectLabel}
# Resource commands use plain AWS CLI (no --endpoint-url).
# Set AWS_ENDPOINT_URL in the preamble for LCK AWS CLI, or see the note in the AWS CLI block.
set -euo pipefail

`;
  const blocks = entries.map((e) => {
    const comment = `# ${e.resourceType}: ${e.resourceName}${e.savedConfigName ? ` (${e.savedConfigName})` : ""}`;
    return `${comment}\n${e.command}`;
  });
  return `${header}${preamble}\n\n${blocks.join("\n\n")}\n`;
}

export function inventorySummary(
  liveResources: Resource[]
): { type: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of liveResources) {
    counts.set(r.type, (counts.get(r.type) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));
}
