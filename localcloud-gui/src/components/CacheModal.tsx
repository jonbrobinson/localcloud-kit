"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cacheApi } from "@/services/api";

interface CacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CacheModal({ isOpen, onClose }: CacheModalProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [allKeys, setAllKeys] = useState<any[]>([]);
  const [showAllKeys, setShowAllKeys] = useState(false);
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
          setShowAllKeys(true);
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
        setShowAllKeys(true);
      } else {
        setError(res.error || "Failed to fetch keys");
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  // Fetch status when modal opens
  useEffect(() => {
    if (isOpen) fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Redis Cache</h2>
        <p className="text-sm text-gray-600 mb-4">
          Interact with the Redis cache: set, get, delete, or flush keys.
        </p>

        {/* Connection Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Connection Details
          </h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div>
              <span className="font-medium">Host:</span> localhost
            </div>
            <div>
              <span className="font-medium">Port:</span> 6380
            </div>
            <div>
              <span className="font-medium">Password:</span> (none)
            </div>
            <div>
              <span className="font-medium">Database:</span> 0
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={fetchStatus}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            Refresh Status
          </button>
          {status && (
            <div className="mt-2 text-sm text-gray-700">
              <div>
                Status:{" "}
                <span
                  className={
                    status.status === "running"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {status.status}
                </span>
              </div>
              {status.info && (
                <div className="break-all">Info: {status.info}</div>
              )}
            </div>
          )}
        </div>

        {/* Action Selection */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Choose Action
          </h3>
          <div className="flex space-x-2 mb-3">
            <button
              onClick={() => setActiveAction("set")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeAction === "set"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Set Key-Value
            </button>
            <button
              onClick={() => setActiveAction("get")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeAction === "get"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Get Value
            </button>
            <button
              onClick={() => setActiveAction("delete")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
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
          <div className="mb-4 space-y-3">
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
            <input
              type="text"
              placeholder="Enter value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button
              onClick={handleSet}
              disabled={loading || !key || !value}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Set Key-Value
            </button>
          </div>
        )}

        {activeAction === "get" && (
          <div className="mb-4 space-y-3">
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
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Get Value
            </button>
          </div>
        )}

        {activeAction === "delete" && (
          <div className="mb-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Delete Key</h3>
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
              className="w-full px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Delete Key
            </button>
          </div>
        )}

        {/* Utility Actions */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Utility Actions
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleFlush}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              ) : null}
              Flush All
            </button>
            <button
              onClick={handleShowAllKeys}
              disabled={loading}
              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              ) : null}
              Show All Keys
            </button>
          </div>
        </div>

        {/* All Keys Display */}
        {showAllKeys && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              All Cache Keys ({allKeys.length})
            </h3>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {allKeys.length === 0 ? (
                <p className="text-xs text-gray-500">No keys found</p>
              ) : (
                <div className="space-y-1">
                  {allKeys.map((item, index) => (
                    <div
                      key={index}
                      className="text-xs border-b border-gray-200 pb-1"
                    >
                      <div className="font-medium text-gray-900">
                        Key: {item.key}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-medium">Value:</span>
                        {isJson(item.value) ? (
                          <pre className="whitespace-pre-wrap break-all bg-white p-1 rounded border mt-1 text-xs">
                            {formatValue(item.value)}
                          </pre>
                        ) : (
                          <span className="break-all"> {item.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAllKeys(false)}
              className="mt-2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Hide Keys
            </button>
          </div>
        )}

        {result && (
          <div className="bg-green-50 text-green-800 rounded p-2 mb-2 text-xs">
            <div className="font-medium mb-1">Result:</div>
            {isJson(result) ? (
              <pre className="whitespace-pre-wrap break-all bg-white p-2 rounded border text-xs">
                {formatValue(result)}
              </pre>
            ) : (
              <div className="break-all">{result}</div>
            )}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-800 rounded p-2 mb-2 text-xs break-all">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
