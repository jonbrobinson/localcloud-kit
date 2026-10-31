export interface EmulatorStatus {
  running: boolean;
  endpoint: string;
  health: "healthy" | "unhealthy" | "unknown";
  uptime?: string;
}

// Categorises platform services by their relationship to the developer's app.
// "instance-service" — always-on infrastructure the app connects to directly (Redis, PostgreSQL).
// "admin-tool"       — developer-facing management UI (Keycloak, Mailpit, pgAdmin).
export type ServiceKind = "instance-service" | "admin-tool";

// Modal keys for platform services that open an in-app modal rather than navigating to a page.
export type ModalKey = "mailpit" | "redis";

export interface Resource {
  id: string;
  name: string;
  type:
    | "s3"
    | "dynamodb"
    | "lambda"
    | "apigateway"
    | "ssm"
    | "iam"
    | "secretsmanager"
    | "rds";
  status: "creating" | "active" | "deleting" | "stopped" | "error" | "unknown";
  environment: string;
  project: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
}

export interface ProjectConfig {
  projectName: string;
  awsEndpoint: string;
  awsRegion: string;
}

export interface AutomationApproach {
  id: "shell";
  name: string;
  description: string;
  icon: string;
}

export interface S3BucketConfig {
  bucketName: string;
  region?: string;
  versioning?: boolean;
  encryption?: boolean;
}

export interface DynamoDBGSI {
  indexName: string;
  partitionKey: string;
  sortKey?: string;
  projectionType: "ALL" | "KEYS_ONLY" | "INCLUDE";
  nonKeyAttributes?: string[];
}

export interface DynamoDBTableConfig {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
  billingMode: "PAY_PER_REQUEST" | "PROVISIONED";
  readCapacity?: number;
  writeCapacity?: number;
  gsis: DynamoDBGSI[];
}

export interface SecretsManagerConfig {
  secretName: string;
  secretValue: string;
  description?: string;
  tags?: Record<string, string>;
  kmsKeyId?: string;
}

export interface LambdaFunctionConfig {
  functionName: string;
  runtime?: string;
  handler?: string;
  description?: string;
}

export interface APIGatewayConfig {
  apiName: string;
  description?: string;
}

export interface SSMParameterConfig {
  parameterName: string;
  parameterValue: string;
  parameterType: "String" | "StringList" | "SecureString";
  description?: string;
}

export type RDSEngine = "postgres" | "mysql" | "mariadb";

export interface RDSInstanceConfig {
  engine: RDSEngine;
  engineVersion: string;
  dbInstanceIdentifier: string;
  masterUsername: string;
  /** Never persisted in saved configs */
  masterPassword?: string;
  dbName?: string;
  instanceClass: string;
  allocatedStorage?: number;
  /** PostgreSQL only — register the instance as a server in the bundled pgAdmin */
  registerPgAdmin?: boolean;
  /** Store master credentials as a Secrets Manager secret (rds/<id>/master) */
  storeInSecretsManager?: boolean;
}

export interface RDSEngineOption {
  label: string;
  port: number;
  versions: string[];
  defaultVersion: string;
}

export interface RDSOptions {
  engines: Record<RDSEngine, RDSEngineOption>;
  instanceClasses: string[];
  /** Identifiers deleted earlier whose data volume MiniStack may have kept */
  deletedIdentifiers: string[];
}

export interface IAMRoleConfig {
  roleName: string;
  trustServices: string[];
  trustPolicy: string;
  customPolicy?: string;
  description?: string;
  path?: string;
}

export interface ResourceTemplate {
  id: string;
  name: string;
  description: string;
  resources: {
    s3: boolean;
    dynamodb: boolean;
    lambda: boolean;
    apigateway: boolean;
    secretsmanager: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
}

export interface MailpitStats {
  total: number;
  unread: number;
  status: "healthy" | "unavailable" | "unknown";
}

export interface MailpitAddress {
  Name: string;
  Address: string;
}

/** One row of Mailpit's /api/v1/messages list. */
export interface MailpitMessageSummary {
  ID: string;
  From: MailpitAddress;
  To: MailpitAddress[];
  Subject: string;
  Created: string;
  Read: boolean;
  Size: number;
  Attachments: number;
  Snippet: string;
}

/** Full message from Mailpit's /api/v1/message/{ID}. */
export interface MailpitMessage {
  ID: string;
  From: MailpitAddress;
  To: MailpitAddress[];
  Cc: MailpitAddress[] | null;
  Subject: string;
  Date: string;
  Size: number;
  HTML: string;
  Text: string;
  Attachments: Array<{ PartID: string; FileName: string; ContentType: string; Size: number }>;
}

export interface RedisStatus {
  status: "running" | "stopped" | "unknown";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info?: Record<string, any>;
}

export interface PostgresStatus {
  status: "running" | "stopped" | "unknown";
}

export interface KeycloakStatus {
  status: "running" | "starting" | "stopped" | "failed" | "unknown";
}

export interface LangfuseStatus {
  status: "running" | "starting" | "stopped" | "failed" | "unknown";
  version?: string;
  /** Host SDK base URL, e.g. http://localhost:3100 (follows LANGFUSE_PORT) */
  baseUrl?: string;
  /** Traefik UI URL (follows APP_PORT) */
  uiUrl?: string;
}

export interface PosthogStatus {
  status: "running" | "starting" | "stopped" | "failed" | "unknown";
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  source: "aws-emulator" | "automation" | "gui";
}

export interface CreateResourceRequest {
  projectName: string;
  resources: {
    s3: boolean;
    dynamodb: boolean;
    lambda: boolean;
    apigateway: boolean;
    secretsmanager: boolean;
  };
  template?: string;
  dynamodbConfig?: DynamoDBTableConfig;
  s3Config?: S3BucketConfig;
  secretsmanagerConfig?: SecretsManagerConfig;
}

export interface CreateSingleResourceRequest {
  projectName: string;
  resourceType: "s3" | "dynamodb" | "lambda" | "apigateway" | "secretsmanager" | "ssm" | "iam" | "rds";
  dynamodbConfig?: DynamoDBTableConfig;
  s3Config?: S3BucketConfig;
  secretsmanagerConfig?: SecretsManagerConfig;
  lambdaConfig?: LambdaFunctionConfig;
  apigatewayConfig?: APIGatewayConfig;
  ssmConfig?: SSMParameterConfig;
  iamConfig?: IAMRoleConfig;
  rdsConfig?: RDSInstanceConfig;
}

export interface DestroyResourceRequest {
  projectName: string;
  resourceIds: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  value?: string;
  error?: string;
  message?: string;
}

export type PreferredLanguage = "typescript" | "node" | "python" | "go" | "java" | "cli";

export type HighlightTheme =
  | "github"
  | "github-dark"
  | "github-dark-dimmed"
  | "atom-one-dark"
  | "atom-one-light";

export type ThemePreference = "auto" | "light" | "dark";

export interface Project {
  id: number;
  name: string;
  label: string;
  description?: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  preferred_language: PreferredLanguage;
  highlight_theme: HighlightTheme;
  theme: ThemePreference;
  display_name: string;
  active_project_id: number | null;
  active_project_name: string | null;
  active_project_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedConfig {
  id: number;
  project_id: number;
  name: string;
  resource_type: "s3" | "dynamodb" | "secrets" | "secretsmanager" | "lambda" | "apigateway" | "ssm" | "iam" | "rds";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  config_json: string;
  created_at: string;
  updated_at: string;
}
