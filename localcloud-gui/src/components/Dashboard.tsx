"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { useServicesData } from "@/hooks/useServicesData";
import { projectsApi, resourceApi } from "@/services/api";
import { DynamoDBTableConfig, S3BucketConfig } from "@/types";
import {
  BookOpenIcon,
  ChevronDownIcon,
  CircleStackIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FolderIcon,
  KeyIcon,
  ServerIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ResourceList from "./ResourceList";

import Image from "next/image";
import Link from "next/link";
import packageJson from "../../package.json";
import BucketViewer from "./BucketViewer";
import DynamoDBConfigModal from "./DynamoDBConfigModal";
import DynamoDBViewer from "./DynamoDBViewer";
import LogViewer from "./LogViewer";
import MailpitModal from "./MailpitModal";
import RedisModal from "./RedisModal";
import S3ConfigModal from "./S3ConfigModal";
import SecretsManagerViewer from "./SecretsManagerViewer";

export default function Dashboard() {
  const {
    localstack,
    mailpit,
    redis,
    loading,
    error,
    refetch: loadInitialData,
  } = useServicesData();

  const { status: localstackStatus, projectConfig: config, resources } = localstack;
  const { profile, projects, updateProfile } = usePreferences();

  // Derive projectName: active project from preferences, fall back to config from API
  const projectName = profile?.active_project_name || config.projectName;

  const [showDynamoDBConfig, setShowDynamoDBConfig] = useState(false);
  const [showS3Config, setShowS3Config] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showBuckets, setShowBuckets] = useState(false);
  const [showDynamoDB, setShowDynamoDB] = useState(false);
  const [showSecretsManager, setShowSecretsManager] = useState(false);
  const [showMailpit, setShowMailpit] = useState(false);
  const [showRedis, setShowRedis] = useState(false);

  const [selectedDynamoDBTable, setSelectedDynamoDBTable] =
    useState<string>("");
  const [selectedS3Bucket, setSelectedS3Bucket] = useState<string>("");

  // Loading states for buttons
  const [createLoading, setCreateLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);

  // Dropdowns
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const docsMenuRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
      if (docsMenuRef.current && !docsMenuRef.current.contains(e.target as Node)) {
        setShowDocsMenu(false);
      }
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      const project = await projectsApi.create(name, label);
      await updateProfile({ active_project_id: project.id });
      setShowProjectMenu(false);
      await loadInitialData();
      toast.success(`Project "${label}" created`);
    } catch {
      toast.error("Failed to create project");
    }
  };


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
        projectName,
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
        projectName,
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
        projectName,
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
        projectName: projectName,
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
              alt="LocalCloud Kit"
              width={32}
              height={32}
            />
            <h2 className="text-xl font-bold text-gray-900">
              LocalCloud Kit
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
            {/* Logo + Title */}
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="LocalCloud Kit"
                width={40}
                height={40}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  LocalCloud Kit
                </h1>
                <p className="text-xs text-gray-500">
                  Local Cloud Development Environment • v{packageJson.version}
                </p>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center space-x-3">
              {/* Resources dropdown */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => { setShowToolsMenu((v) => !v); setShowDocsMenu(false); }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Resources
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showToolsMenu ? "rotate-180" : ""}`} />
                </button>
                {showToolsMenu && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {/* AWS */}
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS</p>
                    <button
                      onClick={() => { setShowDynamoDB(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                      DynamoDB Tables
                    </button>
                    <button
                      onClick={() => { setShowBuckets(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FolderIcon className="h-4 w-4 mr-3 text-gray-400" />
                      S3 Buckets
                    </button>
                    <button
                      onClick={() => { setShowSecretsManager(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Secrets Manager
                    </button>

                    {/* Cache */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cache</p>
                    <button
                      onClick={() => { setShowRedis(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Redis Cache
                    </button>

                    {/* Inbox */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Inbox</p>
                    <button
                      onClick={() => { setShowMailpit(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Mailpit
                    </button>

                    {/* Logs */}
                    <div className="border-t border-gray-100 mt-1" />
                    <button
                      onClick={() => { setShowLogs(true); setShowToolsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Logs
                    </button>
                  </div>
                )}
              </div>

              {/* Docs dropdown */}
              <div className="relative" ref={docsMenuRef}>
                <button
                  onClick={() => { setShowDocsMenu((v) => !v); setShowToolsMenu(false); }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Docs
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showDocsMenu ? "rotate-180" : ""}`} />
                </button>
                {showDocsMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {/* LocalStack */}
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Infrastructure</p>
                    <Link
                      href="/localstack"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />
                      LocalStack
                    </Link>

                    {/* AWS Resources */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS Resources</p>
                    <Link
                      href="/s3"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FolderIcon className="h-4 w-4 mr-3 text-gray-400" />
                      S3 Buckets
                    </Link>
                    <Link
                      href="/dynamodb"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                      DynamoDB
                    </Link>
                    <Link
                      href="/secrets"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Secrets Manager
                    </Link>

                    {/* Services */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Services</p>
                    <Link
                      href="/redis"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Redis Cache
                    </Link>
                    <Link
                      href="/mailpit"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Inbox
                    </Link>
                  </div>
                )}
              </div>

              {/* Project Switcher */}
              <div className="relative" ref={projectMenuRef}>
                <button
                  onClick={() => { setShowProjectMenu((v) => !v); setShowToolsMenu(false); setShowDocsMenu(false); }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0" />
                  {profile?.active_project_label || "Default"}
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showProjectMenu ? "rotate-180" : ""}`} />
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
                        <span className={`h-2 w-2 rounded-full mr-3 flex-shrink-0 ${p.id === profile?.active_project_id ? "bg-blue-500" : "bg-gray-300"}`} />
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

              {/* Profile icon */}
              <Link
                href="/profile"
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Profile & Preferences"
              >
                <UserCircleIcon className="h-6 w-6" />
              </Link>

            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Services status bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center space-x-6">
          {/* LocalStack */}
          <div className="flex items-center space-x-2">
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
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

          {/* Redis */}
          <button
            onClick={() => setShowRedis(true)}
            className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            title="Open Redis Cache"
          >
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
              redis.status === "running" ? "bg-green-500" :
              redis.status === "stopped" ? "bg-red-500" : "bg-gray-400"
            }`} />
            <span className="text-sm font-medium text-gray-700">Redis</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              redis.status === "running" ? "bg-green-100 text-green-800" :
              redis.status === "stopped" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-600"
            }`}>
              {redis.status === "running" ? "Running" : redis.status === "stopped" ? "Stopped" : "Unknown"}
            </span>
          </button>

          <div className="h-4 w-px bg-gray-200" />

          {/* Mailpit */}
          <button
            onClick={() => setShowMailpit(true)}
            className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            title="Open Mailpit Inbox"
          >
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
              mailpit.status === "healthy" ? "bg-green-500" : "bg-gray-400"
            }`} />
            <span className="text-sm font-medium text-gray-700">Mailpit</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              mailpit.status === "healthy" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}>
              {mailpit.status === "healthy" ? "Running" : "Unavailable"}
            </span>
            {mailpit.unread > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {mailpit.unread} unread
              </span>
            )}
          </button>

          {!localstackStatus.running && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs text-gray-500">
                Run <code className="bg-gray-100 px-1 rounded">docker compose up -d</code> to start
              </span>
            </>
          )}
        </div>

        {/* Resource Management */}
        {localstackStatus.running && (
          <div className="mb-8">
            <ResourceList
              resources={resources}
              onDestroy={handleDestroyResources}
              projectName={projectName}
              loading={destroyLoading}
              onRefresh={loadInitialData}
              onAddS3={() => handleCreateSingleResource("s3")}
              onAddDynamoDB={() => handleCreateSingleResource("dynamodb")}
              onAddSecrets={() => handleCreateSingleResource("secretsmanager")}
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
              onViewCache={() => setShowRedis(true)}
              onViewSecretsManager={() => {
                setShowSecretsManager(true);
              }}
              onViewMailpit={() => setShowMailpit(true)}
            />
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
          projectName={projectName}
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
          projectName={projectName}
          selectedTableName={selectedDynamoDBTable}
        />
      )}

      {showSecretsManager && (
        <SecretsManagerViewer
          isOpen={showSecretsManager}
          onClose={() => {
            setShowSecretsManager(false);
          }}
          projectName={projectName}
        />
      )}

      {showMailpit && (
        <MailpitModal onClose={() => setShowMailpit(false)} />
      )}

      {showRedis && (
        <RedisModal onClose={() => setShowRedis(false)} />
      )}
    </div>
  );
}
