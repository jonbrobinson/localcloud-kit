"use client";

import { useState } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import LogViewer from "./LogViewer";

export default function SystemLogsButton() {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowLogs(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
        title="Open system logs"
      >
        <DocumentTextIcon className="h-4 w-4" />
        System Logs
      </button>
      <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
    </>
  );
}
