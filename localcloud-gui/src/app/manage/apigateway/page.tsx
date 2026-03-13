"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  ArrowPathIcon,
  BookOpenIcon,
  TrashIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { resourceApi } from "@/services/api";
import { APIGatewayConfig } from "@/types";
import APIGatewayConfigModal from "@/components/APIGatewayConfigModal";
import APIGatewayConfigViewer from "@/components/APIGatewayConfigViewer";

interface APIGatewayAPI {
  id: string;
  name: string;
  description?: string;
  createdDate?: string;
}

const projectName = "default";

export default function ManageAPIGatewayPage() {
  const [apis, setApis] = useState<APIGatewayAPI[]>([]);
  const [selectedApi, setSelectedApi] = useState<APIGatewayAPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<APIGatewayAPI | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadApis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apigateway/apis");
      const result = await res.json();
      if (result.success) {
        setApis(result.data?.items || result.data || []);
      } else {
        toast.error("Failed to load APIs");
      }
    } catch {
      toast.error("Failed to load APIs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApis(); }, [loadApis]);

  const handleCreate = async (config: APIGatewayConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "apigateway", { apigatewayConfig: config });
      if (res.success) {
        toast.success("API created");
        setShowCreate(false);
        setTimeout(loadApis, 800);
      } else {
        toast.error(res.error || "Failed to create API");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create API");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/apigateway/apis/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("API deleted");
        setDeleteTarget(null);
        if (selectedApi?.id === deleteTarget.id) setSelectedApi(null);
        loadApis();
      } else {
        toast.error(result.error || "Failed to delete API");
      }
    } catch {
      toast.error("Failed to delete API");
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
              <Image src="/logo.svg" alt="LocalCloud Kit" width={36} height={36} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Manage APIs</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/apigateway" className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button onClick={loadApis} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
                <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create API</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* API sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">APIs ({apis.length})</p>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : apis.length === 0 ? (
            <div className="p-6 text-center">
              <GlobeAltIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No APIs</p>
            </div>
          ) : (
            <ul className="py-1">
              {apis.map((api) => (
                <li key={api.id}>
                  <button
                    onClick={() => setSelectedApi(api)}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedApi?.id === api.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <GlobeAltIcon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{api.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{api.id}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedApi ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <GlobeAltIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">Select an API to view its details</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedApi.name}</h2>
                  {selectedApi.description && <p className="text-sm text-gray-500 mt-1">{selectedApi.description}</p>}
                  <p className="text-xs text-gray-400 font-mono mt-1">ID: {selectedApi.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConfig(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Cog6ToothIcon className="h-3.5 w-3.5" />
                    <span>Configure</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(selectedApi)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {selectedApi.createdDate && (
                  <div className="flex items-center px-5 py-3">
                    <dt className="w-32 text-xs font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{new Date(selectedApi.createdDate).toLocaleString()}</dd>
                  </div>
                )}
                <div className="flex items-center px-5 py-3">
                  <dt className="w-32 text-xs font-medium text-gray-500">Endpoint</dt>
                  <dd className="text-sm font-mono text-gray-700 break-all">
                    http://localhost:4566/restapis/{selectedApi.id}/dev/_user_request_/
                  </dd>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete API?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-medium">{deleteTarget.name}</span> will be permanently deleted.
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

      <APIGatewayConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />

      {showConfig && selectedApi && (
        <APIGatewayConfigViewer
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          apiId={selectedApi.id}
          apiName={selectedApi.name}
        />
      )}
    </div>
  );
}
