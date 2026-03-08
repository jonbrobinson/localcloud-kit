import { useState, useEffect, useCallback } from "react";
import {
  LocalStackStatus,
  Resource,
  ProjectConfig,
  MailpitStats,
  RedisStatus,
} from "@/types";
import {
  localstackApi,
  resourceApi,
  configApi,
  cacheApi,
  mailpitApi,
} from "@/services/api";

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
      const [localstackStatus, projectConfig, mailpitStats] = await Promise.all(
        [
          localstackApi.getStatus(),
          configApi.getProjectConfig(),
          mailpitApi.stats(),
        ]
      );

      const resources = await resourceApi.getStatus(projectConfig.projectName);

      let redis: RedisStatus = { status: "unknown" };
      try {
        const cacheStatus = await cacheApi.status();
        redis = {
          status: cacheStatus.status === "running" ? "running" : "stopped",
          info: cacheStatus.info,
        };
      } catch {
        console.warn("Failed to fetch Redis status");
      }

      setData({
        localstack: { status: localstackStatus, projectConfig, resources },
        mailpit: mailpitStats,
        redis,
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
