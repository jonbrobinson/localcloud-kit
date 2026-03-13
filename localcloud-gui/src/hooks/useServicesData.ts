import { useState, useEffect, useCallback } from "react";
import {
  KeycloakStatus,
  LocalStackStatus,
  MailpitStats,
  PostgresStatus,
  ProjectConfig,
  RedisStatus,
  Resource,
} from "@/types";
import { dashboardApi, keycloakApi, postgresApi } from "@/services/api";

interface LocalStackData {
  status: LocalStackStatus;
  projectConfig: ProjectConfig;
  resources: Resource[];
}

interface ServicesData {
  localstack: LocalStackData;
  mailpit: MailpitStats;
  redis: RedisStatus;
  postgres: PostgresStatus;
  keycloak: KeycloakStatus;
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
    postgres: { status: "unknown" },
    keycloak: { status: "unknown" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [payload, postgresStatus, keycloakStatus] = await Promise.all([
        dashboardApi.getData(),
        postgresApi.status(),
        keycloakApi.status(),
      ]);

      const { localstackStatus, projectConfig, mailpit: mailpitStats, resources, redis } = payload;

      setData({
        localstack: { status: localstackStatus, projectConfig, resources },
        mailpit: mailpitStats,
        redis,
        postgres: postgresStatus,
        keycloak: keycloakStatus,
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
