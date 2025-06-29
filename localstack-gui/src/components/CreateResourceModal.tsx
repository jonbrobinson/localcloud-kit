"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ProjectConfig,
  CreateResourceRequest,
  ResourceTemplate,
} from "@/types";

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateResourceRequest) => void;
  config: ProjectConfig;
  loading?: boolean;
}

const predefinedTemplates: ResourceTemplate[] = [
  {
    id: "basic",
    name: "Basic Setup",
    description: "S3 bucket and DynamoDB table for basic storage needs",
    resources: {
      s3: true,
      dynamodb: true,
      lambda: false,
      apigateway: false,
    },
    config: {},
  },
  {
    id: "serverless",
    name: "Serverless Application",
    description: "Complete serverless stack with Lambda and API Gateway",
    resources: {
      s3: true,
      dynamodb: true,
      lambda: true,
      apigateway: true,
    },
    config: {},
  },
  {
    id: "storage",
    name: "Storage Only",
    description: "S3 bucket for file storage",
    resources: {
      s3: true,
      dynamodb: false,
      lambda: false,
      apigateway: false,
    },
    config: {},
  },
  {
    id: "database",
    name: "Database Only",
    description: "DynamoDB table for data storage",
    resources: {
      s3: false,
      dynamodb: true,
      lambda: false,
      apigateway: false,
    },
    config: {},
  },
  {
    id: "api",
    name: "API Only",
    description: "API Gateway with Lambda function",
    resources: {
      s3: false,
      dynamodb: false,
      lambda: true,
      apigateway: true,
    },
    config: {},
  },
];

export default function CreateResourceModal({
  isOpen,
  onClose,
  onSubmit,
  config,
  loading = false,
}: CreateResourceModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("basic");
  const [projectName, setProjectName] = useState(config.projectName);
  const [resources, setResources] = useState({
    s3: true,
    dynamodb: true,
    lambda: false,
    apigateway: false,
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = predefinedTemplates.find((t) => t.id === templateId);
    if (template) {
      setResources(template.resources);
    }
  };

  const handleResourceToggle = (resourceType: keyof typeof resources) => {
    setResources((prev) => ({
      ...prev,
      [resourceType]: !prev[resourceType],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const request: CreateResourceRequest = {
      projectName,
      resources,
      template: selectedTemplate,
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Create Resources
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
              {/* Project Configuration */}
              <div className="mb-6">
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
              </div>

              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Resource Template
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {predefinedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => handleTemplateChange(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {Object.entries(template.resources).map(
                            ([resource, enabled]) => (
                              <span
                                key={resource}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  enabled
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {resource.toUpperCase()}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Resources to Create
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(resources).map(([resource, enabled]) => (
                    <label
                      key={resource}
                      className="flex items-center space-x-3"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() =>
                          handleResourceToggle(
                            resource as keyof typeof resources
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                      />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {resource === "s3"
                          ? "S3 Bucket"
                          : resource === "dynamodb"
                          ? "DynamoDB Table"
                          : resource === "lambda"
                          ? "Lambda Function"
                          : resource === "apigateway"
                          ? "API Gateway"
                          : resource}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
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
                    <span>Create Resources</span>
                  )}
                  {loading ? "Creating..." : "Create Resources"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
