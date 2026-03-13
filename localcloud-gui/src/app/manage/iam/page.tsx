"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  ArrowPathIcon,
  BookOpenIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { resourceApi } from "@/services/api";
import { IAMRoleConfig } from "@/types";
import IAMConfigModal from "@/components/IAMConfigModal";

interface IAMRole {
  RoleName: string;
  RoleId?: string;
  Arn?: string;
  Description?: string;
  CreateDate?: string;
  AssumeRolePolicyDocument?: string;
  Path?: string;
}

interface IAMPolicy {
  PolicyName: string;
  PolicyArn?: string;
}

const projectName = "default";

export default function ManageIAMPage() {
  const [roles, setRoles] = useState<IAMRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<IAMRole | null>(null);
  const [policies, setPolicies] = useState<IAMPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IAMRole | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedArn, setCopiedArn] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam/roles");
      const result = await res.json();
      if (result.success) {
        setRoles(result.data || []);
      } else {
        toast.error("Failed to load roles");
      }
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const loadPolicies = useCallback(async (roleName: string) => {
    setLoadingPolicies(true);
    try {
      const res = await fetch(`/api/iam/roles/${encodeURIComponent(roleName)}/policies`);
      const result = await res.json();
      if (result.success) {
        setPolicies(result.data || []);
      }
    } catch {
      // policies are optional — fail silently
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  const selectRole = (role: IAMRole) => {
    setSelectedRole(role);
    setPolicies([]);
    loadPolicies(role.RoleName);
  };

  const handleCreate = async (config: IAMRoleConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "iam", { iamConfig: config });
      if (res.success) {
        toast.success("Role created");
        setShowCreate(false);
        setTimeout(loadRoles, 800);
      } else {
        toast.error(res.error || "Failed to create role");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/iam/roles/${encodeURIComponent(deleteTarget.RoleName)}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Role deleted");
        setDeleteTarget(null);
        if (selectedRole?.RoleName === deleteTarget.RoleName) setSelectedRole(null);
        loadRoles();
      } else {
        toast.error(result.error || "Failed to delete role");
      }
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyArn = (arn: string) => {
    navigator.clipboard.writeText(arn).then(() => {
      setCopiedArn(arn);
      setTimeout(() => setCopiedArn(""), 2000);
    });
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
                <p className="text-xs text-gray-500">Manage roles</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/iam" className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button onClick={loadRoles} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Refresh">
                <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Role</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Roles sidebar */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Roles ({roles.length})</p>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">
              {[0,1,2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : roles.length === 0 ? (
            <div className="p-6 text-center">
              <ShieldCheckIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No roles</p>
            </div>
          ) : (
            <ul className="py-1">
              {roles.map((role) => (
                <li key={role.RoleName}>
                  <button
                    onClick={() => selectRole(role)}
                    className={`w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-left transition-colors ${
                      selectedRole?.RoleName === role.RoleName
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ShieldCheckIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{role.RoleName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedRole ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-24">
              <ShieldCheckIcon className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">Select a role to view its details</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRole.RoleName}</h2>
                  {selectedRole.Description && <p className="text-sm text-gray-500 mt-1">{selectedRole.Description}</p>}
                </div>
                <button
                  onClick={() => setDeleteTarget(selectedRole)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {/* Metadata */}
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {selectedRole.Arn && (
                  <div className="flex items-center px-5 py-3">
                    <dt className="w-24 text-xs font-medium text-gray-500 flex-shrink-0">ARN</dt>
                    <dd className="flex items-center space-x-2 flex-1 min-w-0">
                      <code className="text-xs font-mono text-gray-700 truncate flex-1">{selectedRole.Arn}</code>
                      <button onClick={() => copyArn(selectedRole.Arn!)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                        {copiedArn === selectedRole.Arn ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                      </button>
                    </dd>
                  </div>
                )}
                {selectedRole.Path && (
                  <div className="flex items-center px-5 py-3">
                    <dt className="w-24 text-xs font-medium text-gray-500">Path</dt>
                    <dd className="text-sm font-mono text-gray-700">{selectedRole.Path}</dd>
                  </div>
                )}
                {selectedRole.CreateDate && (
                  <div className="flex items-center px-5 py-3">
                    <dt className="w-24 text-xs font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-700">{new Date(selectedRole.CreateDate).toLocaleString()}</dd>
                  </div>
                )}
              </div>

              {/* Policies */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Attached Policies</h3>
                {loadingPolicies ? (
                  <div className="space-y-2">
                    {[0,1].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                  </div>
                ) : policies.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
                    <p className="text-sm text-gray-400">No policies attached</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {policies.map((policy) => (
                      <div key={policy.PolicyName} className="flex items-center px-5 py-3">
                        <ShieldCheckIcon className="h-4 w-4 text-indigo-400 mr-3" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{policy.PolicyName}</p>
                          {policy.PolicyArn && <p className="text-xs text-gray-400 font-mono truncate">{policy.PolicyArn}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete role?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-medium">{deleteTarget.RoleName}</span> will be permanently deleted.
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

      <IAMConfigModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />
    </div>
  );
}
