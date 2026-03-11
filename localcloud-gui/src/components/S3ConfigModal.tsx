"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, FolderIcon } from "@heroicons/react/24/outline";
import { S3BucketConfig } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

interface S3ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: S3BucketConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function S3ConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: S3ConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();
  const [bucketName, setBucketName] = useState(`${projectName}-bucket`);
  const [region, setRegion] = useState("us-east-1");
  const [versioning, setVersioning] = useState(false);
  const [encryption, setEncryption] = useState(false);

  // Save-as-config inline state
  const [saveMode, setSaveMode] = useState<"none" | "save">("none");
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

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "s3" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: S3BucketConfig) => {
    setBucketName(config.bucketName || "");
    setRegion(config.region || "us-east-1");
    setVersioning(config.versioning || false);
    setEncryption(config.encryption || false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config: S3BucketConfig = { bucketName, region, versioning, encryption };

    if (saveMode === "save" && configName.trim()) {
      try {
        await saveConfig(configName.trim(), "s3", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — bucket will still be created");
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
              <FolderIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create S3 Bucket</h2>
              <p className="text-xs text-gray-500">Configure bucket settings</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Saved config pills — load only */}
          {profile?.active_project_id && projectConfigs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Load saved config</p>
              <div className="flex flex-wrap gap-2">
                {projectConfigs.map((cfg) => (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => {
                      loadSavedConfig(cfg.config as S3BucketConfig);
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

          {/* Bucket Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bucket Name
            </label>
            <input
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="my-bucket-name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be globally unique and follow S3 naming conventions
            </p>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="us-east-1">US East (N. Virginia) — us-east-1</option>
              <option value="us-west-2">US West (Oregon) — us-west-2</option>
              <option value="eu-west-1">Europe (Ireland) — eu-west-1</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore) — ap-southeast-1</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Advanced Options</h3>
            <label className="flex items-center space-x-3 text-gray-900">
              <input
                type="checkbox"
                checked={versioning}
                onChange={(e) => setVersioning(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium">Enable Versioning</span>
                <p className="text-xs text-gray-500">Keep multiple versions of objects</p>
              </div>
            </label>
            <label className="flex items-center space-x-3 text-gray-900">
              <input
                type="checkbox"
                checked={encryption}
                onChange={(e) => setEncryption(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium">Enable Encryption</span>
                <p className="text-xs text-gray-500">Encrypt objects at rest using AES-256</p>
              </div>
            </label>
          </div>

          {/* Save-as-config radio */}
          <div className="border-t pt-4 space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === "none"}
                onChange={() => setSaveMode("none")}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="text-sm text-gray-700">Just create bucket</span>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === "save"}
                onChange={() => setSaveMode("save")}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700">Create and save config</span>
                {saveMode === "save" && (
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="Config name (e.g. my-app-assets)"
                    className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    autoFocus
                    required={saveMode === "save"}
                  />
                )}
              </div>
            </label>
          </div>

          {/* Action Buttons */}
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
              disabled={loading || (saveMode === "save" && !configName.trim())}
            >
              {loading ? "Creating..." : saveMode === "save" ? "Create & Save Config" : "Create Bucket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
