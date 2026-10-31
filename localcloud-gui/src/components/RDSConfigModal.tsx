"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { RDSEngine, RDSInstanceConfig, RDSOptions } from "@/types";
import { usePreferences } from "@/context/PreferencesContext";
import { rdsApi } from "@/services/api";
import { Button, IconButton, Input, SegmentedControl } from "@/components/ui";

interface RDSConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: RDSInstanceConfig) => void;
  projectName: string;
  loading?: boolean;
}

// Used until /rds/options answers (and as a fallback if it can't be reached)
const FALLBACK_OPTIONS: RDSOptions = {
  engines: {
    postgres: { label: "PostgreSQL", port: 5432, versions: ["17", "16", "15", "14"], defaultVersion: "16" },
    mysql: { label: "MySQL", port: 3306, versions: ["8.4", "8.0"], defaultVersion: "8.0" },
    mariadb: { label: "MariaDB", port: 3306, versions: ["11.4", "10.11", "10.6"], defaultVersion: "10.11" },
  },
  instanceClasses: ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.m5.large"],
  deletedIdentifiers: [],
};

const ENGINE_ICON: Record<RDSEngine, string> = {
  postgres: "logos:postgresql",
  mysql: "logos:mysql-icon",
  mariadb: "logos:mariadb-icon",
};

const selectClass =
  "h-9 w-full px-2.5 rounded-lg border border-border-strong bg-surface-2 text-[13px] text-ink outline-none transition-colors focus:bg-surface focus:border-primary focus:ring-3 focus:ring-focus";

function defaultIdentifier(projectName: string): string {
  const base = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^[^a-z]+/, "");
  return `${base || "app"}-db`.slice(0, 63);
}

function generatePassword(length = 20): string {
  // RDS disallows / " @ and spaces; keep to letters, digits, and a few safe symbols
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_!#%^*";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export function validateRdsIdentifier(id: string): string {
  if (!id) return "Identifier is required";
  if (id.length > 63) return "Must be 63 characters or fewer";
  if (!/^[a-z]/.test(id)) return "Must start with a letter";
  if (!/^[a-z0-9-]+$/.test(id)) return "Only lowercase letters, numbers, and hyphens";
  if (id.endsWith("-") || id.includes("--")) return "Cannot end with a hyphen or contain two in a row";
  return "";
}

function validateUsername(name: string): string {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,15}$/.test(name)) {
    return "Start with a letter; letters, numbers, underscores; max 16";
  }
  return "";
}

function validatePassword(pw: string): string {
  if (pw.length < 8 || pw.length > 41) return "Must be 8–41 characters";
  if (/[/"@\s]/.test(pw) || /[^\x20-\x7e]/.test(pw)) return "Cannot contain /, \", @, spaces, or non-ASCII";
  return "";
}

function validateDbName(name: string): string {
  if (name && !/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(name)) {
    return "Start with a letter; letters, numbers, underscores only";
  }
  return "";
}

export default function RDSConfigModal({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  loading = false,
}: RDSConfigModalProps) {
  const { profile, savedConfigs, saveConfig } = usePreferences();
  const [options, setOptions] = useState<RDSOptions>(FALLBACK_OPTIONS);

  const [engine, setEngine] = useState<RDSEngine>("postgres");
  const [engineVersion, setEngineVersion] = useState(FALLBACK_OPTIONS.engines.postgres.defaultVersion);
  const [identifier, setIdentifier] = useState(defaultIdentifier(projectName));
  const [dbName, setDbName] = useState("app");
  const [masterUsername, setMasterUsername] = useState("dbadmin");
  const [masterPassword, setMasterPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [instanceClass, setInstanceClass] = useState("db.t3.micro");
  const [registerPgAdmin, setRegisterPgAdmin] = useState(true);
  const [storeInSecretsManager, setStoreInSecretsManager] = useState(false);

  const [saveConfig_, setSaveConfig_] = useState(false);
  const [configName, setConfigName] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  // Reset the form and refresh options each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setEngine("postgres");
    setEngineVersion(FALLBACK_OPTIONS.engines.postgres.defaultVersion);
    setIdentifier(defaultIdentifier(projectName));
    setDbName("app");
    setMasterUsername("dbadmin");
    setMasterPassword(generatePassword());
    setShowPassword(false);
    setInstanceClass("db.t3.micro");
    setRegisterPgAdmin(true);
    setStoreInSecretsManager(false);
    setSaveConfig_(false);
    setConfigName("");
    setSubmitted(false);

    let cancelled = false;
    rdsApi.getOptions().then((opts) => {
      if (!cancelled && opts) setOptions(opts);
    });
    return () => { cancelled = true; };
  }, [isOpen, projectName]);

  const projectConfigs = useMemo(
    () => savedConfigs.filter((c) => c.resource_type === "rds" && c.project_id === profile?.active_project_id),
    [savedConfigs, profile?.active_project_id]
  );

  if (!isOpen) return null;

  const engineInfo = options.engines[engine];
  const isPostgres = engine === "postgres";

  const errors = {
    identifier: validateRdsIdentifier(identifier),
    masterUsername: validateUsername(masterUsername),
    masterPassword: validatePassword(masterPassword),
    dbName: validateDbName(dbName),
    configName: saveConfig_ && !configName.trim() ? "Config name is required" : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const showError = (field: keyof typeof errors) => (submitted ? errors[field] : "");
  const identifierReused = options.deletedIdentifiers.includes(identifier);

  const handleEngineChange = (next: RDSEngine) => {
    setEngine(next);
    setEngineVersion(options.engines[next].defaultVersion);
  };

  const loadSavedConfig = (config: RDSInstanceConfig) => {
    const nextEngine = options.engines[config.engine] ? config.engine : "postgres";
    setEngine(nextEngine);
    setEngineVersion(
      options.engines[nextEngine].versions.includes(config.engineVersion)
        ? config.engineVersion
        : options.engines[nextEngine].defaultVersion
    );
    setIdentifier(config.dbInstanceIdentifier || defaultIdentifier(projectName));
    setDbName(config.dbName ?? "");
    setMasterUsername(config.masterUsername || "dbadmin");
    setInstanceClass(config.instanceClass || "db.t3.micro");
    setRegisterPgAdmin(config.registerPgAdmin ?? true);
    setStoreInSecretsManager(config.storeInSecretsManager ?? false);
    // Passwords are never saved — generate a fresh one
    setMasterPassword(generatePassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    const config: RDSInstanceConfig = {
      engine,
      engineVersion,
      dbInstanceIdentifier: identifier,
      masterUsername,
      masterPassword,
      dbName: dbName || undefined,
      instanceClass,
      registerPgAdmin: isPostgres && registerPgAdmin,
      storeInSecretsManager,
    };

    if (saveConfig_ && configName.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { masterPassword: _omit, ...savable } = config;
      try {
        await saveConfig(configName.trim(), "rds", savable);
        toast.success(`Config "${configName.trim()}" saved`);
      } catch {
        toast.error("Failed to save config — the instance will still be created");
      }
    }

    onSubmit(config);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(masterPassword);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy password");
    }
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="bg-surface border border-border rounded-xl shadow-e3 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-soft text-primary">
              <Icon icon="logos:aws-rds" width={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Create RDS instance</h2>
              <p className="text-xs text-muted">Runs a real {engineInfo.label} container locally</p>
            </div>
          </div>
          <IconButton icon="lucide:x" label="Close" variant="ghost" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            {/* Saved config pills */}
            {profile?.active_project_id && projectConfigs.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-faint mb-2 uppercase tracking-wide">Load saved config</p>
                <div className="flex flex-wrap gap-1.5">
                  {projectConfigs.map((cfg) => (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => {
                        loadSavedConfig(cfg.config as RDSInstanceConfig);
                        toast.success(`Loaded "${cfg.name}"`);
                      }}
                      className="h-[26px] px-2.5 rounded-full border border-border bg-surface text-ink-2 text-xs font-medium cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-soft"
                    >
                      {cfg.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Engine + version */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">Engine</span>
              <SegmentedControl<RDSEngine>
                fullWidth
                value={engine}
                onChange={handleEngineChange}
                options={(Object.keys(options.engines) as RDSEngine[]).map((key) => ({
                  value: key,
                  label: options.engines[key].label,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                  <Icon icon={ENGINE_ICON[engine]} width={13} />
                  Version
                </span>
                <select value={engineVersion} onChange={(e) => setEngineVersion(e.target.value)} className={selectClass}>
                  {engineInfo.versions.map((v) => (
                    <option key={v} value={v}>
                      {engineInfo.label} {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">Instance class</span>
                <select value={instanceClass} onChange={(e) => setInstanceClass(e.target.value)} className={selectClass}>
                  {options.instanceClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Identifier */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">DB instance identifier</span>
              <Input
                mono
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                invalid={!!showError("identifier")}
                placeholder="my-app-db"
                className="h-9"
              />
              {showError("identifier") ? (
                <p className="text-xs text-danger">{errors.identifier}</p>
              ) : identifierReused ? (
                <p className="flex items-start gap-1.5 text-xs text-warn-ink bg-warn-soft rounded-md px-2 py-1.5">
                  <Icon icon="lucide:alert-triangle" width={13} className="mt-px shrink-0" />
                  <span>
                    An instance with this name was deleted before. MiniStack keeps its data volume, so the new
                    instance would start with the old data and old password. Pick another name or run{" "}
                    <span className="font-mono">make rds-prune</span> first.
                  </span>
                </p>
              ) : (
                <p className="text-xs text-faint">Lowercase letters, numbers, and hyphens · starts with a letter</p>
              )}
            </label>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">Master username</span>
                <Input
                  mono
                  value={masterUsername}
                  onChange={(e) => setMasterUsername(e.target.value)}
                  invalid={!!showError("masterUsername")}
                  className="h-9"
                />
                {showError("masterUsername") && <p className="text-xs text-danger">{errors.masterUsername}</p>}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">
                  Initial database <span className="text-faint font-normal">(optional)</span>
                </span>
                <Input
                  mono
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  invalid={!!showError("dbName")}
                  placeholder={isPostgres ? "postgres" : "none"}
                  className="h-9"
                />
                {showError("dbName") && <p className="text-xs text-danger">{errors.dbName}</p>}
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">Master password</span>
              <div className="flex items-center gap-1.5">
                <Input
                  mono
                  type={showPassword ? "text" : "password"}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  invalid={!!showError("masterPassword")}
                  className="h-9 flex-1"
                  autoComplete="new-password"
                  aria-label="Master password"
                />
                <IconButton
                  type="button"
                  icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
                  label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                />
                <IconButton type="button" icon="lucide:copy" label="Copy password" onClick={copyPassword} />
                <IconButton
                  type="button"
                  icon="lucide:refresh-cw"
                  label="Generate new password"
                  onClick={() => setMasterPassword(generatePassword())}
                />
              </div>
              {showError("masterPassword") ? (
                <p className="text-xs text-danger">{errors.masterPassword}</p>
              ) : (
                <p className="text-xs text-faint">
                  Copy it now{storeInSecretsManager ? "" : " or store it in Secrets Manager below"} — it isn&apos;t shown again.
                </p>
              )}
            </div>

            {/* Integrations */}
            <div className="border-t border-divider pt-4 space-y-2.5">
              <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wide">Integrations</h3>
              <label
                className={`flex items-start gap-3 p-2.5 rounded-lg border border-border transition-colors ${
                  isPostgres ? "cursor-pointer hover:bg-surface-2" : "opacity-60 cursor-not-allowed"
                }`}
                title={isPostgres ? undefined : "pgAdmin only manages PostgreSQL"}
              >
                <input
                  type="checkbox"
                  checked={isPostgres && registerPgAdmin}
                  disabled={!isPostgres}
                  onChange={(e) => setRegisterPgAdmin(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    <Icon icon="logos:postgresql" width={13} />
                    Register in pgAdmin
                  </span>
                  <span className="block text-xs text-muted">
                    {isPostgres
                      ? "Adds the instance to the \"LocalCloud RDS\" group in pgAdmin, with the password saved so it connects in one click"
                      : "Only available for PostgreSQL instances"}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 p-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-2 transition-colors">
                <input
                  type="checkbox"
                  checked={storeInSecretsManager}
                  onChange={(e) => setStoreInSecretsManager(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    <Icon icon="logos:aws-secrets-manager" width={13} />
                    Store credentials in Secrets Manager
                  </span>
                  <span className="block text-xs text-muted">
                    Creates <span className="font-mono">rds/{identifier || "…"}/master</span> with host, port, username,
                    and password. Deleted along with the instance.
                  </span>
                </span>
              </label>
            </div>

            {/* Save config toggle */}
            <div className="border-t border-divider pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveConfig_}
                  onChange={(e) => {
                    setSaveConfig_(e.target.checked);
                    if (!e.target.checked) setConfigName("");
                  }}
                  className="h-4 w-4 accent-primary shrink-0"
                />
                <span className="text-[13px] text-ink-2">
                  Save as config for future use <span className="text-faint">(password not saved)</span>
                </span>
              </label>
              {saveConfig_ && (
                <div className="mt-3">
                  <Input
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. app-postgres"
                    invalid={!!showError("configName")}
                    className="w-full h-9"
                    autoFocus
                  />
                  {showError("configName") && <p className="text-xs text-danger mt-1">{errors.configName}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 px-6 py-3.5 border-t border-divider bg-surface-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px] text-muted min-w-0">
              <Icon icon="lucide:terminal" width={13} className="shrink-0" />
              <span className="truncate">
                Runs <span className="font-mono">aws rds create-db-instance --engine {engine}</span>
              </span>
            </span>
            <div className="flex items-center gap-2.5 ml-auto shrink-0">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={loading ? undefined : "lucide:plus"}
                loading={loading}
                disabled={loading || (submitted && hasErrors)}
              >
                {loading ? "Creating…" : "Create instance"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
