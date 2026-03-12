"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { SSMParameterConfig } from "@/types";

interface SSMEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SSMParameterConfig) => Promise<void>;
  parameterName: string;
  loading?: boolean;
}

export default function SSMEditModal({
  isOpen,
  onClose,
  onSave,
  parameterName,
  loading = false,
}: SSMEditModalProps) {
  const [parameterValue, setParameterValue] = useState("");
  const [parameterType, setParameterType] = useState<"String" | "StringList" | "SecureString">("String");
  const [description, setDescription] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

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
    if (isOpen && parameterName) {
      setFetchError(null);
      setFetching(true);
      const path = `/api/ssm/parameters/${parameterName.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
      fetch(`${path}?withDecryption=true`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.Parameter) {
            const p = data.data.Parameter;
            setParameterValue(p.Value || "");
            setParameterType((p.Type || "String") as "String" | "StringList" | "SecureString");
            setDescription(p.Description || "");
          } else {
            setFetchError(data.error || "Failed to load parameter");
          }
        })
        .catch((e) => setFetchError(e.message || "Failed to load parameter"))
        .finally(() => setFetching(false));
    }
  }, [isOpen, parameterName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ parameterName, parameterValue, parameterType, description });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Icon icon="logos:aws-systems-manager" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Parameter</h2>
              <p className="text-xs text-gray-500 font-mono truncate max-w-xs">{parameterName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/manage/ssm"
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

        {fetching ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : fetchError ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{fetchError}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Parameter Name</label>
              <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{parameterName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <textarea
                value={parameterValue}
                onChange={(e) => setParameterValue(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-mono text-sm resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-3">
                {(["String", "StringList", "SecureString"] as const).map((t) => (
                  <label key={t} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paramType"
                      value={t}
                      checked={parameterType === t}
                      onChange={() => setParameterType(t)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50"
                disabled={loading || !parameterValue.trim()}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
