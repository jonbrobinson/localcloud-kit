"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { LambdaFunctionConfig } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

interface LambdaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: LambdaFunctionConfig) => void;
  projectName: string;
  loading?: boolean;
}

const RUNTIMES = [
  "python3.12",
  "python3.11",
  "python3.10",
  "python3.9",
  "nodejs20.x",
  "nodejs18.x",
  "java21",
  "java17",
  "go1.x",
  "dotnet8",
];

export default function LambdaConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: LambdaConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();
  const [functionName, setFunctionName] = useState(`${projectName}-lambda`);
  const [runtime, setRuntime] = useState("python3.12");
  const [handler, setHandler] = useState("lambda_function.lambda_handler");
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
      setFunctionName(`${projectName}-lambda`);
      setRuntime("python3.12");
      setHandler("lambda_function.lambda_handler");
      setDescription("");
      setSaveConfig_(false);
      setConfigName("");
    }
  }, [isOpen, projectName]);

  // Update default handler when runtime changes
  useEffect(() => {
    if (runtime.startsWith("node")) setHandler("index.handler");
    else if (runtime.startsWith("python")) setHandler("lambda_function.lambda_handler");
    else if (runtime.startsWith("go")) setHandler("main");
    else if (runtime.startsWith("java")) setHandler("com.example.Handler::handleRequest");
    else if (runtime.startsWith("dotnet")) setHandler("Assembly::Namespace.Handler::FunctionHandler");
  }, [runtime]);

  if (!isOpen) return null;

  const projectConfigs = savedConfigs.filter(
    (c) => c.resource_type === "lambda" && c.project_id === profile?.active_project_id
  );

  const loadSavedConfig = (config: LambdaFunctionConfig) => {
    setFunctionName(config.functionName || "");
    setRuntime(config.runtime || "python3.12");
    setHandler(config.handler || "lambda_function.lambda_handler");
    setDescription(config.description || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functionName.trim()) return;
    if (saveConfig_ && !configName.trim()) return;

    const config: LambdaFunctionConfig = { functionName, runtime, handler, description };

    if (saveConfig_ && configName.trim()) {
      try {
        await saveConfig(configName.trim(), "lambda", config);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — function will still be created");
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
            <div className="p-2 bg-orange-50 rounded-lg">
              <Icon icon="logos:aws-lambda" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create Lambda Function</h2>
              <p className="text-xs text-gray-500">Deploy a new Lambda function to the AWS Emulator</p>
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
                    onClick={() => loadSavedConfig(c.config as LambdaFunctionConfig)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Function Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function Name
            </label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="my-function"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Runtime */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Runtime
            </label>
            <select
              value={runtime}
              onChange={(e) => setRuntime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
            >
              {RUNTIMES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Handler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handler
            </label>
            <input
              type="text"
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="lambda_function.lambda_handler"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: <code className="bg-gray-100 px-1 rounded">filename.method</code>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              placeholder="What does this function do?"
            />
          </div>

          {/* Note */}
          <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
            <strong>No zip required.</strong> The function is created with a minimal placeholder. Upload your real code later with{" "}
            <code className="bg-orange-100 px-1 rounded">update-function-code</code> (AWS CLI or SDK).
          </div>

          {/* Save Config Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveConfig_}
                onChange={(e) => setSaveConfig_(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Save as config for future use</span>
            </label>
            {saveConfig_ && (
              <div className="mt-3">
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="Config name (e.g. My Python Handler)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
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
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
              disabled={loading || !functionName.trim() || (saveConfig_ && !configName.trim())}
            >
              {loading ? "Creating..." : "Create Function"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
