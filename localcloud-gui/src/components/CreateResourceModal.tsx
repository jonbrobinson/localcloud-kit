"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProjectConfig, CreateResourceRequest } from "@/types";

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateResourceRequest) => void;
  config: ProjectConfig;
  loading?: boolean;
}

const defaultResources = {
  s3: true,
  dynamodb: true,
  lambda: false,
  apigateway: false,
  secretsmanager: false,
};

export default function CreateResourceModal({
  isOpen,
  onClose,
  onSubmit,
  config,
  loading = false,
}: CreateResourceModalProps) {
  const [projectName, setProjectName] = useState(config.projectName);
  const [resources, setResources] = useState({ ...defaultResources });

  if (!isOpen) return null;

  const handleResourceToggle = (resourceType: keyof typeof resources) => {
    setResources((prev) => ({ ...prev, [resourceType]: !prev[resourceType] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const request: CreateResourceRequest = {
      projectName,
      resources,
    };
    onSubmit(request);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Resources
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Fill out the form to create AWS resources in LocalStack.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resources to Create
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(resources).map(([resource, enabled]) => (
                <label
                  key={resource}
                  className="flex items-center space-x-2 text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() =>
                      handleResourceToggle(resource as keyof typeof resources)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>
                    {resource === "s3"
                      ? "S3 Bucket"
                      : resource === "dynamodb"
                      ? "DynamoDB Table"
                      : resource === "lambda"
                      ? "Lambda Function"
                      : resource === "apigateway"
                      ? "API Gateway"
                      : resource === "secretsmanager"
                      ? "Secrets Manager"
                      : resource}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Resources"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
