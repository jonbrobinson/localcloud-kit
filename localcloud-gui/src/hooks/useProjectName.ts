import { usePreferences } from "@/context/PreferencesContext";
import { useServicesData } from "@/hooks/useServicesData";

/**
 * Same project name resolution as the dashboard (Resources, create modals).
 * Manage pages must use this instead of hardcoding `"default"`.
 */
export function useProjectName(): string {
  const { profile } = usePreferences();
  const { awsEmulator } = useServicesData();
  return profile?.active_project_name || awsEmulator.projectConfig?.projectName || "default";
}
