"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { cacheApi } from "@/services/api";
import Link from "next/link";

export default function CachePage() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [allKeys, setAllKeys] = useState<any[]>([]);
  const [activeAction, setActiveAction] = useState<
    "set" | "get" | "delete" | null
  >(null);

  // Helper function to check if a string is valid JSON and format it
  const formatValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  // Helper function to check if a string is valid JSON
  const isJson = (value: string) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.status();
      setStatus(res);
      setResult(null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  const handleSet = async () => {
    if (!key || !value) {
      setError("Key and value are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.set(key, value);
      setResult(JSON.stringify(res));
      if (res.success) {
        setKey("");
        setValue("");
        setActiveAction(null);
        // Refresh keys list
        await handleShowAllKeys();
      }
    } catch (e: any) {
      setError(e.message || "Failed to set key");
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async () => {
    if (!key) {
      setError("Key is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.get(key);
      setResult(JSON.stringify(res));
      if (res.success) {
        setKey("");
        setActiveAction(null);
      }
    } catch (e: any) {
      setError(e.message || "Failed to get key");
    } finally {
      setLoading(false);
    }
  };

  const handleDel = async () => {
    if (!key) {
      setError("Key is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.del(key);
      setResult(JSON.stringify(res));
      if (res.success) {
        setKey("");
        setActiveAction(null);
        // Refresh keys list
        await handleShowAllKeys();
      }
    } catch (e: any) {
      setError(e.message || "Failed to delete key");
    } finally {
      setLoading(false);
    }
  };

  const handleFlush = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.flush();
      setResult(JSON.stringify(res));
      if (res.success) {
        // Immediately refresh the keys list to show empty state
        const keysRes = await cacheApi.keys();
        if (keysRes.success) {
          setAllKeys(keysRes.data || []);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to flush cache");
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cacheApi.keys();
      if (res.success) {
        setAllKeys(res.data || []);
      } else {
        setError(res.error || "Failed to fetch keys");
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  // Fetch status when page loads
  useEffect(() => {
    fetchStatus();
    handleShowAllKeys();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🧊</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Redis Cache Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    Full-featured cache management interface
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Cache Operations */}
          <div className="space-y-6">
            {/* Connection Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Connection Details
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Host:</span>
                  <span className="ml-2 text-gray-900">localhost</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Port:</span>
                  <span className="ml-2 text-gray-900">6380</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Password:</span>
                  <span className="ml-2 text-gray-900">(none)</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Database:</span>
                  <span className="ml-2 text-gray-900">0</span>
                </div>
              </div>
              {status && (
                <div className="mt-4 p-3 rounded-md border border-gray-200">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Status:</span>
                    <span
                      className={`ml-2 font-bold ${
                        status.status === "running"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {status.status}
                    </span>
                  </div>
                  {status.info && (
                    <div className="text-sm text-gray-800 mt-1 break-all">
                      {status.info}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cache Operations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Cache Operations
              </h2>

              {/* Action Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Choose Action
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveAction("set")}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeAction === "set"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Set Key-Value
                  </button>
                  <button
                    onClick={() => setActiveAction("get")}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeAction === "get"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Get Value
                  </button>
                  <button
                    onClick={() => setActiveAction("delete")}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeAction === "delete"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Delete Key
                  </button>
                </div>
              </div>

              {/* Action-Specific Forms */}
              {activeAction === "set" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Set Key-Value Pair
                  </h3>
                  <input
                    type="text"
                    placeholder="Enter key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <textarea
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                  />
                  <button
                    onClick={handleSet}
                    disabled={loading || !key || !value}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Set Key-Value
                  </button>
                </div>
              )}

              {activeAction === "get" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Get Value by Key
                  </h3>
                  <input
                    type="text"
                    placeholder="Enter key to retrieve"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    onClick={handleGet}
                    disabled={loading || !key}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Get Value
                  </button>
                </div>
              )}

              {activeAction === "delete" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Delete Key
                  </h3>
                  <input
                    type="text"
                    placeholder="Enter key to delete"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    onClick={handleDel}
                    disabled={loading || !key}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Delete Key
                  </button>
                </div>
              )}

              {/* Utility Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Utility Actions
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleFlush}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Flush All
                  </button>
                  <button
                    onClick={handleShowAllKeys}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Refresh Keys
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {(result || error) && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-300">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Results
                </h2>
                {result && (
                  <div className="mb-4">
                    <div className="font-medium text-gray-900 mb-2">
                      Result:
                    </div>
                    {isJson(result) ? (
                      <pre className="whitespace-pre-wrap break-all bg-gray-100 p-3 rounded border border-gray-300 text-sm text-gray-900 overflow-auto max-h-40">
                        {formatValue(result)}
                      </pre>
                    ) : (
                      <div className="break-all bg-gray-100 p-3 rounded border border-gray-300 text-sm text-gray-900">
                        {result}
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <div className="bg-red-100 text-red-800 rounded p-3 text-sm break-all border border-red-300">
                    Error: {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - All Keys Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Cache Keys ({allKeys.length})
              </h2>
              <button
                onClick={handleShowAllKeys}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {allKeys.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🧊</div>
                  <p className="text-gray-500">No keys found in cache</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allKeys.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 text-sm">
                          Key: {item.key}
                        </div>
                        <button
                          onClick={() => {
                            setKey(item.key);
                            setActiveAction("get");
                          }}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Get
                        </button>
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium text-xs">Value:</span>
                        {isJson(item.value) ? (
                          <pre className="whitespace-pre-wrap break-all bg-gray-50 p-2 rounded border mt-1 text-xs overflow-auto max-h-32">
                            {formatValue(item.value)}
                          </pre>
                        ) : (
                          <div className="break-all mt-1 text-sm">
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
