"use client";

import { Icon } from "@iconify/react";
import { Button, cn } from "@/components/ui";
import type { MailpitMessageSummary } from "@/types";

const relativeTime = (iso: string) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

interface RecentMailCardProps {
  messages: MailpitMessageSummary[];
  total: number;
  unread: number;
  onOpenMessage: (id: string) => void;
  onViewAll: () => void;
}

/** Dashboard strip showing the newest emails Mailpit has captured. Rendered only when there is mail. */
export default function RecentMailCard({ messages, total, unread, onOpenMessage, onViewAll }: RecentMailCardProps) {
  return (
    <div className="mb-6 bg-surface rounded-xl shadow-e1 border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:mail" width={16} className="text-muted" />
          <h3 className="text-[15px] font-semibold text-ink">Recent mail</h3>
          {unread > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary-ink">
              {unread} unread
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-3 text-ink-2">
            {total} total
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all
          <Icon icon="lucide:chevron-right" width={14} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-divider">
        {messages.map((msg) => (
          <button
            key={msg.ID}
            type="button"
            onClick={() => onOpenMessage(msg.ID)}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 px-4 py-3 text-left hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <span
              className={cn("mt-1.5 h-1.5 w-1.5 rounded-full", msg.Read ? "bg-transparent" : "bg-primary")}
              aria-label={msg.Read ? "Read" : "Unread"}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex justify-between gap-2 text-xs text-muted">
                <span className="truncate">{msg.From?.Name || msg.From?.Address || "Unknown sender"}</span>
                <time dateTime={msg.Created} className="shrink-0 text-[11px] tabular-nums">
                  {relativeTime(msg.Created)}
                </time>
              </span>
              <span className={cn("truncate text-[13px] text-ink", !msg.Read && "font-semibold")}>
                {msg.Subject || "(no subject)"}
              </span>
              {msg.Snippet && <span className="truncate text-xs text-faint">{msg.Snippet}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
