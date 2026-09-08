"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cacheApi } from "@/services/api";
import DocPageNav from "@/components/DocPageNav";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import Link from "next/link";
import { Badge, Button, Card, IconButton, Input, SearchInput, SegmentedControl } from "@/components/ui";

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

type CacheAction = "set" | "get" | "delete";

export default function CachePage() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ status: string; info?: unknown } | null>(null);
  const [allKeys, setAllKeys] = useState<{ key: string; value: string }[]>([]);
  const [activeAction, setActiveAction] = useState<CacheAction | null>("set");
  const [showConnection, setShowConnection] = useState(false);
  const [confirmFlush, setConfirmFlush] = useState(false);
  const [keyFilter, setKeyFilter] = useState("");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch status");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to set key");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get key");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete key");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to flush cache");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFlush = async () => {
    await handleFlush();
    setConfirmFlush(false);
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    handleShowAllKeys();
  }, []);

  const isRunning = status?.status === "running";
  const filteredKeys = keyFilter.trim()
    ? allKeys.filter((item) =>
        item.key.toLowerCase().includes(keyFilter.trim().toLowerCase())
      )
    : allKeys;

  return (
    <main className="min-h-screen bg-bg">
      <DocPageNav title="LocalCloud Kit" subtitle="Redis">
        <ServiceStatusBadge service="redis" name="Redis" />
        <div className="relative" ref={connectionRef}>
          <Button
            variant="secondary"
            size="sm"
            icon="lucide:link"
            onClick={() => setShowConnection((v) => !v)}
          >
            Connection
            <Icon
              icon="lucide:chevron-down"
              width={13}
              className={`transition-transform ${showConnection ? "rotate-180" : ""}`}
            />
          </Button>
          {showConnection && (
            <div className="absolute right-0 mt-1.5 w-80 bg-surface border border-border rounded-xl shadow-e2 p-4 z-50">
              <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-3">
                Connection details
              </p>
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted mb-1.5">
                    From your app (localhost)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Host</span>
                      <span className="font-mono text-ink">localhost</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Port</span>
                      <span className="font-mono text-ink">6380</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Password</span>
                      <span className="font-mono text-ink">(none)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Database</span>
                      <span className="font-mono text-ink">0</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium text-ink-2">Connection string:</span>
                    <code className="block mt-1 bg-surface-2 border border-border px-1.5 py-1 rounded font-mono text-ink-2">
                      redis://localhost:6380
                    </code>
                  </p>
                </div>
                <div className="pt-3 border-t border-divider">
                  <p className="text-xs font-medium text-muted mb-1.5">
                    From Docker (same network)
                  </p>
                  <p className="text-xs text-muted">
                    Host: <code className="font-mono text-ink-2">localcloud-redis</code>, Port:{" "}
                    <code className="font-mono text-ink-2">6379</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <Link
          href="/redis"
          className="no-underline inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-border-strong bg-surface text-ink-2 text-[13px] font-medium transition-colors hover:bg-surface-2"
        >
          <Icon icon="lucide:book-open" width={14} />
          Documentation
        </Link>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Icon icon="logos:redis" width={22} />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-ink tracking-tight">Redis cache</h1>
            <p className="text-xs text-muted">Set, get, delete or flush keys</p>
          </div>
          {status ? (
            <Badge tone={isRunning ? "success" : "danger"}>
              {isRunning ? "Running" : "Not connected"}
            </Badge>
          ) : (
            <Badge tone="neutral">Checking…</Badge>
          )}
          <span className="ml-auto font-mono text-xs text-muted">
            {allKeys.length} key{allKeys.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Operations */}
          <div className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:plus-circle" width={15} className="text-primary" />
                  <span className="text-[13px] font-semibold text-ink">Operations</span>
                </div>
                <SegmentedControl
                  options={[
                    { value: "set", label: "Set" },
                    { value: "get", label: "Get" },
                    { value: "delete", label: "Delete" },
                  ]}
                  value={activeAction ?? "set"}
                  onChange={(v) => setActiveAction(v)}
                />
              </div>

              <AnimatePresence mode="wait">
                {activeAction === "set" && (
                  <motion.div
                    key="set"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-3"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-ink-2">Key</span>
                      <Input
                        mono
                        placeholder="session:user#42"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-ink-2">Value</span>
                      <textarea
                        placeholder="Plain text or JSON"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        rows={3}
                        className="min-h-[72px] px-2.5 py-2 rounded-lg border border-border-strong bg-surface-2 font-mono text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint resize-y focus:bg-surface focus:border-primary focus:ring-3 focus:ring-focus"
                      />
                    </label>
                    <Button
                      variant="primary"
                      icon="lucide:save"
                      onClick={handleSet}
                      disabled={!key || !value}
                      loading={loading}
                    >
                      Set key
                    </Button>
                  </motion.div>
                )}

                {activeAction === "get" && (
                  <motion.div
                    key="get"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-3"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-ink-2">Key</span>
                      <Input
                        mono
                        placeholder="session:user#42"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    </label>
                    <Button
                      variant="primary"
                      icon="lucide:search"
                      onClick={handleGet}
                      disabled={!key}
                      loading={loading}
                    >
                      Get key
                    </Button>
                  </motion.div>
                )}

                {activeAction === "delete" && (
                  <motion.div
                    key="delete"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-3"
                  >
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-ink-2">Key</span>
                      <Input
                        mono
                        placeholder="session:user#42"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    </label>
                    <Button
                      variant="danger"
                      icon="lucide:trash-2"
                      onClick={handleDel}
                      disabled={!key}
                      loading={loading}
                    >
                      Delete key
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Result */}
            {(result || error) && (
              <Card className="p-4 flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                  Result
                </span>
                {result && (
                  <pre className="m-0 p-2.5 rounded-lg bg-surface-2 border border-border font-mono text-[11px] leading-relaxed text-ink-2 overflow-auto max-h-40">
                    {isJson(result) ? formatValue(result) : result}
                  </pre>
                )}
                {error && (
                  <div className="rounded-lg border border-danger bg-danger-soft text-danger-ink text-xs p-2.5">
                    {error}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right: Keys */}
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 py-3 border-b border-divider flex-wrap">
                <span className="text-[13px] font-semibold text-ink">Keys</span>
                <span className="font-mono text-[11px] text-faint">{allKeys.length}</span>
                <SearchInput
                  placeholder="Filter keys…"
                  value={keyFilter}
                  onChange={(e) => setKeyFilter(e.target.value)}
                  containerClassName="ml-auto min-w-[140px] h-7"
                />
                <IconButton
                  icon="lucide:refresh-cw"
                  label="Refresh keys"
                  variant="outline"
                  size="sm"
                  onClick={handleShowAllKeys}
                  disabled={loading}
                  className={loading ? "animate-spin" : undefined}
                />
              </div>

              {filteredKeys.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-3 text-faint">
                    <Icon icon="lucide:key" width={18} />
                  </span>
                  <p className="text-sm text-muted">
                    {allKeys.length === 0 ? "No keys in cache" : "No keys match your filter"}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredKeys.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-[1fr_auto] items-center gap-2 px-3.5 h-10 border-b border-divider last:border-b-0 hover:bg-surface-2 transition-colors"
                    >
                      <span className="font-mono text-xs text-ink truncate" title={item.key}>
                        {item.key}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <IconButton
                          icon="lucide:eye"
                          label={`View ${item.key}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setKey(item.key);
                            setActiveAction("get");
                          }}
                        />
                        <IconButton
                          icon="lucide:trash-2"
                          label={`Delete ${item.key}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setKey(item.key);
                            setActiveAction("delete");
                          }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Guarded flush */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-danger bg-danger-soft flex-wrap">
              <Icon icon="lucide:alert-triangle" width={16} className="text-danger shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-semibold text-danger-ink">Flush all keys</span>
                <span className="text-[11px] text-danger-ink/85">
                  Drops all {allKeys.length} key{allKeys.length !== 1 ? "s" : ""} immediately. Dev
                  only, no undo.
                </span>
              </div>
              {confirmFlush ? (
                <div className="ml-auto flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmFlush(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon="lucide:trash-2"
                    loading={loading}
                    onClick={handleConfirmFlush}
                  >
                    Confirm flush
                  </Button>
                </div>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  icon="lucide:trash-2"
                  className="ml-auto shrink-0"
                  onClick={() => setConfirmFlush(true)}
                  disabled={loading || allKeys.length === 0}
                >
                  Flush all
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
