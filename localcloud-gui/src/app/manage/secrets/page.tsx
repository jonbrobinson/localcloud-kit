"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  TagIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import SecretsConfigModal from "@/components/SecretsConfigModal";
import ManageHeaderBrand from "@/components/ManageHeaderBrand";
import { SecretsManagerConfig } from "@/types";
import { resourceApi } from "@/services/api";
import SystemLogsButton from "@/components/SystemLogsButton";

interface Secret {
  Name: string;
  ARN?: string;
  Description?: string;
  LastChangedDate?: string;
  Tags?: Array<{ Key: string; Value: string }>;
  SecretString?: string;
}

export default function ManageSecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [secretDetails, setSecretDetails] = useState<Record<string, Secret>>({});
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Secret | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedArn, setCopiedArn] = useState<string>("");
  const [editValue, setEditValue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  // active_project_name isn't available outside dashboard — we use a neutral project label
  const projectName = "default";

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/secrets");
      const result = await res.json();
      if (result.success) {
        setSecrets(result.data.SecretList || []);
      } else {
        toast.error("Failed to load secrets");
      }
    } catch {
      toast.error("Failed to load secrets");
    } finally {
      setLoading(false);
    }
  };

  const revealSecret = async (secretName: string) => {
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(secretName)}?includeValue=true`);
      const result = await res.json();
      if (result.success) {
        setSecretDetails((prev) => ({ ...prev, [secretName]: result.data }));
        setRevealedSecrets((prev) => new Set(prev).add(secretName));
      } else {
        toast.error("Failed to reveal secret");
      }
    } catch {
      toast.error("Failed to reveal secret");
    }
  };

  const hideSecret = (name: string) => {
    setRevealedSecrets((prev) => {
      const s = new Set(prev);
      s.delete(name);
      return s;
    });
  };

  const handleCreate = async (config: SecretsManagerConfig) => {
    setCreateLoading(true);
    try {
      const res = await resourceApi.createSingleWithConfig(projectName, "secretsmanager", { secretsmanagerConfig: config });
      if (res.success) {
        toast.success("Secret created");
        setShowCreateModal(false);
        setTimeout(loadSecrets, 800);
      } else {
        toast.error(res.error || "Failed to create secret");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create secret");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (secret: Secret) => {
    setEditingSecret(secret);
    setEditValue("");
    setEditDesc(secret.Description || "");
    setSelectedSecret(secret);
  };

  const handleSave = async () => {
    if (!editingSecret || !editValue.trim()) {
      toast.error("Secret value is required");
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(editingSecret.Name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretValue: editValue, description: editDesc || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Secret updated");
        setEditingSecret(null);
        setSelectedSecret(null);
        setEditValue("");
        setRevealedSecrets((prev) => { const s = new Set(prev); s.delete(editingSecret.Name); return s; });
        loadSecrets();
      } else {
        toast.error(result.error || "Failed to update secret");
      }
    } catch {
      toast.error("Failed to update secret");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(deleteTarget.Name)}?forceDelete=true`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Secret deleted");
        setDeleteTarget(null);
        if (selectedSecret?.Name === deleteTarget.Name) setSelectedSecret(null);
        loadSecrets();
      } else {
        toast.error(result.error || "Failed to delete secret");
      }
    } catch {
      toast.error("Failed to delete secret");
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <ManageHeaderBrand />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Manage secrets</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <SystemLogsButton />
              <Link
                href="/secrets"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BookOpenIcon className="h-4 w-4" />
                <span>Docs</span>
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Create Secret</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/5 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/5 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : secrets.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
            <KeyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No secrets found</h3>
            <p className="text-gray-500 mb-5">Get started by creating your first secret.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Create Secret
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {secrets.map((secret, idx) => {
                const isSelected = selectedSecret?.Name === secret.Name;
                const isEditing = editingSecret?.Name === secret.Name;
                const isRevealed = revealedSecrets.has(secret.Name);

                return (
                  <motion.div
                    key={secret.ARN ?? secret.Name ?? `secret-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className={`bg-white border rounded-lg p-5 transition-shadow ${isSelected ? "border-indigo-300 shadow-md" : "border-gray-200 hover:shadow-sm"}`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{secret.Name}</h3>
                          {secret.Tags && secret.Tags.length > 0 && (
                            <span className="flex items-center text-xs text-gray-400">
                              <TagIcon className="h-3.5 w-3.5 mr-0.5" />
                              {secret.Tags.length}
                            </span>
                          )}
                        </div>
                        {secret.Description && (
                          <p className="flex items-center space-x-1.5 text-sm text-gray-600 mb-1">
                            <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{secret.Description}</span>
                          </p>
                        )}
                        {secret.LastChangedDate && (
                          <p className="text-xs text-gray-400">
                            Last changed: {new Date(secret.LastChangedDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-4 shrink-0">
                        <button
                          onClick={() => isSelected && !isEditing ? setSelectedSecret(null) : openEdit(secret)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit secret"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(secret)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete secret"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* ARN */}
                    {secret.ARN && (
                      <div className="mt-3 flex items-center space-x-2 bg-gray-50 rounded px-3 py-1.5 text-xs">
                        <code className="flex-1 text-gray-500 font-mono truncate">{secret.ARN}</code>
                        <button onClick={() => copyArn(secret.ARN!)} title="Copy ARN" className="text-gray-400 hover:text-gray-600">
                          {copiedArn === secret.ARN ? <CheckIcon className="h-3.5 w-3.5 text-green-500" /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Tags */}
                    {secret.Tags && secret.Tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {secret.Tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {tag.Key}: {tag.Value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Secret value reveal */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Secret Value</span>
                        <button
                          onClick={() => isRevealed ? hideSecret(secret.Name) : revealSecret(secret.Name)}
                          className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          {isRevealed ? (
                            <><EyeSlashIcon className="h-3.5 w-3.5" /><span>Hide</span></>
                          ) : (
                            <><EyeIcon className="h-3.5 w-3.5" /><span>Reveal</span></>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                        <code className={`text-sm font-mono ${isRevealed ? "text-gray-900 break-all" : "text-gray-400 tracking-widest"}`}>
                          {isRevealed ? (secretDetails[secret.Name]?.SecretString || "***MASKED***") : "••••••••••••••••"}
                        </code>
                      </div>
                    </div>

                    {/* Inline edit panel */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 border border-indigo-200 rounded-lg p-4 bg-indigo-50/30 space-y-3">
                            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Edit Secret</p>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">New Value *</label>
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                rows={3}
                                placeholder="Enter new secret value"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSave}
                                disabled={saveLoading || !editValue.trim()}
                                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {saveLoading ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => { setEditingSecret(null); setSelectedSecret(null); }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete secret?</h3>
              <p className="text-sm text-gray-600 mb-1">
                This will permanently delete <span className="font-mono font-medium">{deleteTarget.Name}</span>.
              </p>
              <p className="text-xs text-red-600 mb-5">This action cannot be undone.</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting…" : "Delete"}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <SecretsConfigModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        projectName={projectName}
        loading={createLoading}
      />
    </div>
  );
}
