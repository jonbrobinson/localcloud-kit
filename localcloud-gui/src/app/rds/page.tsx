"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppNavBar from "@/components/AppNavBar";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";
import { usePreferences } from "@/context/PreferencesContext";
import { useAdminUrl } from "@/hooks/useAdminUrl";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const TAB_LABELS: Record<PageTab, string> = {
  typescript: "TypeScript",
  node: "Node.js",
  python: "Python",
  cli: "AWS CLI",
};

const sdkExamples: Record<PageTab, { code: string; language: string }> = {
  typescript: {
    language: "typescript",
    code: `// npm install @aws-sdk/client-rds pg
import {
  RDSClient,
  CreateDBInstanceCommand,
  DescribeDBInstancesCommand,
  waitUntilDBInstanceAvailable,
} from "@aws-sdk/client-rds";
import { Client } from "pg";

const rds = new RDSClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a PostgreSQL 16 instance (MiniStack starts a real postgres container)
await rds.send(new CreateDBInstanceCommand({
  DBInstanceIdentifier: "orders-db",
  Engine: "postgres",
  EngineVersion: "16",
  DBInstanceClass: "db.t3.micro",
  AllocatedStorage: 20,
  MasterUsername: "dbadmin",
  MasterUserPassword: "change-me-please",
  DBName: "orders",
}));

// Wait for it to boot, then read the endpoint
await waitUntilDBInstanceAvailable(
  { client: rds, maxWaitTime: 180 },
  { DBInstanceIdentifier: "orders-db" },
);
const { DBInstances } = await rds.send(
  new DescribeDBInstancesCommand({ DBInstanceIdentifier: "orders-db" }),
);
const { Address, Port } = DBInstances![0].Endpoint!; // localhost, 15432+

// Connect with a normal driver
const db = new Client({
  host: Address,
  port: Port,
  user: "dbadmin",
  password: "change-me-please",
  database: "orders",
});
await db.connect();
const { rows } = await db.query("select version()");
console.log(rows[0].version);
await db.end();`,
  },
  node: {
    language: "javascript",
    code: `// npm install @aws-sdk/client-rds mysql2
import { RDSClient, CreateDBInstanceCommand, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import mysql from "mysql2/promise";

const rds = new RDSClient({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// Create a MySQL 8.0 instance
await rds.send(new CreateDBInstanceCommand({
  DBInstanceIdentifier: "catalog-db",
  Engine: "mysql",
  EngineVersion: "8.0",
  DBInstanceClass: "db.t3.micro",
  AllocatedStorage: 20,
  MasterUsername: "dbadmin",
  MasterUserPassword: "change-me-please",
  DBName: "catalog",
}));

// Poll until available
let instance;
do {
  await new Promise((r) => setTimeout(r, 3000));
  const { DBInstances } = await rds.send(
    new DescribeDBInstancesCommand({ DBInstanceIdentifier: "catalog-db" }),
  );
  instance = DBInstances[0];
} while (instance.DBInstanceStatus !== "available");

const conn = await mysql.createConnection({
  host: instance.Endpoint.Address,
  port: instance.Endpoint.Port,
  user: "dbadmin",
  password: "change-me-please",
  database: "catalog",
});
const [rows] = await conn.query("select version() as v");
console.log(rows[0].v);
await conn.end();`,
  },
  python: {
    language: "python",
    code: `# pip install boto3 psycopg[binary]
import boto3
import psycopg

rds = boto3.client(
    "rds",
    region_name="us-east-1",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

rds.create_db_instance(
    DBInstanceIdentifier="orders-db",
    Engine="postgres",
    EngineVersion="16",
    DBInstanceClass="db.t3.micro",
    AllocatedStorage=20,
    MasterUsername="dbadmin",
    MasterUserPassword="change-me-please",
    DBName="orders",
)

rds.get_waiter("db_instance_available").wait(DBInstanceIdentifier="orders-db")
endpoint = rds.describe_db_instances(DBInstanceIdentifier="orders-db")["DBInstances"][0]["Endpoint"]

with psycopg.connect(
    host=endpoint["Address"],
    port=endpoint["Port"],
    user="dbadmin",
    password="change-me-please",
    dbname="orders",
) as conn:
    print(conn.execute("select version()").fetchone()[0])`,
  },
  cli: {
    language: "bash",
    code: `export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
alias awslocal='aws --endpoint-url http://localhost:4566'

# Create a PostgreSQL instance
awslocal rds create-db-instance \\
  --db-instance-identifier orders-db \\
  --engine postgres \\
  --engine-version 16 \\
  --db-instance-class db.t3.micro \\
  --allocated-storage 20 \\
  --master-username dbadmin \\
  --master-user-password change-me-please \\
  --db-name orders

# Wait, then read the endpoint
awslocal rds wait db-instance-available --db-instance-identifier orders-db
awslocal rds describe-db-instances \\
  --db-instance-identifier orders-db \\
  --query 'DBInstances[0].Endpoint'

# Connect (port comes from the Endpoint above)
PGPASSWORD=change-me-please psql -h localhost -p 15432 -U dbadmin -d orders

# Stop / start / reboot / delete
awslocal rds stop-db-instance   --db-instance-identifier orders-db
awslocal rds start-db-instance  --db-instance-identifier orders-db
awslocal rds reboot-db-instance --db-instance-identifier orders-db
awslocal rds delete-db-instance --db-instance-identifier orders-db --skip-final-snapshot`,
  },
};

const frameworkExamples = [
  {
    title: "Laravel (.env)",
    language: "bash",
    code: `DB_CONNECTION=pgsql        # or mysql / mariadb
DB_HOST=127.0.0.1          # Laravel Sail / Docker: use the internal host instead
DB_PORT=15432              # the instance's Endpoint.Port
DB_DATABASE=orders
DB_USERNAME=dbadmin
DB_PASSWORD=change-me-please`,
  },
  {
    title: "Next.js / Prisma (.env)",
    language: "bash",
    code: `# Host app (next dev on your machine)
DATABASE_URL="postgresql://dbadmin:change-me-please@localhost:15432/orders"

# App running in a container on lck-network
# DATABASE_URL="postgresql://dbadmin:change-me-please@ministack-rds-<scope>-instance-orders-db:5432/orders"`,
  },
];

const engines = [
  { engine: "postgres", label: "PostgreSQL", versions: "17, 16, 15, 14", image: "postgres:<v>-alpine", port: "5432", pgadmin: true },
  { engine: "mysql", label: "MySQL", versions: "8.4, 8.0", image: "mysql:<v>", port: "3306", pgadmin: false },
  { engine: "mariadb", label: "MariaDB", versions: "11.4, 10.11, 10.6", image: "mariadb:<v>", port: "3306", pgadmin: false },
];

const apiEndpoints: [string, string, string][] = [
  ["GET", "/api/rds/options", "Engines, versions, instance classes, and previously deleted identifiers"],
  ["GET", "/api/rds/instances", "List instances (also prunes stale pgAdmin registrations)"],
  ["GET", "/api/rds/instances/:id", "Describe one instance with host and Docker connection details"],
  ["POST", "/api/rds/instances", "Create an instance (registerPgAdmin, storeInSecretsManager optional)"],
  ["POST", "/api/rds/instances/:id/:action", "start, stop, or reboot"],
  ["PUT", "/api/rds/instances/:id/pgadmin", "Register or remove the instance in pgAdmin"],
  ["DELETE", "/api/rds/instances/:id", "Delete instance, its linked secret, and pgAdmin registration"],
];

const externalResources = [
  {
    name: "Amazon RDS User Guide",
    url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html",
    description: "Official RDS concepts — DB instances, engines, endpoints.",
  },
  {
    name: "RDS SDK v3 (Node.js)",
    url: "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/rds/",
    description: "RDSClient API reference for the AWS SDK v3.",
  },
  {
    name: "boto3 RDS Reference",
    url: "https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/rds.html",
    description: "Complete boto3 RDS client reference for Python.",
  },
  {
    name: "MiniStack GitHub",
    url: "https://github.com/nahuelnucera/ministack",
    description: "MiniStack AWS emulator — RDS support and configuration variables.",
  },
];

const sectionClass = "bg-surface rounded-xl shadow-e1 border border-border p-6";
const thClass = "px-4 py-2.5 text-left font-medium text-muted";
const codeInline = "bg-surface-3 px-1 rounded font-mono text-xs text-ink";

export default function RDSDocPage() {
  const { profile, updateProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("typescript");
  const pgAdminUrl = useAdminUrl("https://pgadmin.localcloudkit.com:3030", "http://localhost:5050");

  useEffect(() => {
    if (profile?.preferred_language) {
      const lang = profile.preferred_language as PageTab;
      setActiveTab(PAGE_TABS.includes(lang) ? lang : "typescript");
    }
  }, [profile?.preferred_language]);

  const handleTabChange = (tab: PageTab) => {
    setActiveTab(tab);
    updateProfile({ preferred_language: tab }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-bg">
      <AppNavBar pageLabel="RDS">
        <ServiceStatusBadge service="aws-emulator" name="AWS Emulator" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-ink-2 bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
        >
          <Icon icon="logos:aws-rds" width={15} />
          Create on Dashboard
        </Link>
      </AppNavBar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-2">About RDS</h2>
          <p className="text-sm text-muted leading-relaxed">
            LocalCloud Kit emulates <strong className="text-ink">Amazon RDS</strong> through MiniStack. Every DB
            instance is a <strong className="text-ink">real database container</strong> (PostgreSQL, MySQL, or
            MariaDB), so your app talks to the same engine it uses in production, through the same RDS API calls.
          </p>
          <p className="text-sm text-muted leading-relaxed mt-2">
            Create instances from the dashboard (<span className="font-medium text-ink-2">Resources → RDS</span>) or with
            any AWS SDK. From the dashboard you can also register PostgreSQL instances in pgAdmin and store the master
            credentials in Secrets Manager in one step.
          </p>
        </section>

        {/* Engines */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Supported Engines</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass}>Engine</th>
                  <th className={thClass}>Versions</th>
                  <th className={thClass}>Image</th>
                  <th className={thClass}>Container port</th>
                  <th className={thClass}>pgAdmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {engines.map((e) => (
                  <tr key={e.engine}>
                    <td className="px-4 py-2.5 text-ink">
                      <span className="font-medium">{e.label}</span>{" "}
                      <span className="font-mono text-xs text-muted">({e.engine})</span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-2">{e.versions}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">{e.image}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-2">{e.port}</td>
                    <td className="px-4 py-2.5 text-ink-2">{e.pgadmin ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Connecting */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Connecting</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass}>From</th>
                  <th className={thClass}>Host</th>
                  <th className={thClass}>Port</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                <tr>
                  <td className="px-4 py-2.5 text-ink-2">Your machine (host apps, GUI clients)</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink">localhost</td>
                  <td className="px-4 py-2.5 text-ink-2">
                    <span className="font-mono text-xs text-ink">Endpoint.Port</span> — assigned from 15432 upward
                    (<span className="font-mono text-xs">RDS_BASE_PORT</span>)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-ink-2">Containers on lck-network (Lambdas, your services)</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink">ministack-rds-&lt;scope&gt;-instance-&lt;id&gt;</td>
                  <td className="px-4 py-2.5 text-ink-2">Engine default (5432 / 3306)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            The plug icon on an RDS row in the dashboard shows both hosts with copy buttons, plus ready-made connection
            strings.
          </p>
        </section>

        {/* Integrations */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Dashboard Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon icon="logos:postgresql" width={16} /> Register in pgAdmin
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                For PostgreSQL instances, the create form registers the instance in the bundled pgAdmin under the{" "}
                <span className="font-medium text-ink-2">LocalCloud RDS</span> group, with the password saved, so it
                connects in one click. Deleting the instance removes it from pgAdmin. You can also turn this on or off
                later from the instance&apos;s connection panel.
              </p>
              <a href={pgAdminUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                Open pgAdmin <Icon icon="lucide:external-link" width={12} />
              </a>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon icon="logos:aws-secrets-manager" width={16} /> Store credentials in Secrets Manager
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Creates <span className={codeInline}>rds/&lt;id&gt;/master</span> containing{" "}
                <span className="font-mono">engine, host, port, username, password, dbname</span> plus{" "}
                <span className="font-mono">dockerHost/dockerPort</span> for containers. The secret is deleted along
                with the instance.
              </p>
              <Link href="/secrets" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                Secrets Manager docs <Icon icon="lucide:arrow-right" width={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* SDK Examples */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-1">SDK Examples</h2>
          <p className="text-sm text-muted mb-4">Create an instance through the RDS API, then connect with a normal driver.</p>
          <div className="flex gap-1 mb-4 border-b border-border">
            {PAGE_TABS.map((key) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
          <ThemeableCodeBlock code={sdkExamples[activeTab].code} language={sdkExamples[activeTab].language} />
        </section>

        {/* Framework config */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Framework Configuration</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {frameworkExamples.map((ex) => (
              <div key={ex.title}>
                <p className="text-sm font-medium text-ink-2 mb-2">{ex.title}</p>
                <ThemeableCodeBlock code={ex.code} language={ex.language} showThemeSelector={false} />
              </div>
            ))}
          </div>
        </section>

        {/* Good to know */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Good to Know</h2>
          <ul className="space-y-2.5 text-sm text-muted list-disc pl-5">
            <li>
              <strong className="text-ink-2">First boot is slow.</strong> The first instance of an engine pulls its
              image. The dashboard shows <em>Creating</em> and refreshes on its own until the instance is available.
            </li>
            <li>
              <strong className="text-ink-2">Data persists.</strong> Instance data lives in Docker volumes
              (<span className="font-mono text-xs">RDS_PERSIST=1</span>) and instance records survive emulator restarts
              (<span className="font-mono text-xs">MINISTACK_PERSIST_STATE=1</span>).
            </li>
            <li>
              <strong className="text-ink-2">Reusing a deleted name.</strong> MiniStack keeps a deleted instance&apos;s
              data volume. A new instance with the same identifier boots on the old data and old password. Run{" "}
              <span className={codeInline}>make rds-prune</span> first, or pick a new name. The create form warns you.
            </li>
            <li>
              <strong className="text-ink-2">Stop is bookkeeping only.</strong> Stopping sets the status to{" "}
              <em>stopped</em>, but MiniStack leaves the container running.
            </li>
            <li>
              <strong className="text-ink-2">Cleanup.</strong> RDS containers run outside Docker Compose.{" "}
              <span className={codeInline}>make reset</span> and <span className={codeInline}>make clean-all</span>{" "}
              remove them; <span className={codeInline}>make rds-list</span> shows what exists.
            </li>
          </ul>
        </section>

        {/* API Endpoints */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">LocalCloud Kit API</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <thead className="bg-surface-2">
                <tr>
                  <th className={thClass}>Method</th>
                  <th className={thClass}>Endpoint</th>
                  <th className={thClass}>Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {apiEndpoints.map(([method, endpoint, desc]) => (
                  <tr key={`${method}-${endpoint}`}>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${
                          method === "GET"
                            ? "bg-success-soft text-success-ink"
                            : method === "DELETE"
                              ? "bg-danger-soft text-danger-ink"
                              : method === "PUT"
                                ? "bg-warn-soft text-warn-ink"
                                : "bg-primary-soft text-primary-ink"
                        }`}
                      >
                        {method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink">{endpoint}</td>
                    <td className="px-4 py-2.5 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resources */}
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-ink mb-4">Resources</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-divider text-sm">
              <tbody className="divide-y divide-divider">
                {externalResources.map((r) => (
                  <tr key={r.url}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                      >
                        <Icon icon="lucide:external-link" width={13} />
                        {r.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
