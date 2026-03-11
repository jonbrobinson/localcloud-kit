"use client";

import { useState, useRef, useEffect } from "react";
import { Resource } from "@/types";
import { Icon } from "@iconify/react";
import {
  TrashIcon,
  EyeIcon,
  PencilSquareIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
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
  onViewSecretsManager?: () => void;
  onEditSSM?: (parameterName: string) => void;
  onViewLambdaCode?: (functionName: string) => void;
  onConfigureAPIGateway?: (apiId: string, apiName: string) => void;
  onRefresh?: () => void;
  onAddS3?: () => void;
  onAddDynamoDB?: () => void;
  onAddSecrets?: () => void;
  onAddLambda?: () => void;
  onAddAPIGateway?: () => void;
  onAddSSM?: () => void;
  refreshLoading?: boolean;
  addLoading?: boolean;
}

// AWS resource types only — platform services are excluded
const AWS_RESOURCE_TYPES = ["s3", "dynamodb", "lambda", "apigateway", "ssm", "iam", "secretsmanager"];

const AWS_CATEGORIES = [
  { name: "Storage", types: ["s3"] },
  { name: "Database", types: ["dynamodb"] },
  { name: "Compute", types: ["lambda"] },
  { name: "Networking", types: ["apigateway"] },
  { name: "Security & Identity", types: ["iam", "secretsmanager", "ssm"] },
];

const RESOURCE_ICON: Record<string, string> = {
  s3: "logos:aws-s3",
  dynamodb: "logos:aws-dynamodb",
  lambda: "logos:aws-lambda",
  apigateway: "logos:aws-api-gateway",
  ssm: "logos:aws-systems-manager",
  iam: "logos:aws-iam",
  secretsmanager: "logos:aws-secrets-manager",
};

const RESOURCE_LABEL: Record<string, string> = {
  s3: "S3 Bucket",
  dynamodb: "DynamoDB Table",
  lambda: "Lambda Function",
  apigateway: "API Gateway",
  ssm: "Parameter Store",
  iam: "IAM",
  secretsmanager: "Secrets Manager",
};

export default function ResourceList({
  resources,
  onDestroy,
  projectName,
  loading = false,
  onViewS3,
  onViewDynamoDB,
  onViewSecretsManager,
  onEditSSM,
  onViewLambdaCode,
  onConfigureAPIGateway,
  onRefresh,
  onAddS3,
  onAddDynamoDB,
  onAddSecrets,
  onAddLambda,
  onAddAPIGateway,
  onAddSSM,
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

  // Only show AWS resources (no platform services)
  const awsResources = resources.filter(
    (r) => r.project === projectName && AWS_RESOURCE_TYPES.includes(r.type)
  );

  const handleSelectAll = () => {
    if (selectedResources.length === awsResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(awsResources.map((r) => r.id));
    }
  };

  const getApiId = (r: Resource) => r.details?.apiId || r.id.replace(/^apigateway-/, "");

  const hasAddActions = onAddS3 || onAddDynamoDB || onAddSecrets || onAddLambda || onAddAPIGateway || onAddSSM;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">AWS Resources</h3>
            <p className="text-xs text-gray-500 mt-0.5">{awsResources.length} resource{awsResources.length !== 1 ? "s" : ""} in &quot;{projectName}&quot;</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Destroy Selected */}
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

            {/* Refresh */}
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
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    {(onAddS3) && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</p>
                        <button
                          onClick={() => { onAddS3(); setShowAddMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-s3" className="w-5 h-5 mr-3 flex-shrink-0" />
                          S3 Bucket
                        </button>
                      </>
                    )}
                    {(onAddDynamoDB) && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1">Database</p>
                        <button
                          onClick={() => { onAddDynamoDB(); setShowAddMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-dynamodb" className="w-5 h-5 mr-3 flex-shrink-0" />
                          DynamoDB Table
                        </button>
                      </>
                    )}
                    {(onAddLambda) && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1">Compute</p>
                        <button
                          onClick={() => { onAddLambda(); setShowAddMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-lambda" className="w-5 h-5 mr-3 flex-shrink-0" />
                          Lambda Function
                        </button>
                      </>
                    )}
                    {(onAddAPIGateway) && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1">Networking</p>
                        <button
                          onClick={() => { onAddAPIGateway(); setShowAddMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-api-gateway" className="w-5 h-5 mr-3 flex-shrink-0" />
                          API Gateway
                        </button>
                      </>
                    )}
                    {(onAddSecrets || onAddSSM) && (
                      <>
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1">Security & Identity</p>
                        {onAddSecrets && (
                          <button
                            onClick={() => { onAddSecrets(); setShowAddMenu(false); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon icon="logos:aws-secrets-manager" className="w-5 h-5 mr-3 flex-shrink-0" />
                            Secrets Manager
                          </button>
                        )}
                        {onAddSSM && (
                          <button
                            onClick={() => { onAddSSM(); setShowAddMenu(false); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon icon="logos:aws-systems-manager" className="w-5 h-5 mr-3 flex-shrink-0" />
                            Parameter Store
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {awsResources.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6 opacity-20">
            <Icon icon="logos:aws-s3" className="w-10 h-10" />
            <Icon icon="logos:aws-dynamodb" className="w-10 h-10" />
            <Icon icon="logos:aws-lambda" className="w-10 h-10" />
            <Icon icon="logos:aws-api-gateway" className="w-10 h-10" />
            <Icon icon="logos:aws-secrets-manager" className="w-10 h-10" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">No AWS Resources Yet</h4>
          <p className="text-sm text-gray-500">
            Use the <span className="font-medium">+ Add</span> button to create your first S3 bucket, DynamoDB table, Lambda function, API Gateway, or secret.
          </p>
        </div>
      ) : (
        <>
          {/* Category sections */}
          {AWS_CATEGORIES.map((category, catIndex) => {
            const categoryResources = awsResources.filter((r) =>
              category.types.includes(r.type)
            );
            if (categoryResources.length === 0) return null;

            return (
              <div key={`${category.name}-${catIndex}`}>
                {/* Category header */}
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-400">({categoryResources.length})</span>
                </div>

                {/* Column labels — only on first category */}
                <div
                  className="grid items-center gap-x-4 px-6 py-2 bg-white border-b border-gray-100"
                  style={{ gridTemplateColumns: "1.25rem 2.5rem 1fr 9rem 6rem 1.75rem" }}
                >
                  <div />
                  <div />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Resource</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</span>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Action</span>
                  <div />
                </div>

                <div className="divide-y divide-gray-100">
                  {categoryResources.map((resource) => (
                    <div key={resource.id} className="px-6 py-3.5">
                      <div
                        className="grid items-center gap-x-4"
                        style={{ gridTemplateColumns: "1.25rem 2.5rem 1fr 9rem 6rem 1.75rem" }}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedResources.includes(resource.id)}
                          onChange={() => handleSelectResource(resource.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />

                        {/* AWS icon */}
                        <div className="flex items-center justify-center">
                          <Icon
                            icon={RESOURCE_ICON[resource.type] || "logos:aws"}
                            className="w-6 h-6"
                          />
                        </div>

                        {/* Name + type */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {resource.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {RESOURCE_LABEL[resource.type] || resource.type} · {resource.project}
                          </p>
                        </div>

                        {/* Status badge */}
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(resource.status)}`}
                          >
                            {getStatusIcon(resource.status)}
                            <span className="ml-1 capitalize">{resource.status}</span>
                          </span>
                        </div>

                        {/* Action button */}
                        <div className="flex justify-center">
                          {resource.status === "active" && (
                            <>
                              {resource.type === "s3" && onViewS3 && (
                                <button
                                  onClick={() => onViewS3(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="Browse S3 Bucket"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Open
                                </button>
                              )}
                              {resource.type === "dynamodb" && onViewDynamoDB && (
                                <button
                                  onClick={() => onViewDynamoDB(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="Browse DynamoDB Table"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Open
                                </button>
                              )}
                              {resource.type === "secretsmanager" && onViewSecretsManager && (
                                <button
                                  onClick={onViewSecretsManager}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="Browse Secrets Manager"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Open
                                </button>
                              )}
                              {resource.type === "ssm" && onEditSSM && (
                                <button
                                  onClick={() => onEditSSM(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="Edit parameter"
                                >
                                  <PencilSquareIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Edit
                                </button>
                              )}
                              {resource.type === "lambda" && onViewLambdaCode && (
                                <button
                                  onClick={() => onViewLambdaCode(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="View code"
                                >
                                  <CodeBracketIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Code
                                </button>
                              )}
                              {resource.type === "apigateway" && onConfigureAPIGateway && (
                                <button
                                  onClick={() => onConfigureAPIGateway(getApiId(resource), resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="Configure API"
                                >
                                  <Cog6ToothIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Config
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Details toggle */}
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
                              Object.entries(resource.details).map(([key, value], detailIdx) => (
                                <div key={`${resource.id}-detail-${key}-${detailIdx}`}>
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
              </div>
            );
          })}

          {/* Select All footer */}
          {awsResources.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedResources.length === awsResources.length && awsResources.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Select all ({awsResources.length} resource{awsResources.length !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
