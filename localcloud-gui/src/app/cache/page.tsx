"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  KeyIcon,
  LinkIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cacheApi } from "@/services/api";
import DocPageNav from "@/components/DocPageNav";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import Link from "next/link";

const formVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

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
  >("set");
  const [showConnection, setShowConnection] = useState(false);
  const connectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        connectionRef.current &&
        !connectionRef.current.contains(e.target as Node)
      ) {
        setShowConnection(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatValue = (val: string) => {
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  const isJson = (val: string) => {
    try {
      JSON.parse(val);
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

  useEffect(() => {
    fetchStatus();
    handleShowAllKeys();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="Cache" subtitle="Redis">
        <ServiceStatusBadge service="redis" name="Redis" />
        <div className="relative" ref={connectionRef}>
          <button
            onClick={() => setShowConnection((v) => !v)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <LinkIcon className="h-4 w-4 mr-1.5" />
            Connection
            <ChevronDownIcon
              className={`h-4 w-4 ml-1.5 transition-transform ${showConnection ? "rotate-180" : ""}`}
            />
          </button>
          {showConnection && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Connection details
              </p>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    From your app (localhost)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Host</span>
                      <span className="font-mono text-gray-900">localhost</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Port</span>
                      <span className="font-mono text-gray-900">6380</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Password</span>
                      <span className="font-mono text-gray-900">(none)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Database</span>
                      <span className="font-mono text-gray-900">0</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Connection string:</span>{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono block mt-1">
                      redis://localhost:6380
                    </code>
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    From Docker (same network)
                  </p>
                  <p className="text-gray-600">
                    Host: <code className="font-mono">localcloud-redis</code>,
                    Port: <code className="font-mono">6379</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <Link
          href="/redis"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <DocumentTextIcon className="h-4 w-4 mr-1.5" />
          Documentation
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch">
          {/* Left: Operations */}
          <div className="space-y-6">
            {/* Operations */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[32rem] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Operations
                </h2>
                {status && (
                  <div className="flex items-center gap-3 text-sm">
                    {status.status === "running" ? (
                      <>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-emerald-700">Connected</span>
                        </span>
                        <span className="text-gray-500">
                          {allKeys.length} key{allKeys.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-600">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Not connected
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveAction("set")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeAction === "set"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Set
                </button>
                <button
                  onClick={() => setActiveAction("get")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeAction === "get"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Get
                </button>
                <button
                  onClick={() => setActiveAction("delete")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeAction === "delete"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeAction === "set" && (
                  <motion.div
                    key="set"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Key
                    </label>
                    <input
                      type="text"
                      placeholder="Enter key"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Value
                    </label>
                    <textarea
                      placeholder="Enter value (plain text or JSON)"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
                    />
                    <button
                      onClick={handleSet}
                      disabled={loading || !key || !value}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : null}
                      Set
                    </button>
                  </motion.div>
                )}

                {activeAction === "get" && (
                  <motion.div
                    key="get"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Key
                    </label>
                    <input
                      type="text"
                      placeholder="Enter key"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleGet}
                      disabled={loading || !key}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : null}
                      Get
                    </button>
                  </motion.div>
                )}

                {activeAction === "delete" && (
                  <motion.div
                    key="delete"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-4"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Key
                    </label>
                    <input
                      type="text"
                      placeholder="Enter key"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleDel}
                      disabled={loading || !key}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : null}
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={handleFlush}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                  Flush All
                </button>
                <button
                  onClick={handleShowAllKeys}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="h-4 w-4" />
                  )}
                  Refresh Keys
                </button>
              </div>
            </section>

            {/* Result */}
            {(result || error) && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Result
                </h2>
                {result && (
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-900 overflow-auto max-h-40 border border-gray-100 font-mono">
                    {isJson(result) ? formatValue(result) : result}
                  </pre>
                )}
                {error && (
                  <div className="bg-red-50 text-red-800 rounded-lg p-3 text-sm border border-red-100">
                    {error}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right: Keys */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[32rem] flex flex-col lg:sticky lg:top-8 lg:self-start">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                All Keys ({allKeys.length})
              </h2>
              <button
                onClick={handleShowAllKeys}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                title="Refresh"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto -mx-1">
              {allKeys.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-3">
                    <KeyIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-gray-500">No keys in cache</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allKeys.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-0.5">
                            Key
                          </p>
                          <code className="text-sm font-medium text-gray-900 truncate block">
                            {item.key}
                          </code>
                        </div>
                        <button
                          onClick={() => {
                            setKey(item.key);
                            setActiveAction("get");
                          }}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                        >
                          Get
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">
                          Value
                        </p>
                        {isJson(item.value) ? (
                          <pre className="whitespace-pre-wrap break-all bg-gray-50 p-2 rounded text-xs overflow-auto max-h-24 font-mono text-gray-900">
                            {formatValue(item.value)}
                          </pre>
                        ) : (
                          <div className="break-all text-sm text-gray-900">
                            {item.value}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
