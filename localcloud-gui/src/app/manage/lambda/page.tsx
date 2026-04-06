"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  ArrowPathIcon,
  BookOpenIcon,
  TrashIcon,
  CodeBracketIcon,
  BoltIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { resourceApi } from "@/services/api";
import ManageHeaderBrand from "@/components/ManageHeaderBrand";
import { LambdaFunctionConfig } from "@/types";
import LambdaConfigModal from "@/components/LambdaConfigModal";
import LambdaCodeModal from "@/components/LambdaCodeModal";
import SystemLogsButton from "@/components/SystemLogsButton";
import { useProjectName } from "@/hooks/useProjectName";

interface LambdaFunction {
  FunctionName: string;
  Runtime?: string;
  Handler?: string;
  MemorySize?: number;
  Timeout?: number;
  LastModified?: string;
  FunctionArn?: string;
  Description?: string;
  CodeSize?: number;
}

const formatBytes = (b?: number) => {
  if (!b) return "—";
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
};

export default function ManageLambdaPage() {
  const projectName = useProjectName();
  const [functions, setFunctions] = useState<LambdaFunction[]>([]);
  const [selectedFn, setSelectedFn] = useState<LambdaFunction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  /** When false, only functions whose name starts with `{projectName}-` (same filter as the dashboard list). */
  const [showAllFunctions, setShowAllFunctions] = useState(false);

  const loadFunctions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = showAllFunctions
        ? ""
        : `?projectName=${encodeURIComponent(projectName)}`;
      const res = await fetch(`/api/lambda/functions${qs}`);
      const result = await res.json();
      if (result.success) {
        setFunctions(result.data?.Functions || []);
      } else {
        toast.error("Failed to load functions");
      }
    } catch {
      toast.error("Failed to load functions");
    } finally {
      setLoading(false);
    }
  }, [projectName, showAllFunctions]);

  useEffect(() => {
    void loadFunctions();
  }, [loadFunctions]);

  const handleCreate = async (config: LambdaFunctionConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "lambda", { lambdaConfig: config });
      if (res.success) {
        toast.success("Function created");
        setShowCreate(false);
        setTimeout(loadFunctions, 800);
      } else {
        toast.error(res.error || "Failed to create function");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create function");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/lambda/functions/${encodeURIComponent(deleteTarget)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Function deleted");
        setDeleteTarget(null);
        if (selectedFn?.FunctionName === deleteTarget) setSelectedFn(null);
        loadFunctions();
      } else {
        toast.error(result.error || "Failed to delete function");
      }
    } catch {
      toast.error("Failed to delete function");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <ManageHeaderBrand />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Manage functions</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <SystemLogsButton />
              <Link href="/lambda" className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button onClick={loadFunctions} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
                <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Function</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Function sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Functions ({functions.length})</p>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={showAllFunctions}
                onChange={(e) => setShowAllFunctions(e.target.checked)}
              />
              <span className="text-xs text-gray-600">Show all in emulator</span>
            </label>
            {!showAllFunctions && (
              <p className="text-[10px] text-gray-400 leading-snug">
                Scoped to <span className="font-mono">{projectName}-*</span>. Turn on to list every function (e.g. names without that prefix).
              </p>
            )}
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : functions.length === 0 ? (
            <div className="p-6 text-center">
              <BoltIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No functions</p>
            </div>
          ) : (
            <ul className="py-1">
              {functions.map((fn) => (
                <li key={fn.FunctionName}>
                  <button
                    onClick={() => setSelectedFn(fn)}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedFn?.FunctionName === fn.FunctionName
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <BoltIcon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{fn.FunctionName}</p>
                      {fn.Runtime && <p className="text-xs text-gray-400">{fn.Runtime}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedFn ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <BoltIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">Select a function to view its details</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              {/* Function header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFn.FunctionName}</h2>
                  {selectedFn.Description && <p className="text-sm text-gray-500 mt-1">{selectedFn.Description}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCode(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <CodeBracketIcon className="h-3.5 w-3.5" />
                    <span>View Code</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selectedFn.FunctionName)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Config grid */}
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {[
                  { label: "Runtime", value: selectedFn.Runtime },
                  { label: "Handler", value: selectedFn.Handler },
                  { label: "Memory", value: selectedFn.MemorySize ? `${selectedFn.MemorySize} MB` : undefined },
                  { label: "Timeout", value: selectedFn.Timeout ? `${selectedFn.Timeout}s` : undefined },
                  { label: "Code Size", value: formatBytes(selectedFn.CodeSize) },
                  { label: "Last Modified", value: selectedFn.LastModified ? new Date(selectedFn.LastModified).toLocaleString() : undefined },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center px-5 py-3">
                    <dt className="w-32 text-xs font-medium text-gray-500">{label}</dt>
                    <dd className="text-sm text-gray-900 font-mono">{value}</dd>
                  </div>
                ) : null)}
              </div>

              {/* ARN */}
              {selectedFn.FunctionArn && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs font-mono text-gray-500 break-all">
                  {selectedFn.FunctionArn}
                </div>
              )}

              {/* Invoke info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <ClockIcon className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-800">Invoke</p>
                </div>
                <p className="text-xs text-amber-700">
                  Use the AWS CLI or SDK to invoke this function at <code className="bg-amber-100 px-1 rounded">http://localhost:4566</code>.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete function?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-mono font-medium">{deleteTarget}</span> will be permanently deleted.
            </p>
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

      <LambdaConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />

      {showCode && selectedFn && (
        <LambdaCodeModal
          isOpen={showCode}
          onClose={() => setShowCode(false)}
          functionName={selectedFn.FunctionName}
        />
      )}
    </div>
  );
}
