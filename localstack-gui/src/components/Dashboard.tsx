"use client";

import { useState, useEffect } from "react";
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { LocalStackStatus, Resource, ProjectConfig } from "@/types";
import { localstackApi, resourceApi, configApi } from "@/services/api";
import StatusCard from "./StatusCard";
import ResourceList from "./ResourceList";
import CreateResourceModal from "./CreateResourceModal";
import ConfigModal from "./ConfigModal";
import LogViewer from "./LogViewer";
import Image from "next/image";

export default function Dashboard() {
  const [localstackStatus, setLocalstackStatus] = useState<LocalStackStatus>({
    running: false,
    endpoint: "http://localhost:4566",
    health: "unknown",
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [config, setConfig] = useState<ProjectConfig>({
    projectName: "localstack-template",
    environment: "dev",
    awsRegion: "us-east-1",
    awsEndpoint: "http://localhost:4566",
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState<"shell">("shell");

  const automationApproaches: AutomationApproach[] = [
    {
      id: "shell",
      name: "Shell Scripts",
      description: "Fast command-line automation with AWS CLI",
      icon: "⚡",
    },
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadInitialData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, projectConfig] = await Promise.all([
        localstackApi.getStatus(),
        configApi.getProjectConfig(),
      ]);

      setLocalstackStatus(status);
      setConfig(projectConfig);

      if (status.running) {
        const resourceList = await resourceApi.getStatus(
          projectConfig.projectName,
          projectConfig.environment
        );
        setResources(resourceList);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalStackAction = async (
    action: "start" | "stop" | "restart"
  ) => {
    try {
      let response;
      switch (action) {
        case "start":
          response = await localstackApi.start();
          break;
        case "stop":
          response = await localstackApi.stop();
          break;
        case "restart":
          response = await localstackApi.restart();
          break;
      }

      if (response.success) {
        toast.success(`LocalStack ${action} successful`);
        await loadInitialData();
      } else {
        toast.error(response.error || `Failed to ${action} LocalStack`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} LocalStack`);
    }
  };

  const handleCreateResources = async (request: any) => {
    try {
      const response = await resourceApi.create({
        ...request,
        approach: selectedApproach,
      });

      if (response.success) {
        toast.success("Resources created successfully");
        setShowCreateModal(false);
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to create resources");
      }
    } catch (error) {
      toast.error("Failed to create resources");
    }
  };

  const handleDestroyResources = async (resourceIds: string[]) => {
    try {
      const response = await resourceApi.destroy({
        projectName: config.projectName,
        environment: config.environment,
        approach: selectedApproach,
        resources: resourceIds,
      });

      if (response.success) {
        toast.success("Resources destroyed successfully");
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to destroy resources");
      }
    } catch (error) {
      toast.error("Failed to destroy resources");
    }
  };

  const handleConfigUpdate = async (newConfig: ProjectConfig) => {
    try {
      const response = await configApi.updateProjectConfig(newConfig);
      if (response.success) {
        setConfig(newConfig);
        toast.success("Configuration updated");
        setShowConfigModal(false);
        await loadInitialData();
      } else {
        toast.error(response.error || "Failed to update configuration");
      }
    } catch (error) {
      toast.error("Failed to update configuration");
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
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Config
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
            <div className="flex space-x-2">
              <button
                onClick={() => handleLocalStackAction("start")}
                disabled={localstackStatus.running}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start
              </button>
              <button
                onClick={() => handleLocalStackAction("stop")}
                disabled={!localstackStatus.running}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Stop
              </button>
              <button
                onClick={() => handleLocalStackAction("restart")}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Restart
              </button>
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
                <select
                  value={selectedApproach}
                  onChange={(e) => setSelectedApproach(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="shell">Shell Scripts</option>
                </select>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Resources
                </button>
              </div>
            </div>
            <ResourceList
              resources={resources}
              onDestroy={handleDestroyResources}
              projectName={config.projectName}
              environment={config.environment}
            />
          </div>
        )}

        {/* Configuration Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.projectName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Environment
              </label>
              <p className="mt-1 text-sm text-gray-900">{config.environment}</p>
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
          approach={selectedApproach}
        />
      )}

      {showConfigModal && (
        <ConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onSubmit={handleConfigUpdate}
          config={config}
        />
      )}

      {showLogs && (
        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      )}
    </div>
  );
}
