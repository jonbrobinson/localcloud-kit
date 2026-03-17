export type DocsCategory = "infrastructure" | "aws-resources" | "platform-services";

export interface DocsHubEntry {
  id:
    | "localstack"
    | "connect"
    | "s3"
    | "dynamodb"
    | "lambda"
    | "apigateway"
    | "secrets"
    | "ssm"
    | "iam"
    | "redis"
    | "mailpit"
    | "postgres"
    | "keycloak"
    | "posthog";
  title: string;
  category: DocsCategory;
  docsPath: string;
  summary: string;
  quickChecks: string[];
  managerPath?: string;
  managerLabel?: string;
  adminUrl?: string;
  adminLabel?: string;
  icon?: string;
}

export interface ExternalDocsLink {
  title: string;
  href: string;
  description: string;
}

export const DOCS_CATEGORY_LABEL: Record<DocsCategory, string> = {
  infrastructure: "Infrastructure",
  "aws-resources": "AWS Resources",
  "platform-services": "Platform Services",
};

export const DOCS_CATEGORY_ORDER: DocsCategory[] = [
  "infrastructure",
  "aws-resources",
  "platform-services",
];

export const DOCS_HUB_ENTRIES: DocsHubEntry[] = [
  {
    id: "localstack",
    title: "LocalStack",
    category: "infrastructure",
    docsPath: "/localstack",
    summary: "Core AWS emulation runtime used by all AWS resource workflows.",
    quickChecks: [
      "LocalStack status is healthy",
      "Endpoint http://localhost:4566 is reachable",
      "Resources list updates after create/destroy actions",
    ],
  },
  {
    id: "connect",
    title: "Connect",
    category: "infrastructure",
    docsPath: "/connect",
    summary: "SDK endpoint configuration reference for local integration.",
    quickChecks: [
      "AWS endpoint points to LocalStack",
      "Credentials are test/test in local mode",
      "Region is set consistently across services",
    ],
  },
  {
    id: "s3",
    title: "S3 Buckets",
    category: "aws-resources",
    docsPath: "/s3",
    summary: "Verify object uploads, key paths, and metadata quickly.",
    quickChecks: [
      "Bucket exists in active project",
      "Latest object key matches expected pattern",
      "Object metadata/type looks correct",
    ],
    managerPath: "/manage/s3",
    managerLabel: "Open Manager",
    icon: "logos:aws-s3",
  },
  {
    id: "dynamodb",
    title: "DynamoDB",
    category: "aws-resources",
    docsPath: "/dynamodb",
    summary: "Inspect table records and confirm value/type shape.",
    quickChecks: [
      "Target table exists and is ACTIVE",
      "Recent items include expected keys",
      "Numeric/date fields use expected types",
    ],
    managerPath: "/manage/dynamodb",
    managerLabel: "Open Manager",
    icon: "logos:aws-dynamodb",
  },
  {
    id: "lambda",
    title: "Lambda",
    category: "aws-resources",
    docsPath: "/lambda",
    summary: "Confirm function config and invocation response shape.",
    quickChecks: [
      "Function exists and shows active state",
      "Handler/runtime match your deployment",
      "Invocation output has expected keys/types",
    ],
    managerPath: "/manage/lambda",
    managerLabel: "Open Manager",
    icon: "logos:aws-lambda",
  },
  {
    id: "apigateway",
    title: "API Gateway",
    category: "aws-resources",
    docsPath: "/apigateway",
    summary: "Validate routes/integrations and local invoke URLs.",
    quickChecks: [
      "API/stage exists in project",
      "Route method/path match application calls",
      "Invoke URL returns expected status and payload",
    ],
    managerPath: "/manage/apigateway",
    managerLabel: "Open Manager",
    icon: "logos:aws-api-gateway",
  },
  {
    id: "secrets",
    title: "Secrets Manager",
    category: "aws-resources",
    docsPath: "/secrets",
    summary: "Verify secret names, values, and retrieval behavior locally.",
    quickChecks: [
      "Secret name/path matches app config",
      "Latest value is available",
      "Consumer app can read secret without cloud calls",
    ],
    managerPath: "/manage/secrets",
    managerLabel: "Open Manager",
    icon: "logos:aws-secrets-manager",
  },
  {
    id: "ssm",
    title: "Parameter Store",
    category: "aws-resources",
    docsPath: "/ssm",
    summary: "Check parameter paths, types, and current values.",
    quickChecks: [
      "Expected parameter path exists",
      "Type is String/StringList/SecureString as intended",
      "Runtime reads local value correctly",
    ],
    managerPath: "/manage/ssm",
    managerLabel: "Open Manager",
    icon: "logos:aws-systems-manager",
  },
  {
    id: "iam",
    title: "IAM & STS",
    category: "aws-resources",
    docsPath: "/iam",
    summary: "Inspect role setup and local credential/assume-role flows.",
    quickChecks: [
      "Role exists with expected trust service",
      "Policy attachment matches intended access",
      "STS call returns expected identity/session data",
    ],
    managerPath: "/manage/iam",
    managerLabel: "Open Manager",
    icon: "logos:aws-iam",
  },
  {
    id: "redis",
    title: "Redis Cache",
    category: "platform-services",
    docsPath: "/redis",
    summary: "Quickly verify cache keys, value format, and service health.",
    quickChecks: [
      "Redis service status is running",
      "Expected key prefixes appear after app action",
      "TTL/value structure looks correct",
    ],
    managerPath: "/cache",
    managerLabel: "Open Manager",
    icon: "logos:redis",
  },
  {
    id: "mailpit",
    title: "Mailpit",
    category: "platform-services",
    docsPath: "/mailpit",
    summary: "Confirm local email delivery and payload content.",
    quickChecks: [
      "SMTP submissions are received",
      "To/from/subject values are correct",
      "Unread count updates after test send",
    ],
    adminUrl: "https://mailpit.localcloudkit.com:3030",
    adminLabel: "Open Admin UI",
    icon: "mdi:email-outline",
  },
  {
    id: "postgres",
    title: "PostgreSQL",
    category: "platform-services",
    docsPath: "/postgres",
    summary: "Verify DB availability and inspect local SQL data paths.",
    quickChecks: [
      "Postgres status is running",
      "Client can connect on localhost:5432",
      "Recent writes appear in expected table",
    ],
    adminUrl: "https://pgadmin.localcloudkit.com:3030",
    adminLabel: "Open Admin UI",
    icon: "logos:postgresql",
  },
  {
    id: "keycloak",
    title: "Keycloak",
    category: "platform-services",
    docsPath: "/keycloak",
    summary: "Validate realms/clients and local auth token flows.",
    quickChecks: [
      "Keycloak service is running",
      "Realm and client IDs match app config",
      "Token issue/refresh works in local auth flow",
    ],
    adminUrl: "https://keycloak.localcloudkit.com:3030",
    adminLabel: "Open Admin UI",
    icon: "simple-icons:keycloak",
  },
  {
    id: "posthog",
    title: "PostHog (Beta)",
    category: "platform-services",
    docsPath: "/posthog",
    summary: "Experimental product analytics and feature-flag verification in local mode.",
    quickChecks: [
      "PostHog service is running",
      "Project API key and host match local settings",
      "Test event appears in the PostHog events stream",
    ],
    adminUrl: "https://posthog.localcloudkit.com:3030",
    adminLabel: "Open PostHog UI",
    icon: "simple-icons:posthog",
  },
];

export const EXTERNAL_DOCS_LINKS: ExternalDocsLink[] = [
  {
    title: "AWS LocalStack Coverage",
    href: "https://docs.localstack.cloud/references/coverage/",
    description: "Service-by-service coverage details for AWS APIs in LocalStack.",
  },
  {
    title: "AWS SDK Endpoint Configuration",
    href: "https://docs.aws.amazon.com/sdkref/latest/guide/feature-ss-endpoints.html",
    description: "Reference for overriding SDK endpoints in local development.",
  },
  {
    title: "Redis CLI Reference",
    href: "https://redis.io/docs/latest/commands/",
    description: "Quick lookup for Redis commands used during local verification.",
  },
  {
    title: "Mailpit Docs",
    href: "https://mailpit.axllent.org/docs/",
    description: "Mailpit UI and SMTP behavior reference.",
  },
  {
    title: "PostHog Self-Host Docs",
    href: "https://posthog.com/docs/self-host",
    description: "PostHog deployment and self-hosting reference.",
  },
];
