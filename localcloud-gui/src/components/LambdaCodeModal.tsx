"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  XMarkIcon,
  DocumentIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Icon } from "@iconify/react";
import ThemeableCodeBlock from "./ThemeableCodeBlock";
import { parseLambdaZipFile, type LambdaPreviewFile } from "@/lib/lambdaZipPreview";

interface LambdaCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  functionName: string;
}

function highlightLanguageForFile(name: string): string {
  if (/\.py$/i.test(name)) return "python";
  if (/\.(js|cjs|mjs)$/i.test(name)) return "javascript";
  if (/\.tsx?$/i.test(name)) return "typescript";
  if (/\.json$/i.test(name)) return "javascript";
  return "text";
}

export default function LambdaCodeModal({
  isOpen,
  onClose,
  functionName,
}: LambdaCodeModalProps) {
  const [files, setFiles] = useState<LambdaPreviewFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFromEmulator = useCallback(async () => {
    if (!functionName) return;
    setLoading(true);
    setError(null);
    setUnavailableReason(null);
    setZipError(null);
    setLocalPreview(false);
    setFiles([]);
    setSelectedFile(null);
    try {
      const r = await fetch(`/api/lambda/functions/${encodeURIComponent(functionName)}/code`);
      const data = await r.json();
      if (data.success && data.data) {
        const list = Array.isArray(data.data.files) ? data.data.files : [];
        setFiles(list);
        if (typeof data.data.unavailableReason === "string" && data.data.unavailableReason) {
          setUnavailableReason(data.data.unavailableReason);
        }
        if (list.length > 0) {
          setSelectedFile(list[0].name);
        }
      } else {
        const detail =
          typeof data.message === "string" && data.message
            ? `${data.error || "Failed to load code"}: ${data.message}`
            : data.error || "Failed to load code";
        setError(detail);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load code");
    } finally {
      setLoading(false);
    }
  }, [functionName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && functionName) {
      void loadFromEmulator();
    }
  }, [isOpen, functionName, loadFromEmulator]);

  const onPickZip = () => {
    setZipError(null);
    fileInputRef.current?.click();
  };

  const onZipSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setZipError(null);
    const { files: parsed, error: parseErr } = await parseLambdaZipFile(file);
    if (parseErr) {
      setZipError(parseErr);
      return;
    }
    setLocalPreview(true);
    setUnavailableReason(null);
    setError(null);
    setFiles(parsed);
    setSelectedFile(parsed[0]?.name ?? null);
  };

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.name === selectedFile);
  const isText = (name: string) =>
    /\.(py|js|ts|json|txt|html|css|xml|yaml|yml|md|sh|bash|cjs|mjs|tsx)$/i.test(name) ||
    !/\./.test(name);

  const pickZipButton = (className?: string) => (
    <button
      type="button"
      onClick={onPickZip}
      disabled={loading}
      className={
        className ??
        "flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none"
      }
    >
      <ArrowUpTrayIcon className="h-3.5 w-3.5" />
      <span>Upload zip</span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(ev) => ev.stopPropagation()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="sr-only"
          aria-label="Choose zip to preview"
          onChange={onZipSelected}
        />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-amber-50 rounded-lg shrink-0">
              <Icon icon="logos:aws-lambda" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Lambda Code</h2>
              <p className="text-xs text-gray-500 font-mono truncate">{functionName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {pickZipButton()}
            {localPreview && (
              <button
                type="button"
                onClick={() => void loadFromEmulator()}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                title="Fetch deployment package from the emulator again"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">From emulator</span>
              </button>
            )}
            <Link
              href="/manage/lambda"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <span>Open Manager</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {localPreview && files.length > 0 && (
          <div className="px-6 py-2 text-xs text-amber-900 bg-amber-50 border-b border-amber-100 shrink-0">
            Showing files from your uploaded zip only — this does not deploy or change the function.
          </div>
        )}

        {zipError && (
          <div className="px-6 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100 shrink-0">
            {zipError}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading code...</div>
        ) : error ? (
          <div className="p-6 text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600">You can still preview a deployment package from your machine.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pickZipButton(
                "inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center space-y-4 text-gray-600 text-sm">
            {unavailableReason ? (
              <>
                <p className="font-medium text-gray-900">Code preview unavailable</p>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your local emulator doesn&apos;t expose the same &quot;download package&quot; URL as AWS, so we
                  can&apos;t open the zip from the dashboard.
                </p>
                <p className="text-gray-600 max-w-md mx-auto">
                  Upload a <span className="font-mono text-xs">.zip</span> here to browse the same layout as the
                  Code view.
                </p>
              </>
            ) : (
              <p>No files in deployment package</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {pickZipButton(
                "inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50"
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 shrink-0">
              {files.map((f, idx) => (
                <button
                  key={`${f.name}-${idx}`}
                  onClick={() => setSelectedFile(f.name)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 truncate ${
                    selectedFile === f.name
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <DocumentIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {currentFile && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-mono">{currentFile.name}</p>
                  {isText(currentFile.name) && currentFile.content.length > 0 ? (
                    <div className="text-sm">
                      <ThemeableCodeBlock
                        code={currentFile.content}
                        language={highlightLanguageForFile(currentFile.name)}
                        showThemeSelector={false}
                      />
                    </div>
                  ) : (
                    <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-x-auto">
                      {currentFile.content.length > 0
                        ? currentFile.content
                        : "(binary or non-text file)"}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
