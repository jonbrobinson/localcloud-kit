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

  destroy: async (request: DestroyResourceRequest): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>("/resources/destroy", request);
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

  updateProjectConfig: async (config: ProjectConfig): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>("/config/project", config);
    return response.data;
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

export default api;
