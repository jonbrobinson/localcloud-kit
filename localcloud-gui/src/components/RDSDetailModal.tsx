"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Resource } from "@/types";
import { rdsApi } from "@/services/api";
import { useAdminUrl } from "@/hooks/useAdminUrl";
import { Badge, Button, Modal } from "@/components/ui";
import type { StatusTone } from "@/components/ui";

interface RDSDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  projectName: string;
  /** Called after an action that changes instance state, so the dashboard can refresh */
  onChanged?: () => void;
}

const STATUS_TONE: Record<Resource["status"], StatusTone> = {
  active: "success",
  creating: "warn",
  deleting: "warn",
  stopped: "neutral",
  error: "danger",
  unknown: "neutral",
};

const ENGINE_LABEL: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
};

function CopyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
        <code className="flex-1 min-w-0 truncate font-mono text-xs text-ink" title={value}>{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="shrink-0 text-faint hover:text-ink transition-colors cursor-pointer"
        >
          <Icon icon="lucide:copy" width={13} />
        </button>
      </div>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </div>
  );
}

export default function RDSDetailModal({ isOpen, onClose, instanceId, projectName, onChanged }: RDSDetailModalProps) {
  const [instance, setInstance] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pgAdminUrl = useAdminUrl("https://pgadmin.localcloudkit.com:3030", "http://localhost:5050");

  const load = useCallback(async () => {
    const res = await rdsApi.get(instanceId, projectName);
    if (res.success && res.data) {
      setInstance(res.data);
      setError(null);
    } else {
      setError(res.error || "Failed to load instance");
    }
  }, [instanceId, projectName]);

  useEffect(() => {
    if (!isOpen) return;
    setInstance(null);
    void load();
  }, [isOpen, load]);

  // Poll while the instance is changing state (container pull/boot can take a while)
  const transitioning = instance?.status === "creating" || instance?.status === "deleting";
  useEffect(() => {
    if (!isOpen || !transitioning) return;
    const timer = setInterval(() => void load(), 4000);
    return () => clearInterval(timer);
  }, [isOpen, transitioning, load]);

  const runAction = async (action: "start" | "stop" | "reboot") => {
    setBusy(action);
    const res = await rdsApi.action(instanceId, action, projectName);
    setBusy(null);
    if (res.success) {
      toast.success(`${action[0].toUpperCase()}${action.slice(1)} requested`);
      await load();
      onChanged?.();
    } else {
      toast.error(res.error || `Failed to ${action}`);
    }
  };

  const togglePgAdmin = async (enabled: boolean) => {
    if (!instance) return;
    let password: string | undefined;
    if (enabled && !instance.details?.secretName) {
      password = window.prompt(`Master password for ${instance.name} (saved for pgAdmin only):`) || undefined;
      if (!password) return;
    }
    setBusy("pgadmin");
    const res = await rdsApi.setPgAdmin(instanceId, enabled, projectName, password);
    setBusy(null);
    if (res.success) {
      toast.success(enabled ? "Registered in pgAdmin — appears within a few seconds" : "Removed from pgAdmin");
      await load();
    } else {
      toast.error(res.error || "Failed to update pgAdmin");
    }
  };

  const d = instance?.details ?? {};
  const isPostgres = d.engine === "postgres";
  const envPrefix = isPostgres ? "PG" : "MYSQL_";

  return (
    <Modal open={isOpen} onClose={onClose} size="form" className="max-w-[600px]">
      <Modal.Header
        icon="logos:aws-rds"
        title={
          <span className="flex items-center gap-2">
            <span className="font-mono">{instanceId}</span>
            {instance && (
              <Badge tone={STATUS_TONE[instance.status]} pulse={transitioning}>
                {d.rdsStatus || instance.status}
              </Badge>
            )}
          </span>
        }
        subtitle={instance ? `${ENGINE_LABEL[d.engine] || d.engine} ${d.engineVersion} · ${d.instanceClass}` : "Loading…"}
        onClose={onClose}
      />
      <Modal.Body>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger-ink">
            <Icon icon="lucide:alert-circle" width={14} />
            {error}
          </div>
        )}

        {!instance && !error && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-skeleton animate-pulse" />
            ))}
          </div>
        )}

        {instance && (
          <>
            {instance.status === "creating" && (
              <p className="flex items-start gap-2 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn-ink">
                <Icon icon="lucide:loader" width={14} className="mt-px shrink-0 animate-spin" />
                MiniStack is pulling the {ENGINE_LABEL[d.engine] || d.engine} image and starting the container. The
                first instance of an engine can take a minute.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CopyRow label="Host (from your machine)" value={`${d.endpoint}:${d.port}`} />
              <CopyRow label="Host (from Docker containers)" value={`${d.internalHost}:${d.internalPort}`} />
              <CopyRow label="Master username" value={d.masterUsername || ""} />
              <CopyRow label="Database" value={d.dbName || (isPostgres ? "postgres" : "—")} />
            </div>

            <CopyRow
              label="Connection string (host apps)"
              value={d.hostConnectionString || ""}
              hint="Replace <password> with the master password"
            />
            <CopyRow
              label="Connection string (Lambdas & containers on lck-network)"
              value={d.dockerConnectionString || ""}
            />

            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink-2">Environment variables</summary>
              <pre className="overflow-x-auto border-t border-divider bg-surface-2 px-3 py-2 font-mono text-[11px] text-ink">
{isPostgres
  ? `PGHOST=${d.endpoint}\nPGPORT=${d.port}\nPGUSER=${d.masterUsername}\nPGPASSWORD=<password>\nPGDATABASE=${d.dbName || "postgres"}`
  : `${envPrefix}HOST=${d.endpoint}\n${envPrefix}PORT=${d.port}\n${envPrefix}USER=${d.masterUsername}\n${envPrefix}PASSWORD=<password>${d.dbName ? `\n${envPrefix}DATABASE=${d.dbName}` : ""}`}
              </pre>
            </details>

            {/* Integrations */}
            <div className="flex flex-col gap-2 border-t border-divider pt-3">
              {isPostgres && (
                <div className="flex items-center gap-3">
                  <Icon icon="logos:postgresql" width={16} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink">pgAdmin</p>
                    <p className="text-[11px] text-muted">
                      {d.pgadmin ? "Registered under \"LocalCloud RDS\"" : "Not registered"}
                    </p>
                  </div>
                  {d.pgadmin && (
                    <a href={pgAdminUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" icon="lucide:external-link">Open</Button>
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy === "pgadmin"}
                    disabled={!!busy}
                    onClick={() => togglePgAdmin(!d.pgadmin)}
                  >
                    {d.pgadmin ? "Remove" : "Register"}
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Icon icon="logos:aws-secrets-manager" width={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink">Secrets Manager</p>
                  <p className="text-[11px] text-muted truncate">
                    {d.secretName ? <span className="font-mono">{d.secretName}</span> : "Credentials not stored"}
                  </p>
                </div>
                {d.secretName && (
                  <Link href="/manage/secrets">
                    <Button variant="ghost" size="sm" icon="lucide:external-link">View</Button>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer
        hint={
          <Link href="/rds" className="hover:text-ink">
            RDS docs &amp; SDK examples →
          </Link>
        }
      >
        {instance?.status === "stopped" ? (
          <Button variant="secondary" icon="lucide:play" loading={busy === "start"} disabled={!!busy} onClick={() => runAction("start")}>
            Start
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              icon="lucide:rotate-cw"
              loading={busy === "reboot"}
              disabled={!!busy || instance?.status !== "active"}
              onClick={() => runAction("reboot")}
            >
              Reboot
            </Button>
            <Button
              variant="secondary"
              icon="lucide:square"
              loading={busy === "stop"}
              disabled={!!busy || instance?.status !== "active"}
              onClick={() => runAction("stop")}
            >
              Stop
            </Button>
          </>
        )}
        <Button variant="primary" onClick={onClose}>Done</Button>
      </Modal.Footer>
    </Modal>
  );
}
