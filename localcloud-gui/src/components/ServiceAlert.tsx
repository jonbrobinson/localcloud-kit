"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui";
import type { ServiceHealthEntry } from "@/lib/serviceHealth";

interface ServiceAlertProps {
  down: ServiceHealthEntry[];
  onViewLogs: () => void;
}

/** One-line warning shown above the dashboard only while a platform service is stopped or failing. */
export default function ServiceAlert({ down, onViewLogs }: ServiceAlertProps) {
  if (down.length === 0) return null;

  const [first] = down;
  const names = down.map((service) => service.label);
  const summary =
    down.length === 1
      ? `${first.label} is ${first.statusLabel.toLowerCase()}.`
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are not running.`;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-[13px] text-danger-ink"
    >
      <Icon icon="lucide:alert-triangle" width={16} className="shrink-0" />
      <span>
        <span className="font-semibold">{summary}</span>
        {down.length === 1 && first.endpoint && (
          <>
            {" "}Apps using <span className="font-mono">{first.endpoint}</span> can&apos;t connect.
          </>
        )}
        {" "}Run <span className="font-mono">make status</span> to check the containers.
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" icon="lucide:scroll-text" onClick={onViewLogs}>
          View logs
        </Button>
        {down.length === 1 && (
          <Link
            href={first.href}
            className="inline-flex items-center h-7 px-2.5 rounded-lg text-xs font-medium hover:bg-surface/60 transition-colors"
          >
            {first.label} docs
          </Link>
        )}
      </div>
    </div>
  );
}
