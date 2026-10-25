import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";

const router = express.Router();

const LANGFUSE_INTERNAL_URL =
  process.env.LANGFUSE_INTERNAL_URL || "http://langfuse-web:3000";

router.get("/langfuse/status", async (req, res) => {
  try {
    const response = await axios.get(`${LANGFUSE_INTERNAL_URL}/api/public/health`, {
      timeout: 5000,
    });
    // Healthy response: { status: "OK", version: "4.x.x" }
    res.json({
      success: true,
      data: { status: "running", version: response.data?.version },
    });
  } catch (error) {
    // 503 means the web container is up but a backing store (Postgres/ClickHouse) is not ready
    if (error.response?.status === 503) {
      return res.json({ success: true, data: { status: "starting" } });
    }
    // Health endpoint not reachable — check whether the container port is up at all
    try {
      const host = new URL(LANGFUSE_INTERNAL_URL);
      const reachable = await checkTcpPort(host.hostname, Number(host.port) || 3000);
      // Port open but HTTP not answering → migrations are still running on first boot
      res.json({ success: true, data: { status: reachable ? "starting" : "stopped" } });
    } catch {
      res.json({ success: true, data: { status: "stopped" } });
    }
  }
});

export default router;
