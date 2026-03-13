"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  FolderIcon,
  DocumentIcon,
  ArrowPathIcon,
  BookOpenIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ChevronRightIcon,
  ArrowLeftIcon as BackIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { s3Api, resourceApi } from "@/services/api";
import { S3BucketConfig } from "@/types";
import S3ConfigModal from "@/components/S3ConfigModal";
import FileViewerModal from "@/components/FileViewerModal";
import UploadFileModal from "@/components/UploadFileModal";

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

const projectName = "default";

export default function ManageS3Page() {
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [contents, setContents] = useState<BucketItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fileViewer, setFileViewer] = useState<{ bucketName: string; objectKey: string } | null>(null);

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
  }, []);

  useEffect(() => { loadBuckets(); }, [loadBuckets]);

  const loadContents = useCallback(async (bucket: string, path = "") => {
    setLoadingContents(true);
    try {
      const res = await s3Api.getBucketContents(projectName, bucket);
      if (res.success) {
        let items = res.data || [];
        if (path) {
          items = items.filter((item: BucketItem) => {
            const key = item.Key || "";
            if (!key.startsWith(path)) return false;
            const rel = key.slice(path.length);
            return !rel.includes("/") || rel.endsWith("/");
          });
        } else {
          items = items.filter((item: BucketItem) => {
            const key = item.Key || "";
            return !key.includes("/") || key.endsWith("/");
          });
        }
        setContents(items);
        setCurrentPath(path);
      } else {
        toast.error("Failed to load contents");
      }
    } catch {
      toast.error("Failed to load contents");
    } finally {
      setLoadingContents(false);
    }
  }, []);

  const selectBucket = (name: string) => {
    setSelectedBucket(name);
    setCurrentPath("");
    setPathHistory([]);
    loadContents(name, "");
  };

  const openFolder = (key: string) => {
    if (!selectedBucket) return;
    const newPath = key;
    setPathHistory((h) => [...h, currentPath]);
    loadContents(selectedBucket, newPath);
  };

  const goBack = () => {
    if (!selectedBucket) return;
    const prev = pathHistory[pathHistory.length - 1] ?? "";
    setPathHistory((h) => h.slice(0, -1));
    loadContents(selectedBucket, prev);
  };

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
        loadContents(selectedBucket, currentPath);
      } else {
        toast.error(res.error || "Failed to delete object");
      }
    } catch {
      toast.error("Failed to delete object");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={36} height={36} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">S3 service for managing buckets and objects</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/s3" className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button onClick={loadBuckets} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
                <ArrowPathIcon className={`h-4 w-4 ${loadingBuckets ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Bucket</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body — two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: bucket list */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buckets ({buckets.length})</p>
          </div>
          {loadingBuckets ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : buckets.length === 0 ? (
            <div className="p-6 text-center">
              <FolderIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No buckets</p>
            </div>
          ) : (
            <ul className="py-1">
              {buckets.map((b) => (
                <li key={b.Name}>
                  <button
                    onClick={() => selectBucket(b.Name!)}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-sm text-left transition-colors ${
                      selectedBucket === b.Name
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FolderIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{b.Name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main content: object browser */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedBucket ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <FolderIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">Select a bucket to browse its contents</p>
            </div>
          ) : (
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {pathHistory.length > 0 && (
                    <button onClick={goBack} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                      <BackIcon className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex items-center text-sm text-gray-600 space-x-1">
                    <span className="font-medium text-gray-900">{selectedBucket}</span>
                    {currentPath && (
                      <>
                        <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500 font-mono text-xs">{currentPath}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadContents(selectedBucket, currentPath)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Refresh"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${loadingContents ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Object table */}
              {loadingContents ? (
                <div className="space-y-2">
                  {[0,1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : contents.length === 0 ? (
                <div className="text-center py-16">
                  <DocumentIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Bucket is empty</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Size</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-500">Last Modified</th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {contents.map((item, i) => {
                        const key = item.Key || item.Name || "";
                        const displayName = currentPath ? key.slice(currentPath.length) : key;
                        const folder = isFolder(key);
                        return (
                          <tr key={`${key}-${i}`} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center space-x-2">
                                {folder ? (
                                  <FolderIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <DocumentIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                {folder ? (
                                  <button
                                    onClick={() => openFolder(key)}
                                    className="text-indigo-600 hover:text-indigo-800 font-mono text-xs hover:underline"
                                  >
                                    {displayName}
                                  </button>
                                ) : (
                                  <span className="font-mono text-xs text-gray-700">{displayName}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{folder ? "—" : formatSize(item.Size)}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(item.LastModified)}</td>
                            <td className="px-4 py-2.5 text-right">
                              {!folder && (
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => setFileViewer({ bucketName: selectedBucket, objectKey: key })}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="View file"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteObject(key)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete file"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

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
