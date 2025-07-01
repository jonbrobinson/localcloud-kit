"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { S3BucketConfig } from "@/types";

interface S3ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: S3BucketConfig) => void;
  projectName: string;
  loading?: boolean;
}

export default function S3ConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: S3ConfigModalProps) {
  const [bucketName, setBucketName] = useState(`${projectName}-bucket`);
  const [region, setRegion] = useState("us-east-1");
  const [versioning, setVersioning] = useState(false);
  const [encryption, setEncryption] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const config: S3BucketConfig = {
      bucketName,
      region,
      versioning,
      encryption,
    };
    onSubmit(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          S3 Bucket Configuration
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Configure your S3 bucket with custom settings.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bucket Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bucket Name
            </label>
            <input
              type="text"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="my-bucket-name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Bucket names must be globally unique and follow S3 naming
              conventions
            </p>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="us-east-1">
                US East (N. Virginia) - us-east-1
              </option>
              <option value="us-west-2">US West (Oregon) - us-west-2</option>
              <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
              <option value="ap-southeast-1">
                Asia Pacific (Singapore) - ap-southeast-1
              </option>
            </select>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Advanced Options
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 text-gray-900">
                <input
                  type="checkbox"
                  checked={versioning}
                  onChange={(e) => setVersioning(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium">Enable Versioning</span>
                  <p className="text-xs text-gray-500">
                    Keep multiple versions of objects in the bucket
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 text-gray-900">
                <input
                  type="checkbox"
                  checked={encryption}
                  onChange={(e) => setEncryption(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium">Enable Encryption</span>
                  <p className="text-xs text-gray-500">
                    Encrypt objects at rest using AES-256
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Bucket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
