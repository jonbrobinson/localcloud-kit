"use client";

import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import {
  AWS_ENV_PREAMBLE,
  buildFullScript,
  buildPlaybookEntries,
  inventorySummary,
  LOCAL_ENV_PREAMBLE,
  resourceNameFromConfig,
  type CliPreambleMode,
} from "@/lib/cliPlaybook";
import { resourceApi } from "@/services/api";
import type { Resource, SavedConfig } from "@/types";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  CommandLineIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const TYPE_LABELS: Record<string, string> = {
  s3: "S3",
  dynamodb: "DynamoDB",
  lambda: "Lambda",
  apigateway: "API Gateway",
  secretsmanager: "Secrets Manager",
  secrets: "Secrets Manager",
  ssm: "SSM",
  iam: "IAM",
};

interface CliPlaybookSectionProps {
  onDeleteSavedConfig: (id: number) => Promise<void>;
}

export default function CliPlaybookSection({ onDeleteSavedConfig }: CliPlaybookSectionProps) {
  const { profile, savedConfigs } = usePreferences();
  const [preambleMode, setPreambleMode] = useState<CliPreambleMode>("local");
  const [liveResources, setLiveResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedConfigIds, setSelectedConfigIds] = useState<Set<number>>(new Set());
  const [deletingConfigs, setDeletingConfigs] = useState(false);

  const projectName = profile?.active_project_name;
  const projectLabel = profile?.active_project_label || "Default";
  const projectId = profile?.active_project_id ?? null;

  const projectSavedConfigs = useMemo(
    () => savedConfigs.filter((c) => c.project_id === projectId),
    [savedConfigs, projectId]
  );

  const loadResources = useCallback(async () => {
    if (!projectName) return;
    setLoadingResources(true);
    try {
      const list = await resourceApi.list(projectName);
      setLiveResources(list);
    } catch {
      setLiveResources([]);
    } finally {
      setLoadingResources(false);
    }
  }, [projectName]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    setSelectedConfigIds(new Set());
  }, [projectId]);

  useEffect(() => {
    setSelectedConfigIds((prev) => {
      const valid = new Set(projectSavedConfigs.map((c) => c.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [projectSavedConfigs]);

  const entries = useMemo(
    () => buildPlaybookEntries(savedConfigs, liveResources, projectId),
    [savedConfigs, liveResources, projectId]
  );

  const summary = useMemo(() => inventorySummary(liveResources), [liveResources]);
  const preamble = preambleMode === "local" ? LOCAL_ENV_PREAMBLE : AWS_ENV_PREAMBLE;
  const fullScript = useMemo(
    () => buildFullScript(preambleMode, entries, projectLabel),
    [preambleMode, entries, projectLabel]
  );

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error("Copy failed");
    }
  };

  const downloadScript = () => {
    const slug = (projectName || "project").replace(/[^a-z0-9-]/gi, "-");
    const blob = new Blob([fullScript], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `localcloud-${slug}-playbook.sh`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script downloaded");
  };

  const sourceBadge = (source: string) => {
    if (source === "matched") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          full recipe
        </span>
      );
    }
    if (source === "saved-config") {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          saved recipe
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
        minimal CLI
      </span>
    );
  };

  const toggleConfigSelection = (id: number) => {
    setSelectedConfigIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allConfigsSelected =
    projectSavedConfigs.length > 0 &&
    projectSavedConfigs.every((c) => selectedConfigIds.has(c.id));

  const toggleSelectAllConfigs = () => {
    if (allConfigsSelected) {
      setSelectedConfigIds(new Set());
    } else {
      setSelectedConfigIds(new Set(projectSavedConfigs.map((c) => c.id)));
    }
  };

  const handleDeleteSelectedConfigs = async () => {
    const ids = [...selectedConfigIds];
    if (ids.length === 0) return;
    const noun = ids.length === 1 ? "saved configuration" : "saved configurations";
    if (
      !confirm(
        `Delete ${ids.length} ${noun}? This removes stored form recipes only — resources in the emulator are not affected.`
      )
    ) {
      return;
    }
    setDeletingConfigs(true);
    try {
      for (const id of ids) {
        await onDeleteSavedConfig(id);
      }
      setSelectedConfigIds(new Set());
      toast.success(`Deleted ${ids.length} ${noun}`);
    } catch {
      toast.error("Failed to delete one or more configurations");
    } finally {
      setDeletingConfigs(false);
    }
  };

  const configResourceLabel = (cfg: SavedConfig) => {
    const name = resourceNameFromConfig(cfg.resource_type, cfg.config as Record<string, unknown>);
    return name || cfg.name;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">CLI Playbook</h2>
          <p className="text-sm text-gray-500 mt-1">
            Project: <span className="font-medium text-gray-700">{projectLabel}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => copyText(fullScript, "Full playbook copied")}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
            Copy all
          </button>
          <button
            type="button"
            onClick={downloadScript}
            disabled={entries.length === 0}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Download .sh
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Portable <code className="text-xs bg-gray-100 px-1 rounded">aws</code> commands with no
        endpoint in each line. Use <strong>LCK AWS CLI</strong> for MiniStack or{" "}
        <strong>AWS CLI</strong> for real AWS — see the environment block for each.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
        <span className="text-sm font-medium text-gray-700">Environment:</span>
        {(["local", "aws"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setPreambleMode(mode)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
              preambleMode === mode
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {mode === "local" ? "LCK AWS CLI" : "AWS CLI"}
          </button>
        ))}
        <button
          type="button"
          onClick={loadResources}
          disabled={loadingResources}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        >
          {loadingResources ? "Refreshing…" : "Refresh inventory"}
        </button>
      </div>

      <div className="mb-6 mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Environment setup</h3>
        <ThemeableCodeBlock
          code={preamble}
          language="bash"
          showThemeSelector={false}
        />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Live inventory</h3>
        {summary.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {loadingResources
              ? "Loading resources…"
              : "No resources in the emulator for this project."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summary.map(({ type, count }) => (
              <span
                key={type}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
              >
                {TYPE_LABELS[type] || type}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-1">Rebuild commands</h3>
      <p className="text-xs text-gray-500 mb-3">
        Copy portable CLI for each resource. Manage stored recipes in Saved configurations below.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          No saved configs or live resources yet. Create resources on the dashboard and save
          configs from the creation forms for full CLI recipes.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              >
                <div className="flex items-center gap-1 px-2 py-2 sm:px-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="flex-1 flex items-center gap-3 min-w-0 px-2 py-1 text-left rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <CommandLineIcon className="h-4 w-4 text-gray-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.resourceName}
                        {entry.savedConfigName && entry.label !== entry.resourceName && (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            ({entry.savedConfigName})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {TYPE_LABELS[entry.resourceType] || entry.resourceType}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {sourceBadge(entry.source)}
                    <button
                      type="button"
                      onClick={() => copyText(entry.command, "Command copied")}
                      className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Copy command"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                      className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title={isOpen ? "Collapse" : "Expand"}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                    {entry.note && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mt-3 mb-2">
                        {entry.note}
                      </p>
                    )}
                    <div className="mt-3">
                      <ThemeableCodeBlock
                        code={entry.command}
                        language="bash"
                        showThemeSelector={false}
                        showCopyButton={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-200 mt-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Saved configurations</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Form recipes saved from creation modals. Deleting does not remove emulator resources.
            </p>
          </div>
          {projectSavedConfigs.length > 0 && selectedConfigIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelectedConfigs}
              disabled={deletingConfigs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
              Delete selected ({selectedConfigIds.size})
            </button>
          )}
        </div>

        {projectSavedConfigs.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No saved configurations for this project. Use &quot;Save config&quot; in a resource
            creation form to store a recipe for the CLI playbook.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={allConfigsSelected}
                onChange={toggleSelectAllConfigs}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-600">Select all</span>
            </label>
            <ul className="divide-y divide-gray-200">
              {projectSavedConfigs.map((cfg) => (
                <li key={cfg.id}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedConfigIds.has(cfg.id)}
                      onChange={() => toggleConfigSelection(cfg.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{cfg.name}</p>
                      <p className="text-xs text-gray-500">
                        {TYPE_LABELS[cfg.resource_type] || cfg.resource_type}
                        {configResourceLabel(cfg) !== cfg.name && (
                          <span className="text-gray-400"> · {configResourceLabel(cfg)}</span>
                        )}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
