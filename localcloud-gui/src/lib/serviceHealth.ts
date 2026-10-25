import type { StatusTone } from "@/components/ui";
import type {
  EmulatorStatus,
  KeycloakStatus,
  LangfuseStatus,
  MailpitStats,
  PostgresStatus,
  RedisStatus,
} from "@/types";

export type ServiceHealthId = "aws-emulator" | "keycloak" | "langfuse" | "mailpit" | "postgres" | "redis";

export interface ServiceHealthEntry {
  id: ServiceHealthId;
  label: string;
  tone: StatusTone;
  statusLabel: string;
  /** True only when the service is confirmed stopped or failing — not while starting or unknown. */
  down: boolean;
  /** Where to send the user to investigate (doc page). */
  href: string;
  /** Local endpoint apps connect to, shown in the alert. */
  endpoint?: string;
  /** Opt-in Compose profile service — "stopped" is its normal resting state, not an outage. */
  optional?: boolean;
}

export interface ServiceHealthSummary {
  services: ServiceHealthEntry[];
  /** Services counted in the overall tone — excludes opt-in services that aren't started. */
  active: ServiceHealthEntry[];
  down: ServiceHealthEntry[];
  /** Overall tone for a single indicator: danger if anything is down, warn while starting, success when all run. */
  tone: StatusTone;
}

interface ServiceHealthInput {
  emulator: EmulatorStatus;
  keycloak: KeycloakStatus;
  langfuse: LangfuseStatus;
  mailpit: MailpitStats;
  postgres: PostgresStatus;
  redis: RedisStatus;
}

function fromStatus(status: string): Pick<ServiceHealthEntry, "tone" | "statusLabel" | "down"> {
  switch (status) {
    case "running":
    case "healthy":
      return { tone: "success", statusLabel: "Running", down: false };
    case "starting":
      return { tone: "warn", statusLabel: "Starting…", down: false };
    case "failed":
    case "unhealthy":
      return { tone: "danger", statusLabel: "Failed", down: true };
    case "stopped":
      return { tone: "danger", statusLabel: "Stopped", down: true };
    case "unavailable":
      return { tone: "danger", statusLabel: "Unavailable", down: true };
    default:
      return { tone: "neutral", statusLabel: "Unknown", down: false };
  }
}

/** Like fromStatus, but a stopped opt-in service is neutral rather than down. */
function fromOptionalStatus(status: string): Pick<ServiceHealthEntry, "tone" | "statusLabel" | "down" | "optional"> {
  if (status === "stopped") return { tone: "neutral", statusLabel: "Not started", down: false, optional: true };
  return { ...fromStatus(status), optional: true };
}

function emulatorStatus(emulator: EmulatorStatus): string {
  if (emulator.health === "unknown" && !emulator.running) return "unknown";
  if (!emulator.running) return "stopped";
  return emulator.health;
}

/** Collapses every platform service's status into one summary for the nav dot and the dashboard alert. */
export function summarizeServiceHealth(input: ServiceHealthInput): ServiceHealthSummary {
  const services: ServiceHealthEntry[] = [
    { id: "aws-emulator", label: "AWS Emulator", href: "/aws-emulator", endpoint: "localhost:4566", ...fromStatus(emulatorStatus(input.emulator)) },
    { id: "keycloak", label: "Keycloak", href: "/keycloak", ...fromStatus(input.keycloak.status) },
    { id: "langfuse", label: "Langfuse", href: "/langfuse", endpoint: "localhost:3100", ...fromOptionalStatus(input.langfuse.status) },
    { id: "mailpit", label: "Mailpit", href: "/mailpit", endpoint: "localhost:1025", ...fromStatus(input.mailpit.status) },
    { id: "postgres", label: "PostgreSQL", href: "/postgres", endpoint: "localhost:5432", ...fromStatus(input.postgres.status) },
    { id: "redis", label: "Redis", href: "/redis", endpoint: "localhost:6380", ...fromStatus(input.redis.status) },
  ];

  const down = services.filter((service) => service.down);
  // Opt-in services that aren't started don't count toward "all services running"
  const active = services.filter((service) => !(service.optional && service.tone === "neutral"));
  const tone: StatusTone = down.length
    ? "danger"
    : active.some((service) => service.tone === "warn")
      ? "warn"
      : active.every((service) => service.tone === "success")
        ? "success"
        : "neutral";

  return { services, active, down, tone };
}
