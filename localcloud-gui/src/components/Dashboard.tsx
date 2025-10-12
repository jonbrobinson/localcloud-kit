"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  ArrowPathIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { DynamoDBTableConfig, S3BucketConfig } from "@/types";
import { resourceApi } from "@/services/api";
import { useLocalStackData } from "@/hooks/useLocalStackData";
import StatusCard from "./StatusCard";
import ResourceList from "./ResourceList";

import DynamoDBConfigModal from "./DynamoDBConfigModal";
import S3ConfigModal from "./S3ConfigModal";
import LogViewer from "./LogViewer";
import BucketViewer from "./BucketViewer";
import DynamoDBViewer from "./DynamoDBViewer";
import SecretsManagerViewer from "./SecretsManagerViewer";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const {
    localstackStatus,
    projectConfig: config,
    resources,
    loading,
    error,
    refetch: loadInitialData,
  } = useLocalStackData();

  const [showDynamoDBConfig, setShowDynamoDBConfig] = useState(false);
  const [showS3Config, setShowS3Config] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showBuckets, setShowBuckets] = useState(false);
  const [showDynamoDB, setShowDynamoDB] = useState(false);
  const [showSecretsManager, setShowSecretsManager] = useState(false);

  const [selectedDynamoDBTable, setSelectedDynamoDBTable] =
    useState<string>("");
  const [selectedS3Bucket, setSelectedS3Bucket] = useState<string>("");

  // Loading states for buttons
  const [createLoading, setCreateLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);

  // Debug logging
  console.log("Dashboard render - config:", config);

  const handleCreateSingleResource = async (resourceType: string) => {
    // Special handling for DynamoDB and S3 - show config modals instead
    if (resourceType === "dynamodb") {
      setShowDynamoDBConfig(true);
      return;
    }

    if (resourceType === "s3") {
      setShowS3Config(true);
      return;
    }

    if (resourceType === "secretsmanager") {
      setShowSecretsManager(true);
      return;
    }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingle(
        config.projectName,
        resourceType
      );
      if (response.success) {
        toast.success(`${resourceType} resource created successfully`);
        setTimeout(async () => {
          await loadInitialData();
        }, 1000);
      } else {
        toast.error(
          response.error || `Failed to create ${resourceType} resource`
        );
      }
    } catch (error) {
      console.error(`Create ${resourceType} resource error:`, error);
      toast.error(
        `Failed to create ${resourceType} resource: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateDynamoDBTable = async (
    dynamodbConfig: DynamoDBTableConfig
  ) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(
        config.projectName,
        "dynamodb",
        { dynamodbConfig }
      );
      if (response.success) {
        toast.success("DynamoDB table created successfully");
        setShowDynamoDBConfig(false);
        setTimeout(async () => {
          await loadInitialData();
        }, 1000);
      } else {
        toast.error(response.error || "Failed to create DynamoDB table");
      }
    } catch (error) {
      console.error("Create DynamoDB table error:", error);
      toast.error(
        `Failed to create DynamoDB table: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateS3Bucket = async (s3Config: S3BucketConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(
        config.projectName,
        "s3",
        { s3Config }
      );
      if (response.success) {
        toast.success("S3 bucket created successfully");
        setShowS3Config(false);
        setTimeout(async () => {
          await loadInitialData();
        }, 1000);
      } else {
        toast.error(response.error || "Failed to create S3 bucket");
      }
    } catch (error) {
      console.error("Create S3 bucket error:", error);
      toast.error(
        `Failed to create S3 bucket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDestroyResources = async (resourceIds: string[]) => {
    setDestroyLoading(true);
    try {
      const response = await resourceApi.destroy({
        projectName: config.projectName,
        resourceIds: resourceIds,
      });

      if (response.success) {
        toast.success("Resources destroyed successfully");
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to destroy resources");
      }
    } catch (error) {
      console.error("Destroy resources error:", error);
      toast.error(
        `Failed to destroy resources: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDestroyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Image
              src="/logo.svg"
              alt="CloudStack Solutions"
              width={32}
              height={32}
            />
            <h2 className="text-xl font-bold text-gray-900">
              CloudStack Solutions
            </h2>
          </div>
          <p className="text-gray-600">Loading LocalCloud Kit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt="CloudStack Solutions"
                  width={40}
                  height={40}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    LocalCloud Kit
                  </h1>
                  <p className="text-sm text-gray-500">
                    by CloudStack Solutions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-600">
                  Enterprise AWS Development
                </p>
                <p className="text-xs text-gray-400">v0.5.3</p>
              </div>
              <button
                onClick={() => setShowLogs(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Logs
              </button>
              <button
                onClick={() => setShowBuckets(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                S3 Buckets
              </button>
              <button
                onClick={() => setShowDynamoDB(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                🗄️ DynamoDB Tables
              </button>
              <Link
                href="/cache"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                🧊 Redis Cache
              </Link>
              <Link
                href="/connect"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                🔗 Connect
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* LocalStack Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              LocalStack Status
            </h2>
            <div className="text-sm text-gray-500">
              Use{" "}
              <code className="bg-gray-100 px-1 rounded">
                docker compose up -d
              </code>{" "}
              to start LocalStack
            </div>
          </div>
          <StatusCard status={localstackStatus} />
        </div>

        {/* Resource Management */}
        {localstackStatus.running && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadInitialData}
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ArrowPathIcon
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                {/* Individual Resource Creation Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCreateSingleResource("s3")}
                    disabled={createLoading}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    title="Create S3 Bucket"
                  >
                    🪣 S3
                  </button>
                  <button
                    onClick={() => handleCreateSingleResource("dynamodb")}
                    disabled={createLoading}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    title="Create DynamoDB Table"
                  >
                    🗄️ DynamoDB
                  </button>
                  <button
                    onClick={() => handleCreateSingleResource("secretsmanager")}
                    disabled={createLoading}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                    title="Create Secrets Manager Secret"
                  >
                    🔑 Secrets
                  </button>
                </div>
              </div>
            </div>
            <ResourceList
              resources={resources}
              onDestroy={handleDestroyResources}
              projectName={config.projectName}
              loading={destroyLoading}
              onViewS3={(bucketName) => {
                setSelectedS3Bucket(bucketName);
                setShowBuckets(true);
              }}
              onViewDynamoDB={(tableName) => {
                setSelectedDynamoDBTable(tableName);
                setShowDynamoDB(true);
              }}
              onViewCache={() => {
                router.push("/cache");
              }}
              onViewSecretsManager={() => {
                setShowSecretsManager(true);
              }}
            />
          </div>
        )}

        {/* Configuration Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.projectName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                AWS Region
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.awsRegion}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endpoint
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.awsEndpoint}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Image
              src="/logo.svg"
              alt="CloudStack Solutions"
              width={24}
              height={24}
            />
            <span className="text-sm text-gray-600">
              Powered by CloudStack Solutions
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Enterprise AWS Development Tools • LocalCloud Kit v0.5.6
          </p>
        </div>
      </div>

      {/* Modals */}

      {showDynamoDBConfig && (
        <DynamoDBConfigModal
          isOpen={showDynamoDBConfig}
          onClose={() => setShowDynamoDBConfig(false)}
          onSubmit={handleCreateDynamoDBTable}
          projectName={config.projectName}
          loading={createLoading}
        />
      )}

      {showS3Config && (
        <S3ConfigModal
          isOpen={showS3Config}
          onClose={() => setShowS3Config(false)}
          onSubmit={handleCreateS3Bucket}
          projectName={config.projectName}
          loading={createLoading}
        />
      )}

      {showLogs && (
        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      )}

      {showBuckets && (
        <BucketViewer
          isOpen={showBuckets}
          onClose={() => {
            setShowBuckets(false);
            setSelectedS3Bucket("");
          }}
          projectName={config.projectName}
          selectedBucketName={selectedS3Bucket}
        />
      )}

      {showDynamoDB && (
        <DynamoDBViewer
          isOpen={showDynamoDB}
          onClose={() => {
            setShowDynamoDB(false);
            setSelectedDynamoDBTable("");
          }}
          projectName={config.projectName}
          selectedTableName={selectedDynamoDBTable}
        />
      )}

      {showSecretsManager && (
        <SecretsManagerViewer
          isOpen={showSecretsManager}
          onClose={() => {
            setShowSecretsManager(false);
          }}
          projectName={config.projectName}
        />
      )}
    </div>
  );
}
