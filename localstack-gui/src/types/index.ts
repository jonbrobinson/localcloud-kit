export interface LocalStackStatus {
  running: boolean;
  endpoint: string;
  health: "healthy" | "unhealthy" | "unknown";
  uptime?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: "s3" | "dynamodb" | "lambda" | "apigateway" | "iam";
  status: "creating" | "active" | "deleting" | "error" | "unknown";
  environment: string;
  project: string;
  createdAt: string;
  details?: Record<string, any>;
}

export interface ProjectConfig {
  projectName: string;
  environment: "dev" | "uat" | "prod";
  awsRegion: string;
  awsEndpoint: string;
}

export interface AutomationApproach {
  id: "shell";
  name: string;
  description: string;
  icon: string;
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
  environment: string;
  resources: {
    s3: boolean;
    dynamodb: boolean;
    lambda: boolean;
    apigateway: boolean;
  };
  template?: string;
}

export interface DestroyResourceRequest {
  projectName: string;
  environment: string;
  resourceIds?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
