import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";
import { addLog, state } from "../lib/context.js";

const router = express.Router();

const POSTHOG_INTERNAL_URL =
  process.env.POSTHOG_INTERNAL_URL || "http://posthog-web:8000";

router.get("/posthog/status", async (req, res) => {
  try {
    const response = await axios.get(`${POSTHOG_INTERNAL_URL}/_health`, {
      timeout: 5000,
    });

    if (response.status >= 200 && response.status < 300) {
      addLog("success", "PostHog health check passed — service is running", "posthog");
      return res.json({
        success: true,
        data: {
          status: "running",
          url: "https://posthog.localcloudkit.com:3030",
        },
      });
    }

    addLog("warning", "PostHog health check returned non-2xx status", "posthog");
    return res.json({ success: true, data: { status: "failed" } });
  } catch {
    try {
      const reachable = await checkTcpPort("posthog-web", 8000);
      const status = reachable ? "starting" : "stopped";
      addLog(
        "info",
        reachable ? "PostHog port is reachable — service is starting" : "PostHog is not running or not in active profile",
        "posthog"
      );
      return res.json({
        success: true,
        data: { status },
      });
    } catch {
      addLog("warning", "PostHog is not reachable", "posthog");
      return res.json({ success: true, data: { status: "stopped" } });
    }
  }
});

// Return posthog-source logs from the in-memory log store
router.get("/posthog/logs", (req, res) => {
  const posthogLogs = state.logs.filter((l) => l.source === "posthog");
  res.json({ success: true, data: posthogLogs });
});

export default router;
