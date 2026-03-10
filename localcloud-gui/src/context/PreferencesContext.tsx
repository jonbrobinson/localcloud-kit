"use client";

import {
  Project,
  SavedConfig,
  UserProfile,
} from "@/types";
import { profileApi, projectsApi, savedConfigsApi } from "@/services/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface PreferencesContextValue {
  profile: UserProfile | null;
  projects: Project[];
  savedConfigs: SavedConfig[];
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  createProject: (name: string, label: string, description?: string) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  saveConfig: (name: string, resourceType: string, config: object) => Promise<void>;
  deleteSavedConfig: (id: number) => Promise<void>;
  refreshSavedConfigs: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [prof, projs, configs] = await Promise.all([
        profileApi.get(),
        projectsApi.list(),
        savedConfigsApi.list(),
      ]);
      setProfile(prof);
      setProjects(projs);
      setSavedConfigs(configs);
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    const updated = await profileApi.update(data);
    setProfile(updated);
  }, []);

  const createProject = useCallback(
    async (name: string, label: string, description?: string): Promise<Project> => {
      const project = await projectsApi.create(name, label, description);
      setProjects((prev) => [...prev, project]);
      return project;
    },
    []
  );

  const deleteProject = useCallback(async (id: number) => {
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSavedConfigs((prev) => prev.filter((c) => c.project_id !== id));
  }, []);

  const refreshSavedConfigs = useCallback(async () => {
    const configs = await savedConfigsApi.list();
    setSavedConfigs(configs);
  }, []);

  const saveConfig = useCallback(
    async (name: string, resourceType: string, config: object) => {
      if (!profile?.active_project_id) return;
      const saved = await savedConfigsApi.create(
        profile.active_project_id,
        name,
        resourceType,
        config
      );
      setSavedConfigs((prev) => [saved, ...prev]);
    },
    [profile?.active_project_id]
  );

  const deleteSavedConfig = useCallback(async (id: number) => {
    await savedConfigsApi.delete(id);
    setSavedConfigs((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        profile,
        projects,
        savedConfigs,
        loading,
        updateProfile,
        createProject,
        deleteProject,
        saveConfig,
        deleteSavedConfig,
        refreshSavedConfigs,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
