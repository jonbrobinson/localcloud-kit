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
import { Icon } from "@iconify/react";
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
import DashboardSkeleton from "./DashboardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import S3ConfigModal from "./S3ConfigModal";
import SecretsConfigModal from "./SecretsConfigModal";
import SecretsManagerViewer from "./SecretsManagerViewer";

export default function Dashboard() {
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
  const { profile, projects, updateProfile } = usePreferences();

  const projectName = profile?.active_project_name || config.projectName;

  const [showDynamoDBConfig, setShowDynamoDBConfig] = useState(false);
  const [showS3Config, setShowS3Config] = useState(false);
  const [showSecretsConfig, setShowSecretsConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showBuckets, setShowBuckets] = useState(false);
  const [showDynamoDB, setShowDynamoDB] = useState(false);
  const [showSecretsManager, setShowSecretsManager] = useState(false);
  const [showMailpit, setShowMailpit] = useState(false);
  const [showRedis, setShowRedis] = useState(false);

  const [selectedDynamoDBTable, setSelectedDynamoDBTable] = useState<string>("");
  const [selectedS3Bucket, setSelectedS3Bucket] = useState<string>("");

  const [createLoading, setCreateLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);

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

  // Dropdowns
  const [showResourcesMenu, setShowResourcesMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);
  const servicesMenuRef = useRef<HTMLDivElement>(null);
  const docsMenuRef = useRef<HTMLDivElement>(null);
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
    setShowProjectMenu(false);
    setShowProfileMenu(false);
  };

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
    if (resourceType === "dynamodb") { setShowDynamoDBConfig(true); return; }
    if (resourceType === "s3") { setShowS3Config(true); return; }
    if (resourceType === "secretsmanager") { setShowSecretsConfig(true); return; }

    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingle(projectName, resourceType);
      if (response.success) {
        toast.success(`${resourceType} resource created successfully`);
        setTimeout(async () => { await loadInitialData(); }, 1000);
      } else {
        toast.error(response.error || `Failed to create ${resourceType} resource`);
      }
    } catch (error) {
      console.error(`Create ${resourceType} resource error:`, error);
      toast.error(`Failed to create ${resourceType} resource: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateDynamoDBTable = async (dynamodbConfig: DynamoDBTableConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "dynamodb", { dynamodbConfig });
      if (response.success) {
        toast.success("DynamoDB table created successfully");
        setShowDynamoDBConfig(false);
        setTimeout(async () => { await loadInitialData(); }, 1000);
      } else {
        toast.error(response.error || "Failed to create DynamoDB table");
      }
    } catch (error) {
      console.error("Create DynamoDB table error:", error);
      toast.error(`Failed to create DynamoDB table: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateS3Bucket = async (s3Config: S3BucketConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "s3", { s3Config });
      if (response.success) {
        toast.success("S3 bucket created successfully");
        setShowS3Config(false);
        setTimeout(async () => { await loadInitialData(); }, 1000);
      } else {
        toast.error(response.error || "Failed to create S3 bucket");
      }
    } catch (error) {
      console.error("Create S3 bucket error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create S3 bucket"));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateSecret = async (secretsmanagerConfig: import("@/types").SecretsManagerConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "secretsmanager", { secretsmanagerConfig });
      if (response.success) {
        toast.success("Secret created successfully");
        setShowSecretsConfig(false);
        setTimeout(async () => { await loadInitialData(); }, 1000);
      } else {
        toast.error(response.error || "Failed to create secret");
      }
    } catch (error) {
      console.error("Create secret error:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (error as any)?.response?.data?.error;
      toast.error(apiMessage || (error instanceof Error ? error.message : "Failed to create secret"));
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

  const serviceStatusClass = (status: string) => {
    if (status === "running") return "bg-green-100 text-green-800";
    if (status === "stopped") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-600";
  };
  const serviceDotClass = (status: string) => {
    if (status === "running") return "bg-green-500";
    if (status === "stopped") return "bg-red-500";
    return "bg-gray-400";
  };
  const serviceLabel = (status: string) => {
    if (status === "running") return "Running";
    if (status === "stopped") return "Stopped";
    return "Unknown";
  };

  if (loading) {
    return (
      <AnimatePresence mode="wait">
        <DashboardSkeleton key="skeleton" />
      </AnimatePresence>
    );
  }

  if (error) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100"
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
    <AnimatePresence mode="wait">
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={40} height={40} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Local Cloud Development Environment • v{packageJson.version}</p>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-0.5">

              {/* Resources dropdown — AWS resources only */}
              <div className="relative" ref={resourcesMenuRef}>
                <button
                  onClick={() => { setShowResourcesMenu((v) => !v); setShowServicesMenu(false); setShowDocsMenu(false); setShowProjectMenu(false); setShowProfileMenu(false); }}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Resources
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showResourcesMenu ? "rotate-180" : ""}`} />
                </button>
                {showResourcesMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {/* Storage */}
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</p>
                    <button
                      onClick={() => { setShowBuckets(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 flex-shrink-0" />
                      S3 Buckets
                    </button>

                    {/* Database */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Database</p>
                    <button
                      onClick={() => { setShowDynamoDB(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 flex-shrink-0" />
                      DynamoDB Tables
                    </button>

                    {/* Security & Identity */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Security & Identity</p>
                    <button
                      onClick={() => { setShowSecretsConfig(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 flex-shrink-0" />
                      Secrets Manager
                    </button>

                  </div>
                )}
              </div>

              {/* Services dropdown — platform services */}
              <div className="relative" ref={servicesMenuRef}>
                <button
                  onClick={() => { setShowServicesMenu((v) => !v); setShowResourcesMenu(false); setShowDocsMenu(false); setShowProjectMenu(false); setShowProfileMenu(false); }}
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
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {/* Alphabetical: Keycloak, Mailpit, PostgreSQL, Redis */}
                    <Link
                      href="/keycloak"
                      onClick={() => closeAllMenus()}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Keycloak
                    </Link>
                    <button
                      onClick={() => { setShowMailpit(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Mailpit Inbox
                      {mailpit.unread > 0 && (
                        <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs font-bold bg-red-500 text-white leading-none">
                          {mailpit.unread > 99 ? "99+" : mailpit.unread}
                        </span>
                      )}
                    </button>
                    <Link
                      href="/postgres"
                      onClick={() => closeAllMenus()}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                      PostgreSQL
                    </Link>
                    <button
                      onClick={() => { setShowRedis(true); closeAllMenus(); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Redis Cache
                    </button>
                  </div>
                )}
              </div>

              {/* Docs dropdown */}
              <div className="relative" ref={docsMenuRef}>
                <button
                  onClick={() => { setShowDocsMenu((v) => !v); setShowResourcesMenu(false); setShowServicesMenu(false); setShowProjectMenu(false); setShowProfileMenu(false); }}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Docs
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showDocsMenu ? "rotate-180" : ""}`} />
                </button>
                {showDocsMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                    {/* Infrastructure */}
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
                      href="/dynamodb"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 flex-shrink-0" />
                      DynamoDB
                    </Link>
                    <Link
                      href="/s3"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 flex-shrink-0" />
                      S3 Buckets
                    </Link>
                    <Link
                      href="/secrets"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 flex-shrink-0" />
                      Secrets Manager
                    </Link>

                    {/* Platform Services */}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform Services</p>
                    <Link
                      href="/keycloak"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Keycloak
                    </Link>
                    <Link
                      href="/mailpit"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Mailpit
                    </Link>
                    <Link
                      href="/postgres"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CircleStackIcon className="h-4 w-4 mr-3 text-gray-400" />
                      PostgreSQL
                    </Link>
                    <Link
                      href="/redis"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ServerIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Redis Cache
                    </Link>
                  </div>
                )}
              </div>

              {/* Divider before project + profile */}
              <div className="h-5 w-px bg-gray-200 mx-1.5" />

              {/* Project Switcher */}
              <div className="relative" ref={projectMenuRef}>
                <button
                  onClick={() => { setShowProjectMenu((v) => !v); setShowResourcesMenu(false); setShowServicesMenu(false); setShowDocsMenu(false); setShowProfileMenu(false); }}
                  className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
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

              {/* Profile dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => { setShowProfileMenu((v) => !v); setShowResourcesMenu(false); setShowServicesMenu(false); setShowDocsMenu(false); setShowProjectMenu(false); dismissVersionDot(); }}
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
                    <div className="border-t border-gray-100 my-1" />
                    <p className="px-4 pt-1 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dev Tools</p>
                    <button
                      onClick={() => { setShowLogs(true); setShowProfileMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Logs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Services status bar — alphabetical: Keycloak, LocalStack, Mailpit, PostgreSQL, Redis */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center flex-wrap gap-y-2 gap-x-0">

          {/* Keycloak */}
          <Link
            href="/keycloak"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title="Keycloak — click to view admin info"
          >
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${serviceDotClass(keycloak.status)}`} />
            <span className="text-sm font-medium text-gray-700">Keycloak</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(keycloak.status)}`}>
              {serviceLabel(keycloak.status)}
            </span>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {/* LocalStack */}
          <div className="flex items-center space-x-2 px-3">
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

          {/* Mailpit */}
          <button
            onClick={() => setShowMailpit(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
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

          <div className="h-4 w-px bg-gray-200" />

          {/* PostgreSQL */}
          <Link
            href="/postgres"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title="PostgreSQL — click to view connection info"
          >
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${serviceDotClass(postgres.status)}`} />
            <span className="text-sm font-medium text-gray-700">PostgreSQL</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(postgres.status)}`}>
              {serviceLabel(postgres.status)}
            </span>
          </Link>

          <div className="h-4 w-px bg-gray-200" />

          {/* Redis */}
          <button
            onClick={() => setShowRedis(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title="Open Redis Cache"
          >
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${serviceDotClass(redis.status)}`} />
            <span className="text-sm font-medium text-gray-700">Redis</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${serviceStatusClass(redis.status)}`}>
              {serviceLabel(redis.status)}
            </span>
          </button>

        </div>

        {/* AWS Resource Management — always visible */}
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
              onViewSecretsManager={() => setShowSecretsManager(true)}
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

      {showSecretsManager && (
        <SecretsManagerViewer
          isOpen={showSecretsManager}
          onClose={() => setShowSecretsManager(false)}
          projectName={projectName}
        />
      )}

      {showMailpit && (
        <MailpitModal onClose={() => setShowMailpit(false)} />
      )}

      {showRedis && (
        <RedisModal onClose={() => setShowRedis(false)} />
      )}
    </motion.div>
    </AnimatePresence>
  );
}
