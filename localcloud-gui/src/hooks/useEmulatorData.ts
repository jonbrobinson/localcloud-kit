import { useState, useEffect, useCallback } from "react";
import { EmulatorStatus, Resource, ProjectConfig } from "@/types";
import {
  awsEmulatorApi,
  resourceApi,
  configApi,
} from "@/services/api";

interface EmulatorData {
  emulatorStatus: EmulatorStatus;
  projectConfig: ProjectConfig;
  resources: Resource[];
}

export function useEmulatorData() {
  const [data, setData] = useState<EmulatorData>({
    emulatorStatus: {
      running: false,
      endpoint: "http://localhost:4566",
      health: "unknown",
    },
    projectConfig: {
      projectName: "localcloud-dev",
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
      const [emulatorStatus, projectConfig] = await Promise.all([
        awsEmulatorApi.getStatus(),
        configApi.getProjectConfig(),
      ]);

      // Use the current project config to fetch resources
      const resources = await resourceApi.getStatus(projectConfig.projectName);

      // Secrets are now included in the resourceApi.getStatus() call via list_resources.sh
      // No need to fetch them separately to avoid duplicates

      setData({
        emulatorStatus,
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
