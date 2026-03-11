"use client";

import { useEffect, useState } from "react";
import {
  localstackApi,
  cacheApi,
  mailpitApi,
  postgresApi,
  keycloakApi,
} from "@/services/api";

export type ServiceKey =
  | "localstack"
  | "redis"
  | "mailpit"
  | "postgres"
  | "keycloak";

type StatusLevel = "running" | "degraded" | "stopped" | "unknown";

interface StatusState {
  level: StatusLevel;
  label: string;
}

async function fetchStatus(service: ServiceKey): Promise<StatusState> {
  try {
    switch (service) {
      case "localstack": {
        const s = await localstackApi.getStatus();
        if (s.running && s.health === "healthy")
          return { level: "running", label: "Running" };
        if (s.running) return { level: "degraded", label: "Unhealthy" };
        return { level: "stopped", label: "Stopped" };
      }
      case "redis": {
        const s = await cacheApi.status();
        const st = s?.data?.status ?? s?.status ?? "unknown";
        if (st === "running") return { level: "running", label: "Running" };
        if (st === "stopped") return { level: "stopped", label: "Stopped" };
        return { level: "unknown", label: "Unknown" };
      }
      case "mailpit": {
        const s = await mailpitApi.stats();
        if (s.status === "healthy") return { level: "running", label: "Running" };
        if (s.status === "unavailable") return { level: "stopped", label: "Stopped" };
        return { level: "unknown", label: "Unknown" };
      }
      case "postgres": {
        const s = await postgresApi.status();
        if (s.status === "running") return { level: "running", label: "Running" };
        if (s.status === "stopped") return { level: "stopped", label: "Stopped" };
        return { level: "unknown", label: "Unknown" };
      }
      case "keycloak": {
        const s = await keycloakApi.status();
        if (s.status === "running") return { level: "running", label: "Running" };
        if (s.status === "stopped") return { level: "stopped", label: "Stopped" };
        return { level: "unknown", label: "Unknown" };
      }
    }
  } catch {
    return { level: "unknown", label: "Unknown" };
  }
}

const dotClass: Record<StatusLevel, string> = {
  running: "bg-green-500 animate-pulse",
  degraded: "bg-yellow-500 animate-pulse",
  stopped: "bg-red-500",
  unknown: "bg-gray-400",
};

const badgeClass: Record<StatusLevel, string> = {
  running: "bg-green-100 text-green-800",
  degraded: "bg-yellow-100 text-yellow-800",
  stopped: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-600",
};

interface ServiceStatusBadgeProps {
  service: ServiceKey;
  /** Label shown before the badge, e.g. "LocalStack" */
  name: string;
  /** Refresh interval in ms — default 10 000 */
  refreshMs?: number;
}

export default function ServiceStatusBadge({
  service,
  name,
  refreshMs = 10_000,
}: ServiceStatusBadgeProps) {
  const [status, setStatus] = useState<StatusState>({
    level: "unknown",
    label: "…",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const s = await fetchStatus(service);
      if (!cancelled) setStatus(s);
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [service, refreshMs]);

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
      <span
        className={`h-2 w-2 rounded-full flex-shrink-0 ${dotClass[status.level]}`}
      />
      <span className="text-xs font-medium text-gray-600">{name}</span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass[status.level]}`}
      >
        {status.label}
      </span>
    </div>
  );
}
