"use client";

import { useState } from "react";
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import {
  LocalStackStatus,
  Resource,
  ProjectConfig,
  CreateResourceRequest,
} from "@/types";
import { localstackApi, resourceApi, configApi } from "@/services/api";
import { useLocalStackData } from "@/hooks/useLocalStackData";
import StatusCard from "./StatusCard";
import ResourceList from "./ResourceList";
import CreateResourceModal from "./CreateResourceModal";
import LogViewer from "./LogViewer";
import Image from "next/image";

export default function Dashboard() {
  const {
    localstackStatus,
    projectConfig: config,
    resources,
    loading,
    error,
    refetch: loadInitialData,
  } = useLocalStackData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Loading states for buttons
  const [createLoading, setCreateLoading] = useState(false);
  const [destroyLoading, setDestroyLoading] = useState(false);

  const handleCreateResources = async (request: CreateResourceRequest) => {
    setCreateLoading(true);
    try {
      const response = await resourceApi.create(request);
      if (response.success) {
        toast.success("Resources created successfully");
        setShowCreateModal(false);
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to create resources");
      }
    } catch (error) {
      console.error("Create resources error:", error);
      toast.error(
        `Failed to create resources: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDestroyResources = async (resourceIds: string[]) => {
    setDestroyLoading(true);
    try {
      const response = await resourceApi.destroy({
        projectName: config.projectName,
        resources: resourceIds,
      });

      if (response.success) {
        toast.success("Resources destroyed successfully");
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to destroy resources");
      }
    } catch (error) {
      console.error("Destroy resources error:", error);
      toast.error(
        `Failed to destroy resources: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDestroyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Image
              src="/logo.svg"
              alt="CloudStack Solutions"
              width={32}
              height={32}
            />
            <h2 className="text-xl font-bold text-gray-900">
              CloudStack Solutions
            </h2>
          </div>
          <p className="text-gray-600">Loading LocalStack Manager...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt="CloudStack Solutions"
                  width={40}
                  height={40}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    LocalStack Manager
                  </h1>
                  <p className="text-sm text-gray-500">
                    by CloudStack Solutions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-600">
                  Enterprise AWS Development
                </p>
                <p className="text-xs text-gray-400">v1.0.0</p>
              </div>
              <button
                onClick={() => setShowLogs(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Logs
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* LocalStack Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              LocalStack Status
            </h2>
            <div className="text-sm text-gray-500">
              Use{" "}
              <code className="bg-gray-100 px-1 rounded">
                docker compose up -d
              </code>{" "}
              to start LocalStack
            </div>
          </div>
          <StatusCard status={localstackStatus} />
        </div>

        {/* Resource Management */}
        {localstackStatus.running && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={createLoading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {createLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-2" />
                  )}
                  {createLoading ? "Creating..." : "Create Resources"}
                </button>
              </div>
            </div>
            <ResourceList
              resources={resources}
              onDestroy={handleDestroyResources}
              projectName={config.projectName}
              loading={destroyLoading}
            />
          </div>
        )}

        {/* Configuration Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.projectName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                AWS Region
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.awsRegion}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Endpoint
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.awsEndpoint}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Image
              src="/logo.svg"
              alt="CloudStack Solutions"
              width={24}
              height={24}
            />
            <span className="text-sm text-gray-600">
              Powered by CloudStack Solutions
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Enterprise AWS Development Tools • LocalStack Manager v1.0.0
          </p>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateResourceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateResources}
          config={config}
          loading={createLoading}
        />
      )}

      {showLogs && (
        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      )}
    </div>
  );
}
