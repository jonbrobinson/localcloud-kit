"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  FolderIcon,
  DocumentIcon,
  ArrowLeftIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { s3Api, resourceApi } from "@/services/api";
import { S3BucketConfig } from "@/types";
import FileViewerModal from "./FileViewerModal";
import UploadFileModal from "./UploadFileModal";
import S3ConfigModal from "./S3ConfigModal";
import { highlightThemes, HighlightTheme } from "./highlightThemes";
import { Icon } from "@iconify/react";
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

  return (
  <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              {selectedBucket && (
                <button
                  onClick={() => {
                    setSelectedBucket(null);
                    setBucketContents([]);
                    setCurrentPath("");
                    setPathHistory([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedBucket ? `Bucket: ${selectedBucket}` : "S3 Buckets"}
                </h2>
                {selectedBucket && currentPath && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2 flex-wrap">
                    <span className="text-gray-400">Path:</span>
                    <button
                      onClick={handleRootClick}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      root
                    </button>
                    {pathHistory.map((path, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span>/</span>
                        <button
                          onClick={() => {
                            const newHistory = pathHistory.slice(0, index + 1);
                            setPathHistory(newHistory);
                            loadBucketContents(selectedBucket, path);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {getDisplayName(path)}
                        </button>
                      </div>
                    ))}
                    {currentPath && (
                      <>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">
                          {getDisplayName(currentPath)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4 shrink-0 ml-4">
              {selectedBucket && currentPath && pathHistory.length > 0 && (
                <button
                  onClick={handleBackClick}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
              )}
              {selectedBucket && (
                <button
                  onClick={() =>
                    loadBucketContents(selectedBucket, currentPath)
                  }
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh bucket contents"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              )}
              <Link
                href="/manage/s3"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <span>Open Manager</span>
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </Link>
              {selectedBucket && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload File
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
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
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  style={{ opacity: op }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-100 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-44 bg-gray-200 rounded" />
                      <div className="h-3 w-32 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-24 bg-gray-100 rounded" />
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
              <div className="flex bg-gray-50 border-b border-gray-200 px-6 py-3 gap-6">
                <div className="h-3 w-2/5 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
              </div>
              {/* Fake rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center border-b border-gray-100 px-6 py-4 gap-6"
                  style={{ opacity: 1 - i * 0.09 }}
                >
                  <div className="flex items-center gap-2 w-2/5">
                    <div className="h-5 w-5 rounded bg-gray-200 shrink-0" />
                    <div className="h-3 flex-1 bg-gray-200 rounded" />
                  </div>
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                  <div className="h-3 w-12 bg-gray-100 rounded ml-auto" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div key="error" variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={
                    selectedBucket
                      ? () => loadBucketContents(selectedBucket, currentPath)
                      : loadBuckets
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          ) : selectedBucket ? (
            /* Bucket Contents */
            <motion.div key={`bucket-${selectedBucket}`} variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="h-full overflow-auto">
              {bucketContents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
                  <Icon icon="logos:aws-s3" className="w-20 h-20 mb-4 opacity-20" />
                  <p className="text-sm font-medium text-gray-700">This bucket is empty</p>
                  <p className="text-xs text-gray-400 mt-1">Upload a file using the button above to get started.</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Name</span>
                              {sortConfig?.key === "name" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("size")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Size</span>
                              {sortConfig?.key === "size" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("modified")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Last Modified</span>
                              {sortConfig?.key === "modified" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ))}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 select-none"
                            onClick={() => handleSort("storage")}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Storage Class</span>
                              {sortConfig?.key === "storage" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                ))}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getSortedContents().map((item, index) => (
                          <tr key={item.Key ?? `obj-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {isFolder(item.Key || "") ? (
                                  <FolderIcon className="h-5 w-5 text-blue-500 mr-2 shrink-0" />
                                ) : (
                                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  {isFolder(item.Key || "") ? (
                                    <button
                                      onClick={() =>
                                        handleFolderClick(item.Key || "")
                                      }
                                      className="text-left text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer truncate"
                                      title={getDisplayName(item.Key || "")}
                                    >
                                      {getDisplayName(item.Key || "")}
                                    </button>
                                  ) : (
                                    <span
                                      className="text-sm text-gray-900 font-medium truncate"
                                      title={getDisplayName(item.Key || "")}
                                    >
                                      {getDisplayName(item.Key || "")}
                                    </span>
                                  )}
                                  {item.Key && item.Key.includes("/") && (
                                    <span
                                      className="text-xs text-gray-500 truncate max-w-xs"
                                      title={item.Key}
                                    >
                                      {item.Key}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {isFolder(item.Key || "")
                                ? "-"
                                : formatFileSize(item.Size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.LastModified)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.StorageClass || "STANDARD"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {!isFolder(item.Key || "") && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleViewFile(item.Key || "")
                                    }
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="View file"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteFile(item.Key || "")
                                    }
                                    disabled={deletingFile === item.Key}
                                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                    title="Delete file"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
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
                  <p className="text-sm font-medium text-gray-700">No S3 buckets found</p>
                  <p className="text-xs text-gray-400 mt-1 mb-5">Create your first bucket to start storing files.</p>
                  <button
                    onClick={() => setShowCreateBucket(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Create Bucket
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid gap-4">
                    {buckets.map((bucket, index) => (
                      <div
                        key={bucket.Name ?? `bucket-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => loadBucketContents(bucket.Name || "")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FolderIcon className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {bucket.Name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Created: {formatDate(bucket.CreationDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Click to view contents
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
