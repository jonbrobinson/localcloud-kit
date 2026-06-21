"use client";

import { usePreferences } from "@/context/PreferencesContext";
import {
  InspectTargetId,
  useDashboardNav,
} from "@/context/DashboardNavContext";
import { PLATFORM_SERVICES, PLATFORM_SERVICE_KINDS, SERVICE_KIND_LABEL } from "@/constants/platformServices";
import { useServicesData } from "@/hooks/useServicesData";
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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import packageJson from "../../package.json";
import LogViewer from "./LogViewer";
import MailpitModal from "./MailpitModal";
import RedisModal from "./RedisModal";

const DOC_ROUTES = [
  "/docs", "/aws-emulator", "/s3", "/dynamodb", "/lambda",
  "/apigateway", "/secrets", "/ssm", "/iam",
  "/redis", "/mailpit", "/postgres", "/keycloak",
];

type DashboardNavBarProps = {
  activePage?: "dashboard" | "profile";
};

type ResourceActionOptions = {
  label: string;
  target: InspectTargetId;
  manageHref: string;
  onPreview?: () => void;
};

const INSPECT_FALLBACK_HREF = "/";
const DASHBOARD_FALLBACK_HREF = "/";

export default function DashboardNavBar({
  activePage = "dashboard",
}: DashboardNavBarProps) {
  const router = useRouter();
  const actions = useDashboardNav();
  const { profile, projects, updateProfile, createProject } = usePreferences();
  const {
    mailpit,
  } = useServicesData();

  const prefetchDocRoutes = useCallback(() => {
    DOC_ROUTES.forEach((route) => router.prefetch(route));
  }, [router]);

  const [showLogs, setShowLogs] = useState(false);
  const [showMailpit, setShowMailpit] = useState(false);
  const [showRedis, setShowRedis] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const [hasNewVersion, setHasNewVersion] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem("lck_last_seen_version");
    if (seen !== packageJson.version) setHasNewVersion(true);
  }, []);

  const dismissVersionDot = () => {
    localStorage.setItem("lck_last_seen_version", packageJson.version);
    setHasNewVersion(false);
  };

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

  const toggleMenu = (setter: (v: boolean) => void, current: boolean) => {
    closeAllMenus();
    setter(!current);
  };

  const openInspectTarget = (target: InspectTargetId) => {
    closeAllMenus();
    if (actions) {
      actions.openInspectTarget(target);
      return;
    }
    router.push(INSPECT_FALLBACK_HREF);
  };

  const openActionOrFallback = (
    action: (() => void) | undefined,
    fallbackHref: string
  ) => {
    closeAllMenus();
    if (action) {
      action();
      return;
    }
    router.push(fallbackHref);
  };

  const openModal = (
    modal: "mailpit" | "redis" | "logs"
  ) => {
    closeAllMenus();
    if (actions) {
      if (modal === "logs") {
        actions.openLogs();
      } else {
        actions.openModal(modal);
      }
      return;
    }

    if (modal === "logs") setShowLogs(true);
    if (modal === "mailpit") setShowMailpit(true);
    if (modal === "redis") setShowRedis(true);
  };

  const handleSwitchProject = async (projectId: number) => {
    try {
      await updateProfile({ active_project_id: projectId });
      setShowProjectMenu(false);
      await actions?.onAfterProjectSwitch?.();
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
      await actions?.onAfterProjectSwitch?.();
      toast.success(`Project "${label}" created`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const previewActionClass =
    "inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors";
  const inspectActionClass =
    "inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors";
  const manageActionClass =
    "inline-flex items-center justify-center p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors";

  const renderResourceActions = ({
    label,
    target,
    manageHref,
    onPreview,
  }: ResourceActionOptions) => (
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

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" onClick={closeAllMenus} aria-label="Go to dashboard">
                <Image src="/logo.svg" alt="LocalCloud Kit" width={90} height={36} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">
                  Local Cloud Development Environment
                  {" "}
                  •
                  {" "}
                  v
                  {packageJson.version}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-0.5">
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
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openS3Buckets, "/manage/s3")}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                        S3 Buckets
                      </button>
                      {renderResourceActions({
                        label: "S3 Buckets",
                        target: "s3",
                        manageHref: "/manage/s3",
                        onPreview: () => openActionOrFallback(actions?.openS3Buckets, "/manage/s3"),
                      })}
                    </div>

                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Database</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openDynamoDBViewer, "/manage/dynamodb")}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                        DynamoDB
                      </button>
                      {renderResourceActions({
                        label: "DynamoDB",
                        target: "dynamodb",
                        manageHref: "/manage/dynamodb",
                        onPreview: () => openActionOrFallback(actions?.openDynamoDBViewer, "/manage/dynamodb"),
                      })}
                    </div>

                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Compute</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openLambdaConfig, DASHBOARD_FALLBACK_HREF)}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                        Lambda
                      </button>
                      {renderResourceActions({
                        label: "Lambda",
                        target: "lambda",
                        manageHref: "/manage/lambda",
                        onPreview: () => openActionOrFallback(actions?.openLambdaViewer, "/manage/lambda"),
                      })}
                    </div>

                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Networking</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openAPIGatewayConfig, DASHBOARD_FALLBACK_HREF)}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                        API Gateway
                      </button>
                      {renderResourceActions({
                        label: "API Gateway",
                        target: "apigateway",
                        manageHref: "/manage/apigateway",
                        onPreview: () => openActionOrFallback(actions?.openAPIGatewayViewer, "/manage/apigateway"),
                      })}
                    </div>

                    <div className="border-t border-gray-100 mt-1" />
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Security & Identity</p>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openSecretsConfig, DASHBOARD_FALLBACK_HREF)}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                        Secrets Manager
                      </button>
                      {renderResourceActions({
                        label: "Secrets Manager",
                        target: "secretsmanager",
                        manageHref: "/manage/secrets",
                        onPreview: () => openActionOrFallback(actions?.openSecretsViewer, "/manage/secrets"),
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openSSMConfig, DASHBOARD_FALLBACK_HREF)}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                        Parameter Store
                      </button>
                      {renderResourceActions({
                        label: "Parameter Store",
                        target: "ssm",
                        manageHref: "/manage/ssm",
                        onPreview: () => openActionOrFallback(actions?.openSSMViewer, "/manage/ssm"),
                      })}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openIAMConfig, DASHBOARD_FALLBACK_HREF)}
                        className="flex items-center flex-1 px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                        IAM Roles
                      </button>
                      {renderResourceActions({
                        label: "IAM Roles",
                        target: "iam",
                        manageHref: "/manage/iam",
                        onPreview: () => openActionOrFallback(actions?.openIAMRoleViewer, "/manage/iam"),
                      })}
                    </div>
                  </div>
                )}
              </div>

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
                      const items = PLATFORM_SERVICES.filter((service) => service.kind === kind);
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
                                    onClick={closeAllMenus}
                                    className="flex items-center flex-1 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  >
                                    {itemContent}
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => openModal(action.modalKey)}
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
                          href="/aws-emulator"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />
                          AWS Emulator
                        </Link>
                      </div>

                      <div className="rounded-md border border-gray-100 py-1">
                        <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS Resources</p>
                        <Link href="/dynamodb" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                          DynamoDB
                        </Link>
                        <Link href="/s3" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                          S3 Buckets
                        </Link>
                        <Link href="/lambda" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                          Lambda
                        </Link>
                        <Link href="/apigateway" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                          API Gateway
                        </Link>
                        <Link href="/secrets" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Secrets Manager
                        </Link>
                        <Link href="/ssm" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Parameter Store
                        </Link>
                        <Link href="/iam" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
                      onClick={() => openModal("logs")}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />
                      System Logs
                    </button>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-gray-200 mx-1.5" />

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
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSwitchProject(project.id)}
                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                          project.id === profile?.active_project_id
                            ? "text-blue-700 bg-blue-50 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full mr-3 shrink-0 ${project.id === profile?.active_project_id ? "bg-blue-500" : "bg-gray-300"}`} />
                        {project.label}
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
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        activePage === "profile"
                          ? "text-blue-700 bg-blue-50 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Manage projects...
                    </Link>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    toggleMenu(setShowProfileMenu, showProfileMenu);
                    dismissVersionDot();
                  }}
                  className="relative p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Profile & Settings"
                >
                  <UserCircleIcon className={`h-6 w-6 ${activePage === "profile" ? "text-blue-600" : ""}`} />
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
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                        activePage === "profile"
                          ? "text-blue-700 bg-blue-50 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <UserCircleIcon className={`h-4 w-4 mr-3 ${activePage === "profile" ? "text-blue-500" : "text-gray-400"}`} />
                      Profile & Preferences
                    </Link>
                  </div>
                )}
              </div>
            </div>

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
                onClick={() => setShowMobileMenu((value) => !value)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                {showMobileMenu ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-100 pb-3">
              <div className="pt-3 px-2">
                <p className="px-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">AWS Resources</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openS3Buckets, "/manage/s3")} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                    S3 Buckets
                  </button>
                  <button onClick={() => openInspectTarget("s3")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openDynamoDBViewer, "/manage/dynamodb")} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                    DynamoDB Tables
                  </button>
                  <button onClick={() => openInspectTarget("dynamodb")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openLambdaConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                    Lambda Functions
                  </button>
                  <button onClick={() => openInspectTarget("lambda")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openAPIGatewayConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                    API Gateway
                  </button>
                  <button onClick={() => openInspectTarget("apigateway")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openSecretsConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                    Secrets Manager
                  </button>
                  <button onClick={() => openInspectTarget("secretsmanager")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openSSMConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                    Parameter Store
                  </button>
                  <button onClick={() => openInspectTarget("ssm")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openIAMConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                    IAM Roles
                  </button>
                  <button onClick={() => openInspectTarget("iam")} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded whitespace-nowrap">
                    Inspect
                  </button>
                </div>
              </div>

              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                {PLATFORM_SERVICE_KINDS.map((kind, i) => {
                  const items = PLATFORM_SERVICES.filter((service) => service.kind === kind);
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
                                onClick={() => openModal(action.modalKey)}
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

              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Docs</p>
                <Link href="/docs" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm font-medium text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors">
                  <BookOpenIcon className="h-4 w-4 mr-3 text-indigo-500" />
                  Docs Hub
                </Link>
                <Link href="/aws-emulator" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Squares2X2Icon className="h-4 w-4 mr-3 text-gray-400" />
                  AWS Emulator
                </Link>
                <Link href="/s3" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                  S3 Buckets
                </Link>
                <Link href="/dynamodb" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                  DynamoDB
                </Link>
                <Link href="/lambda" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                  Lambda
                </Link>
                <Link href="/apigateway" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                  API Gateway
                </Link>
                <Link href="/secrets" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                  Secrets Manager
                </Link>
                <Link href="/ssm" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                  Parameter Store
                </Link>
                <Link href="/iam" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                  IAM &amp; STS
                </Link>
                {PLATFORM_SERVICES.map((service) => {
                  const ServiceIcon = service.icon;
                  const href = service.action.type === "link" ? service.action.href : `/${service.id}`;
                  return (
                    <Link key={service.id} href={href} onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <ServiceIcon className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                      {service.label}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dev Tools</p>
                <button onClick={() => openModal("logs")} className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <DocumentTextIcon className="h-4 w-4 mr-3 text-gray-400" />
                  System Logs
                </button>
              </div>

              <div className="pt-2 px-2 border-t border-gray-100 mt-2">
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                <div className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {profile?.active_project_label || "Default"}
                  </span>
                </div>
                <Link href="/profile" onClick={closeAllMenus} className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  activePage === "profile"
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}>
                  <UserCircleIcon className={`h-4 w-4 mr-3 ${activePage === "profile" ? "text-blue-500" : "text-gray-400"}`} />
                  Profile & Preferences
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {showLogs && !actions && (
        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      )}

      {showMailpit && !actions && (
        <MailpitModal onClose={() => setShowMailpit(false)} />
      )}

      {showRedis && !actions && (
        <RedisModal onClose={() => setShowRedis(false)} />
      )}
    </>
  );
}
