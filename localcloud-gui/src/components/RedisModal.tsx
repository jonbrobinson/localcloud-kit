"use client";

import { cacheApi } from "@/services/api";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, IconButton } from "@/components/ui";

interface RedisInfo {
  status: string;
  info?: Record<string, string>;
}

interface RedisModalProps {
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-divider last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs font-mono text-ink-2">{value}</span>
    </div>
  );
}

export default function RedisModal({ onClose }: RedisModalProps) {
  const [redisInfo, setRedisInfo] = useState<RedisInfo>({ status: "unknown" });
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statusData, keysData] = await Promise.all([
        cacheApi.status(),
        cacheApi.keys(),
      ]);
      setRedisInfo({
        status: statusData.status,
        info: statusData.info,
      });
      setKeys((keysData.data || []).map((k) => k.key));
    } catch {
      setRedisInfo({ status: "unavailable" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Escape key + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isRunning = redisInfo.status === "running";
  const info = redisInfo.info || {};

  // Pull out key stats from Redis INFO output
  const usedMemory = info["used_memory_human"] || info["used_memory"] || "—";
  const totalKeys = keys.length;
  const redisVersion = info["redis_version"] || "—";
  const uptimeSeconds = info["uptime_in_seconds"];
  const uptime = uptimeSeconds
    ? uptimeSeconds.length > 0
      ? `${Math.floor(Number(uptimeSeconds) / 3600)}h ${Math.floor((Number(uptimeSeconds) % 3600) / 60)}m`
      : "—"
    : "—";
  const connectedClients = info["connected_clients"] || "—";

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-surface border border-border rounded-xl shadow-e3 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft text-primary">
              <Icon icon="logos:redis" width={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Redis Cache</h2>
              <p className="text-xs text-muted">Local cache service</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/cache"
              onClick={onClose}
              className="no-underline inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border-strong bg-surface text-ink-2 text-xs font-medium transition-colors hover:bg-surface-2"
            >
              <Icon icon="lucide:arrow-right" width={13} />
              Manage Cache
            </Link>
            <IconButton
              icon="lucide:x"
              label="Close"
              variant="ghost"
              size="sm"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-divider">

          {/* Status bar */}
          <div className="px-6 py-4 bg-surface-2 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] text-faint uppercase tracking-wide">Status</p>
                <div className="mt-0.5">
                  <Badge tone={isRunning ? "success" : "neutral"} pulse={isRunning}>
                    {isRunning ? "Running" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-faint uppercase tracking-wide">Keys</p>
                <p className="text-2xl font-bold text-ink font-mono">
                  {loading ? "—" : totalKeys}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-faint uppercase tracking-wide">Memory</p>
                <p className="text-2xl font-bold text-ink font-mono">
                  {loading ? "—" : usedMemory}
                </p>
              </div>
            </div>
          </div>

          {/* Server info */}
          {isRunning && !loading && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-ink mb-3">Server Info</h3>
              <div className="rounded-lg border border-border px-4 py-2">
                <InfoRow label="Redis Version" value={redisVersion} />
                <InfoRow label="Uptime" value={uptime} />
                <InfoRow label="Connected Clients" value={connectedClients} />
                <InfoRow label="Host" value="localhost:6379" />
              </div>
            </div>
          )}

          {/* Key sample */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink">Keys</h3>
              <span className="text-xs text-faint">
                {totalKeys === 0 ? "No keys" : `${totalKeys} total`}
              </span>
            </div>
            {loading ? (
              <div className="text-center py-4 text-muted text-sm">Loading…</div>
            ) : keys.length === 0 ? (
              <div className="text-center py-4 text-muted text-sm">
                No keys stored yet.
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="divide-y divide-divider max-h-40 overflow-y-auto">
                  {keys.slice(0, 20).map((key) => (
                    <div key={key} className="px-3 py-2 text-xs font-mono text-ink-2 bg-surface hover:bg-surface-2">
                      {key}
                    </div>
                  ))}
                  {keys.length > 20 && (
                    <div className="px-3 py-2 text-xs text-faint bg-surface-2">
                      +{keys.length - 20} more — open Redis Management for full view
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-6 py-4 bg-surface-2">
            <Link
              href="/cache"
              onClick={onClose}
              className="no-underline inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg bg-primary text-white text-[13px] font-medium transition-colors hover:bg-primary-hover"
            >
              Go to Redis Management
              <Icon icon="lucide:arrow-right" width={15} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
