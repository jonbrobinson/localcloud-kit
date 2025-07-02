"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import hljs from "highlight.js";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  bucketName: string;
  objectKey: string;
  objectSize?: number;
}

interface FileContent {
  content: string;
  metadata: {
    ContentType?: string;
    ContentLength?: number;
    LastModified?: string;
    ETag?: string;
  };
}

export default function FileViewerModal({
  isOpen,
  onClose,
  projectName,
  bucketName,
  objectKey,
  objectSize,
}: FileViewerModalProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFileContent = async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/s3/bucket/${encodeURIComponent(
          bucketName
        )}/object/${encodeURIComponent(
          objectKey
        )}?projectName=${encodeURIComponent(projectName)}`
      );
      const data = await response.json();

      if (data.success) {
        setFileContent(data.data);
      } else {
        setError(data.error || "Failed to load file content");
      }
    } catch (err) {
      setError("Failed to load file content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFileContent();
    } else {
      setFileContent(null);
      setError(null);
    }
  }, [isOpen, projectName, bucketName, objectKey]);

  const handleDownload = () => {
    if (!fileContent) return;

    const blob = new Blob([fileContent.content], {
      type: fileContent.metadata.ContentType || "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = objectKey.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageFromContentType = (contentType?: string): string => {
    if (!contentType) return "text";

    if (contentType.includes("json")) return "json";
    if (contentType.includes("xml")) return "xml";
    if (contentType.includes("html")) return "html";
    if (contentType.includes("css")) return "css";
    if (contentType.includes("javascript") || contentType.includes("js"))
      return "javascript";
    if (contentType.includes("python") || contentType.includes("py"))
      return "python";
    if (contentType.includes("java")) return "java";
    if (contentType.includes("sql")) return "sql";
    if (contentType.includes("yaml") || contentType.includes("yml"))
      return "yaml";
    if (contentType.includes("markdown") || contentType.includes("md"))
      return "markdown";
    if (contentType.includes("text/plain")) return "text";

    return "text";
  };

  const highlightCode = (code: string, language: string) => {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {objectKey}
            </h2>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>Bucket: {bucketName}</span>
              {fileContent?.metadata.ContentLength && (
                <span>
                  Size: {formatFileSize(fileContent.metadata.ContentLength)}
                </span>
              )}
              {fileContent?.metadata.LastModified && (
                <span>
                  Modified: {formatDate(fileContent.metadata.LastModified)}
                </span>
              )}
              {fileContent?.metadata.ContentType && (
                <span>Type: {fileContent.metadata.ContentType}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {fileContent && (
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Download file"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
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
                  onClick={loadFileContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : fileContent ? (
            <div className="h-full overflow-auto">
              <div className="p-6">
                <pre
                  className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  }}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(
                        fileContent.content,
                        getLanguageFromContentType(
                          fileContent.metadata.ContentType
                        )
                      ),
                    }}
                    className="hljs"
                    style={{
                      background: "transparent",
                      padding: 0,
                      color: "#e5e7eb",
                    }}
                  />
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No content available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
