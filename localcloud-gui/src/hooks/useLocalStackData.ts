import { useState, useEffect, useCallback } from "react";
import { LocalStackStatus, Resource, ProjectConfig } from "@/types";
import {
  localstackApi,
  resourceApi,
  configApi,
  cacheApi,
} from "@/services/api";

interface LocalStackData {
  localstackStatus: LocalStackStatus;
  projectConfig: ProjectConfig;
  resources: Resource[];
}

export function useLocalStackData() {
  const [data, setData] = useState<LocalStackData>({
    localstackStatus: {
      running: false,
      endpoint: "http://localhost:4566",
      health: "unknown",
    },
    projectConfig: {
      projectName: "localstack-dev",
      awsEndpoint: "http://localhost:4566",
      awsRegion: "us-east-1",
    },
    resources: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [localstackStatus, projectConfig] = await Promise.all([
        localstackApi.getStatus(),
        configApi.getProjectConfig(),
      ]);

      // Use the current project config to fetch resources
      const resources = await resourceApi.getStatus(projectConfig.projectName);

      // Add cache status as a resource
      try {
        const cacheStatus = await cacheApi.status();
        const cacheResource: Resource = {
          id: "cache-redis",
          name: "Redis Cache",
          type: "cache",
          status: cacheStatus.status === "running" ? "active" : "error",
          environment: "local",
          project: projectConfig.projectName,
          createdAt: new Date().toISOString(),
          details: {
            info: cacheStatus.info,
            status: cacheStatus.status,
          },
        };
        resources.push(cacheResource);
      } catch (error) {
        console.warn("Failed to fetch cache status:", error);
      }

      // Add secrets manager status as a resource
      try {
        const secretsResponse = await fetch("/api/secrets");
        const secretsResult = await secretsResponse.json();
        const secretsCount = secretsResult.success
          ? secretsResult.data.SecretList?.length || 0
          : 0;

        if (secretsCount > 0) {
          const secretsResource: Resource = {
            id: "secrets-manager",
            name: `Secrets Manager (${secretsCount} secrets)`,
            type: "secretsmanager",
            status: "active",
            environment: "local",
            project: projectConfig.projectName,
            createdAt: new Date().toISOString(),
            details: {
              count: secretsCount,
              secrets: secretsResult.data.SecretList || [],
            },
          };
          resources.push(secretsResource);
        }
      } catch (error) {
        console.warn("Failed to fetch secrets status:", error);
      }

      setData({
        localstackStatus,
        projectConfig,
        resources,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load data");
      setError(error);
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return {
    ...data,
    loading,
    error,
    refetch: loadData,
  };
}
