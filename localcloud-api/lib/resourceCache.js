import db from "../db.js";
import { listResources } from "./resources.js";
import { addLog } from "./context.js";

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

const deleteStmt = db.prepare(
  "DELETE FROM resource_cache WHERE project_name = ?"
);

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

/**
 * Immediately refresh the cache after a mutation (create/destroy).
 * Runs listResources in the background so the caller is not blocked.
 * The next /dashboard request will read the freshly updated cache.
 */
export function invalidateResourceCache(projectName) {
  listResources(projectName)
    .then((fresh) => setCachedResources(projectName, fresh))
    .catch((err) =>
      addLog("warn", `Cache invalidation refresh failed: ${err.message}`, "api")
    );
}
