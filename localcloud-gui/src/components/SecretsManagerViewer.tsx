"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  TagIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { resourceApi } from "@/services/api";
import { SecretsManagerConfig } from "@/types";
import SecretsConfigModal from "./SecretsConfigModal";

interface Secret {
  Name: string;
  ARN?: string;
  Description?: string;
  LastChangedDate?: string;
  Tags?: Array<{ Key: string; Value: string }>;
  SecretString?: string;
  VersionId?: string;
}

interface SecretsManagerViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export default function SecretsManagerViewer({
  isOpen,
  onClose,
  projectName,
}: SecretsManagerViewerProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set()
  );
  const [secretDetails, setSecretDetails] = useState<Record<string, Secret>>(
    {}
  );

  // Form states
  const [formData, setFormData] = useState({
    secretName: "",
    secretValue: "",
    description: "",
    tags: "",
    kmsKeyId: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadSecrets();
    }
  }, [isOpen]);

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

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/secrets");
      const result = await response.json();

      if (result.success) {
        setSecrets(result.data.SecretList || []);
      } else {
        toast.error("Failed to load secrets");
      }
    } catch (error) {
      console.error("Error loading secrets:", error);
      toast.error("Failed to load secrets");
    } finally {
      setLoading(false);
    }
  };

  const revealSecret = async (secretName: string) => {
    try {
      const response = await fetch(
        `/api/secrets/${encodeURIComponent(secretName)}?includeValue=true`
      );
      const result = await response.json();

      if (result.success) {
        setSecretDetails((prev) => ({
          ...prev,
          [secretName]: result.data,
        }));
        setRevealedSecrets((prev) => new Set(prev).add(secretName));
        toast.success("Secret value revealed");
      } else {
        toast.error("Failed to reveal secret");
      }
    } catch (error) {
      console.error("Error revealing secret:", error);
      toast.error("Failed to reveal secret");
    }
  };

  const hideSecret = (secretName: string) => {
    setRevealedSecrets((prev) => {
      const newSet = new Set(prev);
      newSet.delete(secretName);
      return newSet;
    });
  };

  const handleUpdateSecret = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSecret) return;

    try {
      const tags = formData.tags
        ? Object.fromEntries(
            formData.tags.split(",").map((tag) => {
              const [key, value] = tag.split("=").map((s) => s.trim());
              return [key, value];
            })
          )
        : {};

      const response = await fetch(
        `/api/secrets/${encodeURIComponent(selectedSecret.Name)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secretValue: formData.secretValue,
            description: formData.description || undefined,
            tags: Object.keys(tags).length > 0 ? tags : undefined,
            kmsKeyId: formData.kmsKeyId || undefined,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Secret updated successfully");
        setShowEditModal(false);
        setSelectedSecret(null);
        setFormData({
          secretName: "",
          secretValue: "",
          description: "",
          tags: "",
          kmsKeyId: "",
        });
        loadSecrets();
      } else {
        toast.error(result.error || "Failed to update secret");
      }
    } catch (error) {
      console.error("Error updating secret:", error);
      toast.error("Failed to update secret");
    }
  };

  const handleDeleteSecret = async () => {
    if (!selectedSecret) return;

    try {
      const response = await fetch(
        `/api/secrets/${encodeURIComponent(
          selectedSecret.Name
        )}?forceDelete=true`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Secret deleted successfully");
        setShowDeleteModal(false);
        setSelectedSecret(null);
        loadSecrets();
      } else {
        toast.error(result.error || "Failed to delete secret");
      }
    } catch (error) {
      console.error("Error deleting secret:", error);
      toast.error("Failed to delete secret");
    }
  };

  const handleCreateSecretFromConfig = async (secretsmanagerConfig: SecretsManagerConfig) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.createSingleWithConfig(projectName, "secretsmanager", { secretsmanagerConfig });
      if (response.success) {
        toast.success("Secret created successfully");
        setShowCreateModal(false);
        setTimeout(loadSecrets, 800);
      } else {
        toast.error(response.error || "Failed to create secret");
      }
    } catch (error) {
      console.error("Create secret error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create secret");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (secret: Secret) => {
    setSelectedSecret(secret);
    setFormData({
      secretName: secret.Name,
      secretValue: "",
      description: secret.Description || "",
      tags:
        secret.Tags?.map((tag) => `${tag.Key}=${tag.Value}`).join(", ") || "",
      kmsKeyId: "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (secret: Secret) => {
    setSelectedSecret(secret);
    setShowDeleteModal(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[74vh] min-h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <KeyIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Secrets Manager</h2>
              <p className="text-xs text-gray-500">Project: {projectName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/manage/secrets"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <span>Open Manager</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Secret</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto p-6 space-y-4"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/5" />
                      <div className="h-3 bg-gray-100 rounded w-3/5" />
                      <div className="h-3 bg-gray-100 rounded w-1/4 mt-3" />
                      <div className="mt-3 bg-gray-50 rounded-md p-3">
                        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                        <div className="h-6 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4 mt-1">
                      <div className="h-8 w-8 bg-gray-100 rounded" />
                      <div className="h-8 w-8 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
              className="h-full overflow-y-auto p-6"
            >
              {secrets.length === 0 ? (
                <div className="text-center py-12">
                  <KeyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No secrets found
                  </h3>
                  <p className="text-gray-500 mb-5">
                    Get started by creating your first secret.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm mx-auto"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    Create Secret
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {secrets.map((secret, idx) => (
                    <div
                      key={secret.ARN ?? secret.Name ?? `secret-${idx}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {secret.Name}
                            </h3>
                            {secret.Tags && secret.Tags.length > 0 && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <TagIcon className="h-4 w-4" />
                                <span>{secret.Tags.length} tags</span>
                              </div>
                            )}
                          </div>

                          {secret.Description && (
                            <p className="text-gray-600 mb-2 flex items-center space-x-2">
                              <DocumentTextIcon className="h-4 w-4" />
                              <span>{secret.Description}</span>
                            </p>
                          )}

                          {secret.LastChangedDate && (
                            <p className="text-sm text-gray-500">
                              Last changed:{" "}
                              {new Date(
                                secret.LastChangedDate
                              ).toLocaleString()}
                            </p>
                          )}

                          {/* Secret Value Display */}
                          <div className="mt-3">
                            {revealedSecrets.has(secret.Name) ? (
                              <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Secret Value:
                                  </span>
                                  <button
                                    onClick={() => hideSecret(secret.Name)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <EyeSlashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <code className="text-sm bg-white p-2 rounded border block break-all text-gray-900">
                                  {secretDetails[secret.Name]?.SecretString ||
                                    "***MASKED***"}
                                </code>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Secret Value:
                                  </span>
                                  <button
                                    onClick={() => revealSecret(secret.Name)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                </div>
                                <code className="text-sm bg-white p-2 rounded border block text-gray-900">
                                  ***MASKED***
                                </code>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {secret.Tags && secret.Tags.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-700">
                                Tags:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {secret.Tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tag.Key}: {tag.Value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openEditModal(secret)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                            title="Edit secret"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(secret)}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Delete secret"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Create Secret Modal — uses SecretsConfigModal with SavedConfigPicker */}
      <SecretsConfigModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSecretFromConfig}
        projectName={projectName}
        loading={createLoading}
      />

      {/* Edit Secret Modal */}
      {showEditModal && selectedSecret && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowEditModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Secret</h3>
                <p className="text-xs text-gray-500">{selectedSecret.Name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSecret} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Name
                </label>
                <input
                  type="text"
                  value={formData.secretName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Secret Value *
                </label>
                <textarea
                  value={formData.secretValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      secretValue: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated, format: key=value)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Environment=dev, Project=myapp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KMS Key ID
                </label>
                <input
                  type="text"
                  value={formData.kmsKeyId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      kmsKeyId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSecret && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="shrink-0">
                  <TrashIcon className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Secret
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the secret{" "}
                <strong>{selectedSecret.Name}</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSecret}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Secret
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
