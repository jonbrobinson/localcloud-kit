export interface LocalStackStatus {
  running: boolean;
  endpoint: string;
  health: "healthy" | "unhealthy" | "unknown";
  uptime?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: "s3" | "dynamodb" | "lambda" | "apigateway" | "iam" | "cache";
  status: "creating" | "active" | "deleting" | "error" | "unknown";
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

export interface ResourceTemplate {
  id: string;
  name: string;
  description: string;
  resources: {
    s3: boolean;
    dynamodb: boolean;
    lambda: boolean;
    apigateway: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  source: "localstack" | "automation" | "gui";
}

export interface CreateResourceRequest {
  projectName: string;
  resources: {
    s3: boolean;
    dynamodb: boolean;
    lambda: boolean;
    apigateway: boolean;
  };
  template?: string;
  dynamodbConfig?: DynamoDBTableConfig;
  s3Config?: S3BucketConfig;
}

export interface CreateSingleResourceRequest {
  projectName: string;
  resourceType: "s3" | "dynamodb" | "lambda" | "apigateway";
  dynamodbConfig?: DynamoDBTableConfig;
  s3Config?: S3BucketConfig;
}

export interface DestroyResourceRequest {
  projectName: string;
  resourceIds: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
