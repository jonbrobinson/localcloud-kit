import express from "express";
import { asRedisString, getRedis, parseServerInfo } from "../lib/redis.js";

const router = express.Router();

router.get("/cache/status", async (_req, res) => {
  try {
    const redis = await getRedis();
    const pong = await redis.ping();
    if (pong !== "PONG") {
      return res.json({ status: "stopped" });
    }
    const info = parseServerInfo(await redis.info("server"));
    res.json({ status: "running", info });
  } catch {
    res.json({ status: "stopped" });
  }
});

router.post("/cache/set", async (req, res) => {
  const { key, value } = req.body;
  const stored = asRedisString(value);
  if (!key || stored === null) {
    return res.status(400).json({ success: false, error: "Key and value required" });
  }
  try {
    const redis = await getRedis();
    await redis.set(key, stored);
    res.json({ success: true });
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
    const redis = await getRedis();
    const value = await redis.get(key);
    if (value === null) {
      return res.json({ success: false, error: "Key not found" });
    }
    res.json({ success: true, value });
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
    const redis = await getRedis();
    const deleted = await redis.del(key);
    if (deleted === 0) {
      return res.json({ success: false, error: "Key not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/cache/flush", async (_req, res) => {
  try {
    const redis = await getRedis();
    await redis.flushAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/cache/keys", async (_req, res) => {
  try {
    const redis = await getRedis();
    const keys = await redis.keys("*");
    if (keys.length === 0) {
      return res.json({ success: true, data: [], message: "No keys found" });
    }
    const values = await redis.mGet(keys);
    const data = keys.map((k, i) => ({ key: k, value: values[i] ?? "" }));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
