"use client";

import { useState, useRef, useEffect } from "react";
import { Resource } from "@/types";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
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
  onViewSecretsManager?: (secretName: string) => void;
  onEditSSM?: (parameterName: string) => void;
  onViewLambdaCode?: (functionName: string) => void;
  onConfigureAPIGateway?: (apiId: string, apiName: string) => void;
  onViewIAMRole?: (roleName: string) => void;
  onRefresh?: () => void;
  onAddS3?: () => void;
  onAddDynamoDB?: () => void;
  onAddSecrets?: () => void;
  onAddLambda?: () => void;
  onAddAPIGateway?: () => void;
  onAddSSM?: () => void;
  onAddIAM?: () => void;
  refreshLoading?: boolean;
  addLoading?: boolean;
  firstResourceLoading?: boolean;
}

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

interface EmptyStateAction {
  key: string;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

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
  onViewIAMRole,
  onRefresh,
  onAddS3,
  onAddDynamoDB,
  onAddSecrets,
  onAddLambda,
  onAddAPIGateway,
  onAddSSM,
  onAddIAM,
  refreshLoading = false,
  addLoading = false,
  firstResourceLoading = false,
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

  const awsTypes = new Set(AWS_CATEGORIES.flatMap((c) => c.types));
  const awsResources = resources.filter((r) => r.project === projectName && awsTypes.has(r.type));

  const handleSelectAll = () => {
    if (selectedResources.length === awsResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(awsResources.map((r) => r.id));
    }
  };

  const getApiId = (r: Resource) => r.details?.apiId || r.id.replace(/^apigateway-/, "");

  const hasAddActions = onAddS3 || onAddDynamoDB || onAddSecrets || onAddLambda || onAddAPIGateway || onAddSSM || onAddIAM;
  const rowGridTemplate = "1.25rem 2.5rem minmax(0, 1fr) 10rem 8rem 1.75rem";
  const listTransition = { duration: 0.24, ease: "easeOut" as const };
  const emptyStateActions: EmptyStateAction[] = [
    onAddS3
      ? {
          key: "s3",
          title: "Create S3 Bucket",
          description: "Store objects and files",
          icon: "logos:aws-s3",
          onClick: onAddS3,
        }
      : null,
    onAddDynamoDB
      ? {
          key: "dynamodb",
          title: "Create DynamoDB Table",
          description: "Set up a NoSQL table",
          icon: "logos:aws-dynamodb",
          onClick: onAddDynamoDB,
        }
      : null,
    onAddLambda
      ? {
          key: "lambda",
          title: "Create Lambda Function",
          description: "Run event-driven code",
          icon: "logos:aws-lambda",
          onClick: onAddLambda,
        }
      : null,
    onAddAPIGateway
      ? {
          key: "apigateway",
          title: "Create API Gateway",
          description: "Expose REST endpoints",
          icon: "logos:aws-api-gateway",
          onClick: onAddAPIGateway,
        }
      : null,
  ].filter((action): action is EmptyStateAction => action !== null);
  const viewState = awsResources.length === 0 ? (firstResourceLoading ? "building" : "empty") : "list";

  return (
    <motion.div layout className="bg-white rounded-lg shadow">
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
                    {(onAddSecrets || onAddSSM || onAddIAM) && (
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
                        {onAddIAM && (
                          <button
                            onClick={() => { onAddIAM(); setShowAddMenu(false); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon icon="logos:aws-iam" className="w-5 h-5 mr-3 flex-shrink-0" />
                            IAM Role
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

      <AnimatePresence initial={false} mode="wait">
        {viewState === "empty" && (
          <motion.div
            key="empty-state"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={listTransition}
            className="px-6 py-12 min-h-[23rem] flex flex-col justify-center"
          >
            <div className="flex items-center justify-center space-x-4 mb-6 opacity-20">
              <Icon icon="logos:aws-s3" className="w-10 h-10" />
              <Icon icon="logos:aws-dynamodb" className="w-10 h-10" />
              <Icon icon="logos:aws-lambda" className="w-10 h-10" />
              <Icon icon="logos:aws-api-gateway" className="w-10 h-10" />
              <Icon icon="logos:aws-secrets-manager" className="w-10 h-10" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1 text-center">Create your first AWS resource</h4>
            <p className="text-sm text-gray-500 text-center">
              Start with S3 or DynamoDB, or pick from other resource types.
            </p>

            {emptyStateActions.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {emptyStateActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={action.onClick}
                    disabled={addLoading}
                    className="flex items-center p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/40 transition-colors disabled:opacity-50"
                  >
                    <Icon icon={action.icon} className="w-8 h-8 mr-3 flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{action.title}</span>
                      <span className="block text-xs text-gray-500">{action.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500 text-center">
              You can also use the <span className="font-medium">+ Add</span> menu for Secrets Manager, Parameter Store, and IAM.
            </p>
          </motion.div>
        )}

        {viewState === "building" && (
          <motion.div
            key="building-first-resource"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={listTransition}
            className="px-6 py-12 min-h-[23rem] flex flex-col justify-center"
          >
            <div className="flex items-center justify-center space-x-4 mb-6 opacity-20">
              <Icon icon="logos:aws-s3" className="w-10 h-10" />
              <Icon icon="logos:aws-dynamodb" className="w-10 h-10" />
              <Icon icon="logos:aws-lambda" className="w-10 h-10" />
              <Icon icon="logos:aws-api-gateway" className="w-10 h-10" />
              <Icon icon="logos:aws-secrets-manager" className="w-10 h-10" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1 text-center">Building your first AWS resource...</h4>
            <p className="text-sm text-gray-500 text-center">
              This can take a few seconds while LocalStack provisions and saves it.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={`building-card-${idx}`}
                  className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50/70 animate-pulse"
                >
                  <div className="w-8 h-8 mr-3 rounded bg-gray-200" />
                  <span className="min-w-0 w-full">
                    <span className="block h-3.5 w-28 bg-gray-200 rounded mb-1.5" />
                    <span className="block h-3 w-24 bg-gray-100 rounded" />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Your new resource will appear here automatically.
            </p>
          </motion.div>
        )}

        {viewState === "list" && (
          <motion.div
            key="resource-list"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={listTransition}
          >
            {/* Category sections */}
            <AnimatePresence initial={false}>
              {AWS_CATEGORIES.map((category, catIndex) => {
                const categoryResources = awsResources.filter((r) =>
                  category.types.includes(r.type)
                );
                if (categoryResources.length === 0) return null;

                return (
                  <motion.div
                    key={`${category.name}-${catIndex}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={listTransition}
                  >
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
                      style={{ gridTemplateColumns: rowGridTemplate }}
                    >
                      <div />
                      <div />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Resource</span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</span>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide text-center">Action</span>
                      <div />
                    </div>

                    <div className="divide-y divide-gray-100">
                      <AnimatePresence initial={false}>
                        {categoryResources.map((resource) => (
                          <motion.div
                            key={resource.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={listTransition}
                            className="px-6 py-4"
                          >
                            <div
                              className="grid items-center gap-x-4"
                              style={{ gridTemplateColumns: rowGridTemplate }}
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
                          <h4 className="text-sm font-medium text-gray-900 break-words leading-5">
                            {resource.name}
                          </h4>
                          <p className="text-xs text-gray-500 break-words">
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
                                  onClick={() => onViewSecretsManager(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="View secret"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  View
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
                              {resource.type === "iam" && onViewIAMRole && (
                                <button
                                  onClick={() => onViewIAMRole(resource.name)}
                                  className="w-full flex items-center justify-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                  title="View role policies"
                                >
                                  <EyeIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Policies
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
                            <AnimatePresence initial={false}>
                              {showDetails === resource.id && (
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={listTransition}
                                  className="mt-4 pl-8 border-l-2 border-gray-200 overflow-hidden"
                                >
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

                            {resource.type === "iam" && resource.details && (
                              <>
                                {resource.details.arn && (
                                  <div>
                                    <dt className="font-medium text-gray-500">ARN</dt>
                                    <dd className="text-gray-900 font-mono text-sm break-all">
                                      <div className="flex items-center space-x-2">
                                        <code className="flex-1 min-w-0">{resource.details.arn}</code>
                                        <button
                                          onClick={() => resource.details?.arn && copyArnToClipboard(resource.details.arn)}
                                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                          title="Copy ARN"
                                        >
                                          <ClipboardDocumentIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                      {copiedArn === resource.details.arn && (
                                        <p className="text-xs text-green-600 mt-1">✓ Copied to clipboard</p>
                                      )}
                                    </dd>
                                  </div>
                                )}
                                {resource.details.trustService && (
                                  <div>
                                    <dt className="font-medium text-gray-500">Trusted Service</dt>
                                    <dd className="text-gray-900 font-mono text-sm">{resource.details.trustService}.amazonaws.com</dd>
                                  </div>
                                )}
                                {resource.details.description && (
                                  <div>
                                    <dt className="font-medium text-gray-500">Description</dt>
                                    <dd className="text-gray-900">{resource.details.description}</dd>
                                  </div>
                                )}
                                {resource.details.path && (
                                  <div>
                                    <dt className="font-medium text-gray-500">Path</dt>
                                    <dd className="text-gray-900 font-mono text-sm">{resource.details.path}</dd>
                                  </div>
                                )}
                              </>
                            )}

                            {resource.type !== "secretsmanager" && resource.type !== "iam" &&
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
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Select All footer */}
            <AnimatePresence initial={false}>
              {awsResources.length > 0 && (
                <motion.div
                  key="select-all-footer"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={listTransition}
                  className="px-6 py-3 bg-gray-50 border-t border-gray-200"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
