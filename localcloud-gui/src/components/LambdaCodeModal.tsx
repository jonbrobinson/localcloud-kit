"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import ThemeableCodeBlock from "./ThemeableCodeBlock";

interface LambdaCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  functionName: string;
}

interface CodeFile {
  name: string;
  content: string;
}

export default function LambdaCodeModal({
  isOpen,
  onClose,
  functionName,
}: LambdaCodeModalProps) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isOpen && functionName) {
      setError(null);
      setLoading(true);
      setFiles([]);
      setSelectedFile(null);
      fetch(`/api/lambda/functions/${encodeURIComponent(functionName)}/code`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.files) {
            setFiles(data.data.files);
            if (data.data.files.length > 0) {
              setSelectedFile(data.data.files[0].name);
            }
          } else {
            setError(data.error || "Failed to load code");
          }
        })
        .catch((e) => setError(e.message || "Failed to load code"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, functionName]);

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.name === selectedFile);
  const isText = (name: string) =>
    /\.(py|js|ts|json|txt|html|css|xml|yaml|yml|md|sh|bash)$/i.test(name) ||
    !/\./.test(name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Icon icon="logos:aws-lambda" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lambda Code</h2>
              <p className="text-xs text-gray-500 font-mono">{functionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading code...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No files in deployment package</div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 shrink-0">
              {files.map((f, idx) => (
                <button
                  key={`${f.name}-${idx}`}
                  onClick={() => setSelectedFile(f.name)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 truncate ${
                    selectedFile === f.name ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100"
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
                  {isText(currentFile.name) ? (
                    <div className="text-sm">
                      <ThemeableCodeBlock
                        code={currentFile.content}
                        language={currentFile.name.match(/\.py$/) ? "python" : currentFile.name.match(/\.js$/) ? "javascript" : "text"}
                        showThemeSelector={false}
                      />
                    </div>
                  ) : (
                    <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded overflow-x-auto">
                      (binary or non-text file)
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
