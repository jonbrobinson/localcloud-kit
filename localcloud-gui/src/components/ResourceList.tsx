"use client";

import { useState, useRef, useEffect } from "react";
import { Resource } from "@/types";
import {
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  PlusIcon,
  ChevronDownIcon,
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
  onViewMailpit?: () => void;
  onRefresh?: () => void;
  onAddS3?: () => void;
  onAddDynamoDB?: () => void;
  onAddSecrets?: () => void;
  refreshLoading?: boolean;
  addLoading?: boolean;
}

// Resource types that are services (not AWS resources) — not selectable/destroyable
const SERVICE_TYPES = ["cache", "mailpit"];

export default function ResourceList({
  resources,
  onDestroy,
  projectName,
  loading = false,
  onViewS3,
  onViewDynamoDB,
  onViewCache,
  onViewSecretsManager,
  onViewMailpit,
  onRefresh,
  onAddS3,
  onAddDynamoDB,
  onAddSecrets,
  refreshLoading = false,
  addLoading = false,
}: ResourceListProps) {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      case "mailpit":
        return "📬";
      default:
        return "📦";
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

  const selectableResources = filteredResources.filter(
    (r: Resource) => !SERVICE_TYPES.includes(r.type)
  );

  const handleSelectAll = () => {
    if (selectedResources.length === selectableResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(selectableResources.map((r) => r.id));
    }
  };

  const hasAddActions = onAddS3 || onAddDynamoDB || onAddSecrets;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Resources ({filteredResources.length})
          </h3>
          <div className="flex items-center space-x-2">
            {/* Destroy Selected — only when rows are checked */}
            {selectedResources.length > 0 && (
              <button
                onClick={handleDestroySelected}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                {loading ? "Destroying..." : `Destroy Selected (${selectedResources.length})`}
              </button>
            )}

            {/* Refresh icon */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshLoading}
                className="p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                title="Refresh resources"
              >
                <ArrowPathIcon className={`h-4 w-4 ${refreshLoading ? "animate-spin" : ""}`} />
              </button>
            )}

            {/* + Add dropdown */}
            {hasAddActions && (
              <div className="relative" ref={addMenuRef}>
                <button
                  onClick={() => setShowAddMenu((v) => !v)}
                  disabled={addLoading}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add
                  <ChevronDownIcon className={`h-3.5 w-3.5 ml-1.5 transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {onAddS3 && (
                      <button
                        onClick={() => { onAddS3(); setShowAddMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="mr-3">🪣</span>
                        S3 Bucket
                      </button>
                    )}
                    {onAddDynamoDB && (
                      <button
                        onClick={() => { onAddDynamoDB(); setShowAddMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="mr-3">🗄️</span>
                        DynamoDB Table
                      </button>
                    )}
                    {onAddSecrets && (
                      <button
                        onClick={() => { onAddSecrets(); setShowAddMenu(false); }}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="mr-3">🔑</span>
                        Secrets Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state — inside the card so the header stays visible */}
      {filteredResources.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-5xl mb-3">📦</div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">No Resources Found</h4>
          <p className="text-sm text-gray-500">
            No resources found for project &quot;{projectName}&quot;.
          </p>
        </div>
      ) : (
        <>
          {/* Column labels */}
          <div className="grid items-center gap-x-4 px-6 py-2 bg-gray-50 border-b border-gray-200"
            style={{ gridTemplateColumns: "1.25rem 2rem 1fr 9rem 6rem 1.75rem" }}>
            <div />
            <div />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resource</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Action</span>
            <div />
          </div>

          {/* Resource List */}
          <div className="divide-y divide-gray-200">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="px-6 py-3.5">
                <div
                  className="grid items-center gap-x-4"
                  style={{ gridTemplateColumns: "1.25rem 2rem 1fr 9rem 6rem 1.75rem" }}
                >
                  {/* Col 1: checkbox or spacer */}
                  {SERVICE_TYPES.includes(resource.type) ? (
                    <div />
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedResources.includes(resource.id)}
                      onChange={() => handleSelectResource(resource.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}

                  {/* Col 2: emoji icon */}
                  <span className="text-xl leading-none text-center">
                    {getResourceIcon(resource.type)}
                  </span>

                  {/* Col 3: name + subtitle */}
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {resource.name}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {resource.type === "mailpit"
                        ? "Mailpit Integration"
                        : `${resource.type} • ${resource.project}`}
                    </p>
                  </div>

                  {/* Col 4: status badge — fixed column keeps all badges aligned */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(resource.status)}`}
                    >
                      {getStatusIcon(resource.status)}
                      <span className="ml-1 capitalize">{resource.status}</span>
                    </span>
                  </div>

                  {/* Col 5: action button — always rendered so col 6 stays aligned */}
                  <div className="flex justify-center">
                    {resource.status === "active" && (
                      <>
                        {resource.type === "s3" && onViewS3 && (
                          <button
                            onClick={() => onViewS3(resource.name)}
                            className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                            title="View S3 Bucket Contents"
                          >
                            <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            View
                          </button>
                        )}
                        {resource.type === "dynamodb" && onViewDynamoDB && (
                          <button
                            onClick={() => onViewDynamoDB(resource.name)}
                            className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                            title="View DynamoDB Table Contents"
                          >
                            <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            View
                          </button>
                        )}
                        {resource.type === "cache" && onViewCache && (
                          <button
                            onClick={onViewCache}
                            className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-cyan-600 bg-cyan-50 rounded-md hover:bg-cyan-100 transition-colors"
                            title="Open Cache Management"
                          >
                            <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            Manage
                          </button>
                        )}
                        {resource.type === "mailpit" && onViewMailpit && (
                          <button
                            onClick={onViewMailpit}
                            className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                            title="Open Mailpit Integration"
                          >
                            <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            Manage
                          </button>
                        )}
                        {resource.type === "secretsmanager" && onViewSecretsManager && (
                          <button
                            onClick={onViewSecretsManager}
                            className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                            title="Open Secrets Manager"
                          >
                            <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                            Manage
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Col 6: details toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        setShowDetails(showDetails === resource.id ? null : resource.id)
                      }
                      className={`text-gray-400 hover:text-gray-600 transition-colors ${showDetails === resource.id ? "text-gray-600" : ""}`}
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

                      {resource.type === "mailpit" && resource.details && (
                        <>
                          <div>
                            <dt className="font-medium text-gray-500">Total Emails</dt>
                            <dd className="text-gray-900">{resource.details.total}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Unread</dt>
                            <dd className={resource.details.unread > 0 ? "text-red-600 font-medium" : "text-gray-900"}>
                              {resource.details.unread}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">SMTP</dt>
                            <dd className="text-gray-900 font-mono">localhost:1025</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-gray-500">Web UI</dt>
                            <dd className="text-gray-900 font-mono">localhost:8025</dd>
                          </div>
                        </>
                      )}

                      {resource.type === "secretsmanager" && resource.details && (
                        <>
                          <div>
                            <dt className="font-medium text-gray-500">ARN</dt>
                            <dd className="text-gray-900 font-mono text-sm break-all">
                              <div className="flex items-center space-x-2">
                                <code className="flex-1 min-w-0">
                                  {resource.details.arn}
                                </code>
                                <button
                                  onClick={() =>
                                    resource.details?.arn &&
                                    copyArnToClipboard(resource.details.arn)
                                  }
                                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy ARN"
                                >
                                  <ClipboardDocumentIcon className="h-4 w-4" />
                                </button>
                              </div>
                              {copiedArn === resource.details.arn && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Copied to clipboard
                                </p>
                              )}
                            </dd>
                          </div>
                          {resource.details.description && (
                            <div>
                              <dt className="font-medium text-gray-500">Description</dt>
                              <dd className="text-gray-900">{resource.details.description}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="font-medium text-gray-500">Last Changed</dt>
                            <dd className="text-gray-900">
                              {new Date(resource.details.lastChangedDate).toLocaleString()}
                            </dd>
                          </div>
                        </>
                      )}

                      {resource.type !== "secretsmanager" &&
                        resource.details &&
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
          {selectableResources.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedResources.length === selectableResources.length && selectableResources.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Select all ({selectableResources.length} resources)
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
