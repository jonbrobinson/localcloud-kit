"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "@iconify/react";
import { IAMRoleConfig } from "@/types";

// Common AWS service principals that can assume roles
const TRUST_SERVICE_OPTIONS = [
  { value: "lambda", label: "Lambda" },
  { value: "ec2", label: "EC2" },
  { value: "ecs-tasks", label: "ECS Tasks" },
  { value: "apigateway", label: "API Gateway" },
  { value: "states", label: "Step Functions" },
  { value: "firehose", label: "Kinesis Firehose" },
  { value: "s3", label: "S3" },
];

interface IAMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: IAMRoleConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function IAMConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: IAMConfigModalProps) {
  const [roleName, setRoleName] = useState(`${projectName}-role`);
  const [trustService, setTrustService] = useState("lambda");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("/");

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

  useEffect(() => {
    if (isOpen) {
      setRoleName(`${projectName}-role`);
      setTrustService("lambda");
      setDescription("");
      setPath("/");
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ roleName, trustService, description, path });
  };

  const previewTrustPolicy = JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: `${trustService}.amazonaws.com` },
          Action: "sts:AssumeRole",
        },
      ],
    },
    null,
    2
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Icon icon="logos:aws-iam" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create IAM Role</h2>
              <p className="text-xs text-gray-500">Add a new IAM role with a trust policy</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="my-lambda-execution-role"
              required
            />
          </div>

          {/* Trusted Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trusted AWS Service
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRUST_SERVICE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                    trustService === opt.value
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="trustService"
                    value={opt.value}
                    checked={trustService === opt.value}
                    onChange={() => setTrustService(opt.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The AWS service that can assume this role via <code className="bg-gray-100 px-1 rounded">sts:AssumeRole</code>.
            </p>
          </div>

          {/* Trust Policy Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trust Policy Preview
            </label>
            <pre className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {previewTrustPolicy}
            </pre>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="Execution role for my Lambda function"
            />
          </div>

          {/* Path */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Path <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
              placeholder="/"
            />
            <p className="text-xs text-gray-500 mt-1">
              IAM path for the role (e.g. <code className="bg-gray-100 px-1 rounded">/service-role/</code>). Defaults to <code className="bg-gray-100 px-1 rounded">/</code>.
            </p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={loading || !roleName.trim()}
            >
              {loading ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
