"use client";

import { Icon } from "@iconify/react";
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
import { Badge, Button, Card, IconButton, SegmentedControl, type StatusTone } from "@/components/ui";
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

const SOURCE_LABELS: Record<string, { label: string; tone: StatusTone }> = {
  matched: { label: "full recipe", tone: "success" },
  "saved-config": { label: "saved recipe", tone: "neutral" },
  "live-only": { label: "minimal CLI", tone: "warn" },
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
    const meta = SOURCE_LABELS[source] || SOURCE_LABELS["live-only"];
    return <Badge tone={meta.tone}>{meta.label}</Badge>;
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
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">CLI Playbook</h2>
          <p className="text-sm text-muted mt-1">
            Project: <span className="font-medium text-ink-2">{projectLabel}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="lucide:copy"
            onClick={() => copyText(fullScript, "Full playbook copied")}
          >
            Copy all
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="lucide:download"
            onClick={downloadScript}
            disabled={entries.length === 0}
          >
            Download .sh
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted mb-4">
        Portable <code className="text-xs font-mono bg-surface-3 px-1 rounded">aws</code> commands
        with no endpoint in each line. Use <strong className="text-ink-2">LCK AWS CLI</strong> for
        MiniStack or <strong className="text-ink-2">AWS CLI</strong> for real AWS — see the
        environment block for each.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4 w-full">
        <span className="text-sm font-medium text-ink-2">Environment:</span>
        <SegmentedControl
          options={[
            { value: "local", label: "LCK AWS CLI" },
            { value: "aws", label: "AWS CLI" },
          ]}
          value={preambleMode}
          onChange={setPreambleMode}
        />
        <button
          type="button"
          onClick={loadResources}
          disabled={loadingResources}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-50 cursor-pointer"
        >
          <Icon
            icon="lucide:refresh-cw"
            width={13}
            className={loadingResources ? "animate-spin" : undefined}
          />
          {loadingResources ? "Refreshing…" : "Refresh inventory"}
        </button>
      </div>

      <div className="mb-6 mt-4">
        <h3 className="text-sm font-medium text-ink-2 mb-2">Environment setup</h3>
        <ThemeableCodeBlock code={preamble} language="bash" showThemeSelector={false} />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-ink-2 mb-2">Live inventory</h3>
        {summary.length === 0 ? (
          <p className="text-sm text-faint italic">
            {loadingResources
              ? "Loading resources…"
              : "No resources in the emulator for this project."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summary.map(({ type, count }) => (
              <span
                key={type}
                className="text-xs px-2.5 py-1 rounded-md bg-surface-3 text-ink-2 border border-border"
              >
                {TYPE_LABELS[type] || type}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-ink-2 mb-1">Rebuild commands</h3>
      <p className="text-xs text-muted mb-3">
        Copy portable CLI for each resource. Manage stored recipes in Saved configurations below.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-faint italic">
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
                className="border border-border rounded-lg overflow-hidden bg-surface-2"
              >
                <div className="flex items-center gap-1 px-2 py-2 sm:px-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="flex-1 flex items-center gap-3 min-w-0 px-2 py-1 text-left rounded-md cursor-pointer hover:bg-surface-3 transition-colors"
                  >
                    <Icon icon="lucide:terminal" width={16} className="text-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {entry.resourceName}
                        {entry.savedConfigName && entry.label !== entry.resourceName && (
                          <span className="text-muted font-normal"> ({entry.savedConfigName})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {TYPE_LABELS[entry.resourceType] || entry.resourceType}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {sourceBadge(entry.source)}
                    <IconButton
                      icon="lucide:copy"
                      label="Copy command"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyText(entry.command, "Command copied")}
                    />
                    <IconButton
                      icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                      label={isOpen ? "Collapse" : "Expand"}
                      variant="ghost"
                      size="sm"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-divider bg-surface">
                    {entry.note && (
                      <p className="text-xs text-warn-ink bg-warn-soft rounded-md px-3 py-2 mt-3 mb-2">
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

      <div className="border-t border-divider mt-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-medium text-ink-2">Saved configurations</h3>
            <p className="text-xs text-muted mt-0.5">
              Form recipes saved from creation modals. Deleting does not remove emulator resources.
            </p>
          </div>
          {projectSavedConfigs.length > 0 && selectedConfigIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon="lucide:trash-2"
              disabled={deletingConfigs}
              onClick={handleDeleteSelectedConfigs}
            >
              Delete selected ({selectedConfigIds.size})
            </Button>
          )}
        </div>

        {projectSavedConfigs.length === 0 ? (
          <p className="text-sm text-faint italic">
            No saved configurations for this project. Use &quot;Save config&quot; in a resource
            creation form to store a recipe for the CLI playbook.
          </p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-2.5 bg-surface-2 border-b border-divider cursor-pointer hover:bg-surface-3 transition-colors">
              <input
                type="checkbox"
                checked={allConfigsSelected}
                onChange={toggleSelectAllConfigs}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              <span className="text-xs font-medium text-ink-2">Select all</span>
            </label>
            <ul className="divide-y divide-divider">
              {projectSavedConfigs.map((cfg) => (
                <li key={cfg.id}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-2 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedConfigIds.has(cfg.id)}
                      onChange={() => toggleConfigSelection(cfg.id)}
                      className="h-4 w-4 rounded border-border-strong accent-primary shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{cfg.name}</p>
                      <p className="text-xs text-muted">
                        {TYPE_LABELS[cfg.resource_type] || cfg.resource_type}
                        {configResourceLabel(cfg) !== cfg.name && (
                          <span className="text-faint"> · {configResourceLabel(cfg)}</span>
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
    </Card>
  );
}
