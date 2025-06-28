"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProjectConfig } from "@/types";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ProjectConfig) => void;
  config: ProjectConfig;
}

export default function ConfigModal({
  isOpen,
  onClose,
  onSubmit,
  config,
}: ConfigModalProps) {
  const [formData, setFormData] = useState<ProjectConfig>(config);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProjectConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                    Configuration
                  </h3>
                  <p className="text-sm text-gray-500">CloudStack Solutions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) =>
                      handleInputChange("projectName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="my-project"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for resource naming and organization
                  </p>
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) =>
                      handleInputChange("environment", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="dev">Development</option>
                    <option value="uat">UAT</option>
                    <option value="prod">Production</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Environment for resource isolation
                  </p>
                </div>

                {/* AWS Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWS Region
                  </label>
                  <select
                    value={formData.awsRegion}
                    onChange={(e) =>
                      handleInputChange("awsRegion", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    AWS region for resource deployment
                  </p>
                </div>

                {/* AWS Endpoint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LocalStack Endpoint
                  </label>
                  <input
                    type="url"
                    value={formData.awsEndpoint}
                    onChange={(e) =>
                      handleInputChange("awsEndpoint", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="http://localhost:4566"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    LocalStack service endpoint URL
                  </p>
                </div>
              </div>

              {/* CloudStack Solutions Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">CS</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    CloudStack Solutions
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Enterprise AWS Development Tools • Professional LocalStack
                  Management
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
                >
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
