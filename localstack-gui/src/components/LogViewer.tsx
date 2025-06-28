"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  ArrowDownIcon,
  TrashIcon,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CS</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Log Viewer
                    </h3>
                    <p className="text-sm text-gray-500">
                      CloudStack Solutions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={loadLogs}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                  <button
                    onClick={clearLogs}
                    className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Clear
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Filter:
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <span className="text-sm text-gray-700">Auto-scroll</span>
                </label>
              </div>
            </div>

            {/* Log Content */}
            <div className="max-h-96 overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm">
              {filteredLogs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">CS</span>
                    </div>
                    <span className="text-sm">No logs available</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    CloudStack Solutions Log Viewer
                  </p>
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
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">CS</span>
                  </div>
                  <span>
                    Showing {filteredLogs.length} of {logs.length} logs
                  </span>
                </div>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
