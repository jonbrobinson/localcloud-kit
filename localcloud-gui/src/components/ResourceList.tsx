"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Resource } from "@/types";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge, Button, IconButton, SearchInput } from "@/components/ui";
import type { StatusTone } from "@/components/ui";

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
  { name: "Storage", types: ["s3"] as Resource["type"][] },
  { name: "Database", types: ["dynamodb"] as Resource["type"][] },
  { name: "Compute", types: ["lambda"] as Resource["type"][] },
  { name: "Networking", types: ["apigateway"] as Resource["type"][] },
  { name: "Security & Identity", types: ["iam", "secretsmanager", "ssm"] as Resource["type"][] },
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
  iam: "IAM Role",
  secretsmanager: "Secrets Manager",
};

const RESOURCE_GROUP_LABEL: Record<string, string> = {
  s3: "S3 buckets",
  dynamodb: "DynamoDB tables",
  lambda: "Lambda functions",
  apigateway: "API Gateway APIs",
  ssm: "Parameter Store",
  iam: "IAM roles",
  secretsmanager: "Secrets",
};

const RESOURCE_DESCRIPTION: Record<string, string> = {
  s3: "Object storage",
  dynamodb: "Key-value store",
  lambda: "Placeholder zip, upload later",
  apigateway: "REST API",
  ssm: "Config parameters",
  iam: "Trust policy required",
  secretsmanager: "Encrypted secret values",
};

const STATUS_LABEL: Record<Resource["status"], string> = {
  active: "Active",
  creating: "Creating",
  deleting: "Deleting",
  error: "Error",
  unknown: "Unknown",
};

const STATUS_TONE: Record<Resource["status"], StatusTone> = {
  active: "success",
  creating: "warn",
  deleting: "warn",
  error: "danger",
  unknown: "neutral",
};

const STATUS_PULSE: Record<Resource["status"], boolean> = {
  active: false,
  creating: true,
  deleting: true,
  error: false,
  unknown: false,
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

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
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTypePicker) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowTypePicker(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showTypePicker]);

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

  const filteredAwsResources = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return awsResources;
    return awsResources.filter((r) => r.name.toLowerCase().includes(query));
  }, [awsResources, filterQuery]);

  const handleSelectAll = () => {
    if (selectedResources.length === filteredAwsResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(filteredAwsResources.map((r) => r.id));
    }
  };

  const getApiId = (r: Resource) => r.details?.apiId || r.id.replace(/^apigateway-/, "");

  const addHandlers: Partial<Record<Resource["type"], () => void>> = {
    s3: onAddS3,
    dynamodb: onAddDynamoDB,
    lambda: onAddLambda,
    apigateway: onAddAPIGateway,
    secretsmanager: onAddSecrets,
    ssm: onAddSSM,
    iam: onAddIAM,
  };

  const hasAddActions = Object.values(addHandlers).some(Boolean);
  const rowGridTemplate = "1.25rem minmax(0,1fr) 8rem 6rem 6.5rem 5rem";
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

  const viewState =
    awsResources.length === 0
      ? firstResourceLoading
        ? "building"
        : "empty"
      : filteredAwsResources.length === 0
        ? "no-match"
        : "list";

  return (
    <motion.div layout className="bg-surface border border-border rounded-xl shadow-e1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-divider flex-wrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ink">AWS resources</span>
          <span className="text-[11px] text-muted">
            {awsResources.length} resource{awsResources.length !== 1 ? "s" : ""} in{" "}
            <span className="font-mono">{projectName}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {selectedResources.length > 0 && (
            <Button variant="danger" size="sm" icon="lucide:trash-2" onClick={handleDestroySelected} loading={loading}>
              {loading ? "Destroying…" : `Destroy Selected (${selectedResources.length})`}
            </Button>
          )}

          <SearchInput
            placeholder="Filter resources…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            containerClassName="w-44"
          />

          {onRefresh && (
            <IconButton
              icon="lucide:refresh-cw"
              label="Refresh resources"
              onClick={onRefresh}
              loading={refreshLoading}
            />
          )}

          {hasAddActions && (
            <Button variant="primary" size="sm" icon="lucide:plus" onClick={() => setShowTypePicker(true)} disabled={addLoading}>
              Create resource
            </Button>
          )}
        </div>
      </div>

      {/* Column labels */}
      {viewState === "list" && (
        <div
          className="grid items-center gap-x-3 px-4 py-2 bg-surface-2 border-b border-divider"
          style={{ gridTemplateColumns: rowGridTemplate }}
        >
          <div />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Name</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Detail</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">Created</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint text-center">Status</span>
          <div />
        </div>
      )}

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
            <h4 className="text-sm font-semibold text-ink mb-1 text-center">No AWS resources yet</h4>
            <p className="text-sm text-muted text-center">Create resources for your active project.</p>

            {emptyStateActions.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
                {emptyStateActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={action.onClick}
                    disabled={addLoading}
                    className="flex items-center p-3 text-left border border-border rounded-lg hover:border-primary hover:bg-primary-soft/40 transition-colors disabled:opacity-50"
                  >
                    <Icon icon={action.icon} className="w-8 h-8 mr-3 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{action.title}</span>
                      <span className="block text-xs text-muted">{action.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-muted text-center">Pick any service; there&apos;s no required order.</p>
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
            <h4 className="text-sm font-semibold text-ink mb-1 text-center">Resource creation in progress…</h4>
            <p className="text-sm text-muted text-center">Setting up your resource for the active project.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={`building-card-${idx}`}
                  className="flex items-center p-3 border border-border rounded-lg bg-surface-2 animate-pulse"
                >
                  <div className="w-8 h-8 mr-3 rounded bg-skeleton" />
                  <span className="min-w-0 w-full">
                    <span className="block h-3.5 w-28 bg-skeleton rounded mb-1.5" />
                    <span className="block h-3 w-24 bg-skeleton rounded" />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted text-center">It will appear here automatically when ready.</p>
          </motion.div>
        )}

        {viewState === "no-match" && (
          <motion.div
            key="no-match"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={listTransition}
            className="px-6 py-12 flex flex-col items-center justify-center gap-2"
          >
            <Icon icon="lucide:search-x" width={28} className="text-faint" />
            <p className="text-sm text-ink font-medium">No resources match &quot;{filterQuery}&quot;</p>
            <button
              onClick={() => setFilterQuery("")}
              className="text-xs font-medium text-primary hover:text-primary-hover cursor-pointer"
            >
              Clear filter
            </button>
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
                const categoryResources = filteredAwsResources.filter((r) =>
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
                    {/* Group headers — one per resource type present */}
                    {category.types.map((type) => {
                      const typeResources = categoryResources.filter((r) => r.type === type);
                      if (typeResources.length === 0) return null;
                      return (
                        <div key={type}>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-2 border-b border-divider border-t border-t-divider first:border-t-0">
                            <Icon icon={RESOURCE_ICON[type] || "logos:aws"} width={14} />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                              {RESOURCE_GROUP_LABEL[type] || type}
                            </span>
                            <span className="font-mono text-[11px] text-faint">{typeResources.length}</span>
                          </div>

                          <div className="divide-y divide-divider">
                            <AnimatePresence initial={false}>
                              {typeResources.map((resource) => (
                                <motion.div
                                  key={resource.id}
                                  layout
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={listTransition}
                                  className="px-4 py-3"
                                >
                                  <div
                                    className="grid items-center gap-x-3"
                                    style={{ gridTemplateColumns: rowGridTemplate }}
                                  >
                                    {/* Checkbox */}
                                    <input
                                      type="checkbox"
                                      checked={selectedResources.includes(resource.id)}
                                      onChange={() => handleSelectResource(resource.id)}
                                      className="h-3.5 w-3.5 accent-primary border-border-strong rounded"
                                    />

                                    {/* Name */}
                                    <div className="min-w-0">
                                      <p className="font-mono text-[13px] text-ink truncate">{resource.name}</p>
                                    </div>

                                    {/* Detail */}
                                    <span className="text-xs text-muted truncate">
                                      {RESOURCE_LABEL[resource.type] || resource.type}
                                    </span>

                                    {/* Created */}
                                    <span
                                      className="text-xs text-muted truncate"
                                      title={new Date(resource.createdAt).toLocaleString()}
                                    >
                                      {formatRelativeTime(resource.createdAt)}
                                    </span>

                                    {/* Status badge */}
                                    <div className="flex justify-center">
                                      <Badge tone={STATUS_TONE[resource.status]} pulse={STATUS_PULSE[resource.status]}>
                                        {STATUS_LABEL[resource.status] || resource.status}
                                      </Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-center gap-1">
                                      {resource.status === "active" && (
                                        <>
                                          {resource.type === "s3" && onViewS3 && (
                                            <IconButton
                                              icon="lucide:eye"
                                              label="Browse S3 bucket"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onViewS3(resource.name)}
                                            />
                                          )}
                                          {resource.type === "dynamodb" && onViewDynamoDB && (
                                            <IconButton
                                              icon="lucide:eye"
                                              label="Browse DynamoDB table"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onViewDynamoDB(resource.name)}
                                            />
                                          )}
                                          {resource.type === "secretsmanager" && onViewSecretsManager && (
                                            <IconButton
                                              icon="lucide:eye"
                                              label="View secret"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onViewSecretsManager(resource.name)}
                                            />
                                          )}
                                          {resource.type === "ssm" && onEditSSM && (
                                            <IconButton
                                              icon="lucide:pencil"
                                              label="Edit parameter"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onEditSSM(resource.name)}
                                            />
                                          )}
                                          {resource.type === "lambda" && onViewLambdaCode && (
                                            <IconButton
                                              icon="lucide:code"
                                              label="View code"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onViewLambdaCode(resource.name)}
                                            />
                                          )}
                                          {resource.type === "iam" && onViewIAMRole && (
                                            <IconButton
                                              icon="lucide:shield-check"
                                              label="View role policies"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onViewIAMRole(resource.name)}
                                            />
                                          )}
                                          {resource.type === "apigateway" && onConfigureAPIGateway && (
                                            <IconButton
                                              icon="lucide:settings"
                                              label="Configure API"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => onConfigureAPIGateway(getApiId(resource), resource.name)}
                                            />
                                          )}
                                        </>
                                      )}
                                      <IconButton
                                        icon={showDetails === resource.id ? "lucide:chevron-up" : "lucide:chevron-down"}
                                        label="Toggle details"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setShowDetails(showDetails === resource.id ? null : resource.id)
                                        }
                                      />
                                    </div>
                                  </div>

                                  {/* Resource details */}
                                  <AnimatePresence initial={false}>
                                    {showDetails === resource.id && (
                                      <motion.div
                                        layout
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={listTransition}
                                        className="mt-3 pl-6 border-l-2 border-divider overflow-hidden"
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <dt className="font-medium text-muted text-xs">Resource ID</dt>
                                            <dd className="text-ink font-mono text-xs break-all">{resource.id}</dd>
                                          </div>
                                          <div>
                                            <dt className="font-medium text-muted text-xs">Created</dt>
                                            <dd className="text-ink text-xs">
                                              {new Date(resource.createdAt).toLocaleString()}
                                            </dd>
                                          </div>

                                          {resource.type === "secretsmanager" && resource.details && (
                                            <>
                                              <div>
                                                <dt className="font-medium text-muted text-xs">ARN</dt>
                                                <dd className="text-ink font-mono text-xs break-all">
                                                  <div className="flex items-center gap-2">
                                                    <code className="flex-1 min-w-0">{resource.details.arn}</code>
                                                    <button
                                                      onClick={() =>
                                                        resource.details?.arn &&
                                                        copyArnToClipboard(resource.details.arn)
                                                      }
                                                      className="shrink-0 p-1 text-faint hover:text-ink transition-colors cursor-pointer"
                                                      title="Copy ARN"
                                                    >
                                                      <Icon icon="lucide:copy" width={14} />
                                                    </button>
                                                  </div>
                                                  {copiedArn === resource.details.arn && (
                                                    <p className="text-xs text-success-ink mt-1">Copied to clipboard</p>
                                                  )}
                                                </dd>
                                              </div>
                                              {resource.details.description && (
                                                <div>
                                                  <dt className="font-medium text-muted text-xs">Description</dt>
                                                  <dd className="text-ink text-xs">{resource.details.description}</dd>
                                                </div>
                                              )}
                                              <div>
                                                <dt className="font-medium text-muted text-xs">Last Changed</dt>
                                                <dd className="text-ink text-xs">
                                                  {new Date(resource.details.lastChangedDate).toLocaleString()}
                                                </dd>
                                              </div>
                                            </>
                                          )}

                                          {resource.type === "iam" && resource.details && (
                                            <>
                                              {resource.details.arn && (
                                                <div>
                                                  <dt className="font-medium text-muted text-xs">ARN</dt>
                                                  <dd className="text-ink font-mono text-xs break-all">
                                                    <div className="flex items-center gap-2">
                                                      <code className="flex-1 min-w-0">{resource.details.arn}</code>
                                                      <button
                                                        onClick={() =>
                                                          resource.details?.arn &&
                                                          copyArnToClipboard(resource.details.arn)
                                                        }
                                                        className="shrink-0 p-1 text-faint hover:text-ink transition-colors cursor-pointer"
                                                        title="Copy ARN"
                                                      >
                                                        <Icon icon="lucide:copy" width={14} />
                                                      </button>
                                                    </div>
                                                    {copiedArn === resource.details.arn && (
                                                      <p className="text-xs text-success-ink mt-1">Copied to clipboard</p>
                                                    )}
                                                  </dd>
                                                </div>
                                              )}
                                              {resource.details.trustService && (
                                                <div>
                                                  <dt className="font-medium text-muted text-xs">Trusted Service</dt>
                                                  <dd className="text-ink font-mono text-xs">
                                                    {resource.details.trustService}.amazonaws.com
                                                  </dd>
                                                </div>
                                              )}
                                              {resource.details.description && (
                                                <div>
                                                  <dt className="font-medium text-muted text-xs">Description</dt>
                                                  <dd className="text-ink text-xs">{resource.details.description}</dd>
                                                </div>
                                              )}
                                              {resource.details.path && (
                                                <div>
                                                  <dt className="font-medium text-muted text-xs">Path</dt>
                                                  <dd className="text-ink font-mono text-xs">{resource.details.path}</dd>
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {resource.type !== "secretsmanager" &&
                                            resource.type !== "iam" &&
                                            resource.details &&
                                            Object.entries(resource.details).map(([key, value], detailIdx) => (
                                              <div key={`${resource.id}-detail-${key}-${detailIdx}`}>
                                                <dt className="font-medium text-muted text-xs capitalize">
                                                  {key.replace(/([A-Z])/g, " $1")}
                                                </dt>
                                                <dd className="text-ink text-xs">{String(value)}</dd>
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
                        </div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Select All footer */}
            <AnimatePresence initial={false}>
              {filteredAwsResources.length > 0 && (
                <motion.div
                  key="select-all-footer"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={listTransition}
                  className="flex items-center gap-3 px-4 py-2.5 bg-surface-2 border-t border-border"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedResources.length === filteredAwsResources.length && filteredAwsResources.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 accent-primary border-border-strong rounded"
                  />
                  <span className="text-xs text-muted">
                    {selectedResources.length > 0
                      ? `${selectedResources.length} selected`
                      : `Select all (${filteredAwsResources.length} resource${filteredAwsResources.length !== 1 ? "s" : ""})`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resource type picker */}
      <AnimatePresence>
        {showTypePicker && (
          <motion.div
            key="type-picker-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-scrim px-6 py-10"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowTypePicker(false);
            }}
          >
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-surface border border-border rounded-xl shadow-e3 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 px-4 py-3.5 border-b border-divider">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-soft text-primary shrink-0">
                  <Icon icon="lucide:plus" width={17} />
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[15px] font-semibold text-ink">Create resource</span>
                  <span className="text-[11px] text-muted truncate">
                    Into <span className="font-mono">{projectName}</span>
                  </span>
                </div>
                <IconButton
                  icon="lucide:x"
                  label="Close"
                  variant="ghost"
                  size="sm"
                  className="ml-auto shrink-0"
                  onClick={() => setShowTypePicker(false)}
                />
              </div>

              <div className="p-1.5 max-h-[70vh] overflow-y-auto">
                {AWS_CATEGORIES.map((category) => {
                  const items = category.types.filter((type) => addHandlers[type]);
                  if (items.length === 0) return null;
                  return (
                    <div key={category.name}>
                      <div className="px-2.5 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                        {category.name}
                      </div>
                      {items.map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            addHandlers[type]?.();
                            setShowTypePicker(false);
                          }}
                          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left hover:bg-surface-3 transition-colors cursor-pointer"
                        >
                          <Icon icon={RESOURCE_ICON[type]} width={17} className="shrink-0" />
                          <span className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[13px] font-medium text-ink">{RESOURCE_LABEL[type]}</span>
                            <span className="text-[11px] text-muted truncate">{RESOURCE_DESCRIPTION[type]}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
