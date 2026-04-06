"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

interface Secret {
  Name: string;
  ARN?: string;
  Description?: string;
  LastChangedDate?: string;
  Tags?: Array<{ Key: string; Value: string }>;
  SecretString?: string;
}

interface SecretsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretName: string;
  projectName: string;
  onDeleted?: () => void;
}

export default function SecretsDetailModal({
  isOpen,
  onClose,
  secretName,
  onDeleted,
}: SecretsDetailModalProps) {
  const [secret, setSecret] = useState<Secret | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState<string>("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadSecret = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(secretName)}?includeValue=false`);
      const result = await res.json();
      if (result.success) {
        setSecret(result.data);
        setEditDesc(result.data.Description || "");
      } else {
        toast.error("Failed to load secret");
      }
    } catch {
      toast.error("Failed to load secret");
    } finally {
      setLoading(false);
    }
  }, [secretName]);

  useEffect(() => {
    if (isOpen && secretName) {
      loadSecret();
    }
    // Reset state when closed or name changes
    if (!isOpen) {
      setSecret(null);
      setRevealed(false);
      setRevealedValue("");
      setEditing(false);
      setConfirmDelete(false);
    }
  }, [isOpen, secretName, loadSecret]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDelete) { setConfirmDelete(false); return; }
        if (editing) { setEditing(false); return; }
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, editing, confirmDelete]);

  const handleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      setRevealedValue("");
      return;
    }
    setRevealLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(secretName)}?includeValue=true`);
      const result = await res.json();
      if (result.success) {
        setRevealedValue(result.data.SecretString || "");
        setRevealed(true);
      } else {
        toast.error("Failed to reveal secret");
      }
    } catch {
      toast.error("Failed to reveal secret");
    } finally {
      setRevealLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error("Secret value is required");
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(secretName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretValue: editValue, description: editDesc || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Secret updated");
        setEditing(false);
        setEditValue("");
        setRevealed(false);
        setRevealedValue("");
        loadSecret();
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
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/secrets/${encodeURIComponent(secretName)}?forceDelete=true`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Secret deleted");
        onDeleted?.();
        onClose();
      } else {
        toast.error(result.error || "Failed to delete secret");
      }
    } catch {
      toast.error("Failed to delete secret");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyArn = () => {
    if (!secret?.ARN) return;
    navigator.clipboard.writeText(secret.ARN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openEdit = () => {
    setEditValue("");
    setEditDesc(secret?.Description || "");
    setEditing(true);
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <KeyIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 truncate">{secretName}</h2>
              <p className="text-xs text-gray-500">AWS Secrets Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ) : secret ? (
            <>
              {/* ARN */}
              {secret.ARN && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">ARN</p>
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-3 py-2">
                    <code className="text-xs text-gray-700 flex-1 break-all font-mono">{secret.ARN}</code>
                    <button onClick={copyArn} className="shrink-0 text-gray-400 hover:text-gray-600" title="Copy ARN">
                      {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              {secret.Description && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <DocumentTextIcon className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <span>{secret.Description}</span>
                </div>
              )}

              {/* Last changed */}
              {secret.LastChangedDate && (
                <p className="text-xs text-gray-500">
                  Last changed: {new Date(secret.LastChangedDate).toLocaleString()}
                </p>
              )}

              {/* Tags */}
              {secret.Tags && secret.Tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {secret.Tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {tag.Key}: {tag.Value}
                    </span>
                  ))}
                </div>
              )}

              {/* Secret value */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-500">Secret Value</p>
                  <button
                    onClick={handleReveal}
                    disabled={revealLoading}
                    className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    {revealLoading ? (
                      <span>Loading…</span>
                    ) : revealed ? (
                      <><EyeSlashIcon className="h-3.5 w-3.5" /><span>Hide</span></>
                    ) : (
                      <><EyeIcon className="h-3.5 w-3.5" /><span>Reveal</span></>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                  <AnimatePresence mode="wait">
                    {revealed ? (
                      <motion.code
                        key="revealed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-900 break-all font-mono"
                      >
                        {revealedValue}
                      </motion.code>
                    ) : (
                      <motion.code
                        key="masked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-gray-400 font-mono tracking-widest"
                      >
                        ••••••••••••••••
                      </motion.code>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Inline edit form */}
              <AnimatePresence>
                {editing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/30 space-y-3">
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
                          onClick={() => setEditing(false)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delete confirm */}
              <AnimatePresence>
                {confirmDelete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
                      <p className="text-sm font-medium text-red-800">Delete <span className="font-mono">{secretName}</span>?</p>
                      <p className="text-xs text-red-600">This will permanently delete the secret. This action cannot be undone.</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteLoading ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Secret not found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center space-x-2">
            {!editing && !confirmDelete && secret && (
              <>
                <button
                  onClick={openEdit}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
          <Link
            href="/manage/secrets"
            className="flex items-center space-x-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            <span>Open in Secrets Manager</span>
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
