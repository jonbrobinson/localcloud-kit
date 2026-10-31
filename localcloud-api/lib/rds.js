// RDS (via MiniStack) — each DB instance is a real postgres/mysql/mariadb
// container that MiniStack starts on lck-network.
//
// The AWS CLI is called with execFile and an argument array (never a shell
// string), because RDS requests carry master passwords.

import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { awsEnv, awsRegion, internalEndpoint } from "./aws.js";
import { addLog } from "./context.js";

const execFileAsync = promisify(execFile);

const ACCOUNT_ID = "000000000000";
const PGADMIN_IMPORT_DIR = process.env.PGADMIN_IMPORT_DIR || "/app/pgadmin-import";
const PGADMIN_GROUP = "LocalCloud RDS";
const PGADMIN_PASSFILE = "/var/lib/pgadmin/rds.pgpass";
const DATA_DIR = process.env.DATA_DIR || "/app/data";
const DELETED_IDS_FILE = path.join(DATA_DIR, "rds-deleted-identifiers.json");

export const TAG_PROJECT = "lck:project";
export const TAG_PGADMIN = "lck:pgadmin";
export const TAG_SECRET = "lck:secret";

/** Engines and versions verified against MiniStack (each maps to an official image). */
export const RDS_ENGINES = {
  postgres: { label: "PostgreSQL", port: 5432, versions: ["17", "16", "15", "14"], defaultVersion: "16" },
  mysql: { label: "MySQL", port: 3306, versions: ["8.4", "8.0"], defaultVersion: "8.0" },
  mariadb: { label: "MariaDB", port: 3306, versions: ["11.4", "10.11", "10.6"], defaultVersion: "10.11" },
};

export const RDS_INSTANCE_CLASSES = ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.m5.large"];

export class RdsValidationError extends Error {}

// ---------------------------------------------------------------------------
// AWS CLI helper
// ---------------------------------------------------------------------------

async function aws(args) {
  try {
    const { stdout } = await execFileAsync(
      "aws",
      ["--endpoint-url", internalEndpoint, "--region", awsRegion, "--output", "json", ...args],
      { env: { ...awsEnv(), AWS_PAGER: "" }, maxBuffer: 10 * 1024 * 1024 }
    );
    return stdout.trim() ? JSON.parse(stdout) : {};
  } catch (error) {
    const message = (error.stderr || error.message || "").trim();
    // Strip the CLI's "An error occurred (X) when calling the Y operation:" preamble
    const match = message.match(/operation: (.*)$/s);
    throw new Error(match ? match[1].trim() : message);
  }
}

// ---------------------------------------------------------------------------
// Validation (mirrors the real RDS rules closely enough to catch typos early)
// ---------------------------------------------------------------------------

export function validateIdentifier(id) {
  if (!id) return "DB instance identifier is required";
  if (id.length > 63) return "Identifier must be 63 characters or fewer";
  if (!/^[a-z]/.test(id)) return "Identifier must start with a letter";
  if (!/^[a-z0-9-]+$/.test(id)) return "Only lowercase letters, numbers, and hyphens are allowed";
  if (id.endsWith("-") || id.includes("--")) return "Identifier cannot end with a hyphen or contain two in a row";
  return "";
}

function validateConfig(cfg) {
  const engine = RDS_ENGINES[cfg.engine];
  if (!engine) return `Unsupported engine "${cfg.engine}". Use one of: ${Object.keys(RDS_ENGINES).join(", ")}`;
  if (cfg.engineVersion && !engine.versions.includes(cfg.engineVersion)) {
    return `Unsupported ${engine.label} version "${cfg.engineVersion}"`;
  }
  const idError = validateIdentifier(cfg.dbInstanceIdentifier);
  if (idError) return idError;
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,15}$/.test(cfg.masterUsername || "")) {
    return "Master username must start with a letter and contain only letters, numbers, and underscores (max 16)";
  }
  const pw = cfg.masterPassword || "";
  if (pw.length < 8 || pw.length > 41) return "Master password must be 8–41 characters";
  if (/[/"@\s]/.test(pw) || /[^\x20-\x7e]/.test(pw)) {
    return "Master password cannot contain /, \", @, spaces, or non-ASCII characters";
  }
  if (cfg.dbName && !/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(cfg.dbName)) {
    return "Database name must start with a letter and contain only letters, numbers, and underscores";
  }
  if (cfg.instanceClass && !RDS_INSTANCE_CLASSES.includes(cfg.instanceClass)) {
    return `Unsupported instance class "${cfg.instanceClass}"`;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** Name MiniStack gives the instance's container — reachable on lck-network. */
export function containerHostFor(dbInstanceIdentifier) {
  const scope = crypto.createHash("sha1").update(`${ACCOUNT_ID}:${awsRegion}`).digest("hex").slice(0, 12);
  return `ministack-rds-${scope}-instance-${dbInstanceIdentifier}`;
}

const STATUS_MAP = {
  available: "active",
  creating: "creating",
  starting: "creating",
  rebooting: "creating",
  modifying: "creating",
  "backing-up": "active",
  deleting: "deleting",
  stopping: "deleting",
  stopped: "stopped",
  failed: "error",
  "incompatible-parameters": "error",
  "inaccessible-encryption-credentials": "error",
};

function tagMap(tagList = []) {
  return Object.fromEntries(tagList.map((t) => [t.Key, t.Value]));
}

function buildConnection(engine, { host, port, username, dbName }) {
  const scheme = engine === "postgres" ? "postgresql" : "mysql";
  const db = dbName || (engine === "postgres" ? "postgres" : "");
  return `${scheme}://${username}:<password>@${host}:${port}/${db}`;
}

export function toResource(dbi, projectName) {
  const tags = tagMap(dbi.TagList);
  const engineInfo = RDS_ENGINES[dbi.Engine];
  const internalPort = engineInfo?.port ?? dbi.Endpoint?.Port;
  const internalHost = containerHostFor(dbi.DBInstanceIdentifier);
  const hostEndpoint = dbi.Endpoint?.Address || "localhost";
  const hostPort = dbi.Endpoint?.Port;
  const connArgs = { username: dbi.MasterUsername, dbName: dbi.DBName };

  return {
    id: `rds-${dbi.DBInstanceIdentifier}`,
    name: dbi.DBInstanceIdentifier,
    type: "rds",
    status: STATUS_MAP[dbi.DBInstanceStatus] || "unknown",
    project: tags[TAG_PROJECT] || projectName,
    createdAt: dbi.InstanceCreateTime || new Date().toISOString(),
    details: {
      arn: dbi.DBInstanceArn,
      engine: dbi.Engine,
      engineVersion: dbi.EngineVersion,
      instanceClass: dbi.DBInstanceClass,
      rdsStatus: dbi.DBInstanceStatus,
      allocatedStorage: dbi.AllocatedStorage,
      masterUsername: dbi.MasterUsername,
      dbName: dbi.DBName || "",
      endpoint: hostEndpoint,
      port: hostPort,
      internalHost,
      internalPort,
      hostConnectionString: buildConnection(dbi.Engine, { ...connArgs, host: hostEndpoint, port: hostPort }),
      dockerConnectionString: buildConnection(dbi.Engine, { ...connArgs, host: internalHost, port: internalPort }),
      pgadmin: tags[TAG_PGADMIN] === "true",
      secretName: tags[TAG_SECRET] || "",
    },
  };
}

// ---------------------------------------------------------------------------
// pgAdmin registration (picked up by pgadmin/rds-sync.sh inside the pgAdmin container)
// ---------------------------------------------------------------------------

function escapePgpass(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/:/g, "\\:");
}

export async function registerWithPgAdmin({ dbInstanceIdentifier, masterUsername, masterPassword, dbName }) {
  const host = containerHostFor(dbInstanceIdentifier);
  const port = RDS_ENGINES.postgres.port;
  const serverDoc = {
    Servers: {
      1: {
        Name: `${dbInstanceIdentifier} (RDS)`,
        Group: PGADMIN_GROUP,
        Host: host,
        Port: port,
        MaintenanceDB: dbName || "postgres",
        Username: masterUsername,
        SSLMode: "prefer",
        PassFile: PGADMIN_PASSFILE,
      },
    },
  };
  const pgpassLine = [host, port, "*", masterUsername, masterPassword].map(escapePgpass).join(":");

  await fs.mkdir(PGADMIN_IMPORT_DIR, { recursive: true });
  // The pgAdmin container runs as a different user; it only needs to read these.
  await fs.chmod(PGADMIN_IMPORT_DIR, 0o755).catch(() => {});
  await fs.writeFile(path.join(PGADMIN_IMPORT_DIR, `${dbInstanceIdentifier}.pgpass`), pgpassLine, { mode: 0o644 });
  await fs.writeFile(
    path.join(PGADMIN_IMPORT_DIR, `${dbInstanceIdentifier}.json`),
    JSON.stringify(serverDoc, null, 2),
    { mode: 0o644 }
  );
}

export async function unregisterFromPgAdmin(dbInstanceIdentifier) {
  await Promise.all(
    ["json", "pgpass"].map((ext) =>
      fs.rm(path.join(PGADMIN_IMPORT_DIR, `${dbInstanceIdentifier}.${ext}`), { force: true })
    )
  );
}

/** Drop pgAdmin registrations whose instance no longer exists (e.g. after a destroy-all or emulator reset). */
async function reconcilePgAdmin(existingIds) {
  let files;
  try {
    files = await fs.readdir(PGADMIN_IMPORT_DIR);
  } catch {
    return;
  }
  const registered = new Set(files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)));
  for (const id of registered) {
    if (!existingIds.has(id)) {
      await unregisterFromPgAdmin(id);
      addLog("info", `Removed stale pgAdmin registration for RDS instance ${id}`, "automation");
    }
  }
}

// ---------------------------------------------------------------------------
// Deleted-identifier tracking. MiniStack keeps an instance's data volume after
// DeleteDBInstance, so re-using the identifier boots on the old data (and the
// old master password). We remember deleted ids to warn in the create form.
// ---------------------------------------------------------------------------

async function readDeletedIds() {
  try {
    return JSON.parse(await fs.readFile(DELETED_IDS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeDeletedIds(ids) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DELETED_IDS_FILE, JSON.stringify([...new Set(ids)].sort()));
}

export async function listDeletedIdentifiers() {
  return readDeletedIds();
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export async function describeInstances() {
  const data = await aws(["rds", "describe-db-instances"]);
  return data.DBInstances || [];
}

export async function listInstances(projectName) {
  const instances = await describeInstances();
  await reconcilePgAdmin(new Set(instances.map((i) => i.DBInstanceIdentifier)));
  return instances.map((dbi) => toResource(dbi, projectName));
}

export async function getInstance(id, projectName) {
  const idError = validateIdentifier(id);
  if (idError) throw new RdsValidationError(idError);
  const data = await aws(["rds", "describe-db-instances", "--db-instance-identifier", id]);
  const dbi = data.DBInstances?.[0];
  if (!dbi) throw new Error(`DB instance ${id} not found`);
  return toResource(dbi, projectName);
}

export async function createInstance(projectName, rawConfig = {}) {
  const engine = rawConfig.engine || "postgres";
  const cfg = {
    engine,
    engineVersion: rawConfig.engineVersion || RDS_ENGINES[engine]?.defaultVersion,
    dbInstanceIdentifier: String(rawConfig.dbInstanceIdentifier || "").trim().toLowerCase(),
    masterUsername: String(rawConfig.masterUsername || "").trim(),
    masterPassword: rawConfig.masterPassword || "",
    dbName: String(rawConfig.dbName || "").trim(),
    instanceClass: rawConfig.instanceClass || "db.t3.micro",
    allocatedStorage: Number(rawConfig.allocatedStorage) || 20,
    registerPgAdmin: Boolean(rawConfig.registerPgAdmin) && engine === "postgres",
    storeInSecretsManager: Boolean(rawConfig.storeInSecretsManager),
  };

  const error = validateConfig(cfg);
  if (error) throw new RdsValidationError(error);

  const secretName = cfg.storeInSecretsManager ? `rds/${cfg.dbInstanceIdentifier}/master` : "";
  const tags = [
    { Key: TAG_PROJECT, Value: projectName },
    { Key: TAG_PGADMIN, Value: String(cfg.registerPgAdmin) },
    ...(secretName ? [{ Key: TAG_SECRET, Value: secretName }] : []),
  ];

  const args = [
    "rds", "create-db-instance",
    "--db-instance-identifier", cfg.dbInstanceIdentifier,
    "--engine", cfg.engine,
    "--engine-version", cfg.engineVersion,
    "--db-instance-class", cfg.instanceClass,
    "--allocated-storage", String(cfg.allocatedStorage),
    "--master-username", cfg.masterUsername,
    "--master-user-password", cfg.masterPassword,
    "--tags", JSON.stringify(tags),
  ];
  if (cfg.dbName) args.push("--db-name", cfg.dbName);

  const created = await aws(args);
  const dbi = created.DBInstance;
  addLog("success", `RDS ${cfg.engine} instance ${cfg.dbInstanceIdentifier} is being created`, "automation");

  // Identifier is in use again — no longer "deleted".
  const deleted = await readDeletedIds();
  if (deleted.includes(cfg.dbInstanceIdentifier)) {
    await writeDeletedIds(deleted.filter((id) => id !== cfg.dbInstanceIdentifier));
  }

  const warnings = [];

  if (secretName) {
    const secretValue = {
      engine: cfg.engine,
      host: dbi?.Endpoint?.Address || "localhost",
      port: dbi?.Endpoint?.Port,
      username: cfg.masterUsername,
      password: cfg.masterPassword,
      dbname: cfg.dbName || undefined,
      dbInstanceIdentifier: cfg.dbInstanceIdentifier,
      dockerHost: containerHostFor(cfg.dbInstanceIdentifier),
      dockerPort: RDS_ENGINES[cfg.engine].port,
    };
    try {
      await aws([
        "secretsmanager", "create-secret",
        "--name", secretName,
        "--description", `Master credentials for RDS instance ${cfg.dbInstanceIdentifier}`,
        "--secret-string", JSON.stringify(secretValue),
      ]);
      addLog("success", `Stored RDS credentials in Secrets Manager: ${secretName}`, "automation");
    } catch (err) {
      warnings.push(`Could not store credentials in Secrets Manager: ${err.message}`);
    }
  }

  if (cfg.registerPgAdmin) {
    try {
      await registerWithPgAdmin(cfg);
      addLog("success", `Queued pgAdmin registration for ${cfg.dbInstanceIdentifier}`, "automation");
    } catch (err) {
      warnings.push(`Could not register with pgAdmin: ${err.message}`);
    }
  }

  warnings.forEach((w) => addLog("warn", w, "automation"));
  const resource = dbi ? toResource(dbi, projectName) : null;
  return { ...resource, warnings };
}

export async function instanceAction(id, action) {
  const idError = validateIdentifier(id);
  if (idError) throw new RdsValidationError(idError);
  const commands = { start: "start-db-instance", stop: "stop-db-instance", reboot: "reboot-db-instance" };
  if (!commands[action]) throw new RdsValidationError(`Unsupported action "${action}"`);
  const data = await aws(["rds", commands[action], "--db-instance-identifier", id]);
  addLog("info", `RDS instance ${id}: ${action} requested`, "automation");
  return data.DBInstance;
}

export async function deleteInstance(id) {
  const idError = validateIdentifier(id);
  if (idError) throw new RdsValidationError(idError);

  let tags = {};
  try {
    const data = await aws(["rds", "describe-db-instances", "--db-instance-identifier", id]);
    tags = tagMap(data.DBInstances?.[0]?.TagList);
  } catch {
    // Already gone — still clean up anything we own below.
  }

  try {
    await aws(["rds", "delete-db-instance", "--db-instance-identifier", id, "--skip-final-snapshot"]);
  } catch (err) {
    if (!/not ?found/i.test(err.message)) throw err;
  }

  if (tags[TAG_SECRET]) {
    await aws([
      "secretsmanager", "delete-secret",
      "--secret-id", tags[TAG_SECRET],
      "--force-delete-without-recovery",
    ]).catch(() => {});
  }
  await unregisterFromPgAdmin(id);
  await writeDeletedIds([...(await readDeletedIds()), id]);

  addLog("success", `RDS instance ${id} deleted`, "automation");
}

/** Delete every instance tagged with this project (used by "destroy all"). */
export async function deleteProjectInstances(projectName) {
  const instances = await describeInstances();
  const owned = instances.filter((i) => tagMap(i.TagList)[TAG_PROJECT] === projectName);
  for (const dbi of owned) {
    await deleteInstance(dbi.DBInstanceIdentifier);
  }
  return owned.length;
}

/**
 * Turn pgAdmin registration on/off for an existing PostgreSQL instance.
 * Enabling needs the master password: taken from the request, or from the
 * linked Secrets Manager secret when there is one.
 */
export async function setPgAdminRegistration(id, enabled, password) {
  const data = await aws(["rds", "describe-db-instances", "--db-instance-identifier", id]);
  const dbi = data.DBInstances?.[0];
  if (!dbi) throw new Error(`DB instance ${id} not found`);
  if (dbi.Engine !== "postgres") throw new RdsValidationError("pgAdmin registration is only available for PostgreSQL");

  if (enabled) {
    let masterPassword = password;
    const secretName = tagMap(dbi.TagList)[TAG_SECRET];
    if (!masterPassword && secretName) {
      const secret = await aws(["secretsmanager", "get-secret-value", "--secret-id", secretName]);
      masterPassword = JSON.parse(secret.SecretString || "{}").password;
    }
    if (!masterPassword) throw new RdsValidationError("Master password is required to register with pgAdmin");
    await registerWithPgAdmin({
      dbInstanceIdentifier: id,
      masterUsername: dbi.MasterUsername,
      masterPassword,
      dbName: dbi.DBName,
    });
  } else {
    await unregisterFromPgAdmin(id);
  }

  await aws([
    "rds", "add-tags-to-resource",
    "--resource-name", dbi.DBInstanceArn,
    "--tags", JSON.stringify([{ Key: TAG_PGADMIN, Value: String(enabled) }]),
  ]);
}
