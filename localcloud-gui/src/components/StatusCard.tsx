import { EmulatorStatus } from "@/types";
import { Icon } from "@iconify/react";
import { Card, Badge } from "./ui";
import type { StatusTone } from "./ui";

interface StatusCardProps {
  status: EmulatorStatus;
}

export default function StatusCard({ status }: StatusCardProps) {
  const tone: StatusTone =
    status.health === "healthy"
      ? "success"
      : status.health === "unhealthy"
        ? "danger"
        : "neutral";

  const statusText = !status.running
    ? "Stopped"
    : status.health === "healthy"
      ? "Running"
      : status.health === "unhealthy"
        ? "Unhealthy"
        : "Unknown";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary-soft text-primary">
            <Icon icon="lucide:server" width={22} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">AWS Emulator</h3>
            <p className="text-sm text-muted font-mono">{status.endpoint}</p>
          </div>
        </div>
        <Badge tone={tone}>{statusText}</Badge>
      </div>

      {status.running && status.uptime && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Icon icon="lucide:clock" width={15} />
          Uptime: {status.uptime}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <dt className="text-xs font-medium text-muted">Status</dt>
          <dd className="mt-1 text-sm text-ink">{statusText}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Health</dt>
          <dd className="mt-1 text-sm text-ink capitalize">{status.health}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Endpoint</dt>
          <dd className="mt-1 text-sm text-ink font-mono">{status.endpoint}</dd>
        </div>
      </div>
    </Card>
  );
}
