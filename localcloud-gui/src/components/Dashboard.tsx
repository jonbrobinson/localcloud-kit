"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { useServicesData } from "@/hooks/useServicesData";
import { resourceApi } from "@/services/api";
import { DashboardNavActions, DashboardNavProvider, InspectTargetId } from "@/context/DashboardNavContext";
import { DynamoDBTableConfig, S3BucketConfig, LambdaFunctionConfig, APIGatewayConfig, SSMParameterConfig, IAMRoleConfig, Resource } from "@/types";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui";
import { summarizeServiceHealth } from "@/lib/serviceHealth";
import { useMailpitMessages } from "@/hooks/useMailpitMessages";
import ResourceList from "./ResourceList";

import packageJson from "../../package.json";
import BucketViewer from "./BucketViewer";
import DynamoDBConfigModal from "./DynamoDBConfigModal";
import DynamoDBViewer from "./DynamoDBViewer";
import LogViewer from "./LogViewer";
import MailpitModal from "./MailpitModal";
import RedisModal from "./RedisModal";
import { ResourcesPanelSkeleton } from "./DashboardSkeleton";
import MailViewer from "./MailViewer";
import RecentMailCard from "./RecentMailCard";
import ServiceAlert from "./ServiceAlert";
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
import AppNavBar from "./AppNavBar";

const AWS_RESOURCE_TYPES = new Set<Resource["type"]>([
  "s3",
  "dynamodb",
  "lambda",
  "apigateway",
  "secretsmanager",
  "ssm",
  "iam",
]);

export default function Dashboard() {
  const {
    awsEmulator,
    mailpit,
    redis,
    postgres,
    keycloak,
    langfuse,
    loading,
    refreshing,
    error,
    refetch: loadInitialData,
  } = useServicesData();

  const { status: emulatorStatus, projectConfig: config, resources } = awsEmulator;
  const { profile } = usePreferences();

  const projectName = profile?.active_project_name || config.projectName;
  const { messages: recentMail } = useMailpitMessages(3, mailpit.status === "healthy" && mailpit.total > 0);

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
  const [openMailId, setOpenMailId] = useState<string | null>(null);
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

  const openInspectTarget = (target: InspectTargetId) => {
    setInspectTarget(target);
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

  const dashboardNavActions: DashboardNavActions = {
    openS3Buckets: () => setShowBuckets(true),
    openDynamoDBViewer: () => setShowDynamoDB(true),
    openLambdaConfig: () => setShowLambdaConfig(true),
    openLambdaViewer: () => openLambdaViewer(),
    openAPIGatewayConfig: () => setShowAPIGatewayConfig(true),
    openAPIGatewayViewer: () => openAPIGatewayViewer(),
    openSecretsConfig: () => setShowSecretsConfig(true),
    openSecretsViewer: () => openSecretsViewer(),
    openSSMConfig: () => setShowSSMConfig(true),
    openSSMViewer: () => openSSMViewer(),
    openIAMConfig: () => setShowIAMConfig(true),
    openIAMRoleViewer: () => openIAMRoleViewer(),
    openInspectTarget,
    openModal: (modalKey) => {
      if (modalKey === "mailpit") setShowMailpit(true);
      if (modalKey === "redis") setShowRedis(true);
    },
    openLogs: () => setShowLogs(true),
    onAfterProjectSwitch: loadInitialData,
  };

  const serviceHealth = summarizeServiceHealth({
    emulator: emulatorStatus,
    keycloak,
    langfuse,
    mailpit,
    postgres,
    redis,
  });

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
      case "aws-emulator":
        return {
          title: "AWS Emulator",
          subtitle: emulatorStatus.running ? "AWS emulator is running locally" : "AWS Emulator is not running",
          quickChecks: [
            "AWS Emulator shows as running in the Services menu",
            "Endpoint http://localhost:4566 is reachable",
            "AWS resources refresh successfully",
          ],
          actions: withDocs("/aws-emulator"),
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
      case "langfuse":
        return {
          title: "Langfuse",
          subtitle:
            langfuse.status === "running"
              ? "LLM observability is running"
              : langfuse.status === "starting"
                ? "Langfuse is starting (first boot runs migrations)"
                : langfuse.status === "failed"
                  ? "Langfuse is failing — check make langfuse-logs"
                  : "Optional profile — start with make start-langfuse",
          quickChecks: [
            "Langfuse status is running",
            "App uses pk-lf-localcloud / sk-lf-localcloud keys",
            "Test trace appears in the Tracing view",
          ],
          actions: [
            { label: "Open Docs", href: "/langfuse" },
            withAdmin("https://langfuse.localcloudkit.com:3030", "Open Langfuse UI"),
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
          className="flex items-center justify-center min-h-screen bg-bg"
        >
          <div className="text-center">
            <Icon icon="lucide:alert-triangle" width={48} className="text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2">Failed to Load Data</h2>
            <p className="text-muted mb-4">{error.message}</p>
            <Button variant="primary" onClick={loadInitialData}>
              Retry
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <DashboardNavProvider actions={dashboardNavActions}>
      <div className="min-h-screen bg-bg">
        <AppNavBar activePage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Service status lives in the nav's Services menu; only surface it here when something is down. */}
        {!loading && <ServiceAlert down={serviceHealth.down} onViewLogs={() => setShowLogs(true)} />}

        {mailpit.status === "healthy" && mailpit.total > 0 && recentMail.length > 0 && (
          <RecentMailCard
            messages={recentMail}
            total={mailpit.total}
            unread={mailpit.unread}
            onOpenMessage={setOpenMailId}
            onViewAll={() => setShowMailpit(true)}
          />
        )}

        {/* AWS Resource Management — skeleton when loading, real content when loaded */}
        {loading ? (
          <ResourcesPanelSkeleton />
        ) : (
        <div className="mb-8">
          {emulatorStatus.running ? (
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
              refreshLoading={refreshing}
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
            <div className="bg-surface rounded-xl shadow-e1 border border-border overflow-hidden">
              {/* Same header structure as ResourceList */}
              <div className="px-4 py-3.5 border-b border-divider flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">AWS resources</h3>
                  <p className="text-[11px] text-muted mt-0.5">AWS Emulator is not running</p>
                </div>
              </div>
              {/* Stopped state */}
              <div className="px-6 py-14 text-center">
                <Icon icon="logos:aws" className="w-14 h-14 opacity-10 mx-auto mb-4" />
                <h4 className="text-sm font-semibold text-ink-2 mb-1">AWS Emulator is stopped</h4>
                <p className="text-sm text-muted mb-4">Start the stack to manage your AWS resources.</p>
                <code className="inline-block bg-surface-2 text-ink-2 text-xs font-mono px-3 py-1.5 rounded-md border border-border">
                  docker compose up -d
                </code>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-faint">
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
        <MailpitModal
          onClose={() => setShowMailpit(false)}
          onOpenMessage={(id) => {
            setShowMailpit(false);
            setOpenMailId(id);
          }}
        />
      )}

      <MailViewer messageId={openMailId} onClose={() => setOpenMailId(null)} />

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
    </DashboardNavProvider>
  );
}
