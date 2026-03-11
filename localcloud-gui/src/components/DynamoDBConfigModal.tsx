"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon, TrashIcon, CircleStackIcon } from "@heroicons/react/24/outline";
import { DynamoDBTableConfig, DynamoDBGSI } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { toast } from "react-hot-toast";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <CircleStackIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create DynamoDB Table</h2>
              <p className="text-xs text-gray-500">Primary key, billing mode &amp; GSIs</p>
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
                      loadSavedConfig(cfg.config as DynamoDBTableConfig);
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

          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Mode
              </label>
              <select
                value={billingMode}
                onChange={(e) => setBillingMode(e.target.value as "PAY_PER_REQUEST" | "PROVISIONED")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="PAY_PER_REQUEST">Pay Per Request</option>
                <option value="PROVISIONED">Provisioned</option>
              </select>
            </div>
          </div>

          {/* Primary Key */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Primary Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partition Key (PK)
                </label>
                <input
                  type="text"
                  value={partitionKey}
                  onChange={(e) => setPartitionKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Key (SK) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Leave empty for simple primary key"
                />
              </div>
            </div>
          </div>

          {/* Provisioned Capacity */}
          {billingMode === "PROVISIONED" && (
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Provisioned Capacity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Read Capacity Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={readCapacity}
                    onChange={(e) => setReadCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Write Capacity Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={writeCapacity}
                    onChange={(e) => setWriteCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Global Secondary Indexes */}
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Global Secondary Indexes</h3>
              <button
                type="button"
                onClick={addGSI}
                disabled={gsis.length >= 5}
                className="flex items-center px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                Add GSI ({gsis.length}/5)
              </button>
            </div>

            {gsis.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                No GSIs configured. Click &quot;Add GSI&quot; to create up to 5 Global Secondary Indexes.
              </p>
            )}

            {gsis.map((gsi, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900">GSI {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeGSI(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Index Name</label>
                    <input
                      type="text"
                      value={gsi.indexName}
                      onChange={(e) => updateGSI(index, "indexName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Partition Key</label>
                    <input
                      type="text"
                      value={gsi.partitionKey}
                      onChange={(e) => updateGSI(index, "partitionKey", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort Key <span className="text-gray-400">(optional)</span></label>
                    <input
                      type="text"
                      value={gsi.sortKey || ""}
                      onChange={(e) => updateGSI(index, "sortKey", e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Projection Type</label>
                    <select
                      value={gsi.projectionType}
                      onChange={(e) => updateGSI(index, "projectionType", e.target.value as "ALL" | "KEYS_ONLY" | "INCLUDE")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                    >
                      <option value="ALL">All</option>
                      <option value="KEYS_ONLY">Keys Only</option>
                      <option value="INCLUDE">Include</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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
                  placeholder="e.g. my-app-table"
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
              {loading ? "Creating..." : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
