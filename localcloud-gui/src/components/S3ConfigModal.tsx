"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { S3BucketConfig } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";
import { Button, IconButton, Input } from "@/components/ui";

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

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-surface border border-border rounded-xl shadow-e3 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft text-primary">
              <Icon icon="logos:aws-s3" width={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Create S3 bucket</h2>
              <p className="text-xs text-muted">Configure bucket settings</p>
            </div>
          </div>
          <IconButton icon="lucide:x" label="Close" variant="ghost" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="px-6 py-5 space-y-5 overflow-y-auto">

            {/* Saved config pills */}
            {profile?.active_project_id && projectConfigs.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-faint mb-2 uppercase tracking-wide">
                  Load saved config
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {projectConfigs.map((cfg) => (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => {
                        loadSavedConfig(cfg.config as S3BucketConfig);
                        toast.success(`Loaded "${cfg.name}"`);
                      }}
                      className="h-[26px] px-2.5 rounded-full border border-border bg-surface text-ink-2 text-xs font-medium cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-soft"
                    >
                      {cfg.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bucket Name */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">Bucket name</span>
              <Input
                mono
                type="text"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value.toLowerCase())}
                onBlur={() => setTouched((t) => ({ ...t, bucketName: true }))}
                invalid={!!bucketNameError}
                placeholder="my-bucket-name"
                className="h-9"
              />
              {bucketNameError ? (
                <p className="text-xs text-danger">{bucketNameError}</p>
              ) : (
                <p className="text-xs text-faint">
                  Lowercase letters, numbers, and hyphens · 3–63 characters
                </p>
              )}
            </label>

            {/* Region */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">Region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-border-strong bg-surface-2 text-[13px] text-ink outline-none transition-colors focus:bg-surface focus:border-primary focus:ring-3 focus:ring-focus"
              >
                <option value="us-east-1">US East (N. Virginia) — us-east-1</option>
                <option value="us-west-2">US West (Oregon) — us-west-2</option>
                <option value="eu-west-1">Europe (Ireland) — eu-west-1</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore) — ap-southeast-1</option>
              </select>
            </label>

            {/* Advanced Options */}
            <div className="border-t border-divider pt-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Advanced options</h3>
              <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-2 transition-colors">
                <input
                  type="checkbox"
                  checked={versioning}
                  onChange={(e) => setVersioning(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                />
                <span>
                  <span className="block text-[13px] font-medium text-ink">Enable versioning</span>
                  <span className="block text-xs text-muted">Keep multiple versions of objects</span>
                </span>
              </label>
              <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-2 transition-colors">
                <input
                  type="checkbox"
                  checked={encryption}
                  onChange={(e) => setEncryption(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                />
                <span>
                  <span className="block text-[13px] font-medium text-ink">Enable encryption</span>
                  <span className="block text-xs text-muted">Encrypt objects at rest using AES-256</span>
                </span>
              </label>
            </div>

            {/* Save config toggle */}
            <div className="border-t border-divider pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveConfig_}
                  onChange={(e) => {
                    setSaveConfig_(e.target.checked);
                    if (!e.target.checked) setConfigName("");
                  }}
                  className="h-4 w-4 accent-primary shrink-0"
                />
                <span className="text-[13px] text-ink-2">Save as config for future use</span>
              </label>
              {saveConfig_ && (
                <div className="mt-3">
                  <Input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, configName: true }))}
                    placeholder="e.g. my-app-assets"
                    invalid={!!configNameError}
                    className="w-full h-9"
                    autoFocus
                  />
                  {configNameError && (
                    <p className="text-xs text-danger mt-1">{configNameError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-6 py-3.5 border-t border-divider bg-surface-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-muted min-w-0">
              <Icon icon="lucide:terminal" width={13} className="shrink-0" />
              <span className="truncate">
                Runs <span className="font-mono">awslocal s3 mb s3://{bucketName || "…"}</span>
              </span>
            </span>
            <div className="flex items-center gap-2.5 ml-auto shrink-0">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={loading ? undefined : "lucide:plus"}
                loading={loading}
                disabled={loading || (saveConfig_ && !configName.trim())}
              >
                {loading ? "Creating…" : "Create bucket"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
