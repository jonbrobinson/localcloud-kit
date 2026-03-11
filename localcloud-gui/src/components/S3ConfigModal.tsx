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

function validateBucketName(name: string): string {
  if (!name) return "Bucket name is required";
  if (name.length < 3) return "Must be at least 3 characters";
  if (name.length > 63) return "Must be 63 characters or fewer";
  if (!/^[a-z0-9]/.test(name)) return "Must start with a lowercase letter or number";
  if (!/[a-z0-9]$/.test(name)) return "Must end with a lowercase letter or number";
  if (!/^[a-z0-9.-]+$/.test(name)) return "Only lowercase letters, numbers, hyphens, and dots are allowed";
  if (/\.\./.test(name)) return "Cannot contain consecutive dots";
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(name)) return "Cannot be formatted as an IP address";
  return "";
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

  // Save config toggle
  const [saveConfig_, setSaveConfig_] = useState(false);
  const [configName, setConfigName] = useState("");

  // Validation
  const [touched, setTouched] = useState({ bucketName: false, configName: false });
  const bucketNameError = touched.bucketName ? validateBucketName(bucketName) : "";
  const configNameError = touched.configName && saveConfig_ && !configName.trim()
    ? "Config name is required"
    : "";

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBucketName(`${projectName}-bucket`);
      setRegion("us-east-1");
      setVersioning(false);
      setEncryption(false);
      setSaveConfig_(false);
      setConfigName("");
      setTouched({ bucketName: false, configName: false });
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "s3" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: S3BucketConfig) => {
    setBucketName(config.bucketName || "");
    setRegion(config.region || "us-east-1");
    setVersioning(config.versioning || false);
    setEncryption(config.encryption || false);
    setTouched({ bucketName: false, configName: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields to show errors
    setTouched({ bucketName: true, configName: true });

    if (validateBucketName(bucketName)) return;
    if (saveConfig_ && !configName.trim()) return;

    const config: S3BucketConfig = { bucketName, region, versioning, encryption };

    if (saveConfig_ && configName.trim()) {
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Saved config pills */}
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
              onChange={(e) => setBucketName(e.target.value.toLowerCase())}
              onBlur={() => setTouched((t) => ({ ...t, bucketName: true }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                bucketNameError
                  ? "border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
              placeholder="my-bucket-name"
            />
            {bucketNameError ? (
              <p className="text-xs text-red-600 mt-1">{bucketNameError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Lowercase letters, numbers, and hyphens · 3–63 characters
              </p>
            )}
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
            <label className="flex items-center space-x-3 cursor-pointer text-gray-900">
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
            <label className="flex items-center space-x-3 cursor-pointer text-gray-900">
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

          {/* Save config toggle */}
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
                  onBlur={() => setTouched((t) => ({ ...t, configName: true }))}
                  placeholder="e.g. my-app-assets"
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
              disabled={loading || (saveConfig_ && !configName.trim())}
            >
              {loading ? "Creating..." : "Create Bucket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
