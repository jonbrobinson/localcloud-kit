import express from "express";
import path from "path";
import { execAsync } from "../lib/aws.js";

const router = express.Router();

const pathToShell = (script) => path.join("/app/scripts/shell", script);

router.get("/cache/status", async (req, res) => {
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("list_cache.sh")}`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/cache/set", async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ success: false, error: "Key and value required" });
  }
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("cache_set.sh")} '${key}' '${value}'`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/cache/get", async (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ success: false, error: "Key required" });
  }
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("cache_get.sh")} '${key}'`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/cache/del", async (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: "Key required" });
  }
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("cache_del.sh")} '${key}'`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/cache/flush", async (req, res) => {
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("cache_flush.sh")}`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/cache/keys", async (req, res) => {
  try {
    const { stdout } = await execAsync(`/bin/sh ${pathToShell("list_cache_keys.sh")}`);
    res.json(JSON.parse(stdout));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
