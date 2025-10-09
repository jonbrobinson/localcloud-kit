"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import hljs from "highlight.js";
import { highlightThemes, HighlightTheme } from "./highlightThemes";
import { marked } from "marked";
import Papa from "papaparse";

// Helper function to encode Unicode strings to base64
function encodeUnicodeToBase64(str: string): string {
  try {
    // First try the standard btoa for ASCII content
    return btoa(str);
  } catch (error) {
    // If btoa fails due to Unicode characters, use a more robust approach
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binaryString = Array.from(bytes, (byte) =>
      String.fromCharCode(byte)
    ).join("");
    return btoa(binaryString);
  }
}
// Register highlight.js languages
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  bucketName: string;
  objectKey: string;
  objectSize?: number;
  theme?: HighlightTheme;
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

function getViewerType(
  contentType: string | undefined,
  objectKey: string
):
  | "image"
  | "pdf"
  | "markdown"
  | "csv"
  | "json"
  | "code"
  | "plain"
  | "binary"
  | "document" {
  if (!contentType && !objectKey) return "code";
  const ext = objectKey.split(".").pop()?.toLowerCase() || "";
  if (
    contentType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)
  )
    return "image";
  if (contentType === "application/pdf" || ext === "pdf") return "pdf";
  if (contentType?.includes("markdown") || ext === "md") return "markdown";
  if (contentType?.includes("csv") || ext === "csv") return "csv";
  if (contentType?.includes("json") || ext === "json") return "json";
  if (ext === "txt" || contentType === "text/plain") return "plain";
  if (
    ext === "doc" ||
    ext === "docx" ||
    contentType?.includes("word") ||
    contentType?.includes("document")
  )
    return "document";
  if (
    [
      "yml",
      "yaml",
      "xml",
      "js",
      "ts",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "go",
      "rb",
      "php",
      "sh",
      "sql",
    ].includes(ext) ||
    contentType?.startsWith("text/") ||
    contentType?.includes("xml") ||
    contentType?.includes("yaml")
  )
    return "code";
  return "binary";
}

// Custom Tooltip Component
function Tooltip({
  children,
  content,
  className = "",
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className={className}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg left-0 bottom-full mb-2 max-w-xs w-max"
          style={{ maxWidth: "300px", wordBreak: "break-all" }}
        >
          <div className="break-all whitespace-normal">{content}</div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}

export default function FileViewerModal({
  isOpen,
  onClose,
  projectName,
  bucketName,
  objectKey,
  objectSize,
  theme = "github",
}: FileViewerModalProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<HighlightTheme>(theme);

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

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  // Only show theme selector for these types
  const themeableTypes = ["code", "json", "markdown"];
  const showThemeSelector = themeableTypes.includes(
    getViewerType(fileContent?.metadata.ContentType, objectKey)
  );

  // Dynamically inject highlight.js theme CSS
  useEffect(() => {
    if (!isOpen || !showThemeSelector) return;
    const themeFile =
      highlightThemes[selectedTheme] || highlightThemes["github"];
    const id = "hljs-theme";
    // Remove any existing theme link
    document.querySelectorAll(`link#${id}`).forEach((el) => el.remove());
    // Add the new theme link
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/hljs-themes/${themeFile}`;
    link.id = id;
    document.head.appendChild(link);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [selectedTheme, isOpen, showThemeSelector]);

  const handleDownload = () => {
    if (!fileContent) return;

    // Check if content is base64 encoded (for binary files)
    const isBase64 =
      /^[A-Za-z0-9+/]*={0,2}$/.test(fileContent.content) &&
      fileContent.content.length > 0;

    let blob;
    if (isBase64) {
      // Convert base64 to binary for download
      const binaryString = atob(fileContent.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], {
        type: fileContent.metadata.ContentType || "application/octet-stream",
      });
    } else {
      // For text files, use content as-is
      blob = new Blob([fileContent.content], {
        type: fileContent.metadata.ContentType || "application/octet-stream",
      });
    }

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
    // Check file extension as fallback
    const ext = objectKey.split(".").pop()?.toLowerCase() || "";
    if (
      ext === "js" ||
      contentType?.includes("javascript") ||
      contentType?.includes("js")
    )
      return "javascript";
    if (ext === "ts" || ext === "tsx" || contentType?.includes("typescript"))
      return "typescript";
    if (
      ext === "py" ||
      contentType?.includes("python") ||
      contentType?.includes("py")
    )
      return "python";
    if (ext === "java" || contentType?.includes("java")) return "java";
    if (ext === "json" || contentType?.includes("json")) return "json";
    if (ext === "xml" || contentType?.includes("xml")) return "xml";
    if (ext === "html" || contentType?.includes("html")) return "html";
    if (ext === "css" || contentType?.includes("css")) return "css";
    if (ext === "sql" || contentType?.includes("sql")) return "sql";
    if (
      ext === "yaml" ||
      ext === "yml" ||
      contentType?.includes("yaml") ||
      contentType?.includes("yml")
    )
      return "yaml";
    if (
      ext === "md" ||
      contentType?.includes("markdown") ||
      contentType?.includes("md")
    )
      return "markdown";
    if (ext === "txt" || contentType?.includes("text/plain")) return "text";
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

  const viewerType = getViewerType(
    fileContent?.metadata.ContentType,
    objectKey
  );

  let jsonParseError: string | null = null;
  let prettyJson = "";
  if (viewerType === "json" && fileContent) {
    let jsonString = fileContent.content.trim();
    try {
      prettyJson = JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch (e: any) {
      jsonParseError = e.message || "Invalid JSON format.";
      prettyJson = jsonString;
    }
  }

  // Helper to determine if a theme is dark
  const isDarkTheme = selectedTheme.includes("dark");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <Tooltip content={objectKey} className="cursor-help">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {objectKey.split("/").pop() || objectKey}
                </h2>
              </Tooltip>
            </div>
            {objectKey.includes("/") && (
              <div className="mb-2">
                <Tooltip
                  content={`Full path: ${objectKey}`}
                  className="cursor-help"
                >
                  <div className="text-sm text-gray-600">
                    <div className="truncate">
                      Path:{" "}
                      {objectKey.length > 75
                        ? `${objectKey.substring(0, 75)}...`
                        : objectKey}
                    </div>
                  </div>
                </Tooltip>
              </div>
            )}
            <div className="mt-1 text-sm text-gray-500">
              <div>Bucket: {bucketName}</div>
              {fileContent?.metadata.ContentLength && (
                <div>
                  Size: {formatFileSize(fileContent.metadata.ContentLength)}
                </div>
              )}
              {fileContent?.metadata.LastModified && (
                <div>
                  Modified: {formatDate(fileContent.metadata.LastModified)}
                </div>
              )}
              {fileContent?.metadata.ContentType && (
                <div>Type: {fileContent.metadata.ContentType}</div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Theme Selector (only for code/json/markdown) */}
            {showThemeSelector && (
              <>
                <label
                  className="text-xs font-semibold text-gray-700 mr-2"
                  htmlFor="hljs-theme-select-modal"
                >
                  Theme:
                </label>
                <select
                  id="hljs-theme-select-modal"
                  className="border-2 border-gray-500 bg-white text-gray-900 font-semibold rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTheme}
                  onChange={(e) =>
                    setSelectedTheme(e.target.value as HighlightTheme)
                  }
                  style={{ minWidth: 140 }}
                >
                  {Object.keys(highlightThemes).map((key) => (
                    <option key={key} value={key}>
                      {key
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </>
            )}
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
                {viewerType === "plain" && (
                  <pre
                    className="bg-gray-100 text-gray-900 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono shadow"
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    }}
                  >
                    {fileContent.content}
                  </pre>
                )}
                {(viewerType === "code" ||
                  viewerType === "json" ||
                  viewerType === "markdown") && (
                  <div
                    className={
                      isDarkTheme
                        ? "bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono shadow"
                        : "bg-gray-100 text-gray-900 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono shadow"
                    }
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    }}
                  >
                    {viewerType === "json" ? (
                      <>
                        {jsonParseError && (
                          <div className="mb-2 text-red-600 text-sm font-semibold">
                            JSON Parse Error: {jsonParseError}
                          </div>
                        )}
                        <pre className="bg-transparent p-0 m-0 border-0 shadow-none">
                          <code
                            dangerouslySetInnerHTML={{
                              __html: highlightCode(prettyJson, "json"),
                            }}
                            className="hljs"
                            style={{ background: "transparent", padding: 0 }}
                          />
                        </pre>
                      </>
                    ) : (
                      <pre className="bg-transparent p-0 m-0 border-0 shadow-none">
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
                          style={{ background: "transparent", padding: 0 }}
                        />
                      </pre>
                    )}
                  </div>
                )}
                {viewerType === "image" && (
                  <img
                    src={`data:${fileContent.metadata.ContentType};base64,${fileContent.content}`}
                    alt={objectKey}
                    className="max-w-full max-h-[60vh] mx-auto rounded shadow"
                  />
                )}
                {viewerType === "pdf" && (
                  <iframe
                    src={`data:application/pdf;base64,${fileContent.content}`}
                    title={objectKey}
                    className="w-full h-[60vh] border rounded"
                  />
                )}
                {viewerType === "markdown" && (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(fileContent.content),
                    }}
                  />
                )}
                {viewerType === "csv" && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-400">
                      <tbody>
                        {Papa.parse(fileContent.content.trim()).data.map(
                          (row: any, i: number) => (
                            <tr key={i}>
                              {row.map((cell: any, j: number) => (
                                <td
                                  key={j}
                                  className="border border-gray-400 px-2 py-1 whitespace-nowrap text-gray-800 font-medium"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {viewerType === "document" && (
                  <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
                    <div className="prose max-w-none">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {objectKey
                          .split("/")
                          .pop()
                          ?.replace(/\.(doc|docx)$/i, "") || "Document"}
                      </h1>
                      <div
                        className="text-gray-800 leading-relaxed"
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          lineHeight: "1.6",
                          fontSize: "16px",
                        }}
                      >
                        {fileContent.content.split("\n").map((line, index) => {
                          if (line.trim() === "") {
                            return <br key={index} />;
                          }
                          if (line.match(/^\d+\./)) {
                            return (
                              <p key={index} className="mb-2 ml-4">
                                {line}
                              </p>
                            );
                          }
                          if (line.match(/^[A-Z][^:]*:$/)) {
                            return (
                              <h3
                                key={index}
                                className="text-lg font-semibold text-gray-900 mt-4 mb-2"
                              >
                                {line}
                              </h3>
                            );
                          }
                          if (line.startsWith("- ")) {
                            return (
                              <p key={index} className="mb-1 ml-4">
                                • {line.substring(2)}
                              </p>
                            );
                          }
                          return (
                            <p key={index} className="mb-2">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {viewerType === "binary" && (
                  <div className="text-center text-gray-500">
                    <p>
                      This file type cannot be previewed. Please download to
                      view.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                )}
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
