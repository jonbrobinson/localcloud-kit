"use client";

import { useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface IAMRole {
  RoleName: string;
  Arn?: string;
  Description?: string;
  CreateDate?: string;
  Path?: string;
}

interface IAMPolicy {
  PolicyName: string;
  PolicyArn?: string;
}

interface IAMRolePoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
}

export default function IAMRolePoliciesModal({
  isOpen,
  onClose,
  roleName,
}: IAMRolePoliciesModalProps) {
  const [role, setRole] = useState<IAMRole | null>(null);
  const [policies, setPolicies] = useState<IAMPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !roleName) return;

    const loadRoleData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roleRes, policiesRes] = await Promise.all([
          fetch(`/api/iam/roles/${encodeURIComponent(roleName)}`),
          fetch(`/api/iam/roles/${encodeURIComponent(roleName)}/policies`),
        ]);

        const [roleData, policiesData] = await Promise.all([
          roleRes.json(),
          policiesRes.json(),
        ]);

        if (!roleData.success) {
          throw new Error(roleData.error || "Failed to load IAM role");
        }

        setRole(roleData.data || null);
        setPolicies(policiesData.success ? policiesData.data || [] : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load IAM role");
        setRole(null);
        setPolicies([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoleData();
  }, [isOpen, roleName]);

  if (!isOpen) return null;

  const handleCopyArn = () => {
    if (!role?.Arn) return;
    navigator.clipboard.writeText(role.Arn).then(() => {
      setCopiedArn(true);
      setTimeout(() => setCopiedArn(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Icon icon="logos:aws-iam" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">IAM Role Details</h2>
              <p className="text-xs text-gray-500 font-mono">{roleName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/manage/iam"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <span>Open Manager</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading role details...</div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {role && (
                <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {role.Arn && (
                    <div className="flex items-center px-5 py-3">
                      <dt className="w-24 text-xs font-medium text-gray-500 shrink-0">ARN</dt>
                      <dd className="flex items-center space-x-2 flex-1 min-w-0">
                        <code className="text-xs font-mono text-gray-700 truncate flex-1">{role.Arn}</code>
                        <button
                          onClick={handleCopyArn}
                          className="shrink-0 text-gray-400 hover:text-gray-600"
                          title="Copy ARN"
                        >
                          {copiedArn ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          )}
                        </button>
                      </dd>
                    </div>
                  )}
                  {role.Path && (
                    <div className="flex items-center px-5 py-3">
                      <dt className="w-24 text-xs font-medium text-gray-500">Path</dt>
                      <dd className="text-sm font-mono text-gray-700">{role.Path}</dd>
                    </div>
                  )}
                  {role.CreateDate && (
                    <div className="flex items-center px-5 py-3">
                      <dt className="w-24 text-xs font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-700">{new Date(role.CreateDate).toLocaleString()}</dd>
                    </div>
                  )}
                  {role.Description && (
                    <div className="flex items-center px-5 py-3">
                      <dt className="w-24 text-xs font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-700">{role.Description}</dd>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Attached Policies</h3>
                {policies.length === 0 ? (
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
                          {policy.PolicyArn && (
                            <p className="text-xs text-gray-400 font-mono truncate">{policy.PolicyArn}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
