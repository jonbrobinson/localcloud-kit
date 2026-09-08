"use client";

import { useEffect, useState } from "react";
import {
  awsEmulatorApi,
  cacheApi,
  mailpitApi,
  postgresApi,
  keycloakApi,
  posthogApi,
} from "@/services/api";
import { StatusDot, type StatusTone } from "./ui";

export type ServiceKey =
  | "aws-emulator"
  | "redis"
  | "mailpit"
  | "postgres"
  | "keycloak"
  | "posthog";

type StatusLevel = "running" | "degraded" | "starting" | "stopped" | "failed" | "unknown";

interface StatusState {
  level: StatusLevel;
  label: string;
}

async function fetchStatus(service: ServiceKey): Promise<StatusState> {
  try {
    switch (service) {
      case "aws-emulator": {
        const s = await awsEmulatorApi.getStatus();
        if (s.running && s.health === "healthy")
          return { level: "running", label: "Running" };
        if (s.running) return { level: "degraded", label: "Unhealthy" };
        return { level: "stopped", label: "Stopped" };
      }
      case "redis": {
        const s = await cacheApi.status();
        const st = s?.status ?? "unknown";
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
        if (s.status === "starting") return { level: "starting", label: "Starting" };
        if (s.status === "stopped") return { level: "stopped", label: "Stopped" };
        if (s.status === "failed") return { level: "failed", label: "Failed" };
        return { level: "unknown", label: "Unknown" };
      }
      case "posthog": {
        const s = await posthogApi.status();
        if (s.status === "running") return { level: "running", label: "Running" };
        if (s.status === "starting") return { level: "starting", label: "Starting" };
        if (s.status === "stopped") return { level: "stopped", label: "Stopped" };
        if (s.status === "failed") return { level: "failed", label: "Failed" };
        return { level: "unknown", label: "Unknown" };
      }
    }
  } catch {
    return { level: "unknown", label: "Unknown" };
  }
}

const levelTone: Record<StatusLevel, StatusTone> = {
  running: "success",
  degraded: "warn",
  starting: "warn",
  stopped: "neutral",
  failed: "danger",
  unknown: "neutral",
};

const levelPulse: Record<StatusLevel, boolean> = {
  running: false,
  degraded: true,
  starting: true,
  stopped: false,
  failed: false,
  unknown: false,
};

const levelTextTone: Record<StatusLevel, string> = {
  running: "text-ink-2",
  degraded: "text-warn-ink",
  starting: "text-warn-ink",
  stopped: "text-muted",
  failed: "text-danger-ink",
  unknown: "text-muted",
};

interface ServiceStatusBadgeProps {
  service: ServiceKey;
  /** Label shown before the badge, e.g. "AWS Emulator" */
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
    <div className="inline-flex items-center gap-2 h-8 px-3 bg-surface border border-border rounded-full">
      <StatusDot tone={levelTone[status.level]} pulse={levelPulse[status.level]} />
      <span className="text-xs font-medium text-ink-2">{name}</span>
      <span className={`text-xs font-semibold ${levelTextTone[status.level]}`}>
        {status.label}
      </span>
    </div>
  );
}
