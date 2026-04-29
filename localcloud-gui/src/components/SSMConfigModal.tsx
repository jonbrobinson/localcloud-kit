"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { SSMParameterConfig } from "@/types";

interface SSMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: SSMParameterConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function SSMConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: SSMConfigModalProps) {
  const [parameterName, setParameterName] = useState(`/${projectName}/config`);
  const [parameterValue, setParameterValue] = useState("");
  const [parameterType, setParameterType] = useState<"String" | "StringList" | "SecureString">("String");
  const [description, setDescription] = useState("");

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
    if (isOpen) {
      setParameterName(`/${projectName}/config`);
      setParameterValue("");
      setParameterType("String");
      setDescription("");
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ parameterName, parameterValue, parameterType, description });
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Icon icon="logos:aws-systems-manager" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Parameter</h2>
              <p className="text-xs text-gray-500">Add a new SSM Parameter Store entry</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Parameter Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter Name
            </label>
            <input
              type="text"
              value={parameterName}
              onChange={(e) => setParameterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="/my-app/database/host"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">/</code> as a hierarchy separator
              (e.g. <code className="bg-gray-100 px-1 rounded">/my-app/db/host</code>)
            </p>
          </div>

          {/* Parameter Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <textarea
              value={parameterValue}
              onChange={(e) => setParameterValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-mono text-sm resize-none"
              placeholder="my-parameter-value"
              required
            />
          </div>

          {/* Parameter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
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
            {parameterType === "SecureString" && (
              <p className="text-xs text-teal-700 mt-1 bg-teal-50 px-2 py-1 rounded">
                The AWS Emulator encrypts SecureString parameters using a local KMS key.
              </p>
            )}
            {parameterType === "StringList" && (
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list of values, e.g. <code className="bg-gray-100 px-1 rounded">value1,value2,value3</code>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              placeholder="Database hostname for my-app"
            />
          </div>

          {/* Actions */}
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
              disabled={loading || !parameterName.trim() || !parameterValue.trim()}
            >
              {loading ? "Creating..." : "Create Parameter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
