"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { APIGatewayConfig } from "@/types";

interface APIGatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: APIGatewayConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function APIGatewayConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: APIGatewayConfigModalProps) {
  const [apiName, setApiName] = useState(`${projectName}-api`);
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
      setApiName(`${projectName}-api`);
      setDescription("");
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ apiName, description });
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Icon icon="logos:aws-api-gateway" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create REST API</h2>
              <p className="text-xs text-gray-500">Create a new API Gateway REST API in LocalStack</p>
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

          {/* API Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Name
            </label>
            <input
              type="text"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
              placeholder="my-rest-api"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              A unique name for the REST API
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
              placeholder="API for my application"
            />
          </div>

          {/* Info */}
          <div className="rounded-md bg-pink-50 border border-pink-200 p-3 text-xs text-pink-800">
            Creates a REST API stub. Add resources and methods via the AWS CLI or SDK at{" "}
            <code className="font-mono">http://localhost:4566</code>.
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
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50"
              disabled={loading || !apiName.trim()}
            >
              {loading ? "Creating..." : "Create API"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
