import { useState, useEffect, useCallback } from "react";
import { LocalStackStatus, ProjectConfig } from "@/types";
import { localstackApi, configApi } from "@/services/api";

interface LocalStackStatusData {
  status: LocalStackStatus;
  projectConfig: ProjectConfig;
}

export function useLocalStackStatus() {
  const [data, setData] = useState<LocalStackStatusData>({
    status: {
      running: false,
      endpoint: "http://localhost:4566",
      health: "unknown",
    },
    projectConfig: {
      projectName: "localstack-dev",
      awsEndpoint: "http://localhost:4566",
      awsRegion: "us-east-1",
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [status, projectConfig] = await Promise.all([
        localstackApi.getStatus(),
        configApi.getProjectConfig(),
      ]);
      setData({ status, projectConfig });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load status"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { ...data, loading, error, refetch: loadData };
}
