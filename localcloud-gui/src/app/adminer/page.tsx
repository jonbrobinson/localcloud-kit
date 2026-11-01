"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import AppNavBar from "@/components/AppNavBar";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { useAdminUrl } from "@/hooks/useAdminUrl";

const ADMINER_TRAEFIK_URL = "https://adminer.localcloudkit.com:3030";
const ADMINER_DIRECT_URL = "http://localhost:8081";

const sectionClass = "bg-surface rounded-xl shadow-e1 border border-border p-6";
const thClass = "px-4 py-2.5 text-left font-medium text-muted";
const codeInline = "bg-surface-3 px-1 rounded font-mono text-xs text-ink";

const manualServers = [
  { target: "Bundled PostgreSQL", system: "PostgreSQL", server: "postgres:5432", credentials: "localcloud / localcloud" },
  { target: "RDS PostgreSQL instance", system: "PostgreSQL", server: "ministack-rds-<scope>-instance-<id>:5432", credentials: "master user" },
  { target: "RDS MySQL / MariaDB instance", system: "MySQL / MariaDB", server: "ministack-rds-<scope>-instance-<id>:3306", credentials: "master user" },
];

const savedServerExample = `[
  {
    "label": "LocalCloud PostgreSQL",
    "engine": "PostgreSQL",
    "driver": "pgsql",
    "server": "postgres:5432",
    "username": "localcloud",
    "password": "localcloud",
    "db": "localcloud"
  },
  {
    "label": "My app MySQL",
    "engine": "MySQL",
    "driver": "server",
    "server": "my-mysql-container:3306",
    "username": "root",
    "password": "secret"
  }
]`;

const comparison = [
  { aspect: "Engines", adminer: "PostgreSQL, MySQL, MariaDB, SQLite, MS SQL, Oracle", pgadmin: "PostgreSQL only" },
  { aspect: "Footprint", adminer: "Single PHP app, starts instantly", pgadmin: "Python app, heavier" },
  { aspect: "Strengths", adminer: "Quick browsing, editing rows, running SQL, import/export", pgadmin: "Deep Postgres tooling — query plans, roles, server stats, ERD" },
  { aspect: "RDS integration", adminer: "\"Add to Adminer\" — every engine", pgadmin: "\"Register in pgAdmin\" — PostgreSQL" },
];

export default function AdminerDocPage() {
  const adminerUrl = useAdminUrl(ADMINER_TRAEFIK_URL, ADMINER_DIRECT_URL);

  return (
    <main className="min-h-screen bg-bg">
      <AppNavBar pageLabel="Adminer">
        <ServiceStatusBadge service="adminer" name="Adminer" />
        <a
          href={adminerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-ink-2 bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
        >
          <Icon icon="lucide:external-link" width={14} />
          Open Adminer
        </a>
      </AppNavBar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-2">About Adminer</h2>
          <p className="text-sm text-muted leading-relaxed">
            <strong className="text-ink">Adminer</strong> is a lightweight, open-source (Apache-2.0) database UI that
            works with PostgreSQL, MySQL, MariaDB, and more from one screen. LocalCloud Kit adds a{" "}
            <strong className="text-ink">Saved servers</strong> list to its login page: the bundled PostgreSQL plus every{" "}
            <Link href="/rds" className="text-primary hover:underline">RDS instance</Link> created with{" "}
            <span className="font-medium text-ink-2">Add to Adminer</span>. Click one to sign in. No typing needed.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Access</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass}>Interface</th>
                  <th className={thClass}>URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                <tr>
                  <td className="px-4 py-2.5 text-ink-2">Web UI (via Traefik)</td>
                  <td className="px-4 py-2.5">
                    <a href={ADMINER_TRAEFIK_URL} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline">
                      {ADMINER_TRAEFIK_URL}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-ink-2">Web UI (direct)</td>
                  <td className="px-4 py-2.5">
                    <a href={ADMINER_DIRECT_URL} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline">
                      {ADMINER_DIRECT_URL}
                    </a>{" "}
                    <span className="text-xs text-muted">(<span className="font-mono">ADMINER_PORT</span>)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-2">Saved Servers</h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            A small plugin (<span className={codeInline}>adminer/localcloud-servers.php</span>) reads the list on every
            page load from two places:
          </p>
          <ul className="space-y-2 text-sm text-muted list-disc pl-5 mb-4">
            <li>
              <span className={codeInline}>adminer/servers.json</span> — bundled services. Add your own containers here, then run{" "}
              <span className={codeInline}>docker compose restart adminer</span>.
            </li>
            <li>
              The <span className={codeInline}>adminer_servers</span> volume — one file per RDS instance, written and
              removed by the API when you create or delete instances or toggle <em>Add to Adminer</em> in the
              connection panel.
            </li>
          </ul>
          <ThemeableCodeBlock code={savedServerExample} language="javascript" showThemeSelector={false} />
          <p className="text-xs text-muted mt-3">
            <span className="font-mono">driver</span> is <span className="font-mono">pgsql</span> for PostgreSQL and{" "}
            <span className="font-mono">server</span> for MySQL/MariaDB (Adminer&apos;s name for it). Saved passwords are
            stored in plain text — fine for local development, never for shared environments.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-2">Connecting Manually</h2>
          <p className="text-sm text-muted mb-4">
            Adminer runs inside Docker on <span className="font-mono">lck-network</span>, so use container hostnames —{" "}
            <span className="font-mono">localhost</span> would point at the Adminer container itself.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass}>Database</th>
                  <th className={thClass}>System</th>
                  <th className={thClass}>Server</th>
                  <th className={thClass}>Credentials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {manualServers.map((row) => (
                  <tr key={row.target}>
                    <td className="px-4 py-2.5 text-ink-2">{row.target}</td>
                    <td className="px-4 py-2.5 text-ink-2">{row.system}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink">{row.server}</td>
                    <td className="px-4 py-2.5 text-muted">{row.credentials}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            The RDS connection panel on the dashboard shows each instance&apos;s exact Docker host.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Adminer or pgAdmin?</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass} />
                  <th className={thClass}>Adminer</th>
                  <th className={thClass}>pgAdmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {comparison.map((row) => (
                  <tr key={row.aspect}>
                    <td className="px-4 py-2.5 font-medium text-ink-2">{row.aspect}</td>
                    <td className="px-4 py-2.5 text-muted">{row.adminer}</td>
                    <td className="px-4 py-2.5 text-muted">{row.pgadmin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            Both are included — use Adminer for quick, any-engine access and pgAdmin when you need Postgres-specific
            tooling. See <Link href="/postgres" className="text-primary hover:underline">PostgreSQL</Link> for pgAdmin.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Resources</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://www.adminer.org/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                <Icon icon="lucide:external-link" width={13} /> adminer.org
              </a>{" "}
              <span className="text-muted">— features, supported databases, and plugins</span>
            </li>
            <li>
              <a href="https://hub.docker.com/_/adminer" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium">
                <Icon icon="lucide:external-link" width={13} /> Official Docker image
              </a>{" "}
              <span className="text-muted">— environment variables and plugin loading</span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
