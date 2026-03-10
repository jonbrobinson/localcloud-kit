import {
  ApiResponse,
  CreateResourceRequest,
  DestroyResourceRequest,
  KeycloakStatus,
  LocalStackStatus,
  LogEntry,
  MailpitStats,
  PostgresStatus,
  Project,
  ProjectConfig,
  Resource,
  RedisStatus,
  SavedConfig,
  UserProfile,
} from "@/types";

export interface DashboardData {
  localstackStatus: LocalStackStatus;
  projectConfig: ProjectConfig;
  mailpit: MailpitStats;
  resources: Resource[];
  redis: RedisStatus;
}
import axios from "axios";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// LocalStack Management
export const localstackApi = {
  getStatus: async (): Promise<LocalStackStatus> => {
    const response = await api.get<ApiResponse<LocalStackStatus>>(
      "/localstack/status"
    );
    return response.data.data!;
  },

  getLogs: async (): Promise<LogEntry[]> => {
    const response = await api.get<ApiResponse<LogEntry[]>>("/localstack/logs");
    return response.data.data || [];
  },
};

// Resource Management
export const resourceApi = {
  list: async (projectName: string): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(`/resources/list`, {
      params: { projectName },
    });
    return response.data.data || [];
  },

  create: async (request: CreateResourceRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/create", request);
    return response.data;
  },

  createSingle: async (
    projectName: string,
    resourceType: string
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/create-single", {
      projectName,
      resourceType,
    });
    return response.data;
  },

  createSingleWithConfig: async (
    projectName: string,
    resourceType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: any
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/create-single", {
      projectName,
      resourceType,
      ...config,
    });
    return response.data;
  },

  destroy: async (request: DestroyResourceRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/destroy", request);
    return response.data;
  },

  destroySingle: async (
    projectName: string,
    resourceType: string,
    resourceName?: string
  ): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/destroy-single", {
      projectName,
      resourceType,
      resourceName,
    });
    return response.data;
  },

  getStatus: async (projectName: string): Promise<Resource[]> => {
    const response = await api.get<ApiResponse<Resource[]>>(
      `/resources/status`,
      {
        params: { projectName },
      }
    );
    return response.data.data || [];
  },
};

// Configuration Management
export const configApi = {
  getProjectConfig: async (): Promise<ProjectConfig> => {
    const response = await api.get<ApiResponse<ProjectConfig>>(
      "/config/project"
    );
    return response.data.data!;
  },

  getTemplates: async (): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>("/config/templates");
    return response.data.data || [];
  },
};

// Dashboard (batched data - single round-trip)
export const dashboardApi = {
  getData: async (): Promise<DashboardData> => {
    const response = await api.get<ApiResponse<DashboardData>>("/dashboard");
    return response.data.data!;
  },
};

// Health Check
export const healthApi = {
  check: async (): Promise<boolean> => {
    try {
      const response = await api.get("/health");
      return response.status === 200;
    } catch {
      return false;
    }
  },
};

// S3 Bucket Management
export const s3Api = {
  // List all buckets for a project
  getBuckets: async (projectName: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/s3/buckets?projectName=${encodeURIComponent(
          projectName
        )}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch buckets:", error);
      return { success: false, error: "Failed to fetch buckets" };
    }
  },

  // List contents of a specific bucket
  getBucketContents: async (
    projectName: string,
    bucketName: string
  ): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
          bucketName
        )}/contents?projectName=${encodeURIComponent(projectName)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch bucket contents:", error);
      return { success: false, error: "Failed to fetch bucket contents" };
    }
  },

  // Download an object from a bucket
  downloadObject: async (
    projectName: string,
    bucketName: string,
    objectKey: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
          bucketName
        )}/object/${encodeURIComponent(
          objectKey
        )}?projectName=${encodeURIComponent(projectName)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to download object:", error);
      return { success: false, error: "Failed to download object" };
    }
  },

  // Upload an object to a bucket (legacy JSON method)
  uploadObject: async (
    projectName: string,
    bucketName: string,
    objectKey: string,
    content: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
          bucketName
        )}/upload?projectName=${encodeURIComponent(projectName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            objectKey,
            content,
          }),
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to upload object:", error);
      return { success: false, error: "Failed to upload object" };
    }
  },

  // Upload an object to a bucket using multipart (recommended for all files)
  uploadObjectMultipart: async (
    projectName: string,
    bucketName: string,
    objectKey: string,
    file: File
  ): Promise<ApiResponse<any>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("objectKey", objectKey);

      const response = await fetch(
        `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
          bucketName
        )}/upload-multipart?projectName=${encodeURIComponent(projectName)}`,
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to upload object:", error);
      return { success: false, error: "Failed to upload object" };
    }
  },

  // Delete an object from a bucket
  deleteObject: async (
    projectName: string,
    bucketName: string,
    objectKey: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/s3/bucket/${encodeURIComponent(
          bucketName
        )}/object/${encodeURIComponent(
          objectKey
        )}?projectName=${encodeURIComponent(projectName)}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to delete object:", error);
      return { success: false, error: "Failed to delete object" };
    }
  },
};

// Mailpit Email Testing
export const mailpitApi = {
  stats: async (): Promise<MailpitStats> => {
    try {
      const response = await api.get("/mailpit/stats");
      return response.data.data || { total: 0, unread: 0, status: "unavailable" };
    } catch {
      return { total: 0, unread: 0, status: "unavailable" };
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMessages: async (limit = 10): Promise<{ messages: any[]; total: number }> => {
    try {
      const response = await api.get(`/mailpit/messages?limit=${limit}`);
      return response.data.data || { messages: [], total: 0 };
    } catch {
      return { messages: [], total: 0 };
    }
  },

  clearMessages: async (): Promise<void> => {
    await api.delete("/mailpit/messages");
  },

  sendTest: async (payload: {
    from: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/mailpit/send-test", payload);
    return response.data;
  },
};

// Redis Cache Management
export const cacheApi = {
  status: async (): Promise<any> => {
    const response = await api.get("/cache/status");
    return response.data;
  },
  set: async (key: string, value: string): Promise<any> => {
    const response = await api.post("/cache/set", { key, value });
    return response.data;
  },
  get: async (key: string): Promise<any> => {
    const response = await api.get("/cache/get", { params: { key } });
    return response.data;
  },
  del: async (key: string): Promise<any> => {
    const response = await api.delete("/cache/del", { data: { key } });
    return response.data;
  },
  flush: async (): Promise<any> => {
    const response = await api.post("/cache/flush");
    return response.data;
  },
  keys: async (): Promise<any> => {
    const response = await api.get("/cache/keys");
    return response.data;
  },
};

export async function addDynamoDBItem(
  projectName: string,
  tableName: string,
  item: any
) {
  const res = await fetch(`/api/dynamodb/table/${tableName}/item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectName, item }),
  });
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}

export async function getDynamoDBTableSchema(
  projectName: string,
  tableName: string
) {
  const res = await fetch(
    `/api/dynamodb/table/${tableName}/schema?projectName=${encodeURIComponent(
      projectName
    )}`
  );
  if (!res.ok) throw new Error("Failed to get table schema");
  return res.json();
}

export async function deleteDynamoDBItem(
  projectName: string,
  tableName: string,
  partitionKey: string,
  partitionValue: string,
  sortKey?: string,
  sortValue?: string
) {
  const res = await fetch(`/api/dynamodb/table/${tableName}/item`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectName,
      partitionKey,
      partitionValue,
      sortKey,
      sortValue,
    }),
  });
  if (!res.ok) throw new Error("Failed to delete item");
  return res.json();
}

// Profile
export const profileApi = {
  get: async (): Promise<UserProfile> => {
    const response = await api.get<ApiResponse<UserProfile>>("/profile");
    return response.data.data!;
  },
  update: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put<ApiResponse<UserProfile>>("/profile", data);
    return response.data.data!;
  },
};

// Projects
export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const response = await api.get<ApiResponse<Project[]>>("/projects");
    return response.data.data || [];
  },
  create: async (name: string, label: string, description?: string): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>("/projects", { name, label, description });
    return response.data.data!;
  },
  update: async (id: number, label: string, description?: string): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, { label, description });
    return response.data.data!;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

// Saved Configs
export const savedConfigsApi = {
  list: async (projectId?: number, type?: string): Promise<SavedConfig[]> => {
    const params: Record<string, string | number> = {};
    if (projectId !== undefined) params.project_id = projectId;
    if (type) params.type = type;
    const response = await api.get<ApiResponse<SavedConfig[]>>("/saved-configs", { params });
    return response.data.data || [];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: async (projectId: number, name: string, resourceType: string, config: any): Promise<SavedConfig> => {
    const response = await api.post<ApiResponse<SavedConfig>>("/saved-configs", {
      project_id: projectId,
      name,
      resource_type: resourceType,
      config,
    });
    return response.data.data!;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/saved-configs/${id}`);
  },
};

// PostgreSQL
export const postgresApi = {
  status: async (): Promise<PostgresStatus> => {
    try {
      const response = await api.get("/postgres/status");
      return response.data.data || { status: "unknown" };
    } catch {
      return { status: "unknown" };
    }
  },
};

// Keycloak
export const keycloakApi = {
  status: async (): Promise<KeycloakStatus> => {
    try {
      const response = await api.get("/keycloak/status");
      return response.data.data || { status: "unknown" };
    } catch {
      return { status: "unknown" };
    }
  },
};

export default api;
