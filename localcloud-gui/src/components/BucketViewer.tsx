"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { s3Api, resourceApi } from "@/services/api";
import { S3BucketConfig } from "@/types";
import FileViewerModal from "./FileViewerModal";
import UploadFileModal from "./UploadFileModal";
import S3ConfigModal from "./S3ConfigModal";
import { highlightThemes, HighlightTheme } from "./highlightThemes";
import { Icon } from "@iconify/react";
import { Button, IconButton } from "@/components/ui";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { listS3ObjectsAtPrefix } from "@/lib/s3PrefixListing";

const panelVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.4, 0, 1, 1]  as const } },
};

interface BucketViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  selectedBucketName?: string;
}

interface BucketItem {
  Name?: string;
  Key?: string;
  Size?: number;
  LastModified?: string;
  StorageClass?: string;
  CreationDate?: string;
}

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

export default function BucketViewer({
  isOpen,
  onClose,
  projectName,
  selectedBucketName,
}: BucketViewerProps) {
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [bucketContents, setBucketContents] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    bucketName: string;
    objectKey: string;
  } | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<HighlightTheme>("github");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "size" | "modified" | "storage";
    direction: "asc" | "desc";
  } | null>(null);
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreateBucket = async (s3Config: S3BucketConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "s3", { s3Config });
      if (response.success) {
        toast.success("S3 bucket created successfully");
        setShowCreateBucket(false);
        setTimeout(loadBuckets, 1000);
      } else {
        toast.error(response.error || "Failed to create S3 bucket");
      }
    } catch (error) {
      console.error("Create S3 bucket error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create S3 bucket"));
    } finally {
      setCreateLoading(false);
    }
  };

  const loadBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await s3Api.getBuckets(projectName);
      if (response.success) {
        setBuckets(response.data || []);
      } else {
        setError(response.error || "Failed to load buckets");
      }
    } catch {
      setError("Failed to load buckets");
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  const loadBucketContents = useCallback(
    async (bucketName: string, path: string = "") => {
      setLoading(true);
      setError(null);
      try {
        const response = await s3Api.getBucketContents(projectName, bucketName);
        if (response.success) {
          const all = response.data || [];
          const contents = listS3ObjectsAtPrefix(all, path);

          setBucketContents(contents);
          setSelectedBucket(bucketName);
          setCurrentPath(path);
        } else {
          setError(response.error || "Failed to load bucket contents");
        }
      } catch {
        setError("Failed to load bucket contents");
      } finally {
        setLoading(false);
      }
    },
    [projectName]
  );

  useEffect(() => {
    if (isOpen) {
      loadBuckets();
    }
  }, [isOpen, loadBuckets]);

  useEffect(() => {
    if (isOpen && selectedBucketName && buckets.length > 0) {
      loadBucketContents(selectedBucketName);
    }
  }, [isOpen, selectedBucketName, buckets, loadBucketContents]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedBucket(null);
      setBucketContents([]);
      setError(null);
      setCurrentPath("");
      setPathHistory([]);
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

  useEffect(() => {
    const stored = localStorage.getItem("hljs-theme");
    if (stored && highlightThemes[stored])
      setSelectedTheme(stored as HighlightTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("hljs-theme", selectedTheme);
  }, [selectedTheme]);

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  const isFolder = (key: string) => {
    // S3 doesn't have real folders, but we can detect "virtual folders"
    // A key ending with "/" is a folder marker
    // A key without "/" is a file
    return key.endsWith("/");
  };

  const getDisplayName = (key: string) => {
    // For nested paths, show just the filename or folder name
    if (key.endsWith("/")) {
      // It's a folder, get the folder name
      const parts = key.split("/").filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] + "/" : key;
    } else {
      // It's a file, get the filename
      const parts = key.split("/");
      return parts[parts.length - 1];
    }
  };

  const handleViewFile = (objectKey: string) => {
    if (!selectedBucket) return;
    setSelectedFile({ bucketName: selectedBucket, objectKey });
    setFileViewerOpen(true);
  };

  const handleDeleteFile = async (objectKey: string) => {
    if (!selectedBucket) return;

    if (!confirm(`Are you sure you want to delete "${objectKey}"?`)) {
      return;
    }

    setDeletingFile(objectKey);
    try {
      const response = await s3Api.deleteObject(
        projectName,
        selectedBucket,
        objectKey
      );
      if (response.success) {
        // Refresh bucket contents
        await loadBucketContents(selectedBucket, currentPath);
      } else {
        setError(response.error || "Failed to delete file");
      }
    } catch {
      setError("Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleCloseFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
  };

  const handleFolderClick = (folderKey: string) => {
    if (!selectedBucket) return;

    // Add current path to history
    if (currentPath) {
      setPathHistory((prev) => [...prev, currentPath]);
    }

    // Navigate to the folder
    loadBucketContents(selectedBucket, folderKey);
  };

  const handleBackClick = () => {
    if (!selectedBucket || pathHistory.length === 0) return;

    const previousPath = pathHistory[pathHistory.length - 1];
    setPathHistory((prev) => prev.slice(0, -1));
    loadBucketContents(selectedBucket, previousPath);
  };

  const handleRootClick = () => {
    if (!selectedBucket) return;

    // Reset to root of bucket
    setCurrentPath("");
    setPathHistory([]);
    loadBucketContents(selectedBucket, "");
  };

  const handleSort = (key: "name" | "size" | "modified" | "storage") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedContents = () => {
    if (!sortConfig) return bucketContents;

    const sorted = [...bucketContents].sort((a, b) => {
      // Always keep folders at the top
      const aIsFolder = isFolder(a.Key || "");
      const bIsFolder = isFolder(b.Key || "");
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;

      // Sort by the selected key
      let comparison = 0;
      switch (sortConfig.key) {
        case "name":
          comparison = getDisplayName(a.Key || "").localeCompare(
            getDisplayName(b.Key || "")
          );
          break;
        case "size":
          comparison = (a.Size || 0) - (b.Size || 0);
          break;
        case "modified":
          comparison =
            new Date(a.LastModified || 0).getTime() -
            new Date(b.LastModified || 0).getTime();
          break;
        case "storage":
          comparison = (a.StorageClass || "STANDARD").localeCompare(
            b.StorageClass || "STANDARD"
          );
          break;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sortIcon = (key: "name" | "size" | "modified" | "storage") =>
    sortConfig?.key === key ? (
      <Icon icon={sortConfig.direction === "asc" ? "lucide:chevron-up" : "lucide:chevron-down"} width={13} />
    ) : null;

  return (
  <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
        className="bg-surface border border-border rounded-xl shadow-e3 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-divider shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              {selectedBucket && (
                <IconButton
                  icon="lucide:arrow-left"
                  label="Back to bucket list"
                  variant="ghost"
                  onClick={() => {
                    setSelectedBucket(null);
                    setBucketContents([]);
                    setCurrentPath("");
                    setPathHistory([]);
                  }}
                  className="shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                  {!selectedBucket && <Icon icon="logos:aws-s3" width={18} />}
                  {selectedBucket ? (
                    <span className="font-mono">{selectedBucket}</span>
                  ) : (
                    "S3 Buckets"
                  )}
                </h2>
                {selectedBucket && currentPath && (
                  <div className="flex items-center space-x-2 text-sm text-muted mt-1.5 flex-wrap">
                    <span className="text-faint">Path:</span>
                    <button
                      onClick={handleRootClick}
                      className="text-primary hover:text-primary-hover"
                    >
                      root
                    </button>
                    {pathHistory.map((path, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Icon icon="lucide:chevron-right" width={12} className="text-faint" />
                        <button
                          onClick={() => {
                            const newHistory = pathHistory.slice(0, index + 1);
                            setPathHistory(newHistory);
                            loadBucketContents(selectedBucket, path);
                          }}
                          className="font-mono text-primary hover:text-primary-hover"
                        >
                          {getDisplayName(path)}
                        </button>
                      </div>
                    ))}
                    {currentPath && (
                      <>
                        <Icon icon="lucide:chevron-right" width={12} className="text-faint" />
                        <span className="font-mono font-medium text-ink">
                          {getDisplayName(currentPath)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {selectedBucket && currentPath && pathHistory.length > 0 && (
                <Button variant="secondary" size="sm" icon="lucide:arrow-left" onClick={handleBackClick}>
                  Back
                </Button>
              )}
              {selectedBucket && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon="lucide:refresh-cw"
                  onClick={() => loadBucketContents(selectedBucket, currentPath)}
                  disabled={loading}
                  title="Refresh bucket contents"
                >
                  Refresh
                </Button>
              )}
              <Link
                href="/manage/s3"
                onClick={onClose}
                className="no-underline inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-primary text-xs font-medium hover:bg-primary-soft transition-colors"
              >
                Open Manager
                <Icon icon="lucide:external-link" width={13} />
              </Link>
              {selectedBucket && (
                <Button variant="primary" size="sm" icon="lucide:upload" onClick={() => setUploadModalOpen(true)}>
                  Upload File
                </Button>
              )}
              <IconButton icon="lucide:x" label="Close" variant="ghost" onClick={onClose} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
          {loading && !selectedBucket ? (
            /* ── Bucket list skeleton ── */
            <motion.div
              key="loading-buckets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto p-6 space-y-4 animate-pulse"
            >
              {[1, 0.85, 0.7, 0.55].map((op, i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg p-4 flex items-center justify-between"
                  style={{ opacity: op }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-skeleton shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-44 bg-skeleton rounded" />
                      <div className="h-3 w-32 bg-skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-24 bg-skeleton rounded" />
                </div>
              ))}
            </motion.div>
          ) : loading && selectedBucket ? (
            /* ── File table skeleton ── */
            <motion.div
              key={`loading-files-${selectedBucket}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto animate-pulse"
            >
              {/* Fake table header */}
              <div className="flex bg-surface-2 border-b border-divider px-6 py-3 gap-6">
                <div className="h-3 w-2/5 bg-skeleton rounded" />
                <div className="h-3 w-16 bg-skeleton rounded" />
                <div className="h-3 w-32 bg-skeleton rounded" />
                <div className="h-3 w-28 bg-skeleton rounded" />
                <div className="h-3 w-16 bg-skeleton rounded ml-auto" />
              </div>
              {/* Fake rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-divider px-6 py-4 gap-6"
                  style={{ opacity: 1 - i * 0.09 }}
                >
                  <div className="flex items-center gap-2 w-2/5">
                    <div className="h-5 w-5 rounded bg-skeleton shrink-0" />
                    <div className="h-3 flex-1 bg-skeleton rounded" />
                  </div>
                  <div className="h-3 w-16 bg-skeleton rounded" />
                  <div className="h-3 w-32 bg-skeleton rounded" />
                  <div className="h-3 w-20 bg-skeleton rounded" />
                  <div className="h-3 w-12 bg-skeleton rounded ml-auto" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div key="error" variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-danger mb-4">{error}</p>
                <Button
                  variant="primary"
                  onClick={
                    selectedBucket
                      ? () => loadBucketContents(selectedBucket, currentPath)
                      : loadBuckets
                  }
                >
                  Retry
                </Button>
              </div>
            </motion.div>
          ) : selectedBucket ? (
            /* Bucket Contents */
            <motion.div key={`bucket-${selectedBucket}`} variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="h-full overflow-auto">
              {bucketContents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <Icon icon="logos:aws-s3" className="w-20 h-20 mb-4 opacity-20" />
                  <p className="text-sm font-medium text-ink-2">This bucket is empty</p>
                  <p className="text-xs text-faint mt-1">Upload a file using the button above to get started.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-divider">
                      <thead className="bg-surface-2">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-[10px] font-semibold text-faint uppercase tracking-wider w-2/5 cursor-pointer hover:bg-surface-3 select-none"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Key</span>
                              {sortIcon("name")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-[10px] font-semibold text-faint uppercase tracking-wider w-20 cursor-pointer hover:bg-surface-3 select-none"
                            onClick={() => handleSort("size")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Size</span>
                              {sortIcon("size")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-[10px] font-semibold text-faint uppercase tracking-wider w-44 cursor-pointer hover:bg-surface-3 select-none"
                            onClick={() => handleSort("modified")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Last Modified</span>
                              {sortIcon("modified")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-[10px] font-semibold text-faint uppercase tracking-wider w-32 cursor-pointer hover:bg-surface-3 select-none"
                            onClick={() => handleSort("storage")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Storage Class</span>
                              {sortIcon("storage")}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-[10px] font-semibold text-faint uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-surface divide-y divide-divider">
                        {getSortedContents().map((item, index) => {
                          const folder = isFolder(item.Key || "");
                          const typeInfo = getFileTypeInfo(item.Key || "");
                          return (
                          <tr key={item.Key ?? `obj-${index}`} className="hover:bg-surface-2 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Icon
                                  icon={folder ? "lucide:folder" : typeInfo.icon}
                                  width={16}
                                  className={`mr-2 shrink-0 ${folder ? "text-muted" : "text-faint"}`}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  {folder ? (
                                    <button
                                      onClick={() =>
                                        handleFolderClick(item.Key || "")
                                      }
                                      className="text-left text-sm text-primary hover:text-primary-hover font-mono font-medium cursor-pointer truncate"
                                      title={getDisplayName(item.Key || "")}
                                    >
                                      {getDisplayName(item.Key || "")}
                                    </button>
                                  ) : (
                                    <span
                                      className="text-sm text-ink font-mono font-medium truncate"
                                      title={getDisplayName(item.Key || "")}
                                    >
                                      {getDisplayName(item.Key || "")}
                                    </span>
                                  )}
                                  {item.Key && item.Key.includes("/") && (
                                    <span
                                      className="text-xs text-faint truncate max-w-xs"
                                      title={item.Key}
                                    >
                                      {item.Key}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {folder ? "-" : formatFileSize(item.Size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {formatDate(item.LastModified)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {item.StorageClass || "STANDARD"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {!folder && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      handleViewFile(item.Key || "")
                                    }
                                    className="p-1 rounded text-muted hover:text-primary hover:bg-primary-soft transition-colors"
                                    title="View file"
                                  >
                                    <Icon icon="lucide:eye" width={15} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteFile(item.Key || "")
                                    }
                                    disabled={deletingFile === item.Key}
                                    className="p-1 rounded text-muted hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                                    title="Delete file"
                                  >
                                    <Icon icon="lucide:trash-2" width={15} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Bucket List */
            <motion.div key="bucket-list" variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="h-full overflow-auto">
              {buckets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <Icon icon="logos:aws-s3" className="w-24 h-24 mb-4 opacity-20" />
                  <p className="text-sm font-medium text-ink-2">No S3 buckets found</p>
                  <p className="text-xs text-faint mt-1 mb-5">Create your first bucket to start storing files.</p>
                  <Button variant="primary" icon="lucide:plus" onClick={() => setShowCreateBucket(true)}>
                    Create Bucket
                  </Button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid gap-4">
                    {buckets.map((bucket, index) => (
                      <div
                        key={bucket.Name ?? `bucket-${index}`}
                        className="border border-border rounded-lg p-4 hover:bg-surface-2 hover:border-border-strong cursor-pointer transition-colors"
                        onClick={() => loadBucketContents(bucket.Name || "")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary-soft mr-3 shrink-0">
                              <Icon icon="logos:aws-s3" width={20} />
                            </span>
                            <div>
                              <h3 className="text-base font-mono font-medium text-ink">
                                {bucket.Name}
                              </h3>
                              <p className="text-sm text-muted">
                                Created: {formatDate(bucket.CreationDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-faint flex items-center gap-1">
                            View contents
                            <Icon icon="lucide:chevron-right" width={14} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>

    {/* File Viewer Modal */}
    {selectedFile && (
      <FileViewerModal
        isOpen={fileViewerOpen}
        onClose={handleCloseFileViewer}
        projectName={projectName}
        bucketName={selectedFile.bucketName}
        objectKey={selectedFile.objectKey}
        theme={selectedTheme}
      />
    )}

    {/* Upload File Modal */}
    {selectedBucket && (
      <UploadFileModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        projectName={projectName}
        bucketName={selectedBucket}
        onUploadSuccess={() => {
          loadBucketContents(selectedBucket, currentPath);
        }}
      />
    )}

    {/* Create Bucket Modal */}
    <S3ConfigModal
      isOpen={showCreateBucket}
      onClose={() => setShowCreateBucket(false)}
      onSubmit={handleCreateBucket}
      projectName={projectName}
      loading={createLoading}
    />
  </>
  );
}
