"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LogEntry } from "@/types";
import { awsEmulatorApi } from "@/services/api";

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<
    "all" | "aws-emulator" | "automation" | "gui" | "posthog"
  >("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logData = await awsEmulatorApi.getLogs();
      setLogs(logData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "aws-emulator":
        return "bg-purple-100 text-purple-800";
      case "automation":
        return "bg-blue-100 text-blue-800";
      case "gui":
        return "bg-gray-100 text-gray-800";
      case "posthog":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = logs.filter(
    (log) => filter === "all" || log.source === filter
  );

  useEffect(() => {
    if (autoScroll && isOpen && filteredLogs.length > 0) {
      const logContent = document.getElementById("log-content");
      if (logContent) {
        logContent.scrollTop = logContent.scrollHeight;
      }
    }
  }, [filteredLogs, autoScroll, isOpen]);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Log Viewer</h2>
              <p className="text-xs text-gray-500">Auto-refreshes every 2 seconds</p>
            </div>
            <select
              value={filter}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="aws-emulator">AWS Emulator</option>
              <option value="automation">Automation</option>
              <option value="gui">GUI</option>
              <option value="posthog">PostHog</option>
            </select>
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Auto-scroll</span>
            </label>
          </div>
          <div className="flex items-center space-x-1">
            {/* Refresh icon — spins during load, manual trigger on click */}
            <button
              onClick={loadLogs}
              disabled={loading}
              title="Refresh logs"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={clearLogs}
              title="Clear logs"
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content — flex-1 min-h-0 makes this the constrained scroll container */}
        <div
          id="log-content"
          className="flex-1 min-h-0 overflow-y-auto bg-gray-900 text-green-200 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Logs Available</h3>
                <p className="text-gray-500">No logs found for the selected filter.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="text-xs text-gray-500 min-w-[80px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-lg">{getLogIcon(log.level)}</span>
                  <span className={`px-2 py-1 text-xs rounded ${getSourceColor(log.source)}`}>
                    {log.source}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded border ${getLogColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="flex-1 text-green-200 break-words whitespace-pre-line">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{filteredLogs.length} of {logs.length} logs</span>
            {lastUpdated && <span>Updated {lastUpdated}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
