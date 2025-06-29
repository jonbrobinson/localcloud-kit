"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProjectConfig } from "@/types";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ProjectConfig) => void;
  config: ProjectConfig;
  loading?: boolean;
}

export default function ConfigModal({
  isOpen,
  onClose,
  onSubmit,
  config,
  loading = false,
}: ConfigModalProps) {
  const [projectName, setProjectName] = useState(config.projectName);
  const [awsEndpoint, setAwsEndpoint] = useState(config.awsEndpoint);
  const [awsRegion, setAwsRegion] = useState(config.awsRegion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: ProjectConfig = {
      projectName,
      awsEndpoint,
      awsRegion,
    };

    await onSubmit(request);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Project Configuration
                  </h3>
                  <p className="text-sm text-gray-500">CloudStack Solutions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="my-project"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for resource naming and organization
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWS Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={awsEndpoint}
                    onChange={(e) => setAwsEndpoint(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="http://localhost:4566"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    LocalStack endpoint URL
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWS Region
                  </label>
                  <select
                    value={awsRegion}
                    onChange={(e) => setAwsRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="us-east-1">
                      US East (N. Virginia) - us-east-1
                    </option>
                    <option value="us-west-2">
                      US West (Oregon) - us-west-2
                    </option>
                    <option value="eu-west-1">
                      Europe (Ireland) - eu-west-1
                    </option>
                    <option value="ap-southeast-1">
                      Asia Pacific (Singapore) - ap-southeast-1
                    </option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    AWS region for resource creation
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span>Save Configuration</span>
                  )}
                  {loading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
