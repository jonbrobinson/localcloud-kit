import axios from "axios";
import {
  LocalStackStatus,
  Resource,
  ProjectConfig,
  CreateResourceRequest,
  DestroyResourceRequest,
  LogEntry,
  ApiResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3031";

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

export default api;
