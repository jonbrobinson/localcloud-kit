"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { HighlightTheme, PreferredLanguage, Project } from "@/types";
import Image from "next/image";
import {
  CircleStackIcon,
  FolderIcon,
  KeyIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const LANGUAGES: { value: PreferredLanguage; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "node", label: "JavaScript (Node)" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "cli", label: "AWS CLI" },
];

const THEMES: { value: HighlightTheme; label: string }[] = [
  { value: "github-dark", label: "GitHub Dark" },
  { value: "github", label: "GitHub Light" },
  { value: "github-dark-dimmed", label: "GitHub Dark Dimmed" },
  { value: "atom-one-dark", label: "Atom One Dark" },
  { value: "atom-one-light", label: "Atom One Light" },
];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  s3: <FolderIcon className="h-4 w-4 text-yellow-600" />,
  dynamodb: <CircleStackIcon className="h-4 w-4 text-indigo-600" />,
  secrets: <KeyIcon className="h-4 w-4 text-green-600" />,
};

export default function ProfilePage() {
  const {
    profile,
    projects,
    savedConfigs,
    updateProfile,
    createProject,
    deleteProject,
    deleteSavedConfig,
  } = usePreferences();

  const [newProjectLabel, setNewProjectLabel] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const handleLanguageChange = async (lang: PreferredLanguage) => {
    try {
      await updateProfile({ preferred_language: lang });
      toast.success("Language preference saved");
    } catch {
      toast.error("Failed to save preference");
    }
  };

  const handleThemeChange = async (theme: HighlightTheme) => {
    try {
      await updateProfile({ highlight_theme: theme });
      toast.success("Theme preference saved");
    } catch {
      toast.error("Failed to save preference");
    }
  };

  const handleDisplayNameSave = async (name: string) => {
    try {
      await updateProfile({ display_name: name });
      toast.success("Display name saved");
    } catch {
      toast.error("Failed to save display name");
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectLabel.trim()) return;
    setSaving(true);
    try {
      const name = newProjectLabel.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      await createProject(name, newProjectLabel.trim(), newProjectDesc.trim() || undefined);
      setNewProjectLabel("");
      setNewProjectDesc("");
      setShowNewProject(false);
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project (name may already exist)");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (project.id === profile.active_project_id) {
      toast.error("Switch to a different project before deleting this one");
      return;
    }
    if (!confirm(`Delete project "${project.label}" and all its saved configs?`)) return;
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleSwitchProject = async (id: number) => {
    try {
      await updateProfile({ active_project_id: id });
      toast.success("Active project updated");
    } catch {
      toast.error("Failed to switch project");
    }
  };

  const handleDeleteConfig = async (id: number) => {
    try {
      await deleteSavedConfig(id);
      toast.success("Config deleted");
    } catch {
      toast.error("Failed to delete config");
    }
  };

  const activeProjectConfigs = savedConfigs.filter(
    (c) => c.project_id === profile.active_project_id
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="LocalCloud Kit" width={36} height={36} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalCloud Kit</h1>
                <p className="text-xs text-gray-500">Profile</p>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Preferences Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Preferences</h2>

          <div className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  defaultValue={profile.display_name}
                  onBlur={(e) => {
                    if (e.target.value !== profile.display_name) {
                      handleDisplayNameSave(e.target.value);
                    }
                  }}
                  className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* Language Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Code Language
                <span className="ml-2 text-xs text-gray-400 font-normal">Used as default in SDK examples</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleLanguageChange(value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      profile.preferred_language === value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Highlight Theme
                <span className="ml-2 text-xs text-gray-400 font-normal">Used in file viewer and code samples</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {THEMES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      profile.highlight_theme === value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <button
              onClick={() => setShowNewProject((v) => !v)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              New Project
            </button>
          </div>

          {showNewProject && (
            <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <input
                type="text"
                placeholder="Project name (e.g. E-Commerce App)"
                value={newProjectLabel}
                onChange={(e) => setNewProjectLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectLabel.trim() || saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {projects.map((project) => {
              const isActive = project.id === profile.active_project_id;
              const configCount = savedConfigs.filter((c) => c.project_id === project.id).length;
              return (
                <div
                  key={project.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isActive ? "bg-blue-500" : "bg-gray-300"}`} />
                    <div>
                      <p className={`text-sm font-medium ${isActive ? "text-blue-900" : "text-gray-900"}`}>
                        {project.label}
                        {isActive && <span className="ml-2 text-xs text-blue-600 font-normal">active</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {project.description || `/${project.name}`} • {configCount} saved config{configCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitchProject(project.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Switch
                      </button>
                    )}
                    {project.name !== "default" && (
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete project"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saved Configs Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Saved Configurations</h2>
          <p className="text-sm text-gray-500 mb-5">
            Scoped to active project: <span className="font-medium text-gray-700">{profile.active_project_label || "Default"}</span>
          </p>

          {activeProjectConfigs.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No saved configs yet. Open a DynamoDB or S3 creation form and click &quot;Save config&quot; to add one.
            </p>
          ) : (
            <div className="space-y-2">
              {activeProjectConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <span>{RESOURCE_ICONS[cfg.resource_type] ?? null}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cfg.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{cfg.resource_type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteConfig(cfg.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete saved config"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
