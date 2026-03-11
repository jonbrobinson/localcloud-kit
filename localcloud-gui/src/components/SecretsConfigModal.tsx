"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, KeyIcon } from "@heroicons/react/24/outline";
import { SecretsManagerConfig } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

interface SecretsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: SecretsManagerConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function SecretsConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: SecretsConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();

  const [secretName, setSecretName] = useState(`${projectName}-secret`);
  const [secretValue, setSecretValue] = useState("");
  const [description, setDescription] = useState("");

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
      setSecretName(`${projectName}-secret`);
      setSecretValue("");
      setDescription("");
      setSaveConfig_(false);
      setConfigName("");
      setConfigNameTouched(false);
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "secrets" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: SecretsManagerConfig) => {
    setSecretName(config.secretName || "");
    setSecretValue(config.secretValue || "");
    setDescription(config.description || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigNameTouched(true);
    if (saveConfig_ && !configName.trim()) return;

    const config: SecretsManagerConfig = { secretName, secretValue, description };

    if (saveConfig_ && configName.trim()) {
      try {
        await saveConfig(configName.trim(), "secrets", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — secret will still be created");
      }
    }

    onSubmit(config);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <KeyIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Secret</h2>
              <p className="text-xs text-gray-500">Add a new Secrets Manager secret</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Saved config pills — only shown if configs exist */}
          {profile?.active_project_id && projectConfigs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Load saved config</p>
              <div className="flex flex-wrap gap-2">
                {projectConfigs.map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => {
                      loadSavedConfig(cfg.config as SecretsManagerConfig);
                      toast.success(`Loaded "${cfg.name}"`);
                    }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    {cfg.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secret Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Name
            </label>
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="my-app/db-password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">/</code> as a separator to organise secrets (e.g. <code className="bg-gray-100 px-1 rounded">my-app/api-key</code>)
            </p>
          </div>

          {/* Secret Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Value
            </label>
            <textarea
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-mono text-sm resize-none"
              placeholder='{"username":"admin","password":"secret"}'
              required
            />
            <p className="text-xs text-gray-500 mt-1">Plain text or JSON string</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Database credentials for my-app"
            />
          </div>

          {/* Save as config */}
          <div className="border-t pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveConfig_}
                onChange={(e) => {
                  setSaveConfig_(e.target.checked);
                  if (!e.target.checked) setConfigName("");
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Save as config</span>
            </label>
            {saveConfig_ && (
              <div className="mt-3">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onBlur={() => setConfigNameTouched(true)}
                  placeholder="e.g. my-app/db-creds"
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                    configNameError
                      ? "border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                  autoFocus
                />
                {configNameError && (
                  <p className="text-xs text-red-600 mt-1">{configNameError}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || !secretName.trim() || !secretValue.trim() || (saveConfig_ && !configName.trim())}
            >
              {loading ? "Creating..." : "Create Secret"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
