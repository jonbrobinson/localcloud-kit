const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "localcloud.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_profile (
    id                 INTEGER PRIMARY KEY DEFAULT 1,
    preferred_language TEXT NOT NULL DEFAULT 'typescript',
    highlight_theme    TEXT NOT NULL DEFAULT 'github-dark',
    display_name       TEXT DEFAULT 'Developer',
    active_project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_configs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    config_json   TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default project
let defaultProject = db
  .prepare("SELECT id FROM projects WHERE name = ?")
  .get("default");
if (!defaultProject) {
  const result = db
    .prepare(
      "INSERT INTO projects (name, label, description) VALUES (?, ?, ?)"
    )
    .run("default", "Default", "Default project");
  defaultProject = { id: result.lastInsertRowid };
}

// Seed profile row (id = 1)
const profile = db
  .prepare("SELECT id FROM user_profile WHERE id = 1")
  .get();
if (!profile) {
  db.prepare(
    "INSERT INTO user_profile (id, active_project_id) VALUES (1, ?)"
  ).run(defaultProject.id);
}

module.exports = db;
