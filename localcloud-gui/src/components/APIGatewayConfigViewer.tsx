"use client";

import { useState } from "react";
import { XMarkIcon, PlusIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface APIGatewayConfigViewerProps {
  isOpen: boolean;
  onClose: () => void;
  apiId: string;
  apiName: string;
}

export default function APIGatewayConfigViewer({
  isOpen,
  onClose,
  apiId,
  apiName,
}: APIGatewayConfigViewerProps) {
  const [pathPart, setPathPart] = useState("hello");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [stageName, setStageName] = useState("dev");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ invokeUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/apigateway/apis/${apiId}/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathPart, httpMethod, stageName }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult({ invokeUrl: data.data.invokeUrl });
      } else {
        setError(data.error || "Failed to configure");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to configure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Icon icon="logos:aws-api-gateway" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configure API</h2>
              <p className="text-xs text-gray-500">{apiName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/manage/apigateway"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <span>Open Manager</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleConfigure} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Add a path with a mock GET response and deploy to a stage.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">/</span>
              <input
                type="text"
                value={pathPart}
                onChange={(e) => setPathPart(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="hello"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Alphanumeric, hyphens, underscores only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="dev"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-xs font-medium text-green-800 mb-1">Deployed successfully</p>
              <p className="text-xs text-green-700 font-mono break-all">{result.invokeUrl}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !pathPart.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {loading ? "Configuring..." : "Add path & deploy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
