"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { resourceApi } from "@/services/api";
import AppNavBar from "@/components/AppNavBar";
import { SSMParameterConfig } from "@/types";
import SSMConfigModal from "@/components/SSMConfigModal";
import SSMEditModal from "@/components/SSMEditModal";
import { Button, IconButton } from "@/components/ui";

interface SSMParameter {
  Name: string;
  Type?: string;
  Value?: string;
  Version?: number;
  LastModifiedDate?: string;
  ARN?: string;
  DataType?: string;
}

const projectName = "default";

const TYPE_COLORS: Record<string, string> = {
  String: "bg-blue-50 text-blue-700",
  StringList: "bg-purple-50 text-purple-700",
  SecureString: "bg-amber-50 text-amber-700",
};

export default function ManageSSMPage() {
  const [params, setParams] = useState<SSMParameter[]>([]);
  const [selectedParam, setSelectedParam] = useState<SSMParameter | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SSMParameter | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [revealedParams, setRevealedParams] = useState<Set<string>>(new Set());
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const loadParams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ssm/parameters");
      const result = await res.json();
      if (result.success) {
        setParams(result.data?.Parameters || []);
      } else {
        toast.error("Failed to load parameters");
      }
    } catch {
      toast.error("Failed to load parameters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadParams(); }, [loadParams]);

  const revealParam = async (name: string) => {
    try {
      const encoded = name.startsWith("/") ? name.slice(1) : name;
      const res = await fetch(`/api/ssm/parameters/${encodeURIComponent(encoded)}?withDecryption=true`);
      const result = await res.json();
      if (result.success) {
        const value = result.data?.Parameter?.Value || "";
        setParamValues((prev) => ({ ...prev, [name]: value }));
        setRevealedParams((prev) => new Set(prev).add(name));
      } else {
        toast.error("Failed to reveal parameter");
      }
    } catch {
      toast.error("Failed to reveal parameter");
    }
  };

  const hideParam = (name: string) => {
    setRevealedParams((prev) => { const s = new Set(prev); s.delete(name); return s; });
  };

  const handleCreate = async (config: SSMParameterConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "ssm", { ssmConfig: config });
      if (res.success) {
        toast.success("Parameter created");
        setShowCreate(false);
        setTimeout(loadParams, 800);
      } else {
        toast.error(res.error || "Failed to create parameter");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create parameter");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveEdit = async (config: SSMParameterConfig) => {
    setEditLoading(true);
    try {
      const name = editTarget || "";
      const encoded = name.startsWith("/") ? name.slice(1) : name;
      const res = await fetch(`/api/ssm/parameters/${encodeURIComponent(encoded)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: config.parameterValue,
          type: config.parameterType,
          description: config.description,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Parameter updated");
        setEditTarget(null);
        setRevealedParams((prev) => { const s = new Set(prev); s.delete(name); return s; });
        loadParams();
      } else {
        toast.error(result.error || "Failed to update parameter");
      }
    } catch {
      toast.error("Failed to update parameter");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const name = deleteTarget.Name;
      const encoded = name.startsWith("/") ? name.slice(1) : name;
      const res = await fetch(`/api/ssm/parameters/${encodeURIComponent(encoded)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Parameter deleted");
        setDeleteTarget(null);
        if (selectedParam?.Name === deleteTarget.Name) setSelectedParam(null);
        loadParams();
      } else {
        toast.error(result.error || "Failed to delete parameter");
      }
    } catch {
      toast.error("Failed to delete parameter");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <AppNavBar pageLabel="Manage Parameter Store">
        <Link
          href="/ssm"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-ink-2 bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
        >
          <Icon icon="lucide:book-open" width={15} />
          Docs
        </Link>
        <IconButton
          icon="lucide:refresh-cw"
          variant="outline"
          label="Refresh parameters"
          loading={loading}
          onClick={loadParams}
        />
        <Button variant="primary" icon="lucide:plus" onClick={() => setShowCreate(true)}>
          Create Parameter
        </Button>
      </AppNavBar>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="space-y-3">
              {[0,1,2,3].map((i) => <div key={i} className="h-16 bg-white border border-gray-200 rounded-lg animate-pulse" />)}
            </div>
          ) : params.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
              <AdjustmentsHorizontalIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parameters</h3>
              <p className="text-gray-500 mb-5">Store configuration values securely.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create Parameter
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Value</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Last Modified</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {params.map((param) => {
                    const revealed = revealedParams.has(param.Name);
                    const isSecure = param.Type === "SecureString";
                    return (
                      <tr key={param.Name} className={`hover:bg-gray-50 ${selectedParam?.Name === param.Name ? "bg-indigo-50/40" : ""}`}>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setSelectedParam(selectedParam?.Name === param.Name ? null : param)}
                            className="text-left font-mono text-indigo-600 hover:text-indigo-800 text-sm"
                          >
                            {param.Name}
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[param.Type || "String"] || TYPE_COLORS.String}`}>
                            {param.Type || "String"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center space-x-2">
                            {isSecure ? (
                              <>
                                <code className="text-xs font-mono text-gray-400">
                                  {revealed ? (paramValues[param.Name] || "***") : "••••••••"}
                                </code>
                                <button
                                  onClick={() => revealed ? hideParam(param.Name) : revealParam(param.Name)}
                                  className="text-gray-400 hover:text-indigo-600"
                                >
                                  {revealed ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                                </button>
                              </>
                            ) : (
                              <code className="text-xs font-mono text-gray-700 max-w-xs truncate block">
                                {param.Value || "—"}
                              </code>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {param.LastModifiedDate ? new Date(param.LastModifiedDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setEditTarget(param.Name)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="Edit parameter"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(param)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete parameter"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete parameter?</h3>
            <p className="text-sm text-gray-600 mb-5 font-mono">{deleteTarget.Name}</p>
            <div className="flex space-x-3">
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SSMConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />

      {editTarget && (
        <SSMEditModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          parameterName={editTarget}
          loading={editLoading}
        />
      )}
    </div>
  );
}
