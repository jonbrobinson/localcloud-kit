"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import { s3Api, resourceApi } from "@/services/api";
import ManageHeaderBrand from "@/components/ManageHeaderBrand";
import { useProjectName } from "@/hooks/useProjectName";
import { S3BucketConfig } from "@/types";
import S3ConfigModal from "@/components/S3ConfigModal";
import FileViewerModal from "@/components/FileViewerModal";
import UploadFileModal from "@/components/UploadFileModal";
import SystemLogsButton from "@/components/SystemLogsButton";
import { listS3ObjectsAtPrefix } from "@/lib/s3PrefixListing";
import { Button, Card, SearchInput } from "@/components/ui";

interface BucketItem {
  Name?: string;
  Key?: string;
  Size?: number;
  LastModified?: string;
  CreationDate?: string;
}

const formatSize = (bytes?: number) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleString() : "—");
const isFolder = (key: string) => key.endsWith("/");

/** Iconify name + short mime-ish label shown in the Type column, guessed from the key's extension. */
const FILE_TYPE_BY_EXT: Record<string, { icon: string; label: string }> = {
  json: { icon: "lucide:file-json", label: "app/json" },
  png: { icon: "lucide:file-image", label: "image/png" },
  jpg: { icon: "lucide:file-image", label: "image/jpeg" },
  jpeg: { icon: "lucide:file-image", label: "image/jpeg" },
  gif: { icon: "lucide:file-image", label: "image/gif" },
  svg: { icon: "lucide:file-image", label: "image/svg" },
  webp: { icon: "lucide:file-image", label: "image/webp" },
  bmp: { icon: "lucide:file-image", label: "image/bmp" },
  csv: { icon: "lucide:file-text", label: "text/csv" },
  txt: { icon: "lucide:file-text", label: "text/plain" },
  md: { icon: "lucide:file-text", label: "text/markdown" },
  pdf: { icon: "lucide:file-text", label: "app/pdf" },
  xml: { icon: "lucide:file-code", label: "app/xml" },
  yml: { icon: "lucide:file-code", label: "text/yaml" },
  yaml: { icon: "lucide:file-code", label: "text/yaml" },
  js: { icon: "lucide:file-code", label: "text/js" },
  ts: { icon: "lucide:file-code", label: "text/ts" },
  tsx: { icon: "lucide:file-code", label: "text/tsx" },
  html: { icon: "lucide:file-code", label: "text/html" },
  css: { icon: "lucide:file-code", label: "text/css" },
};
const DEFAULT_FILE_TYPE = { icon: "lucide:file", label: "binary" };

function getFileTypeInfo(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  return FILE_TYPE_BY_EXT[ext] || DEFAULT_FILE_TYPE;
}

/** Stack for the Back button when jumping to `prefix` via breadcrumbs (e.g. photos/2024/ → ['', 'photos/']). */
function pathHistoryForPrefix(prefix: string): string[] {
  const trim = prefix.replace(/\/$/, "");
  if (!trim) return [];
  const parts = trim.split("/").filter(Boolean);
  if (parts.length <= 1) return [""];
  const history: string[] = [""];
  let acc = "";
  for (let i = 0; i < parts.length - 1; i++) {
    acc += `${parts[i]}/`;
    history.push(acc);
  }
  return history;
}

/** Folder segments under the bucket (prefix includes trailing slash). */
function breadcrumbFolderSegments(currentPath: string): { label: string; prefix: string }[] {
  const trim = currentPath.replace(/\/$/, "");
  if (!trim) return [];
  const parts = trim.split("/").filter(Boolean);
  const out: { label: string; prefix: string }[] = [];
  let acc = "";
  for (const part of parts) {
    acc += `${part}/`;
    out.push({ label: part, prefix: acc });
  }
  return out;
}

export default function ManageS3Page() {
  const projectName = useProjectName();
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [contents, setContents] = useState<BucketItem[]>([]);
  const [rawContents, setRawContents] = useState<BucketItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fileViewer, setFileViewer] = useState<{ bucketName: string; objectKey: string } | null>(null);
  const [filterText, setFilterText] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [bucketMenuOpen, setBucketMenuOpen] = useState(false);
  const bucketMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (bucketMenuRef.current && !bucketMenuRef.current.contains(e.target as Node)) {
        setBucketMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const loadBuckets = useCallback(async () => {
    setLoadingBuckets(true);
    try {
      const res = await s3Api.getBuckets(projectName);
      if (res.success) setBuckets(res.data || []);
      else toast.error(res.error || "Failed to load buckets");
    } catch {
      toast.error("Failed to load buckets");
    } finally {
      setLoadingBuckets(false);
    }
  }, [projectName]);

  useEffect(() => { loadBuckets(); }, [loadBuckets]);

  const loadContents = useCallback(async (bucket: string, path = "") => {
    setLoadingContents(true);
    try {
      const res = await s3Api.getBucketContents(projectName, bucket);
      if (res.success) {
        const all = res.data || [];
        setRawContents(all);
        setContents(listS3ObjectsAtPrefix(all, path));
        setCurrentPath(path);
      } else {
        toast.error("Failed to load contents");
      }
    } catch {
      toast.error("Failed to load contents");
    } finally {
      setLoadingContents(false);
    }
  }, [projectName]);

  const selectBucket = (name: string) => {
    setSelectedBucket(name);
    setCurrentPath("");
    setPathHistory([]);
    setSelectedKey(null);
    setFilterText("");
    setBucketMenuOpen(false);
    loadContents(name, "");
  };

  const openFolder = (key: string) => {
    if (!selectedBucket) return;
    const newPath = key;
    setPathHistory((h) => [...h, currentPath]);
    setSelectedKey(null);
    loadContents(selectedBucket, newPath);
  };

  const goBack = () => {
    if (!selectedBucket) return;
    const prev = pathHistory[pathHistory.length - 1] ?? "";
    setPathHistory((h) => h.slice(0, -1));
    setSelectedKey(null);
    loadContents(selectedBucket, prev);
  };

  const navigateToPrefix = useCallback(
    (targetPrefix: string) => {
      if (!selectedBucket) return;
      const norm =
        targetPrefix === "" ? "" : targetPrefix.endsWith("/") ? targetPrefix : `${targetPrefix}/`;
      setPathHistory(pathHistoryForPrefix(norm));
      setSelectedKey(null);
      void loadContents(selectedBucket, norm);
    },
    [selectedBucket, loadContents]
  );

  const handleCreate = async (config: S3BucketConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "s3", { s3Config: config });
      if (res.success) {
        toast.success("Bucket created");
        setShowCreate(false);
        setTimeout(loadBuckets, 800);
      } else {
        toast.error(res.error || "Failed to create bucket");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create bucket");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteObject = async (key: string) => {
    if (!selectedBucket) return;
    if (!confirm(`Delete "${key}"?`)) return;
    try {
      const res = await s3Api.deleteObject(projectName, selectedBucket, key);
      if (res.success) {
        toast.success("Object deleted");
        if (selectedKey === key) setSelectedKey(null);
        loadContents(selectedBucket, currentPath);
      } else {
        toast.error(res.error || "Failed to delete object");
      }
    } catch {
      toast.error("Failed to delete object");
    }
  };

  const folderObjectCount = (folderPrefix: string) =>
    rawContents.filter((i) => (i.Key || "").startsWith(folderPrefix) && i.Key !== folderPrefix).length;

  const visibleContents = filterText.trim()
    ? contents.filter((item) => {
        const key = item.Key || item.Name || "";
        const displayName = currentPath ? key.slice(currentPath.length) : key;
        return displayName.toLowerCase().includes(filterText.trim().toLowerCase());
      })
    : contents;

  const selectedItem = selectedKey
    ? contents.find((c) => (c.Key || c.Name) === selectedKey)
    : undefined;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border shrink-0">
        <div className="max-w-[1180px] mx-auto w-full px-6 py-4 flex items-center gap-3 flex-wrap">
          <ManageHeaderBrand />
          <span className="w-px h-[18px] bg-border shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <Icon icon="logos:aws-s3" width={18} />
            <h1 className="text-lg font-semibold tracking-tight text-ink">Manage S3</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-muted hover:text-ink transition-colors shrink-0">
            Dashboard
          </Link>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <SystemLogsButton />
            <Link
              href="/s3"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <Icon icon="lucide:book-open" width={14} />
              Docs
            </Link>
            <Button variant="secondary" icon="lucide:plus" onClick={() => setShowCreate(true)}>
              Create bucket
            </Button>

            <span className="w-px h-[18px] bg-border shrink-0" />

            {/* Bucket selector */}
            <div className="relative shrink-0" ref={bucketMenuRef}>
              <button
                type="button"
                onClick={() => setBucketMenuOpen((v) => !v)}
                disabled={buckets.length === 0}
                className="flex items-center justify-between gap-2 h-8 min-w-[200px] px-2.5 rounded-lg border border-border-strong bg-surface text-sm hover:border-ink-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-mono text-[13px] text-ink truncate">
                  {selectedBucket || "Select a bucket"}
                </span>
                <Icon icon="lucide:chevron-down" width={14} className="text-faint shrink-0" />
              </button>
              {bucketMenuOpen && buckets.length > 0 && (
                <div className="absolute right-0 z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-border bg-surface shadow-e2 py-1">
                  {buckets.map((b) => (
                    <button
                      key={b.Name}
                      type="button"
                      onClick={() => selectBucket(b.Name!)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[13px] transition-colors ${
                        selectedBucket === b.Name
                          ? "bg-primary-soft text-primary-ink"
                          : "text-ink-2 hover:bg-surface-2"
                      }`}
                    >
                      <Icon icon="lucide:folder" width={14} className="shrink-0 text-faint" />
                      <span className="truncate">{b.Name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                void loadBuckets();
                if (selectedBucket) void loadContents(selectedBucket, currentPath);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-strong bg-surface text-ink-2 hover:bg-surface-2 transition-colors shrink-0"
              title="Refresh buckets and current folder"
              aria-label="Refresh buckets and current folder"
            >
              <Icon
                icon="lucide:refresh-cw"
                width={15}
                className={loadingBuckets || loadingContents ? "animate-spin" : ""}
              />
            </button>

            <Button
              variant="primary"
              icon="lucide:upload"
              onClick={() => setShowUpload(true)}
              disabled={!selectedBucket}
            >
              Upload file
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1180px] mx-auto w-full flex flex-col gap-4">
          {!selectedBucket ? (
            <div className="flex flex-col items-center justify-center text-center py-24">
              <Icon icon="logos:aws-s3" width={64} className="mb-4 opacity-30" />
              <p className="text-sm text-muted">
                {buckets.length === 0
                  ? "No buckets yet — create one to get started."
                  : "Select a bucket to browse its contents."}
              </p>
              {buckets.length === 0 && (
                <Button variant="primary" icon="lucide:plus" className="mt-4" onClick={() => setShowCreate(true)}>
                  Create bucket
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 items-start">
              {/* Object table */}
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-divider flex-wrap">
                  <nav
                    aria-label="Bucket path"
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted"
                  >
                    <button
                      type="button"
                      onClick={() => navigateToPrefix("")}
                      className="shrink-0 font-medium text-primary hover:text-primary-hover"
                      title="Bucket root"
                    >
                      {selectedBucket}
                    </button>
                    {breadcrumbFolderSegments(currentPath).map((seg, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <span key={seg.prefix} className="flex min-w-0 items-center gap-1.5">
                          <Icon icon="lucide:chevron-right" width={13} className="shrink-0 text-faint" />
                          {isLast ? (
                            <span className="truncate font-mono text-ink" title={seg.prefix}>
                              {seg.label}/
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigateToPrefix(seg.prefix)}
                              className="truncate font-mono text-primary hover:text-primary-hover"
                              title={seg.prefix}
                            >
                              {seg.label}/
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </nav>
                  <SearchInput
                    placeholder="Filter by prefix…"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    containerClassName="h-7 min-w-[160px] shrink-0"
                  />
                </div>

                <div className="grid grid-cols-[22px_1fr_120px_110px_96px] gap-3 items-center px-3.5 py-2 bg-surface-2 border-b border-divider text-[10px] font-semibold uppercase tracking-wider text-faint">
                  <span />
                  <span>Key</span>
                  <span>Type</span>
                  <span>Size</span>
                  <span>Modified</span>
                </div>

                {loadingContents ? (
                  <div className="p-3.5 space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-9 rounded bg-skeleton animate-pulse" />
                    ))}
                  </div>
                ) : visibleContents.length === 0 && pathHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
                    <Icon icon="lucide:folder-open" width={36} className="mb-3 text-faint" />
                    <p className="text-sm text-muted">
                      {filterText ? "No objects match this filter." : "Bucket is empty."}
                    </p>
                  </div>
                ) : (
                  <div>
                    {pathHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={goBack}
                        className="grid w-full grid-cols-[22px_1fr_120px_110px_96px] gap-3 items-center h-9 px-3.5 border-b border-divider text-left hover:bg-surface-2 transition-colors"
                      >
                        <span />
                        <span className="flex items-center gap-2">
                          <Icon icon="lucide:corner-left-up" width={14} className="text-faint" />
                          <span className="text-sm text-muted">..</span>
                        </span>
                        <span />
                        <span />
                        <span />
                      </button>
                    )}
                    {visibleContents.map((item, i) => {
                      const key = item.Key || item.Name || "";
                      const displayName = currentPath ? key.slice(currentPath.length) : key;
                      const displayLabel = displayName.replace(/\/$/, "") || displayName;
                      const folder = isFolder(key);

                      if (folder) {
                        return (
                          <button
                            key={`${key}-${i}`}
                            type="button"
                            onClick={() => openFolder(key)}
                            className="grid w-full grid-cols-[22px_1fr_120px_110px_96px] gap-3 items-center h-9 px-3.5 border-b border-divider text-left hover:bg-surface-2 transition-colors"
                          >
                            <span />
                            <span className="flex items-center gap-2 min-w-0">
                              <Icon icon="lucide:folder" width={14} className="shrink-0 text-muted" />
                              <span className="truncate font-mono text-[13px] text-ink">{displayLabel}/</span>
                            </span>
                            <span className="text-xs text-faint">prefix</span>
                            <span className="text-xs text-faint">{folderObjectCount(key)} objects</span>
                            <span className="text-xs text-muted">—</span>
                          </button>
                        );
                      }

                      const selected = selectedKey === key;
                      const typeInfo = getFileTypeInfo(key);

                      return (
                        <div
                          key={`${key}-${i}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedKey(key)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedKey(key);
                          }}
                          className={`group grid grid-cols-[22px_1fr_120px_110px_96px] gap-3 items-center h-9 px-3.5 border-b border-divider cursor-pointer transition-colors ${
                            selected ? "bg-primary-soft" : "hover:bg-surface-2"
                          }`}
                        >
                          <span className="flex items-center justify-center">
                            {selected ? (
                              <span className="flex items-center justify-center w-3.5 h-3.5 rounded bg-primary text-white">
                                <Icon icon="lucide:check" width={10} />
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded border border-border-strong bg-surface" />
                            )}
                          </span>
                          <span className="flex items-center gap-2 min-w-0">
                            <Icon
                              icon={typeInfo.icon}
                              width={14}
                              className={`shrink-0 ${selected ? "text-primary" : "text-muted"}`}
                            />
                            <span
                              className={`truncate font-mono text-[13px] ${
                                selected ? "text-primary-ink" : "text-ink"
                              }`}
                            >
                              {displayLabel}
                            </span>
                          </span>
                          <span
                            className={`truncate font-mono text-[11px] ${
                              selected ? "text-primary" : "text-muted"
                            }`}
                          >
                            {typeInfo.label}
                          </span>
                          <span className={`text-xs ${selected ? "text-primary" : "text-muted"}`}>
                            {formatSize(item.Size)}
                          </span>
                          <span
                            className={`flex items-center justify-between gap-1 text-xs ${
                              selected ? "text-primary" : "text-muted"
                            }`}
                          >
                            <span className="truncate">{formatDate(item.LastModified)}</span>
                            <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFileViewer({ bucketName: selectedBucket, objectKey: key });
                                }}
                                className="p-1 rounded text-faint hover:text-primary hover:bg-surface-3"
                                title="View file"
                                aria-label="View file"
                              >
                                <Icon icon="lucide:eye" width={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteObject(key);
                                }}
                                className="p-1 rounded text-faint hover:text-danger hover:bg-danger-soft"
                                title="Delete file"
                                aria-label="Delete file"
                              >
                                <Icon icon="lucide:trash-2" width={13} />
                              </button>
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Details panel */}
              <div className="flex flex-col gap-4">
                <Card className="overflow-hidden">
                  {selectedItem ? (
                    <>
                      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-divider">
                        <Icon
                          icon={getFileTypeInfo(selectedItem.Key || "").icon}
                          width={16}
                          className="shrink-0 text-muted"
                        />
                        <span className="truncate font-mono text-[13px] font-medium text-ink">
                          {(selectedItem.Key || "").slice(currentPath.length)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 px-3.5 py-3">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted">Type</span>
                          <span className="font-mono text-ink-2">
                            {getFileTypeInfo(selectedItem.Key || "").label}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted">Size</span>
                          <span className="font-mono text-ink-2">{formatSize(selectedItem.Size)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted">Modified</span>
                          <span className="font-mono text-ink-2">{formatDate(selectedItem.LastModified)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-3 border-t border-divider">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="lucide:eye"
                          onClick={() =>
                            setFileViewer({ bucketName: selectedBucket, objectKey: selectedItem.Key || "" })
                          }
                        >
                          Preview
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon="lucide:trash-2"
                          className="ml-auto"
                          onClick={() => handleDeleteObject(selectedItem.Key || "")}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                      <Icon icon="lucide:file" width={28} className="mb-2 text-faint" />
                      <p className="text-xs text-muted">Select an object to see its details.</p>
                    </div>
                  )}
                </Card>

                {selectedItem && (
                  <Card className="flex flex-col gap-2.5 p-3.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                      Read it from your app
                    </span>
                    <pre className="m-0 overflow-auto rounded-lg border border-border bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-ink-2">
{`await s3.send(new GetObjectCommand({
  Bucket: "${selectedBucket}",
  Key: "${selectedItem.Key || ""}",
}));`}
                    </pre>
                    <Link href="/s3" className="text-[11px] font-medium">
                      Full connection guide →
                    </Link>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <S3ConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />

      {showUpload && selectedBucket && (
        <UploadFileModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          bucketName={selectedBucket}
          projectName={projectName}
          onUploadSuccess={() => { setShowUpload(false); loadContents(selectedBucket, currentPath); }}
        />
      )}

      {fileViewer && (
        <FileViewerModal
          isOpen={!!fileViewer}
          onClose={() => setFileViewer(null)}
          bucketName={fileViewer.bucketName}
          objectKey={fileViewer.objectKey}
          projectName={projectName}
        />
      )}
    </div>
  );
}
