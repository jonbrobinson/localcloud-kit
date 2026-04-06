import db from "../db.js";
import { listResources } from "./resources.js";
import { addLog } from "./context.js";

/** Skip background refresh if cache is newer than this (avoids list_resources stampede on rapid /dashboard loads). */
const MIN_STALE_MS = Number(process.env.RESOURCE_CACHE_MIN_STALE_MS || 12000);

const getStmt = db.prepare(
  "SELECT resources_json, fetched_at FROM resource_cache WHERE project_name = ?"
);

const upsertStmt = db.prepare(`
  INSERT INTO resource_cache (project_name, resources_json, fetched_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(project_name) DO UPDATE SET
    resources_json = excluded.resources_json,
    fetched_at = CURRENT_TIMESTAMP
`);

/** One in-flight refresh per project so concurrent callers share the same listResources run. */
const refreshInFlight = new Map();

export function getCachedResources(projectName) {
  const row = getStmt.get(projectName);
  if (!row) return null;
  try {
    return {
      resources: JSON.parse(row.resources_json),
      fetchedAt: row.fetched_at,
    };
  } catch {
    return null;
  }
}

export function setCachedResources(projectName, resources) {
  upsertStmt.run(projectName, JSON.stringify(resources));
}

function cacheAgeMs(cached) {
  const t = new Date(cached.fetchedAt).getTime();
  return Number.isFinite(t) ? Date.now() - t : Number.POSITIVE_INFINITY;
}

/**
 * Refresh the SQLite resource cache for a project in the background.
 * @param {string} projectName
 * @param {{ force?: boolean }} opts - force=true skips staleness check (cron, mutations, cold prime)
 * @returns {Promise<void>}
 */
export function scheduleResourceCacheRefresh(projectName, { force = false } = {}) {
  if (!projectName) return Promise.resolve();

  if (!force) {
    const cached = getCachedResources(projectName);
    if (cached && cacheAgeMs(cached) < MIN_STALE_MS) {
      return Promise.resolve();
    }
  }

  const existing = refreshInFlight.get(projectName);
  if (existing) return existing;

  const p = listResources(projectName)
    .then((fresh) => {
      setCachedResources(projectName, fresh);
    })
    .catch((err) => {
      addLog("warn", `Resource cache refresh failed: ${err.message}`, "api");
    })
    .finally(() => {
      refreshInFlight.delete(projectName);
    });

  refreshInFlight.set(projectName, p);
  return p;
}

/**
 * After create/destroy — always queue a full refresh (deduped if already running).
 */
export function invalidateResourceCache(projectName) {
  return scheduleResourceCacheRefresh(projectName, { force: true });
}
