"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { APIGatewayConfig } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

interface APIGatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: APIGatewayConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function APIGatewayConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: APIGatewayConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();
  const [apiName, setApiName] = useState(`${projectName}-api`);
  const [description, setDescription] = useState("");

  // Save config toggle
  const [saveConfig_, setSaveConfig_] = useState(false);
  const [configName, setConfigName] = useState("");

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

  useEffect(() => {
    if (isOpen) {
      setApiName(`${projectName}-api`);
      setDescription("");
      setSaveConfig_(false);
      setConfigName("");
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "apigateway" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: APIGatewayConfig) => {
    setApiName(config.apiName || "");
    setDescription(config.description || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiName.trim()) return;
    if (saveConfig_ && !configName.trim()) return;

    const config: APIGatewayConfig = { apiName, description };

    if (saveConfig_ && configName.trim()) {
      try {
        await saveConfig(configName.trim(), "apigateway", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — API will still be created");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Icon icon="logos:aws-api-gateway" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create REST API</h2>
              <p className="text-xs text-gray-500">Create a new API Gateway REST API in the AWS Emulator</p>
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

          {/* Saved Configs */}
          {projectConfigs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Saved configs</p>
              <div className="flex flex-wrap gap-2">
                {projectConfigs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => loadSavedConfig(c.config as APIGatewayConfig)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* API Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Name
            </label>
            <input
              type="text"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
              placeholder="my-rest-api"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              A unique name for the REST API
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
              placeholder="API for my application"
            />
          </div>

          {/* Info */}
          <div className="rounded-md bg-pink-50 border border-pink-200 p-3 text-xs text-pink-800">
            Creates a REST API stub. Add resources and methods via the AWS CLI or SDK at{" "}
            <code className="font-mono">http://localhost:4566</code>.
          </div>

          {/* Save Config Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveConfig_}
                onChange={(e) => setSaveConfig_(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">Save as config for future use</span>
            </label>
            {saveConfig_ && (
              <div className="mt-3">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Config name (e.g. My REST API)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900"
                />
                {saveConfig_ && !configName.trim() && (
                  <p className="text-xs text-red-500 mt-1">Config name is required</p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50"
              disabled={loading || !apiName.trim() || (saveConfig_ && !configName.trim())}
            >
              {loading ? "Creating..." : "Create API"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
