"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { SavedConfig } from "@/types";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button, Input } from "./ui";

interface SavedConfigPickerProps {
  resourceType: "s3" | "dynamodb" | "secrets" | "iam";
  onLoad: (config: SavedConfig["config"]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentConfig: any;
  configLabel: string;
  hideSave?: boolean;
}

export default function SavedConfigPicker({
  resourceType,
  onLoad,
  currentConfig,
  configLabel,
  hideSave = false,
}: SavedConfigPickerProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const projectConfigs = savedConfigs.filter(
    (c) =>
      c.resource_type === resourceType &&
      c.project_id === profile?.active_project_id
  );

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await saveConfig(saveName.trim(), resourceType, currentConfig);
      setSaveName("");
      setShowSaveInput(false);
      toast.success(`Config "${saveName.trim()}" saved`);
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (!profile?.active_project_id) return null;

  return (
    <div className="flex flex-col gap-1.5 p-3 border border-border rounded-lg bg-surface-2">
      <div className="flex items-center gap-1.5">
        <Icon icon="lucide:bookmark" width={13} className="text-muted" />
        <span className="text-xs font-medium text-ink-2">Saved configs</span>
        <span className="text-[11px] text-faint">{profile.active_project_label}</span>
        {!hideSave && (
          <button
            type="button"
            onClick={() => setShowSaveInput((v) => !v)}
            className="ml-auto text-[11px] font-medium text-primary hover:text-primary-hover cursor-pointer"
          >
            {showSaveInput ? "Cancel" : `Save ${configLabel}`}
          </button>
        )}
      </div>

      {!hideSave && showSaveInput && (
        <div className="flex items-center gap-1.5">
          <Input
            placeholder={`Name this ${configLabel.toLowerCase()} config…`}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            className="flex-1"
            autoFocus
          />
          <Button
            variant="primary"
            size="sm"
            icon="lucide:check"
            onClick={handleSave}
            disabled={!saveName.trim() || saving}
            aria-label="Save config"
          />
          <Button
            variant="secondary"
            size="sm"
            icon="lucide:x"
            onClick={() => {
              setShowSaveInput(false);
              setSaveName("");
            }}
            aria-label="Cancel"
          />
        </div>
      )}

      {projectConfigs.length === 0 ? (
        <p className="text-[11px] text-faint italic">No saved configs yet for this project.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {projectConfigs.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => {
                onLoad(cfg.config);
                toast.success(`Loaded "${cfg.name}"`);
              }}
              className="h-[26px] px-2.5 rounded-full border border-border bg-surface text-ink-2 text-xs font-medium cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-soft"
            >
              {cfg.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
