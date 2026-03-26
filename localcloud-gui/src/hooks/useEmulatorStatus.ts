import { useState, useEffect, useCallback } from "react";
import { EmulatorStatus, ProjectConfig } from "@/types";
import { awsEmulatorApi, configApi } from "@/services/api";

interface EmulatorStatusData {
  status: EmulatorStatus;
  projectConfig: ProjectConfig;
}

export function useEmulatorStatus() {
  const [data, setData] = useState<EmulatorStatusData>({
    status: {
      running: false,
      endpoint: "http://localhost:4566",
      health: "unknown",
    },
    projectConfig: {
      projectName: "localcloud-dev",
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
        awsEmulatorApi.getStatus(),
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
