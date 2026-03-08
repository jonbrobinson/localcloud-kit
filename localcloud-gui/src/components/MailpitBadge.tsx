"use client";

import { MailpitStats } from "@/types";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

const MAILPIT_URL = "https://mailpit.localcloudkit.com:3030";

interface MailpitBadgeProps {
  stats: MailpitStats;
}

export default function MailpitBadge({ stats }: MailpitBadgeProps) {
  const isHealthy = stats.status === "healthy";

  // Badge count: prefer unread (red), fall back to total (blue)
  const badgeCount = stats.unread > 0 ? stats.unread : stats.total;
  const badgeColor = stats.unread > 0 ? "bg-red-500" : "bg-blue-500";
  const showBadge = isHealthy && badgeCount > 0;

  return (
    <a
      href={MAILPIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      title={
        isHealthy
          ? `Mailpit — ${stats.total} emails, ${stats.unread} unread`
          : "Mailpit — unavailable"
      }
    >
      <EnvelopeIcon className="h-4 w-4 mr-1.5" />
      <span>Mailpit</span>

      {/* Status dot */}
      <span
        className={`ml-2 h-2 w-2 flex-shrink-0 rounded-full ${
          isHealthy ? "bg-green-500" : "bg-gray-300"
        }`}
      />

      {/* Count badge (unread = red, total-only = blue) */}
      {showBadge && (
        <span
          className={`absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-bold text-white ${badgeColor}`}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </a>
  );
}
