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
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface Secret {
  Name: string;
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

  const loadSecretDetails = async (secretName: string) => {
    try {
      const response = await fetch(
        `/api/secrets/${encodeURIComponent(secretName)}?includeValue=false`
      );
      const result = await response.json();

      if (result.success) {
        setSecretDetails((prev) => ({
          ...prev,
          [secretName]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading secret details:", error);
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

  const handleCreateSecret = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const tags = formData.tags
        ? Object.fromEntries(
            formData.tags.split(",").map((tag) => {
              const [key, value] = tag.split("=").map((s) => s.trim());
              return [key, value];
            })
          )
        : {};

      const response = await fetch("/api/secrets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretName: formData.secretName,
          secretValue: formData.secretValue,
          description: formData.description || undefined,
          tags: Object.keys(tags).length > 0 ? tags : undefined,
          kmsKeyId: formData.kmsKeyId || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Secret created successfully");
        setShowCreateModal(false);
        setFormData({
          secretName: "",
          secretValue: "",
          description: "",
          tags: "",
          kmsKeyId: "",
        });
        loadSecrets();
      } else {
        toast.error(result.error || "Failed to create secret");
      }
    } catch (error) {
      console.error("Error creating secret:", error);
      toast.error("Failed to create secret");
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <KeyIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Secrets Manager
              </h2>
              <p className="text-sm text-gray-500">Project: {projectName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Secret</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {secrets.length === 0 ? (
                <div className="text-center py-12">
                  <KeyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No secrets found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Get started by creating your first secret.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Secret
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {secrets.map((secret) => (
                    <div
                      key={secret.Name}
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
            </div>
          )}
        </div>
      </div>

      {/* Create Secret Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Secret
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSecret} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Name *
                </label>
                <input
                  type="text"
                  value={formData.secretName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      secretName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Value *
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Secret Modal */}
      {showEditModal && selectedSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Secret
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
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
