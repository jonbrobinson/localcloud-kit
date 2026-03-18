"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { SavedConfig } from "@/types";
import { BookmarkIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface SavedConfigPickerProps {
  resourceType: "s3" | "dynamodb" | "secrets" | "iam";
  onLoad: (config: SavedConfig["config"]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentConfig: any;
  configLabel: string;
}

export default function SavedConfigPicker({
  resourceType,
  onLoad,
  currentConfig,
  configLabel,
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
    <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BookmarkIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Saved configs</span>
          <span className="text-xs text-gray-400">({profile.active_project_label})</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSaveInput((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showSaveInput ? "Cancel" : `Save ${configLabel}`}
        </button>
      </div>

      {/* Save input */}
      {showSaveInput && (
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="text"
            placeholder={`Name this ${configLabel.toLowerCase()} config...`}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!saveName.trim() || saving}
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowSaveInput(false); setSaveName(""); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Saved config list */}
      {projectConfigs.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No saved configs yet for this project.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {projectConfigs.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => {
                onLoad(cfg.config);
                toast.success(`Loaded "${cfg.name}"`);
              }}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {cfg.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
