"use client";

import { cacheApi } from "@/services/api";
import {
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface RedisInfo {
  status: string;
  info?: Record<string, string>;
}

interface RedisModalProps {
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-mono text-gray-900">{value}</span>
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🧊</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Redis Cache</h2>
              <p className="text-xs text-gray-500">Local cache service</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/cache"
              onClick={onClose}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100 transition-colors"
            >
              <ArrowRightIcon className="h-3.5 w-3.5 mr-1" />
              Manage Cache
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">

          {/* Status bar */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <span className={`inline-flex items-center text-sm font-medium ${
                  isRunning ? "text-green-700" : "text-gray-500"
                }`}>
                  <span className={`h-2 w-2 rounded-full mr-1.5 ${
                    isRunning ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`} />
                  {isRunning ? "Running" : "Unavailable"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Keys</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "—" : totalKeys}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Memory</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? "—" : usedMemory}
                </p>
              </div>
            </div>
          </div>

          {/* Server info */}
          {isRunning && !loading && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Server Info</h3>
              <div className="rounded-lg border border-gray-200 px-4 py-2">
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
              <h3 className="text-sm font-semibold text-gray-900">Keys</h3>
              <span className="text-xs text-gray-400">
                {totalKeys === 0 ? "No keys" : `${totalKeys} total`}
              </span>
            </div>
            {loading ? (
              <div className="text-center py-4 text-gray-400 text-sm">Loading…</div>
            ) : keys.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                No keys stored yet.
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {keys.slice(0, 20).map((key) => (
                    <div key={key} className="px-3 py-2 text-xs font-mono text-gray-700 bg-white hover:bg-gray-50">
                      {key}
                    </div>
                  ))}
                  {keys.length > 20 && (
                    <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50">
                      +{keys.length - 20} more — open Redis Management for full view
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-6 py-4 bg-gray-50">
            <Link
              href="/cache"
              onClick={onClose}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors"
            >
              Go to Redis Management
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
