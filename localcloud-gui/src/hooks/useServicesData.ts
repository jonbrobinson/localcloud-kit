import { useState, useEffect, useCallback, startTransition } from "react";
import {
  KeycloakStatus,
  LocalStackStatus,
  MailpitStats,
  PosthogStatus,
  PostgresStatus,
  ProjectConfig,
  RedisStatus,
  Resource,
} from "@/types";
import { dashboardApi, keycloakApi, postgresApi, posthogApi } from "@/services/api";

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
  posthog: PosthogStatus;
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
    posthog: { status: "unknown" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [payloadResult, postgresResult, keycloakResult, posthogResult] = await Promise.allSettled([
        dashboardApi.getData(),
        postgresApi.status(),
        keycloakApi.status(),
        posthogApi.status(),
      ]);

      if (payloadResult.status === "rejected") {
        throw payloadResult.reason instanceof Error
          ? payloadResult.reason
          : new Error("Failed to load dashboard data");
      }

      const payload = payloadResult.value;
      const { localstackStatus, projectConfig, mailpit: mailpitStats, resources, redis } = payload;

      const postgresStatus: PostgresStatus =
        postgresResult.status === "fulfilled" ? postgresResult.value : { status: "unknown" };
      const keycloakStatus: KeycloakStatus =
        keycloakResult.status === "fulfilled" ? keycloakResult.value : { status: "unknown" };
      const posthogStatus: PosthogStatus =
        posthogResult.status === "fulfilled" ? posthogResult.value : { status: "unknown" };

      startTransition(() => {
        setData({
          localstack: { status: localstackStatus, projectConfig, resources },
          mailpit: mailpitStats,
          redis,
          postgres: postgresStatus,
          keycloak: keycloakStatus,
          posthog: posthogStatus,
        });
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
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return { ...data, loading, error, refetch: loadData };
}
