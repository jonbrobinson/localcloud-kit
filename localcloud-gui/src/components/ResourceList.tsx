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
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

interface ResourceListProps {
  resources: Resource[];
  onDestroy: (resourceIds: string[]) => void;
  projectName: string;
  loading?: boolean;
  onViewS3?: (bucketName: string) => void;
  onViewDynamoDB?: (tableName: string) => void;
  onViewCache?: () => void;
  onViewSecretsManager?: () => void;
}

export default function ResourceList({
  resources,
  onDestroy,
  projectName,
  loading = false,
  onViewS3,
  onViewDynamoDB,
  onViewCache,
  onViewSecretsManager,
}: ResourceListProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

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
      case "cache":
        return "🧊";
      case "secretsmanager":
        return "🔑";
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

  const copyArnToClipboard = async (arn: string) => {
    try {
      await navigator.clipboard.writeText(arn);
      setCopiedArn(arn);
      setTimeout(() => setCopiedArn(null), 2000);
    } catch (error) {
      console.error("Failed to copy ARN:", error);
    }
  };

  const handleDestroySelected = () => {
    if (selectedResources.length > 0) {
      onDestroy(selectedResources);
      setSelectedResources([]);
    }
  };

  const filteredResources = resources.filter(
    (resource) => resource.project === projectName
  );

  if (filteredResources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Resources Found
        </h3>
        <p className="text-gray-500">
          No resources found for project &quot;{projectName}&quot;.
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
                    {resource.type} • {resource.project}
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

                {/* View Button for S3, DynamoDB, and Cache */}
                {resource.status === "active" && (
                  <>
                    {resource.type === "s3" && onViewS3 && (
                      <button
                        onClick={() => onViewS3(resource.name)}
                        className="flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        title="View S3 Bucket Contents"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    )}
                    {resource.type === "dynamodb" && onViewDynamoDB && (
                      <button
                        onClick={() => onViewDynamoDB(resource.name)}
                        className="flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                        title="View DynamoDB Table Contents"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </button>
                    )}
                    {resource.type === "cache" && onViewCache && (
                      <button
                        onClick={onViewCache}
                        className="flex items-center px-2 py-1 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-md hover:bg-cyan-100 transition-colors"
                        title="Open Cache Management"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Manage
                      </button>
                    )}
                    {resource.type === "secretsmanager" &&
                      onViewSecretsManager && (
                        <button
                          onClick={onViewSecretsManager}
                          className="flex items-center px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                          title="Open Secrets Manager"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Manage
                        </button>
                      )}
                  </>
                )}

                <button
                  onClick={() =>
                    setShowDetails(
                      showDetails === resource.id ? null : resource.id
                    )
                  }
                  className="text-gray-400 hover:text-gray-600"
                  title="Show Details"
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
                  
                  {/* Special handling for secrets manager */}
                  {resource.type === "secretsmanager" && resource.details?.secrets && (
                    <>
                      <div className="md:col-span-2">
                        <dt className="font-medium text-gray-500 mb-2">Secrets</dt>
                        <div className="space-y-3">
                          {resource.details.secrets.map((secret: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {secret.Name}
                                    </h4>
                                    {secret.Tags && secret.Tags.length > 0 && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {secret.Tags.length} tags
                                      </span>
                                    )}
                                  </div>
                                  
                                  {secret.Description && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      {secret.Description}
                                    </p>
                                  )}
                                  
                                  <div className="space-y-1">
                                    <div>
                                      <span className="text-xs font-medium text-gray-500">ARN:</span>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <code className="text-xs bg-white px-2 py-1 rounded border text-gray-900 break-all flex-1 min-w-0">
                                          {secret.ARN}
                                        </code>
                                        <button
                                          onClick={() => copyArnToClipboard(secret.ARN)}
                                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                          title="Copy ARN"
                                        >
                                          <ClipboardDocumentIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                      {copiedArn === secret.ARN && (
                                        <p className="text-xs text-green-600 mt-1">✓ Copied to clipboard</p>
                                      )}
                                    </div>
                                    
                                    <div className="text-xs text-gray-500">
                                      <div>Created: {new Date(secret.CreatedDate).toLocaleString()}</div>
                                      <div>Last changed: {new Date(secret.LastChangedDate).toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Regular details for other resource types */}
                  {resource.type !== "secretsmanager" && resource.details &&
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
