"use client";

import { useState } from "react";
import { Resource } from "@/types";
import {
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ResourceListProps {
  resources: Resource[];
  onDestroy: (resourceIds: string[]) => void;
  projectName: string;
  environment: string;
  loading?: boolean;
}

export default function ResourceList({
  resources,
  onDestroy,
  projectName,
  environment,
  loading = false,
}: ResourceListProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "creating":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "deleting":
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "creating":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "deleting":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "s3":
        return "🪣";
      case "dynamodb":
        return "🗄️";
      case "lambda":
        return "⚡";
      case "apigateway":
        return "🌐";
      case "iam":
        return "🔐";
      default:
        return "📦";
    }
  };

  const handleSelectAll = () => {
    if (selectedResources.length === resources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(resources.map((r) => r.id));
    }
  };

  const handleSelectResource = (resourceId: string) => {
    setSelectedResources((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleDestroySelected = () => {
    if (selectedResources.length > 0) {
      onDestroy(selectedResources);
      setSelectedResources([]);
    }
  };

  const filteredResources = resources.filter(
    (resource) =>
      resource.project === projectName && resource.environment === environment
  );

  if (filteredResources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Resources Found
        </h3>
        <p className="text-gray-500">
          No resources found for project "{projectName}" in {environment}{" "}
          environment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Resources ({filteredResources.length})
          </h3>
          {selectedResources.length > 0 && (
            <button
              onClick={handleDestroySelected}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              {loading
                ? "Destroying..."
                : `Destroy Selected (${selectedResources.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Resource List */}
      <div className="divide-y divide-gray-200">
        {filteredResources.map((resource) => (
          <div key={resource.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedResources.includes(resource.id)}
                  onChange={() => handleSelectResource(resource.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-2xl">
                  {getResourceIcon(resource.type)}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {resource.name}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {resource.type} • {resource.project}-{resource.environment}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                    resource.status
                  )}`}
                >
                  {getStatusIcon(resource.status)}
                  <span className="ml-1 capitalize">{resource.status}</span>
                </span>

                <button
                  onClick={() =>
                    setShowDetails(
                      showDetails === resource.id ? null : resource.id
                    )
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Resource Details */}
            {showDetails === resource.id && (
              <div className="mt-4 pl-8 border-l-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Resource ID</dt>
                    <dd className="text-gray-900 font-mono">{resource.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Created</dt>
                    <dd className="text-gray-900">
                      {new Date(resource.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  {resource.details &&
                    Object.entries(resource.details).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-medium text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </dt>
                        <dd className="text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Select All */}
      {filteredResources.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedResources.length === filteredResources.length}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Select all ({filteredResources.length} resources)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
