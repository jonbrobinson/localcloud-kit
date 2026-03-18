"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { useServicesData } from "@/hooks/useServicesData";
import { resourceApi } from "@/services/api";
import { DynamoDBTableConfig, S3BucketConfig, LambdaFunctionConfig, APIGatewayConfig, SSMParameterConfig, IAMRoleConfig, ModalKey, Resource } from "@/types";
import { PLATFORM_SERVICES, PLATFORM_SERVICE_KINDS, SERVICE_KIND_LABEL } from "@/constants/platformServices";
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BookOpenIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  ServerIcon,
  Squares2X2Icon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ResourceList from "./ResourceList";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import packageJson from "../../package.json";
import BucketViewer from "./BucketViewer";
import DynamoDBConfigModal from "./DynamoDBConfigModal";
import DynamoDBViewer from "./DynamoDBViewer";
import LogViewer from "./LogViewer";
import MailpitModal from "./MailpitModal";
import RedisModal from "./RedisModal";
import { ResourcesPanelSkeleton, ServicesBarSkeleton } from "./DashboardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import S3ConfigModal from "./S3ConfigModal";
import SecretsConfigModal from "./SecretsConfigModal";
import SecretsDetailModal from "./SecretsDetailModal";
import LambdaConfigModal from "./LambdaConfigModal";
import APIGatewayConfigModal from "./APIGatewayConfigModal";
import APIGatewayConfigViewer from "./APIGatewayConfigViewer";
import SSMConfigModal from "./SSMConfigModal";
import SSMEditModal from "./SSMEditModal";
import IAMConfigModal from "./IAMConfigModal";
import LambdaCodeModal from "./LambdaCodeModal";
import IAMRolePoliciesModal from "./IAMRolePoliciesModal";
import QuickInspectModal, { QuickInspectAction } from "./QuickInspectModal";

type InspectTargetId =
  | "localstack"
  | "s3"
  | "dynamodb"
  | "lambda"
  | "apigateway"
  | "secretsmanager"
  | "ssm"
  | "iam"
  | "postgres"
  | "redis"
  | "keycloak"
  | "mailpit";

const AWS_RESOURCE_TYPES = new Set<Resource["type"]>([
  "s3",
  "dynamodb",
  "lambda",
  "apigateway",
  "secretsmanager",
  "ssm",
  "iam",
]);

const DOC_ROUTES = [
  "/docs", "/localstack", "/s3", "/dynamodb", "/lambda",
  "/apigateway", "/secrets", "/ssm", "/iam",
  "/redis", "/mailpit", "/postgres", "/keycloak",
];

export default function Dashboard() {
  const router = useRouter();

  const prefetchDocRoutes = useCallback(() => {
    DOC_ROUTES.forEach((route) => router.prefetch(route));
  }, [router]);

  const {
    localstack,
    mailpit,
    redis,
    postgres,
    keycloak,
    loading,
    error,
    refetch: loadInitialData,
  } = useServicesData();

  const { status: localstackStatus, projectConfig: config, resources } = localstack;
  const { profile, projects, updateProfile, createProject } = usePreferences();

  const projectName = profile?.active_project_name || config.projectName;

  const [showDynamoDBConfig, setShowDynamoDBConfig] = useState(false);
  const [showS3Config, setShowS3Config] = useState(false);
  const [showSecretsConfig, setShowSecretsConfig] = useState(false);
  const [showLambdaConfig, setShowLambdaConfig] = useState(false);
  const [showAPIGatewayConfig, setShowAPIGatewayConfig] = useState(false);
  const [showSSMConfig, setShowSSMConfig] = useState(false);
  const [showSSMEdit, setShowSSMEdit] = useState(false);
  const [showIAMConfig, setShowIAMConfig] = useState(false);
  const [showIAMRolePolicies, setShowIAMRolePolicies] = useState(false);
  const [editingSSMParameter, setEditingSSMParameter] = useState<string>("");
  const [showLambdaCode, setShowLambdaCode] = useState(false);
  const [viewingLambdaFunction, setViewingLambdaFunction] = useState<string>("");
  const [viewingIAMRole, setViewingIAMRole] = useState<string>("");
  const [configuringAPIGateway, setConfiguringAPIGateway] = useState<{ apiId: string; apiName: string } | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showBuckets, setShowBuckets] = useState(false);
  const [showDynamoDB, setShowDynamoDB] = useState(false);
  const [showSecretsManager, setShowSecretsManager] = useState(false);
  const [selectedSecretName, setSelectedSecretName] = useState<string>("");
  const [showMailpit, setShowMailpit] = useState(false);
  const [showRedis, setShowRedis] = useState(false);
  const [inspectTarget, setInspectTarget] = useState<InspectTargetId | null>(null);

  const [selectedDynamoDBTable, setSelectedDynamoDBTable] = useState<string>("");
  const [selectedS3Bucket, setSelectedS3Bucket] = useState<string>("");

  const [createLoading, setCreateLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);
  const [firstResourceLoading, setFirstResourceLoading] = useState(false);

  const awsResourceCount = resources.filter(
    (resource) =>
      resource.project === projectName && AWS_RESOURCE_TYPES.has(resource.type)
  ).length;
  const hasAwsResources = awsResourceCount > 0;

  useEffect(() => {
    if (hasAwsResources && firstResourceLoading) {
      setFirstResourceLoading(false);
    }
  }, [hasAwsResources, firstResourceLoading]);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const refreshResourcesAfterCreate = async (
    isFirstResourceCreation: boolean
  ): Promise<boolean> => {
    if (isFirstResourceCreation) {
      const timeoutAt = Date.now() + 12000;

      while (Date.now() < timeoutAt) {
        try {
          const latestResources = await resourceApi.list(projectName);
          const hasProvisionedResource = latestResources.some(
            (resource) =>
              resource.project === projectName &&
              AWS_RESOURCE_TYPES.has(resource.type)
          );

          if (hasProvisionedResource) {
            await loadInitialData();
            return true;
          }
        } catch (error) {
          console.error("Polling first resource after create failed:", error);
        }

        await sleep(650);
      }
    }

    await sleep(800);
    await loadInitialData();
    return !isFirstResourceCreation;
  };

  // "What's new" dot — shows when the stored version doesn't match the current one
  const [hasNewVersion, setHasNewVersion] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem("lck_last_seen_version");
    if (seen !== packageJson.version) setHasNewVersion(true);
  }, []);
  const dismissVersionDot = () => {
    localStorage.setItem("lck_last_seen_version", packageJson.version);
    setHasNewVersion(false);
  };

  // Mobile nav
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Dropdowns
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const [showDevToolsMenu, setShowDevToolsMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const docsMenuRef = useRef<HTMLDivElement>(null);
  const devToolsMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resourcesMenuRef.current && !resourcesMenuRef.current.contains(e.target as Node)) {
        setShowResourcesMenu(false);
      }
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(e.target as Node)) {
        setShowServicesMenu(false);
      }
      if (docsMenuRef.current && !docsMenuRef.current.contains(e.target as Node)) {
        setShowDocsMenu(false);
      }
      if (devToolsMenuRef.current && !devToolsMenuRef.current.contains(e.target as Node)) {
        setShowDevToolsMenu(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAllMenus = () => {
    setShowResourcesMenu(false);
    setShowServicesMenu(false);
    setShowDocsMenu(false);
    setShowDevToolsMenu(false);
    setShowProjectMenu(false);
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  };

  const openInspectTarget = (target: InspectTargetId) => {
    closeAllMenus();
    setInspectTarget(target);
  };

  const handleModalOpen = (modalKey: ModalKey) => {
    if (modalKey === "mailpit") setShowMailpit(true);
    if (modalKey === "redis") setShowRedis(true);
  };

  const toggleMenu = (setter: (v: boolean) => void, current: boolean) => {
    closeAllMenus();
    setter(!current);
  };

  const previewActionClass =
    "inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors";
  const inspectActionClass =
    "inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors";
  const manageActionClass =
    "inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors";

  const renderResourceActions = (label: string, target: InspectTargetId, manageHref: string, onPreview?: () => void) => (
    <div className="flex items-center gap-1">
      {onPreview && (
        <button
          onClick={onPreview}
          className={previewActionClass}
          title={`Open ${label} viewer`}
          aria-label={`Open ${label} viewer`}
        >
          <EyeIcon className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => openInspectTarget(target)}
        className={inspectActionClass}
        title={`Inspect ${label} checks`}
        aria-label={`Inspect ${label} checks`}
      >
        <ClipboardDocumentCheckIcon className="h-4 w-4" />
      </button>
      <Link
        href={manageHref}
        onClick={closeAllMenus}
        className={manageActionClass}
        title={`Open ${label} page`}
        aria-label={`Open ${label} page`}
      >
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </Link>
    </div>
  );

  const renderInspectAction = (label: string, target: InspectTargetId) => (
    <button
      onClick={() => openInspectTarget(target)}
      className={inspectActionClass}
      title={`Inspect ${label} checks`}
      aria-label={`Inspect ${label} checks`}
    >
      <ClipboardDocumentCheckIcon className="h-4 w-4" />
    </button>
  );

  const handleSwitchProject = async (projectId: number) => {
    try {
      await updateProfile({ active_project_id: projectId });
      setShowProjectMenu(false);
      await loadInitialData();
    } catch {
      toast.error("Failed to switch project");
    }
  };

  const handleCreateProject = async () => {
    const label = prompt("Project name:");
    if (!label) return;
    const name = label.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    try {
      const project = await createProject(name, label);
      await updateProfile({ active_project_id: project.id });
      setShowProjectMenu(false);
      await loadInitialData();
      toast.success(`Project "${label}" created`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleCreateSingleResource = async (resourceType: string) => {
    if (resourceType === "dynamodb") { setShowDynamoDBConfig(true); return; }
    if (resourceType === "s3") { setShowS3Config(true); return; }
    if (resourceType === "secretsmanager") { setShowSecretsConfig(true); return; }
    if (resourceType === "lambda") { setShowLambdaConfig(true); return; }
    if (resourceType === "apigateway") { setShowAPIGatewayConfig(true); return; }
    if (resourceType === "ssm") { setShowSSMConfig(true); return; }

    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingle(projectName, resourceType);
      if (response.success) {
        toast.success(`${resourceType} resource created successfully`);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || `Failed to create ${resourceType} resource`);
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error(`Create ${resourceType} resource error:`, error);
      toast.error(`Failed to create ${resourceType} resource: ${error instanceof Error ? error.message : "Unknown error"}`);
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateDynamoDBTable = async (dynamodbConfig: DynamoDBTableConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "dynamodb", { dynamodbConfig });
      if (response.success) {
        toast.success("DynamoDB table created successfully");
        setShowDynamoDBConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create DynamoDB table");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create DynamoDB table error:", error);
      toast.error(`Failed to create DynamoDB table: ${error instanceof Error ? error.message : "Unknown error"}`);
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateS3Bucket = async (s3Config: S3BucketConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "s3", { s3Config });
      if (response.success) {
        toast.success("S3 bucket created successfully");
        setShowS3Config(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create S3 bucket");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create S3 bucket error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create S3 bucket"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateSecret = async (secretsmanagerConfig: import("@/types").SecretsManagerConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "secretsmanager", { secretsmanagerConfig });
      if (response.success) {
        toast.success("Secret created successfully");
        setShowSecretsConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create secret");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create secret error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create secret"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateLambda = async (lambdaConfig: LambdaFunctionConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "lambda", { lambdaConfig });
      if (response.success) {
        toast.success("Lambda function created successfully");
        setShowLambdaConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create Lambda function");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create Lambda error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create Lambda function"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateAPIGateway = async (apigatewayConfig: APIGatewayConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "apigateway", { apigatewayConfig });
      if (response.success) {
        toast.success("API Gateway created successfully");
        setShowAPIGatewayConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create API Gateway");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create API Gateway error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create API Gateway"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateSSMParameter = async (ssmConfig: SSMParameterConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "ssm", { ssmConfig });
      if (response.success) {
        toast.success("SSM parameter created successfully");
        setShowSSMConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create SSM parameter");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create SSM parameter error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create SSM parameter"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateIAMRole = async (iamConfig: IAMRoleConfig) => {
    const isFirstResourceCreation = !hasAwsResources;
    if (isFirstResourceCreation) {
      setFirstResourceLoading(true);
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "iam", { iamConfig });
      if (response.success) {
        toast.success("IAM role created successfully");
        setShowIAMConfig(false);
        const firstResourceLoaded = await refreshResourcesAfterCreate(
          isFirstResourceCreation
        );
        if (isFirstResourceCreation && !firstResourceLoaded) {
          setFirstResourceLoading(false);
        }
      } else {
        toast.error(response.error || "Failed to create IAM role");
        if (isFirstResourceCreation) {
          setFirstResourceLoading(false);
        }
      }
    } catch (error) {
      console.error("Create IAM role error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create IAM role"));
      if (isFirstResourceCreation) {
        setFirstResourceLoading(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveSSMParameter = async (ssmConfig: SSMParameterConfig) => {
    setCreateLoading(true);
    try {
      const path = `/api/ssm/parameters/${ssmConfig.parameterName.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
      const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: ssmConfig.parameterValue,
          type: ssmConfig.parameterType,
          description: ssmConfig.description || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Parameter updated");
        setShowSSMEdit(false);
        setEditingSSMParameter("");
        setTimeout(async () => { await loadInitialData(); }, 500);
      } else {
        toast.error(data.error || "Failed to update parameter");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update parameter");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDestroyResources = async (resourceIds: string[]) => {
    setDestroyLoading(true);
    try {
      const response = await resourceApi.destroy({ projectName, resourceIds });
      if (response.success) {
        toast.success("Resources destroyed successfully");
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to destroy resources");
      }
    } catch (error) {
      console.error("Destroy resources error:", error);
      toast.error(`Failed to destroy resources: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setDestroyLoading(false);
    }
  };

  const getFirstActiveResourceByType = (type: Resource["type"]) =>
    resources.find((resource) => resource.project === projectName && resource.type === type && resource.status === "active");

  const getApiIdFromResource = (resource: Resource) => resource.details?.apiId || resource.id.replace(/^apigateway-/, "");

  const openLambdaViewer = (functionName?: string) => {
    const targetName = functionName || getFirstActiveResourceByType("lambda")?.name;
    if (!targetName) {
      toast.error("No active Lambda functions available");
      return;
    }
    setViewingLambdaFunction(targetName);
    setShowLambdaCode(true);
  };

  const openAPIGatewayViewer = (apiId?: string, apiName?: string) => {
    if (apiId && apiName) {
      setConfiguringAPIGateway({ apiId, apiName });
      return;
    }

    const resource = getFirstActiveResourceByType("apigateway");
    if (!resource) {
      toast.error("No active API Gateway resources available");
      return;
    }

    setConfiguringAPIGateway({
      apiId: getApiIdFromResource(resource),
      apiName: resource.name,
    });
  };

  const openSecretsViewer = (secretName?: string) => {
    const targetName = secretName || getFirstActiveResourceByType("secretsmanager")?.name;
    if (!targetName) {
      toast.error("No active secrets available");
      return;
    }
    setSelectedSecretName(targetName);
    setShowSecretsManager(true);
  };

  const openSSMViewer = (parameterName?: string) => {
    const targetName = parameterName || getFirstActiveResourceByType("ssm")?.name;
    if (!targetName) {
      toast.error("No active SSM parameters available");
      return;
    }
    setEditingSSMParameter(targetName);
    setShowSSMEdit(true);
  };

  const openIAMRoleViewer = (roleName?: string) => {
    const targetName = roleName || getFirstActiveResourceByType("iam")?.name;
    if (!targetName) {
      toast.error("No active IAM roles available");
      return;
    }
    setViewingIAMRole(targetName);
    setShowIAMRolePolicies(true);
  };

  const serviceStatusClass = (status: string) => {
    if (status === "running") return "bg-green-100 text-green-800";
    if (status === "starting") return "bg-yellow-100 text-yellow-700";
    if (status === "failed") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-600";
  };
  const serviceDotClass = (status: string) => {
    if (status === "running") return "bg-green-500";
    if (status === "starting") return "bg-yellow-400 animate-pulse";
    if (status === "failed") return "bg-red-500";
    return "bg-gray-400";
  };
  const serviceLabel = (status: string) => {
    if (status === "running") return "Running";
    if (status === "starting") return "Starting…";
    if (status === "failed") return "Failed";
    if (status === "stopped") return "Stopped";
    return "Unknown";
  };

  const inspectConfig = (() => {
    if (!inspectTarget) return null;

    const baseActions: QuickInspectAction[] = [];
    const withDocs = (href: string) => [...baseActions, { label: "Open Docs", href }];
    const withManager = (href: string, label = "Open Manager") => [...baseActions, { label, href }];
    const withAdmin = (href: string, label = "Open Admin UI"): QuickInspectAction => ({
      label,
      href,
      external: true,
    });

    switch (inspectTarget) {
      case "localstack":
        return {
          title: "LocalStack",
          subtitle: localstackStatus.running ? "AWS emulator is running locally" : "LocalStack is not running",
          quickChecks: [
            "Service health is healthy in the status bar",
            "Endpoint http://localhost:4566 is reachable",
            "AWS resources refresh successfully",
          ],
          actions: withDocs("/localstack"),
        };
      case "s3":
        return {
          title: "S3 Buckets",
          subtitle: "Inspect bucket/object flow quickly",
          quickChecks: [
            "Bucket exists in active project",
            "Recent object keys match expected path format",
            "Object metadata/content type looks correct",
          ],
          actions: [
            { label: "Open Viewer", onClick: () => setShowBuckets(true) },
            ...withManager("/manage/s3"),
            ...withDocs("/s3"),
          ],
        };
      case "dynamodb":
        return {
          title: "DynamoDB",
          subtitle: "Inspect local table data and value types",
          quickChecks: [
            "Table exists and is active",
            "Recent items include required keys",
            "Numeric/date fields have expected types",
          ],
          actions: [
            { label: "Open Viewer", onClick: () => setShowDynamoDB(true) },
            ...withManager("/manage/dynamodb"),
            ...withDocs("/dynamodb"),
          ],
        };
      case "lambda":
        return {
          title: "Lambda",
          subtitle: "Check function setup and local invocation flow",
          quickChecks: [
            "Function exists with expected runtime/handler",
            "Invocation returns expected payload structure",
            "Function appears in the manager list",
          ],
          actions: [
            { label: "Create / Configure", onClick: () => setShowLambdaConfig(true) },
            ...withManager("/manage/lambda"),
            ...withDocs("/lambda"),
          ],
        };
      case "apigateway":
        return {
          title: "API Gateway",
          subtitle: "Validate routes and local invoke URLs",
          quickChecks: [
            "API and stage exist",
            "Route method/path match caller behavior",
            "Invoke URL responds with expected status",
          ],
          actions: [
            { label: "Create / Configure", onClick: () => setShowAPIGatewayConfig(true) },
            ...withManager("/manage/apigateway"),
            ...withDocs("/apigateway"),
          ],
        };
      case "secretsmanager":
        return {
          title: "Secrets Manager",
          subtitle: "Verify secret names and local reads",
          quickChecks: [
            "Secret name/path matches application config",
            "Latest value can be read locally",
            "ARN and metadata look correct",
          ],
          actions: [
            { label: "Create / Configure", onClick: () => setShowSecretsConfig(true) },
            ...withManager("/manage/secrets"),
            ...withDocs("/secrets"),
          ],
        };
      case "ssm":
        return {
          title: "Parameter Store",
          subtitle: "Validate local parameter values and types",
          quickChecks: [
            "Expected path exists",
            "Parameter type matches intended usage",
            "Consumer app reads latest local value",
          ],
          actions: [
            { label: "Create / Configure", onClick: () => setShowSSMConfig(true) },
            ...withManager("/manage/ssm"),
            ...withDocs("/ssm"),
          ],
        };
      case "iam":
        return {
          title: "IAM & STS",
          subtitle: "Inspect role setup and local identity flow",
          quickChecks: [
            "Role exists with expected trust policy",
            "Policies match intended permissions",
            "STS calls return expected identity values",
          ],
          actions: [
            { label: "Create / Configure", onClick: () => setShowIAMConfig(true) },
            ...withManager("/manage/iam"),
            ...withDocs("/iam"),
          ],
        };
      case "postgres":
        return {
          title: "PostgreSQL",
          subtitle: postgres.status === "running" ? "Database is running locally" : "Database is not running",
          quickChecks: [
            "Service status is running",
            "Connection works on localhost:5432",
            "Recent writes are visible in expected tables",
          ],
          actions: [
            { label: "Open Docs", href: "/postgres" },
            withAdmin("https://pgadmin.localcloudkit.com:3030"),
          ],
        };
      case "redis":
        return {
          title: "Redis Cache",
          subtitle: redis.status === "running" ? "Redis is running locally" : "Redis is unavailable",
          quickChecks: [
            "Redis status is running",
            "Expected key prefixes appear",
            "TTL/value structure is correct",
          ],
          actions: [
            { label: "Open Inspector", onClick: () => setShowRedis(true) },
            ...withManager("/cache", "Open Cache Manager"),
            ...withDocs("/redis"),
          ],
        };
      case "keycloak":
        return {
          title: "Keycloak",
          subtitle: keycloak.status === "running" ? "Identity provider is running" : "Identity provider is not running",
          quickChecks: [
            "Realm and client IDs match app config",
            "Login/token flows succeed locally",
            "Role mappings are present",
          ],
          actions: [
            { label: "Open Docs", href: "/keycloak" },
            withAdmin("https://keycloak.localcloudkit.com:3030"),
          ],
        };
      case "mailpit":
        return {
          title: "Mailpit",
          subtitle: mailpit.status === "healthy" ? "Mailpit inbox is available" : "Mailpit inbox is unavailable",
          quickChecks: [
            "SMTP test emails are received",
            "To/from/subject values are correct",
            "Unread count increases after send",
          ],
          actions: [
            { label: "Open Inbox Preview", onClick: () => setShowMailpit(true) },
            { label: "Open Docs", href: "/mailpit" },
            withAdmin("https://mailpit.localcloudkit.com:3030"),
          ],
        };
      default:
        return null;
    }
  })();

  if (error) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-screen bg-linear-to-br from-red-50 to-pink-100"
        >
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Data</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button
              onClick={loadInitialData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={80} height={40} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Local Cloud Development Environment • v{packageJson.version}</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">

              {/* Resources dropdown — AWS resources only */}
              <div className="relative" ref={resourcesMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowResourcesMenu, showResourcesMenu)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Resources
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showResourcesMenu ? "rotate-180" : ""}`} />
                </button>
                {showResourcesMenu && (
                  <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1.5">
                    {/* Storage */}
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowBuckets(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                        S3 Buckets
                      </button>
                      {renderResourceActions("S3 Buckets", "s3", "/manage/s3", () => {
                        setShowBuckets(true);
                        closeAllMenus();
                      })}
                    </div>

                    {/* Database */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Database</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowDynamoDB(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                        DynamoDB
                      </button>
                      {renderResourceActions("DynamoDB", "dynamodb", "/manage/dynamodb", () => {
                        setShowDynamoDB(true);
                        closeAllMenus();
                      })}
                    </div>

                    {/* Compute */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Compute</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowLambdaConfig(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                        Lambda
                      </button>
                      {renderResourceActions("Lambda", "lambda", "/manage/lambda", () => {
                        openLambdaViewer();
                        closeAllMenus();
                      })}
                    </div>

                    {/* Networking */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Networking</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowAPIGatewayConfig(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                        API Gateway
                      </button>
                      {renderResourceActions("API Gateway", "apigateway", "/manage/apigateway", () => {
                        openAPIGatewayViewer();
                        closeAllMenus();
                      })}
                    </div>

                    {/* Security & Identity */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Security & Identity</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowSecretsConfig(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                        Secrets Manager
                      </button>
                      {renderResourceActions("Secrets Manager", "secretsmanager", "/manage/secrets", () => {
                        openSecretsViewer();
                        closeAllMenus();
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowSSMConfig(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                        Parameter Store
                      </button>
                      {renderResourceActions("Parameter Store", "ssm", "/manage/ssm", () => {
                        openSSMViewer();
                        closeAllMenus();
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => { setShowIAMConfig(true); closeAllMenus(); }}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                        IAM Roles
                      </button>
                      {renderResourceActions("IAM Roles", "iam", "/manage/iam", () => {
                        openIAMRoleViewer();
                        closeAllMenus();
                      })}
                    </div>

                  </div>
                )}
              </div>

              {/* Services dropdown — platform services */}
              <div className="relative" ref={servicesMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowServicesMenu, showServicesMenu)}
                  className="relative flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ServerIcon className="h-4 w-4 mr-2" />
                  Services
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showServicesMenu ? "rotate-180" : ""}`} />
                  {mailpit.unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs font-bold bg-red-500 text-white leading-none">
                      {mailpit.unread > 99 ? "99+" : mailpit.unread}
                    </span>
                  )}
                </button>
                {showServicesMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {PLATFORM_SERVICE_KINDS.map((kind, i) => {
                      const items = PLATFORM_SERVICES.filter((s) => s.kind === kind);
                      return (
                        <div key={kind}>
                          {i > 0 && <div className="border-t border-gray-100 mt-1" />}
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {SERVICE_KIND_LABEL[kind]}
                          </p>
                          {items.map((service) => {
                            const ServiceIcon = service.icon;
                            const itemContent = (
                              <>
                                <ServiceIcon className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                                {service.label}
                                {service.id === "mailpit" && mailpit.unread > 0 && (
                                  <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs font-bold bg-red-500 text-white leading-none">
                                    {mailpit.unread > 99 ? "99+" : mailpit.unread}
                                  </span>
                                )}
                              </>
                            );
                            const action = service.action;
                            return (
                              <div key={service.id} className="flex items-center justify-between px-2">
                                {action.type === "link" ? (
                                  <Link
                                    href={action.href}
                                    onClick={() => closeAllMenus()}
                                    className="flex items-center flex-1 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  >
                                    {itemContent}
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => { handleModalOpen(action.modalKey); closeAllMenus(); }}
                                    className="flex items-center flex-1 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  >
                                    {itemContent}
                                  </button>
                                )}
                                {renderInspectAction(service.label, service.id)}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Docs dropdown */}
              <div className="relative" ref={docsMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowDocsMenu, showDocsMenu)}
                  onMouseEnter={prefetchDocRoutes}
                  onFocus={prefetchDocRoutes}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Docs
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showDocsMenu ? "rotate-180" : ""}`} />
                </button>
                {showDocsMenu && (
                  <div className="absolute right-0 mt-1 w-176 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3">
                    <Link
                      href="/docs"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
                    >
                      <BookOpenIcon className="h-4 w-4 mr-3 text-indigo-500" />
                      Docs Hub
                    </Link>

                    <div className="mt-3 grid grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto">
                      <div className="rounded-md border border-gray-100 py-1">
                        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Infrastructure</p>
                        <Link
                          href="/localstack"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />
                          LocalStack
                        </Link>
                      </div>

                      <div className="rounded-md border border-gray-100 py-1">
                        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS Resources</p>
                        <Link
                          href="/dynamodb"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                          DynamoDB
                        </Link>
                        <Link
                          href="/s3"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                          S3 Buckets
                        </Link>
                        <Link
                          href="/lambda"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                          Lambda
                        </Link>
                        <Link
                          href="/apigateway"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                          API Gateway
                        </Link>
                        <Link
                          href="/secrets"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Secrets Manager
                        </Link>
                        <Link
                          href="/ssm"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Parameter Store
                        </Link>
                        <Link
                          href="/iam"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                          IAM &amp; STS
                        </Link>
                      </div>

                      <div className="rounded-md border border-gray-100 py-1">
                        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Services</p>
                        {PLATFORM_SERVICES.map((service) => {
                          const ServiceIcon = service.icon;
                          const href = service.action.type === "link" ? service.action.href : `/${service.id}`;
                          return (
                            <Link
                              key={service.id}
                              href={href}
                              onClick={() => setShowDocsMenu(false)}
                              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ServiceIcon className="h-4 w-4 mr-3 text-gray-400" />
                              {service.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dev Tools dropdown */}
              <div className="relative" ref={devToolsMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowDevToolsMenu, showDevToolsMenu)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ServerIcon className="h-4 w-4 mr-2" />
                  Dev Tools
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showDevToolsMenu ? "rotate-180" : ""}`} />
                </button>
                {showDevToolsMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Logs</p>
                    <button
                      onClick={() => { setShowLogs(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />
                      System Logs
                    </button>
                  </div>
                )}
              </div>

              {/* Divider before project + profile */}
              <div className="h-5 w-px bg-gray-200 mx-1.5" />

              {/* Project Switcher */}
              <div className="relative" ref={projectMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowProjectMenu, showProjectMenu)}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {profile?.active_project_label || "Default"}
                  </span>
                  <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showProjectMenu ? "rotate-180" : ""}`} />
                </button>
                {showProjectMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</p>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSwitchProject(p.id)}
                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                          p.id === profile?.active_project_id
                            ? "text-blue-700 bg-blue-50 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full mr-3 shrink-0 ${p.id === profile?.active_project_id ? "bg-blue-500" : "bg-gray-300"}`} />
                        {p.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1" />
                    <button
                      onClick={handleCreateProject}
                      className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      + New project
                    </button>
                    <Link
                      href="/profile"
                      onClick={() => setShowProjectMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Manage projects...
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => { toggleMenu(setShowProfileMenu, showProfileMenu); dismissVersionDot(); }}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Profile & Settings"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  {hasNewVersion && (
                    <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {hasNewVersion && (
                      <div className="mx-2 mb-1 px-3 py-2 bg-blue-50 rounded-md border border-blue-100">
                        <p className="text-xs font-semibold text-blue-700">v{packageJson.version} — What&apos;s new</p>
                        <Link href="https://github.com/localcloud-kit/localcloud-kit/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View changelog →</Link>
                      </div>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Profile & Preferences
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {hasNewVersion && (
                <span className="h-2 w-2 rounded-full bg-red-500" />
              )}
              {mailpit.unread > 0 && (
                <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-xs font-bold bg-red-500 text-white">
                  {mailpit.unread > 99 ? "99+" : mailpit.unread}
                </span>
              )}
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                {showMobileMenu ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu drawer */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-100 pb-3">

              {/* Resources */}
              <div className="pt-3 px-2">
                <p className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS Resources</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowBuckets(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />S3 Buckets
                  </button>
                  <button onClick={() => openInspectTarget("s3")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowDynamoDB(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />DynamoDB Tables
                  </button>
                  <button onClick={() => openInspectTarget("dynamodb")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowLambdaConfig(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />Lambda Functions
                  </button>
                  <button onClick={() => openInspectTarget("lambda")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowAPIGatewayConfig(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />API Gateway
                  </button>
                  <button onClick={() => openInspectTarget("apigateway")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowSecretsConfig(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />Secrets Manager
                  </button>
                  <button onClick={() => openInspectTarget("secretsmanager")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowSSMConfig(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />Parameter Store
                  </button>
                  <button onClick={() => openInspectTarget("ssm")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setShowIAMConfig(true); closeAllMenus(); }} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />IAM Roles
                  </button>
                  <button onClick={() => openInspectTarget("iam")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
              </div>

              {/* Services — categorised by kind */}
              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                {PLATFORM_SERVICE_KINDS.map((kind, i) => {
                  const items = PLATFORM_SERVICES.filter((s) => s.kind === kind);
                  return (
                    <div key={kind}>
                      <p className={`px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i > 0 ? "pt-2" : "py-1"}`}>
                        {SERVICE_KIND_LABEL[kind]}
                      </p>
                      {items.map((service) => {
                        const ServiceIcon = service.icon;
                        const itemContent = (
                          <>
                            <ServiceIcon className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                            {service.label}
                            {service.id === "mailpit" && mailpit.unread > 0 && (
                              <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                {mailpit.unread > 99 ? "99+" : mailpit.unread}
                              </span>
                            )}
                          </>
                        );
                        const action = service.action;
                        return (
                          <div key={service.id} className="flex items-center gap-1">
                            {action.type === "link" ? (
                              <Link
                                href={action.href}
                                onClick={closeAllMenus}
                                className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {itemContent}
                              </Link>
                            ) : (
                              <button
                                onClick={() => { handleModalOpen(action.modalKey); closeAllMenus(); }}
                                className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {itemContent}
                              </button>
                            )}
                            <button
                              onClick={() => openInspectTarget(service.id)}
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap"
                            >
                              Inspect
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Docs */}
              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Docs</p>
                <Link href="/docs" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm font-medium text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors">
                  <BookOpenIcon className="h-4 w-4 mr-3 text-indigo-500" />Docs Hub
                </Link>
                <Link href="/localstack" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />LocalStack
                </Link>
                <Link href="/s3" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />S3 Buckets
                </Link>
                <Link href="/dynamodb" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />DynamoDB
                </Link>
                <Link href="/lambda" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />Lambda
                </Link>
                <Link href="/apigateway" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />API Gateway
                </Link>
                <Link href="/secrets" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />Secrets Manager
                </Link>
                <Link href="/ssm" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />Parameter Store
                </Link>
                <Link href="/iam" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />IAM &amp; STS
                </Link>
                {PLATFORM_SERVICES.map((service) => {
                  const ServiceIcon = service.icon;
                  const href = service.action.type === "link" ? service.action.href : `/${service.id}`;
                  return (
                    <Link key={service.id} href={href} onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <ServiceIcon className="h-4 w-4 mr-3 text-gray-400 shrink-0" />{service.label}
                    </Link>
                  );
                })}
              </div>

              {/* Dev Tools */}
              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dev Tools</p>
                <button onClick={() => { setShowLogs(true); closeAllMenus(); }} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />System Logs
                </button>
              </div>

              {/* Account */}
              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                <div className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {profile?.active_project_label || "Default"}
                  </span>
                </div>
                <Link href="/profile" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <UserCircleIcon className="h-4 w-4 mr-3 text-gray-400" />Profile & Preferences
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Services status bar — categorised; skeleton when loading */}
        {loading ? (
          <ServicesBarSkeleton />
        ) : (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center flex-wrap gap-y-2 gap-x-0">

          {/* Keycloak */}
          <Link href="/keycloak" className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors" title="Keycloak">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${serviceDotClass(keycloak.status)}`} />
            <span className="text-sm font-medium text-gray-700">Keycloak</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(keycloak.status)}`}>
              {serviceLabel(keycloak.status)}
            </span>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {/* LocalStack */}
          <div className="flex items-center space-x-2 px-3">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              localstackStatus.health === "healthy" ? "bg-green-500" :
              localstackStatus.health === "unhealthy" ? "bg-red-500" : "bg-gray-400"
            }`} />
            <span className="text-sm font-medium text-gray-700">LocalStack</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              localstackStatus.running && localstackStatus.health === "healthy"
                ? "bg-green-100 text-green-800"
                : localstackStatus.running ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-600"
            }`}>
              {localstackStatus.running
                ? localstackStatus.health === "healthy" ? "Running" : "Unhealthy"
                : "Stopped"}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          {/* Mailpit */}
          <button onClick={() => setShowMailpit(true)} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors" title="Open Mailpit Inbox">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${mailpit.status === "healthy" ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-sm font-medium text-gray-700">Mailpit</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${mailpit.status === "healthy" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
              {mailpit.status === "healthy" ? "Running" : "Unavailable"}
            </span>
            {mailpit.unread > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {mailpit.unread} unread
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-gray-200" />

          {/* PostgreSQL */}
          <Link href="/postgres" className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors" title="PostgreSQL">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${serviceDotClass(postgres.status)}`} />
            <span className="text-sm font-medium text-gray-700">PostgreSQL</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(postgres.status)}`}>
              {serviceLabel(postgres.status)}
            </span>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {/* Redis */}
          <button onClick={() => setShowRedis(true)} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors" title="Open Redis Cache">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${serviceDotClass(redis.status)}`} />
            <span className="text-sm font-medium text-gray-700">Redis</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(redis.status)}`}>
              {serviceLabel(redis.status)}
            </span>
          </button>

        </div>
        )}

        {/* AWS Resource Management — skeleton when loading, real content when loaded */}
        {loading ? (
          <ResourcesPanelSkeleton />
        ) : (
        <div className="mb-8">
          {localstackStatus.running ? (
            <ResourceList
              resources={resources}
              onDestroy={handleDestroyResources}
              projectName={projectName}
              loading={destroyLoading}
              onRefresh={loadInitialData}
              onAddS3={() => handleCreateSingleResource("s3")}
              onAddDynamoDB={() => handleCreateSingleResource("dynamodb")}
              onAddSecrets={() => handleCreateSingleResource("secretsmanager")}
              onAddLambda={() => handleCreateSingleResource("lambda")}
              onAddAPIGateway={() => handleCreateSingleResource("apigateway")}
              onAddSSM={() => handleCreateSingleResource("ssm")}
              onAddIAM={() => setShowIAMConfig(true)}
              refreshLoading={loading}
              addLoading={createLoading}
              onViewS3={(bucketName) => {
                setSelectedS3Bucket(bucketName);
                setShowBuckets(true);
              }}
              onViewDynamoDB={(tableName) => {
                setSelectedDynamoDBTable(tableName);
                setShowDynamoDB(true);
              }}
              onViewSecretsManager={(name) => {
                openSecretsViewer(name);
              }}
              onEditSSM={(name) => {
                openSSMViewer(name);
              }}
              onViewLambdaCode={(name) => {
                openLambdaViewer(name);
              }}
              onConfigureAPIGateway={(apiId, apiName) => openAPIGatewayViewer(apiId, apiName)}
              onViewIAMRole={(name) => openIAMRoleViewer(name)}
              firstResourceLoading={firstResourceLoading}
            />
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200">
              {/* Same header structure as ResourceList */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">AWS Resources</h3>
                  <p className="text-xs text-gray-500 mt-0.5">LocalStack is not running</p>
                </div>
              </div>
              {/* Stopped state */}
              <div className="px-6 py-14 text-center">
                <Icon icon="logos:aws" className="w-14 h-14 opacity-10 mx-auto mb-4" />
                <h4 className="text-sm font-semibold text-gray-700 mb-1">LocalStack is stopped</h4>
                <p className="text-sm text-gray-500 mb-4">Start the stack to manage your AWS resources.</p>
                <code className="inline-block bg-gray-100 text-gray-700 text-xs font-mono px-3 py-1.5 rounded-md">
                  docker compose up -d
                </code>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            LocalCloud Kit v{packageJson.version} • Local Cloud Development Environment
          </p>
        </div>
      </div>

      {/* Modals */}

      {inspectConfig && (
        <QuickInspectModal
          isOpen={!!inspectConfig}
          onClose={() => setInspectTarget(null)}
          title={inspectConfig.title}
          subtitle={inspectConfig.subtitle}
          quickChecks={inspectConfig.quickChecks}
          actions={inspectConfig.actions}
        />
      )}

      {showDynamoDBConfig && (
        <DynamoDBConfigModal
          isOpen={showDynamoDBConfig}
          onClose={() => setShowDynamoDBConfig(false)}
          onSubmit={handleCreateDynamoDBTable}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showS3Config && (
        <S3ConfigModal
          isOpen={showS3Config}
          onClose={() => setShowS3Config(false)}
          onSubmit={handleCreateS3Bucket}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showSecretsConfig && (
        <SecretsConfigModal
          isOpen={showSecretsConfig}
          onClose={() => setShowSecretsConfig(false)}
          onSubmit={handleCreateSecret}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showLogs && (
        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      )}

      {showBuckets && (
        <BucketViewer
          isOpen={showBuckets}
          onClose={() => { setShowBuckets(false); setSelectedS3Bucket(""); }}
          projectName={projectName}
          selectedBucketName={selectedS3Bucket}
        />
      )}

      {showDynamoDB && (
        <DynamoDBViewer
          isOpen={showDynamoDB}
          onClose={() => { setShowDynamoDB(false); setSelectedDynamoDBTable(""); }}
          projectName={projectName}
          selectedTableName={selectedDynamoDBTable}
        />
      )}

      {showSecretsManager && selectedSecretName && (
        <SecretsDetailModal
          isOpen={showSecretsManager}
          onClose={() => { setShowSecretsManager(false); setSelectedSecretName(""); }}
          secretName={selectedSecretName}
          projectName={projectName}
          onDeleted={loadInitialData}
        />
      )}

      {showMailpit && (
        <MailpitModal onClose={() => setShowMailpit(false)} />
      )}

      {showRedis && (
        <RedisModal onClose={() => setShowRedis(false)} />
      )}

      {showLambdaConfig && (
        <LambdaConfigModal
          isOpen={showLambdaConfig}
          onClose={() => setShowLambdaConfig(false)}
          onSubmit={handleCreateLambda}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showAPIGatewayConfig && (
        <APIGatewayConfigModal
          isOpen={showAPIGatewayConfig}
          onClose={() => setShowAPIGatewayConfig(false)}
          onSubmit={handleCreateAPIGateway}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showSSMEdit && editingSSMParameter && (
        <SSMEditModal
          isOpen={showSSMEdit}
          onClose={() => { setShowSSMEdit(false); setEditingSSMParameter(""); }}
          onSave={handleSaveSSMParameter}
          parameterName={editingSSMParameter}
          loading={createLoading}
        />
      )}

      {showLambdaCode && viewingLambdaFunction && (
        <LambdaCodeModal
          isOpen={showLambdaCode}
          onClose={() => { setShowLambdaCode(false); setViewingLambdaFunction(""); }}
          functionName={viewingLambdaFunction}
        />
      )}

      {showIAMRolePolicies && viewingIAMRole && (
        <IAMRolePoliciesModal
          isOpen={showIAMRolePolicies}
          onClose={() => { setShowIAMRolePolicies(false); setViewingIAMRole(""); }}
          roleName={viewingIAMRole}
        />
      )}

      {configuringAPIGateway && (
        <APIGatewayConfigViewer
          isOpen={!!configuringAPIGateway}
          onClose={() => setConfiguringAPIGateway(null)}
          apiId={configuringAPIGateway.apiId}
          apiName={configuringAPIGateway.apiName}
        />
      )}

      {showSSMConfig && (
        <SSMConfigModal
          isOpen={showSSMConfig}
          onClose={() => setShowSSMConfig(false)}
          onSubmit={handleCreateSSMParameter}
          projectName={projectName}
          loading={createLoading}
        />
      )}

      {showIAMConfig && (
        <IAMConfigModal
          isOpen={showIAMConfig}
          onClose={() => setShowIAMConfig(false)}
          onSubmit={handleCreateIAMRole}
          projectName={projectName}
          loading={createLoading}
        />
      )}
    </div>
  );
}
