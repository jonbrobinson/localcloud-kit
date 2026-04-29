"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { IAMRoleConfig } from "@/types";
import SavedConfigPicker from "./SavedConfigPicker";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

// Common AWS service principals that can assume roles
const TRUST_SERVICE_OPTIONS = [
  { value: "lambda", label: "Lambda" },
  { value: "ec2", label: "EC2" },
  { value: "ecs-tasks", label: "ECS Tasks" },
  { value: "apigateway", label: "API Gateway" },
  { value: "states", label: "Step Functions" },
  { value: "firehose", label: "Kinesis Firehose" },
  { value: "s3", label: "S3" },
];

const DEFAULT_TRUST_SERVICES = ["lambda"];

function buildTrustPolicy(services: string[]): string {
  const principals =
    services.length === 1
      ? `${services[0]}.amazonaws.com`
      : services.map((s) => `${s}.amazonaws.com`);
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: principals },
          Action: "sts:AssumeRole",
        },
      ],
    },
    null,
    2
  );
}

interface IAMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: IAMRoleConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function IAMConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: IAMConfigModalProps) {
  const { saveConfig } = usePreferences();
  const [roleName, setRoleName] = useState(`${projectName}-role`);
  const [trustServices, setTrustServices] = useState<string[]>(DEFAULT_TRUST_SERVICES);
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("/");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPolicy, setCustomPolicy] = useState("");
  const [customPolicyError, setCustomPolicyError] = useState("");
  const [saveAsConfig, setSaveAsConfig] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configNameTouched, setConfigNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setRoleName(`${projectName}-role`);
      setTrustServices(DEFAULT_TRUST_SERVICES);
      setDescription("");
      setPath("/");
      setAdvancedMode(false);
      setCustomPolicy("");
      setCustomPolicyError("");
      setSaveAsConfig(false);
      setConfigName("");
      setConfigNameTouched(false);
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const toggleService = (value: string) => {
    setTrustServices((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const previewPolicy = advancedMode ? customPolicy : buildTrustPolicy(trustServices);

  const handleLoad = (config: Record<string, unknown>) => {
    if (config.roleName) setRoleName(config.roleName as string);
    if (Array.isArray(config.trustServices)) setTrustServices(config.trustServices as string[]);
    if (config.description !== undefined) setDescription(config.description as string);
    if (config.path !== undefined) setPath(config.path as string);
    if (config.customPolicy) {
      setAdvancedMode(true);
      setCustomPolicy(config.customPolicy as string);
    } else {
      setAdvancedMode(false);
      setCustomPolicy("");
    }
  };

  const handlePrettify = () => {
    try {
      setCustomPolicy(JSON.stringify(JSON.parse(customPolicy), null, 2));
      setCustomPolicyError("");
    } catch {
      setCustomPolicyError("Invalid JSON — cannot prettify.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveAsConfig && !configName.trim()) {
      setConfigNameTouched(true);
      return;
    }
    if (advancedMode) {
      try {
        JSON.parse(customPolicy);
      } catch {
        setCustomPolicyError("Invalid JSON — please check your trust policy.");
        return;
      }
    }
    const trustPolicy = advancedMode ? customPolicy : buildTrustPolicy(trustServices);
    const config: IAMRoleConfig = {
      roleName,
      trustServices,
      trustPolicy,
      description,
      path,
    };
    if (advancedMode) {
      config.customPolicy = customPolicy;
    }
    if (saveAsConfig && configName.trim()) {
      setSaving(true);
      try {
        await saveConfig(configName.trim(), "iam", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config");
      } finally {
        setSaving(false);
      }
    }
    onSubmit(config);
  };

  const configNameError = configNameTouched && saveAsConfig && !configName.trim();
  const canSubmit =
    !loading &&
    !saving &&
    roleName.trim() !== "" &&
    (advancedMode ? customPolicy.trim() !== "" : trustServices.length > 0) &&
    (!saveAsConfig || configName.trim() !== "");

  const currentConfig: Record<string, unknown> = {
    roleName,
    trustServices,
    description,
    path,
    ...(advancedMode ? { customPolicy } : {}),
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Icon icon="logos:aws-iam" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create IAM Role</h2>
              <p className="text-xs text-gray-500">Add a new IAM role with a trust policy</p>
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
          <SavedConfigPicker
            resourceType="iam"
            onLoad={handleLoad}
            currentConfig={currentConfig}
            configLabel="IAM Role"
            hideSave
          />

          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="my-lambda-execution-role"
              required
            />
          </div>

          {/* Trusted Services (simple mode) */}
          {!advancedMode && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Trusted AWS Services
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAdvancedMode(true);
                    setCustomPolicy(buildTrustPolicy(trustServices));
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Advanced (custom JSON)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRUST_SERVICE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center space-x-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                      trustServices.includes(opt.value)
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={trustServices.includes(opt.value)}
                      onChange={() => toggleService(opt.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {trustServices.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Select at least one trusted service.</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                AWS services that can assume this role via{" "}
                <code className="bg-gray-100 px-1 rounded">sts:AssumeRole</code>. Select multiple to allow all of them.
              </p>
            </div>
          )}

          {/* Advanced mode — raw JSON textarea */}
          {advancedMode && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Trust Policy (JSON)
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handlePrettify}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Prettify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancedMode(false);
                      setCustomPolicyError("");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Back to selector
                  </button>
                </div>
              </div>
              <textarea
                value={customPolicy}
                onChange={(e) => {
                  setCustomPolicy(e.target.value);
                  setCustomPolicyError("");
                }}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 font-mono text-xs"
                placeholder='{"Version":"2012-10-17","Statement":[...]}'
                required
              />
              {customPolicyError && (
                <p className="text-xs text-red-500 mt-1">{customPolicyError}</p>
              )}
            </div>
          )}

          {/* Trust Policy Preview (simple mode only) */}
          {!advancedMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trust Policy Preview
              </label>
              <pre className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
                {previewPolicy}
              </pre>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="Execution role for my Lambda function"
            />
          </div>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Path <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="/"
            />
            <p className="text-xs text-gray-500 mt-1">
              IAM path for the role (e.g.{" "}
              <code className="bg-gray-100 px-1 rounded">/service-role/</code>). Defaults to{" "}
              <code className="bg-gray-100 px-1 rounded">/</code>.
            </p>
          </div>

          {/* Save as config */}
          <div className="border-t pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsConfig}
                onChange={(e) => {
                  setSaveAsConfig(e.target.checked);
                  if (!e.target.checked) setConfigName("");
                }}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Save as config</span>
            </label>
            {saveAsConfig && (
              <div className="mt-3">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onBlur={() => setConfigNameTouched(true)}
                  placeholder="e.g. my-lambda-role"
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 text-gray-900 ${
                    configNameError
                      ? "border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50"
                      : "border-gray-300 focus:ring-red-500 focus:border-red-500"
                  }`}
                  autoFocus
                />
                {configNameError && (
                  <p className="text-xs text-red-600 mt-1">Config name is required.</p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={!canSubmit}
            >
              {loading || saving ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
