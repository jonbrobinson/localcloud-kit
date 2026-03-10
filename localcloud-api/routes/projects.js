import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/projects", (req, res) => {
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at ASC").all();
  res.json({ success: true, data: projects });
});

router.post("/projects", (req, res) => {
  const { name, label, description } = req.body;
  if (!name || !label) {
    return res.status(400).json({ success: false, error: "name and label are required" });
  }
  try {
    const result = db
      .prepare("INSERT INTO projects (name, label, description) VALUES (?, ?, ?)")
      .run(name, label, description || null);
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, data: project });
  } catch {
    res.status(400).json({ success: false, error: "Project name already exists" });
  }
});

router.put("/projects/:id", (req, res) => {
  const { label, description } = req.body;
  db.prepare(
    "UPDATE projects SET label = COALESCE(?, label), description = COALESCE(?, description) WHERE id = ?"
  ).run(label || null, description !== undefined ? description : null, req.params.id);
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!project) return res.status(404).json({ success: false, error: "Project not found" });
  res.json({ success: true, data: project });
});

router.delete("/projects/:id", (req, res) => {
  const profile = db.prepare("SELECT active_project_id FROM user_profile WHERE id = 1").get();
  if (profile?.active_project_id == req.params.id) {
    return res.status(400).json({
      success: false,
      error: "Cannot delete the active project. Switch projects first.",
    });
  }
  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
