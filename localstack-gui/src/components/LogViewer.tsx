"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LogEntry } from "@/types";
import { localstackApi } from "@/services/api";

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogViewer({ isOpen, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<
    "all" | "localstack" | "automation" | "gui"
  >("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      const interval = setInterval(loadLogs, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const logData = await localstackApi.getLogs();
      setLogs(logData);
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
      case "localstack":
        return "bg-purple-100 text-purple-800";
      case "automation":
        return "bg-blue-100 text-blue-800";
      case "gui":
        return "bg-gray-100 text-gray-800";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Log Viewer</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Filter:
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="localstack">LocalStack</option>
                  <option value="automation">Automation</option>
                  <option value="gui">GUI</option>
                </select>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Auto-scroll</span>
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full overflow-y-auto bg-gray-900 text-green-200 font-mono text-sm"
            id="log-content"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Logs Available
                  </h3>
                  <p className="text-gray-500">
                    No logs found for the selected filter.
                  </p>
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
                    <span
                      className={`px-2 py-1 text-xs rounded ${getSourceColor(
                        log.source
                      )}`}
                    >
                      {log.source}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded border ${getLogColor(
                        log.level
                      )}`}
                    >
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredLogs.length} of {logs.length} logs
            </span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
