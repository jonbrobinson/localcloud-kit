import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/profile", (req, res) => {
  const profile = db
    .prepare(
      `SELECT u.*, p.name as active_project_name, p.label as active_project_label
       FROM user_profile u
       LEFT JOIN projects p ON u.active_project_id = p.id
       WHERE u.id = 1`
    )
    .get();
  res.json({ success: true, data: profile });
});

router.put("/profile", (req, res) => {
  const { preferred_language, highlight_theme, display_name, active_project_id } = req.body;
  const sets = [];
  const vals = [];
  if (preferred_language !== undefined) { sets.push("preferred_language = ?"); vals.push(preferred_language); }
  if (highlight_theme !== undefined) { sets.push("highlight_theme = ?"); vals.push(highlight_theme); }
  if (display_name !== undefined) { sets.push("display_name = ?"); vals.push(display_name); }
  if (active_project_id !== undefined) { sets.push("active_project_id = ?"); vals.push(active_project_id); }
  if (sets.length === 0) return res.status(400).json({ success: false, error: "No fields to update" });
  sets.push("updated_at = CURRENT_TIMESTAMP");
  db.prepare(`UPDATE user_profile SET ${sets.join(", ")} WHERE id = 1`).run(...vals);
  const profile = db
    .prepare(
      `SELECT u.*, p.name as active_project_name, p.label as active_project_label
       FROM user_profile u
       LEFT JOIN projects p ON u.active_project_id = p.id
       WHERE u.id = 1`
    )
    .get();
  res.json({ success: true, data: profile });
});

export default router;
