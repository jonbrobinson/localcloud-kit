"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { DynamoDBTableConfig, DynamoDBGSI } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";
import { Button, IconButton, Input, SegmentedControl } from "./ui";

interface DynamoDBConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: DynamoDBTableConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function DynamoDBConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: DynamoDBConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();

  const [tableName, setTableName] = useState(`${projectName}-table`);
  const [partitionKey, setPartitionKey] = useState("pk");
  const [sortKey, setSortKey] = useState("sk");
  const [billingMode, setBillingMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">("PAY_PER_REQUEST");
  const [readCapacity, setReadCapacity] = useState(5);
  const [writeCapacity, setWriteCapacity] = useState(5);
  const [gsis, setGsis] = useState<DynamoDBGSI[]>([]);

  // Save config
  const [saveConfig_, setSaveConfig_] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configNameTouched, setConfigNameTouched] = useState(false);
  const configNameError = configNameTouched && saveConfig_ && !configName.trim()
    ? "Config name is required"
    : "";

  // Keyboard / scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTableName(`${projectName}-table`);
      setPartitionKey("pk");
      setSortKey("sk");
      setBillingMode("PAY_PER_REQUEST");
      setReadCapacity(5);
      setWriteCapacity(5);
      setGsis([]);
      setSaveConfig_(false);
      setConfigName("");
      setConfigNameTouched(false);
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "dynamodb" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: DynamoDBTableConfig) => {
    setTableName(config.tableName || "");
    setPartitionKey(config.partitionKey || "pk");
    setSortKey(config.sortKey || "");
    setBillingMode(config.billingMode || "PAY_PER_REQUEST");
    setReadCapacity(config.readCapacity || 5);
    setWriteCapacity(config.writeCapacity || 5);
    setGsis(config.gsis || []);
  };

  const addGSI = () => {
    if (gsis.length >= 5) return;
    setGsis([...gsis, {
      indexName: `gsi-${gsis.length + 1}`,
      partitionKey: "pk",
      sortKey: "sk",
      projectionType: "ALL",
      nonKeyAttributes: [],
    }]);
  };

  const removeGSI = (index: number) => setGsis(gsis.filter((_, i) => i !== index));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateGSI = (index: number, field: keyof DynamoDBGSI, value: any) => {
    const updated = [...gsis];
    updated[index] = { ...updated[index], [field]: value };
    setGsis(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigNameTouched(true);
    if (saveConfig_ && !configName.trim()) return;

    const config: DynamoDBTableConfig = {
      tableName,
      partitionKey,
      sortKey,
      billingMode,
      readCapacity: billingMode === "PROVISIONED" ? readCapacity : undefined,
      writeCapacity: billingMode === "PROVISIONED" ? writeCapacity : undefined,
      gsis,
    };

    if (saveConfig_ && configName.trim()) {
      try {
        await saveConfig(configName.trim(), "dynamodb", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — table will still be created");
      }
    }

    onSubmit(config);
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-scrim p-4 py-10"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="w-full max-w-xl shrink-0 rounded-xl border border-border bg-surface shadow-e3">
        {/* Header */}
        <div className="flex items-start gap-2.5 border-b border-divider px-4.5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
            <Icon icon="logos:aws-dynamodb" width={18} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-ink">Create DynamoDB table</span>
            <span className="text-[11px] text-muted">
              Primary key, billing mode &amp; GSIs · runs{" "}
              <span className="font-mono">awslocal dynamodb create-table</span>
            </span>
          </div>
          <IconButton icon="lucide:x" variant="ghost" size="sm" label="Close" className="ml-auto" onClick={onClose} />
        </div>

        <form id="dynamodb-config-form" onSubmit={handleSubmit} className="flex flex-col gap-5 px-4.5 py-4">
          {/* Saved config pills — only shown if configs exist */}
          {profile?.active_project_id && projectConfigs.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
              <div className="flex items-center gap-1.5">
                <Icon icon="lucide:bookmark" width={13} className="text-muted" />
                <span className="text-xs font-medium text-ink-2">Saved configs</span>
                <span className="text-[11px] text-faint">{profile.active_project_label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {projectConfigs.map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => {
                      loadSavedConfig(cfg.config as DynamoDBTableConfig);
                      toast.success(`Loaded "${cfg.name}"`);
                    }}
                    className="h-[26px] cursor-pointer rounded-full border border-border bg-surface px-2.5 text-xs font-medium text-ink-2 transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                  >
                    {cfg.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table name + billing mode */}
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">
                Table name <span className="text-danger">*</span>
              </span>
              <Input mono value={tableName} onChange={(e) => setTableName(e.target.value)} required />
              <span className="text-[11px] text-muted">Lowercase, hyphens, 3–255 chars</span>
            </label>
          </div>

          {/* Primary Key */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">
                Partition key <span className="text-danger">*</span>
              </span>
              <Input mono value={partitionKey} onChange={(e) => setPartitionKey(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">Sort key</span>
              <Input
                mono
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                placeholder="Leave empty for simple primary key"
              />
            </label>
          </div>

          {/* Billing mode */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-2">Billing mode</span>
            <SegmentedControl
              value={billingMode}
              onChange={setBillingMode}
              options={[
                { value: "PAY_PER_REQUEST", label: "On-demand" },
                { value: "PROVISIONED", label: "Provisioned" },
              ]}
            />
          </div>

          {/* Provisioned Capacity */}
          {billingMode === "PROVISIONED" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">Read capacity units</span>
                <Input
                  type="number"
                  min="1"
                  value={readCapacity}
                  onChange={(e) => setReadCapacity(parseInt(e.target.value))}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">Write capacity units</span>
                <Input
                  type="number"
                  min="1"
                  value={writeCapacity}
                  onChange={(e) => setWriteCapacity(parseInt(e.target.value))}
                  required
                />
              </label>
            </div>
          )}

          {/* Global Secondary Indexes */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border-strong px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-ink-2">Global secondary indexes</span>
                <span className="text-[11px] text-muted">
                  {gsis.length === 0
                    ? "None yet — add one if you query by another attribute"
                    : `${gsis.length} configured`}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="lucide:plus"
                onClick={addGSI}
                disabled={gsis.length >= 5}
              >
                Add GSI ({gsis.length}/5)
              </Button>
            </div>

            {gsis.map((gsi, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-2">GSI {index + 1}</span>
                  <IconButton
                    icon="lucide:trash-2"
                    variant="ghost"
                    size="sm"
                    label="Remove GSI"
                    className="!text-danger hover:!bg-danger-soft hover:!text-danger"
                    onClick={() => removeGSI(index)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-muted">Index name</span>
                    <Input
                      mono
                      value={gsi.indexName}
                      onChange={(e) => updateGSI(index, "indexName", e.target.value)}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-muted">Partition key</span>
                    <Input
                      mono
                      value={gsi.partitionKey}
                      onChange={(e) => updateGSI(index, "partitionKey", e.target.value)}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-muted">Sort key <span className="text-faint">(optional)</span></span>
                    <Input
                      mono
                      value={gsi.sortKey || ""}
                      onChange={(e) => updateGSI(index, "sortKey", e.target.value || undefined)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-muted">Projection type</span>
                    <div className="relative">
                      <select
                        value={gsi.projectionType}
                        onChange={(e) =>
                          updateGSI(index, "projectionType", e.target.value as "ALL" | "KEYS_ONLY" | "INCLUDE")
                        }
                        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-border-strong bg-surface pl-2.5 pr-7 text-[13px] text-ink outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-focus"
                      >
                        <option value="ALL">All</option>
                        <option value="KEYS_ONLY">Keys only</option>
                        <option value="INCLUDE">Include</option>
                      </select>
                      <Icon
                        icon="lucide:chevron-down"
                        width={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
                      />
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Save as config */}
          <div className="flex flex-col gap-2.5 border-t border-divider pt-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={saveConfig_}
                onChange={(e) => {
                  setSaveConfig_(e.target.checked);
                  if (!e.target.checked) setConfigName("");
                }}
                className="h-4 w-4 cursor-pointer rounded border-border-strong text-primary focus:ring-focus"
              />
              <span className="text-sm text-ink-2">Save as config for future use</span>
            </label>
            {saveConfig_ && (
              <div>
                <Input
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onBlur={() => setConfigNameTouched(true)}
                  placeholder="e.g. my-app-table"
                  invalid={!!configNameError}
                  className="w-full"
                  autoFocus
                />
                {configNameError && <p className="mt-1 text-[11px] text-danger">{configNameError}</p>}
              </div>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2.5 border-t border-divider bg-surface-2 px-4.5 py-3.5">
          <span className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
            <Icon icon="lucide:terminal" width={13} />
            Runs <span className="font-mono">awslocal dynamodb create-table</span>
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="dynamodb-config-form"
              variant="primary"
              icon="lucide:plus"
              loading={loading}
              disabled={loading || (saveConfig_ && !configName.trim())}
            >
              {loading ? "Creating…" : "Create table"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
