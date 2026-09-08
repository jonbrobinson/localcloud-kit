"use client";

import { usePreferences } from "@/context/PreferencesContext";
import {
  InspectTargetId,
  useDashboardNav,
} from "@/context/DashboardNavContext";
import { PLATFORM_SERVICES, PLATFORM_SERVICE_KINDS, SERVICE_KIND_LABEL } from "@/constants/platformServices";
import { useServicesData } from "@/hooks/useServicesData";
import { cn, SegmentedControl, type SegmentedOption } from "@/components/ui";
import type { PreferredLanguage, ThemePreference } from "@/types";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import packageJson from "../../package.json";
import LogViewer from "./LogViewer";
import MailpitModal from "./MailpitModal";
import RedisModal from "./RedisModal";
import ManageHeaderBrand from "./ManageHeaderBrand";

const DOC_ROUTES = [
  "/docs", "/aws-emulator", "/s3", "/dynamodb", "/lambda",
  "/apigateway", "/secrets", "/ssm", "/iam",
  "/redis", "/mailpit", "/postgres", "/keycloak",
];

const LANGUAGE_LABEL: Record<PreferredLanguage, string> = {
  typescript: "TypeScript",
  node: "Node.js",
  python: "Python",
  go: "Go",
  java: "Java",
  cli: "CLI",
};

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

const navPillClass = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors",
    active ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-surface-3 hover:text-ink"
  );

const dropdownPanelClass = (widthClass: string) =>
  cn(
    "absolute right-0 mt-1.5 bg-surface border border-border rounded-xl shadow-e2 z-50 py-1.5",
    widthClass
  );

const sectionLabelClass = "px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-faint";
const dividerClass = "h-px bg-divider mx-1.5 my-1";
const menuItemClass =
  "flex items-center flex-1 px-2.5 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink rounded-lg transition-colors";

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

  const handleThemeChange = (theme: ThemePreference) => {
    updateProfile({ theme }).catch(() => toast.error("Failed to update theme"));
  };

  const previewActionClass =
    "inline-flex items-center justify-center p-1.5 text-primary hover:text-primary-hover hover:bg-primary-soft rounded-md transition-colors";
  const inspectActionClass =
    "inline-flex items-center justify-center p-1.5 text-muted hover:text-ink hover:bg-surface-3 rounded-md transition-colors";
  const manageActionClass =
    "inline-flex items-center justify-center p-1.5 text-primary hover:text-primary-hover hover:bg-primary-soft rounded-md transition-colors";

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
          <Icon icon="lucide:eye" width={15} />
        </button>
      )}
      <button
        onClick={() => openInspectTarget(target)}
        className={inspectActionClass}
        title={`Inspect ${label} checks`}
        aria-label={`Inspect ${label} checks`}
      >
        <Icon icon="lucide:clipboard-check" width={15} />
      </button>
      <Link
        href={manageHref}
        onClick={closeAllMenus}
        className={manageActionClass}
        title={`Open ${label} page`}
        aria-label={`Open ${label} page`}
      >
        <Icon icon="lucide:external-link" width={15} />
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
      <Icon icon="lucide:clipboard-check" width={15} />
    </button>
  );

  const displayName = profile?.display_name;
  const initials = getInitials(displayName);
  const profileSubtitle = profile
    ? `${LANGUAGE_LABEL[profile.preferred_language] ?? profile.preferred_language} · ${profile.highlight_theme}`
    : undefined;

  return (
    <>
      <header className="bg-surface border-b border-border shadow-e1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 gap-3">
            <Link href="/" onClick={closeAllMenus} aria-label="Go to dashboard" className="flex items-center gap-3 min-w-0">
              <ManageHeaderBrand size="sm" />
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-[15px] font-semibold tracking-tight text-ink truncate">LocalCloud Kit</span>
                <span className="text-[11px] text-muted truncate">
                  Local cloud development environment · v
                  {packageJson.version}
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              <div className="relative" ref={resourcesMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowResourcesMenu, showResourcesMenu)}
                  className={navPillClass(showResourcesMenu)}
                >
                  <Icon icon="lucide:layers" width={14} />
                  Resources
                  <Icon icon="lucide:chevron-down" width={14} className={cn("transition-transform", showResourcesMenu && "rotate-180")} />
                </button>
                {showResourcesMenu && (
                  <div className={dropdownPanelClass("w-80")}>
                    <p className={sectionLabelClass}>Storage</p>
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openS3Buckets, "/manage/s3")}
                        className={menuItemClass}
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

                    <div className={dividerClass} />
                    <p className={sectionLabelClass}>Database</p>
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openDynamoDBViewer, "/manage/dynamodb")}
                        className={menuItemClass}
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

                    <div className={dividerClass} />
                    <p className={sectionLabelClass}>Compute</p>
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openLambdaConfig, DASHBOARD_FALLBACK_HREF)}
                        className={menuItemClass}
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

                    <div className={dividerClass} />
                    <p className={sectionLabelClass}>Networking</p>
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openAPIGatewayConfig, DASHBOARD_FALLBACK_HREF)}
                        className={menuItemClass}
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

                    <div className={dividerClass} />
                    <p className={sectionLabelClass}>Security &amp; Identity</p>
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openSecretsConfig, DASHBOARD_FALLBACK_HREF)}
                        className={menuItemClass}
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
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openSSMConfig, DASHBOARD_FALLBACK_HREF)}
                        className={menuItemClass}
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
                    <div className="flex items-center justify-between gap-2 px-1.5 py-0.5">
                      <button
                        onClick={() => openActionOrFallback(actions?.openIAMConfig, DASHBOARD_FALLBACK_HREF)}
                        className={menuItemClass}
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
                  className={cn("relative", navPillClass(showServicesMenu))}
                >
                  <Icon icon="lucide:server" width={14} />
                  Services
                  <Icon icon="lucide:chevron-down" width={14} className={cn("transition-transform", showServicesMenu && "rotate-180")} />
                  {mailpit.unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-danger text-white leading-none">
                      {mailpit.unread > 99 ? "99+" : mailpit.unread}
                    </span>
                  )}
                </button>
                {showServicesMenu && (
                  <div className={dropdownPanelClass("w-56")}>
                    {PLATFORM_SERVICE_KINDS.map((kind, i) => {
                      const items = PLATFORM_SERVICES.filter((service) => service.kind === kind);
                      return (
                        <div key={kind}>
                          {i > 0 && <div className={dividerClass} />}
                          <p className={sectionLabelClass}>
                            {SERVICE_KIND_LABEL[kind]}
                          </p>
                          {items.map((service) => {
                            const ServiceIcon = service.icon;
                            const itemContent = (
                              <>
                                <ServiceIcon className="h-4 w-4 mr-3 text-faint shrink-0" />
                                {service.label}
                                {service.id === "mailpit" && mailpit.unread > 0 && (
                                  <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-danger text-white leading-none">
                                    {mailpit.unread > 99 ? "99+" : mailpit.unread}
                                  </span>
                                )}
                              </>
                            );
                            const action = service.action;
                            return (
                              <div key={service.id} className="flex items-center justify-between px-1.5">
                                {action.type === "link" ? (
                                  <Link
                                    href={action.href}
                                    onClick={closeAllMenus}
                                    className={menuItemClass}
                                  >
                                    {itemContent}
                                  </Link>
                                ) : (
                                  <button
                                    onClick={() => openModal(action.modalKey)}
                                    className={menuItemClass}
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
                  className={navPillClass(showDocsMenu)}
                >
                  <Icon icon="lucide:book-open" width={14} />
                  Docs
                  <Icon icon="lucide:chevron-down" width={14} className={cn("transition-transform", showDocsMenu && "rotate-180")} />
                </button>
                {showDocsMenu && (
                  <div className="absolute right-0 mt-1.5 w-176 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-xl shadow-e2 z-50 p-3">
                    <Link
                      href="/docs"
                      onClick={() => setShowDocsMenu(false)}
                      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-primary-ink hover:bg-primary-soft transition-colors"
                    >
                      <Icon icon="lucide:book-open" width={16} className="mr-3 text-primary" />
                      Docs Hub
                    </Link>

                    <div className="mt-3 grid grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto">
                      <div className="rounded-lg border border-border py-1">
                        <p className={sectionLabelClass}>Infrastructure</p>
                        <Link
                          href="/aws-emulator"
                          onClick={() => setShowDocsMenu(false)}
                          className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
                        >
                          <Icon icon="lucide:cloud" width={16} className="mr-3 text-faint" />
                          AWS Emulator
                        </Link>
                      </div>

                      <div className="rounded-lg border border-border py-1">
                        <p className={sectionLabelClass}>AWS Resources</p>
                        <Link href="/dynamodb" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                          DynamoDB
                        </Link>
                        <Link href="/s3" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                          S3 Buckets
                        </Link>
                        <Link href="/lambda" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                          Lambda
                        </Link>
                        <Link href="/apigateway" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                          API Gateway
                        </Link>
                        <Link href="/secrets" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Secrets Manager
                        </Link>
                        <Link href="/ssm" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                          Parameter Store
                        </Link>
                        <Link href="/iam" onClick={() => setShowDocsMenu(false)} className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors">
                          <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                          IAM &amp; STS
                        </Link>
                      </div>

                      <div className="rounded-lg border border-border py-1">
                        <p className={sectionLabelClass}>Platform Services</p>
                        {PLATFORM_SERVICES.map((service) => {
                          const ServiceIcon = service.icon;
                          const href = service.action.type === "link" ? service.action.href : `/${service.id}`;
                          return (
                            <Link
                              key={service.id}
                              href={href}
                              onClick={() => setShowDocsMenu(false)}
                              className="flex items-center px-3 py-2 text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
                            >
                              <ServiceIcon className="h-4 w-4 mr-3 text-faint" />
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
                  className={navPillClass(showDevToolsMenu)}
                >
                  <Icon icon="lucide:wrench" width={14} />
                  Dev Tools
                  <Icon icon="lucide:chevron-down" width={14} className={cn("transition-transform", showDevToolsMenu && "rotate-180")} />
                </button>
                {showDevToolsMenu && (
                  <div className={dropdownPanelClass("w-48")}>
                    <p className={sectionLabelClass}>Logs</p>
                    <div className="px-1.5">
                      <button
                        onClick={() => openModal("logs")}
                        className={cn(menuItemClass, "w-full")}
                      >
                        <Icon icon="lucide:scroll-text" width={16} className="mr-3 text-faint" />
                        System Logs
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-[18px] bg-border mx-1.5" />

              <div className="relative" ref={projectMenuRef}>
                <button
                  onClick={() => toggleMenu(setShowProjectMenu, showProjectMenu)}
                  className={cn(
                    "flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors",
                    showProjectMenu
                      ? "border-primary bg-surface text-ink-2 ring-2 ring-focus"
                      : "border-border-strong bg-surface text-ink-2 hover:bg-surface-2"
                  )}
                >
                  <Icon icon="lucide:box" width={13} className={showProjectMenu ? "text-primary" : "text-muted"} />
                  {profile?.active_project_label || "Default"}
                  <Icon icon="lucide:chevron-down" width={13} className={cn("text-faint transition-transform", showProjectMenu && "rotate-180")} />
                </button>
                {showProjectMenu && (
                  <div className={dropdownPanelClass("w-56")}>
                    <p className={sectionLabelClass}>Projects</p>
                    <div className="px-1.5">
                      {projects.map((project) => {
                        const isActive = project.id === profile?.active_project_id;
                        return (
                          <button
                            key={project.id}
                            onClick={() => handleSwitchProject(project.id)}
                            className={cn(
                              "flex items-center w-full gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                              isActive
                                ? "bg-primary-soft text-primary-ink font-medium"
                                : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                            )}
                          >
                            <Icon icon="lucide:box" width={15} className={isActive ? "text-primary shrink-0" : "text-muted shrink-0"} />
                            <span className="flex-1 text-left truncate">{project.label}</span>
                            {isActive && <Icon icon="lucide:check" width={15} className="text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className={dividerClass} />
                    <div className="px-1.5">
                      <button
                        onClick={handleCreateProject}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary-soft transition-colors"
                      >
                        <Icon icon="lucide:plus" width={15} />
                        New project
                      </button>
                      <Link
                        href="/profile"
                        onClick={() => setShowProjectMenu(false)}
                        className={cn(
                          "flex items-center w-full px-2.5 py-2 rounded-lg text-sm transition-colors",
                          activePage === "profile"
                            ? "text-primary-ink bg-primary-soft font-medium"
                            : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                        )}
                      >
                        Manage projects...
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    toggleMenu(setShowProfileMenu, showProfileMenu);
                    dismissVersionDot();
                  }}
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-colors",
                    activePage === "profile"
                      ? "bg-primary-soft text-primary-ink"
                      : "bg-surface-3 text-ink-2 hover:bg-surface-2"
                  )}
                  title="Profile & Settings"
                >
                  {initials}
                  {hasNewVersion && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
                  )}
                </button>
                {showProfileMenu && (
                  <div className={dropdownPanelClass("w-56")}>
                    {hasNewVersion && (
                      <div className="mx-1.5 mb-1.5 px-3 py-2 bg-primary-soft rounded-lg border border-primary/20">
                        <p className="text-xs font-semibold text-primary-ink">
                          v
                          {packageJson.version}
                          {" "}
                          — What&apos;s new
                        </p>
                        <Link href="https://github.com/localcloud-kit/localcloud-kit/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View changelog →</Link>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 px-3 py-2">
                      <span className="flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-surface-3 text-ink-2 text-xs font-semibold shrink-0">
                        {initials}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-ink truncate">{displayName || "Local user"}</span>
                        {profileSubtitle && <span className="text-[11px] text-muted truncate">{profileSubtitle}</span>}
                      </div>
                    </div>
                    <div className={dividerClass} />
                    <div className="px-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className={cn(
                          "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-colors",
                          activePage === "profile"
                            ? "text-primary-ink bg-primary-soft font-medium"
                            : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                        )}
                      >
                        <Icon icon="lucide:user-cog" width={15} className={activePage === "profile" ? "text-primary" : "text-faint"} />
                        Preferences
                      </Link>
                      <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-ink-2">
                        <span className="flex items-center gap-2.5">
                          <Icon icon="lucide:sun-moon" width={15} className="text-faint" />
                          Theme
                        </span>
                        <SegmentedControl
                          options={THEME_OPTIONS}
                          value={profile?.theme ?? "auto"}
                          onChange={handleThemeChange}
                        />
                      </div>
                      <Link
                        href="/docs"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
                      >
                        <Icon icon="lucide:external-link" width={15} className="text-faint" />
                        Docs hub
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex md:hidden items-center gap-2">
              {hasNewVersion && (
                <span className="h-2 w-2 rounded-full bg-danger" />
              )}
              {mailpit.unread > 0 && (
                <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-xs font-bold bg-danger text-white">
                  {mailpit.unread > 99 ? "99+" : mailpit.unread}
                </span>
              )}
              <button
                onClick={() => setShowMobileMenu((value) => !value)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 transition-colors"
                aria-label="Open menu"
              >
                <Icon icon={showMobileMenu ? "lucide:x" : "lucide:menu"} width={22} />
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="md:hidden border-t border-divider pb-3">
              <div className="pt-3 px-2">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-faint">AWS Resources</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openS3Buckets, "/manage/s3")} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                    S3 Buckets
                  </button>
                  <button onClick={() => openInspectTarget("s3")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openDynamoDBViewer, "/manage/dynamodb")} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                    DynamoDB Tables
                  </button>
                  <button onClick={() => openInspectTarget("dynamodb")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openLambdaConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                    Lambda Functions
                  </button>
                  <button onClick={() => openInspectTarget("lambda")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openAPIGatewayConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                    API Gateway
                  </button>
                  <button onClick={() => openInspectTarget("apigateway")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openSecretsConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                    Secrets Manager
                  </button>
                  <button onClick={() => openInspectTarget("secretsmanager")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openSSMConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                    Parameter Store
                  </button>
                  <button onClick={() => openInspectTarget("ssm")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openActionOrFallback(actions?.openIAMConfig, DASHBOARD_FALLBACK_HREF)} className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                    <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                    IAM Roles
                  </button>
                  <button onClick={() => openInspectTarget("iam")} className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap">
                    Inspect
                  </button>
                </div>
              </div>

              <div className="pt-2 px-2 border-t border-divider mt-2">
                {PLATFORM_SERVICE_KINDS.map((kind, i) => {
                  const items = PLATFORM_SERVICES.filter((service) => service.kind === kind);
                  return (
                    <div key={kind}>
                      <p className={`px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-faint ${i > 0 ? "pt-2" : "py-1"}`}>
                        {SERVICE_KIND_LABEL[kind]}
                      </p>
                      {items.map((service) => {
                        const ServiceIcon = service.icon;
                        const itemContent = (
                          <>
                            <ServiceIcon className="h-4 w-4 mr-3 text-faint shrink-0" />
                            {service.label}
                            {service.id === "mailpit" && mailpit.unread > 0 && (
                              <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-danger text-white">
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
                                className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors"
                              >
                                {itemContent}
                              </Link>
                            ) : (
                              <button
                                onClick={() => openModal(action.modalKey)}
                                className="flex items-center flex-1 px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors"
                              >
                                {itemContent}
                              </button>
                            )}
                            <button
                              onClick={() => openInspectTarget(service.id)}
                              className="px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-3 rounded-md whitespace-nowrap"
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

              <div className="pt-2 px-2 border-t border-divider mt-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Docs</p>
                <Link href="/docs" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-ink rounded-lg hover:bg-primary-soft transition-colors">
                  <Icon icon="lucide:book-open" width={16} className="mr-3 text-primary" />
                  Docs Hub
                </Link>
                <Link href="/aws-emulator" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="lucide:cloud" width={16} className="mr-3 text-faint" />
                  AWS Emulator
                </Link>
                <Link href="/s3" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-s3" className="w-4 h-4 mr-3 shrink-0" />
                  S3 Buckets
                </Link>
                <Link href="/dynamodb" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-dynamodb" className="w-4 h-4 mr-3 shrink-0" />
                  DynamoDB
                </Link>
                <Link href="/lambda" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-lambda" className="w-4 h-4 mr-3 shrink-0" />
                  Lambda
                </Link>
                <Link href="/apigateway" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-api-gateway" className="w-4 h-4 mr-3 shrink-0" />
                  API Gateway
                </Link>
                <Link href="/secrets" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-secrets-manager" className="w-4 h-4 mr-3 shrink-0" />
                  Secrets Manager
                </Link>
                <Link href="/ssm" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-systems-manager" className="w-4 h-4 mr-3 shrink-0" />
                  Parameter Store
                </Link>
                <Link href="/iam" onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="logos:aws-iam" className="w-4 h-4 mr-3 shrink-0" />
                  IAM &amp; STS
                </Link>
                {PLATFORM_SERVICES.map((service) => {
                  const ServiceIcon = service.icon;
                  const href = service.action.type === "link" ? service.action.href : `/${service.id}`;
                  return (
                    <Link key={service.id} href={href} onClick={closeAllMenus} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                      <ServiceIcon className="h-4 w-4 mr-3 text-faint shrink-0" />
                      {service.label}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 px-2 border-t border-divider mt-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Dev Tools</p>
                <button onClick={() => openModal("logs")} className="flex items-center w-full px-3 py-2 text-sm text-ink-2 rounded-lg hover:bg-surface-3 transition-colors">
                  <Icon icon="lucide:scroll-text" width={16} className="mr-3 text-faint" />
                  System Logs
                </button>
              </div>

              <div className="pt-2 px-2 border-t border-divider mt-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Account</p>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-3 text-ink-2 text-xs font-semibold shrink-0">
                    {initials}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-ink truncate">{displayName || "Local user"}</span>
                    <span className="text-[11px] text-muted truncate flex items-center gap-1">
                      <Icon icon="lucide:box" width={11} className="text-primary" />
                      {profile?.active_project_label || "Default"}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-ink-2">
                    <Icon icon="lucide:sun-moon" width={15} className="text-faint" />
                    Theme
                  </span>
                  <SegmentedControl
                    options={THEME_OPTIONS}
                    value={profile?.theme ?? "auto"}
                    onChange={handleThemeChange}
                  />
                </div>
                <Link href="/profile" onClick={closeAllMenus} className={cn(
                  "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors",
                  activePage === "profile"
                    ? "text-primary-ink bg-primary-soft"
                    : "text-ink-2 hover:bg-surface-3"
                )}>
                  <Icon icon="lucide:user-cog" width={16} className={cn("mr-3", activePage === "profile" ? "text-primary" : "text-faint")} />
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
