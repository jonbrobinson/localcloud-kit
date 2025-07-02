"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  FolderIcon,
  DocumentIcon,
  ArrowLeftIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { s3Api } from "@/services/api";
import FileViewerModal from "./FileViewerModal";
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
  const [selectedFile, setSelectedFile] = useState<{
    bucketName: string;
    objectKey: string;
  } | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<HighlightTheme>("github");

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
    async (bucketName: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await s3Api.getBucketContents(projectName, bucketName);
        if (response.success) {
          setBucketContents(response.data || []);
          setSelectedBucket(bucketName);
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
    return key.endsWith("/");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {selectedBucket && (
              <button
                onClick={() => {
                  setSelectedBucket(null);
                  setBucketContents([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedBucket ? `Bucket: ${selectedBucket}` : "S3 Buckets"}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Modified
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Storage Class
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bucketContents.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {isFolder(item.Key || "") ? (
                                  <FolderIcon className="h-5 w-5 text-blue-500 mr-2" />
                                ) : (
                                  <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                <span className="text-sm text-gray-900">
                                  {item.Key}
                                </span>
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
    </div>
  );
}
