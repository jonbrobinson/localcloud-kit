import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/saved-configs", (req, res) => {
  const { project_id, type } = req.query;
  let query = "SELECT * FROM saved_configs WHERE 1=1";
  const params = [];
  if (project_id) { query += " AND project_id = ?"; params.push(project_id); }
  if (type) { query += " AND resource_type = ?"; params.push(type); }
  query += " ORDER BY created_at DESC";
  const rows = db.prepare(query).all(...params);
  const configs = rows.map((r) => ({ ...r, config: JSON.parse(r.config_json) }));
  res.json({ success: true, data: configs });
});

router.post("/saved-configs", (req, res) => {
  const { project_id, name, resource_type, config } = req.body;
  if (!project_id || !name || !resource_type || !config) {
    return res.status(400).json({
      success: false,
      error: "project_id, name, resource_type, and config are required",
    });
  }
  const result = db
    .prepare("INSERT INTO saved_configs (project_id, name, resource_type, config_json) VALUES (?, ?, ?, ?)")
    .run(project_id, name, resource_type, JSON.stringify(config));
  const row = db.prepare("SELECT * FROM saved_configs WHERE id = ?").get(result.lastInsertRowid);
  res.json({ success: true, data: { ...row, config: JSON.parse(row.config_json) } });
});

router.put("/saved-configs/:id", (req, res) => {
  const { name, config } = req.body;
  db.prepare(
    "UPDATE saved_configs SET name = COALESCE(?, name), config_json = COALESCE(?, config_json), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(name || null, config ? JSON.stringify(config) : null, req.params.id);
  const row = db.prepare("SELECT * FROM saved_configs WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: "Saved config not found" });
  res.json({ success: true, data: { ...row, config: JSON.parse(row.config_json) } });
});

router.delete("/saved-configs/:id", (req, res) => {
  db.prepare("DELETE FROM saved_configs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
