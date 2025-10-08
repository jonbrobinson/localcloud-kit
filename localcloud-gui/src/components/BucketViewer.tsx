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
} from "@heroicons/react/24/outline";
import { s3Api } from "@/services/api";
import FileViewerModal from "./FileViewerModal";
import UploadFileModal from "./UploadFileModal";
import { highlightThemes, HighlightTheme } from "./highlightThemes";

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
          let contents = response.data || [];

          // Filter contents based on current path
          if (path) {
            contents = contents.filter((item) => {
              const key = item.Key || "";
              // Show items that start with the current path
              if (key.startsWith(path)) {
                // Remove the prefix for display
                const relativeKey = key.slice(path.length);
                // Only show items in the current directory level (not nested deeper)
                return !relativeKey.includes("/") || relativeKey.endsWith("/");
              }
              return false;
            });
          }

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

  const getParentPath = (key: string) => {
    // Get the parent path for navigation
    if (key.endsWith("/")) {
      // Remove the trailing slash and get parent
      const trimmed = key.slice(0, -1);
      const parts = trimmed.split("/");
      parts.pop(); // Remove the last part
      return parts.length > 0 ? parts.join("/") + "/" : "";
    } else {
      // Get the directory path
      const parts = key.split("/");
      parts.pop(); // Remove the filename
      return parts.length > 0 ? parts.join("/") + "/" : "";
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
        await loadBucketContents(selectedBucket);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
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
                  className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
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
            <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
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
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={
                    selectedBucket
                      ? () => loadBucketContents(selectedBucket)
                      : loadBuckets
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : selectedBucket ? (
            /* Bucket Contents */
            <div className="h-full overflow-auto">
              {bucketContents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>This bucket is empty</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                            Last Modified
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Storage Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bucketContents.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {isFolder(item.Key || "") ? (
                                  <FolderIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                ) : (
                                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
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
            </div>
          ) : (
            /* Bucket List */
            <div className="h-full overflow-auto">
              {buckets.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No S3 buckets found for this project</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid gap-4">
                    {buckets.map((bucket, index) => (
                      <div
                        key={index}
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
            </div>
          )}
        </div>
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
            loadBucketContents(selectedBucket);
          }}
        />
      )}
    </div>
  );
}
