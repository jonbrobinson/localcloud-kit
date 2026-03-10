import { useState, useEffect, useCallback } from "react";
import {
  LocalStackStatus,
  Resource,
  ProjectConfig,
  MailpitStats,
  RedisStatus,
} from "@/types";
import { dashboardApi } from "@/services/api";

interface LocalStackData {
  status: LocalStackStatus;
  projectConfig: ProjectConfig;
  resources: Resource[];
}

interface ServicesData {
  localstack: LocalStackData;
  mailpit: MailpitStats;
  redis: RedisStatus;
}

export function useServicesData() {
  const [data, setData] = useState<ServicesData>({
    localstack: {
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
      resources: [],
    },
    mailpit: { total: 0, unread: 0, status: "unknown" },
    redis: { status: "unknown" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const payload = await dashboardApi.getData();

      setData({
        localstack: {
          status: payload.localstackStatus,
          projectConfig: payload.projectConfig,
          resources: payload.resources,
        },
        mailpit: payload.mailpit,
        redis: payload.redis,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load data");
      setError(error);
      console.error("Failed to load data:", error);
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
