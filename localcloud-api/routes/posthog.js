import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";

const router = express.Router();

const POSTHOG_INTERNAL_URL =
  process.env.POSTHOG_INTERNAL_URL || "http://posthog-web:8000";

router.get("/posthog/status", async (req, res) => {
  try {
    const response = await axios.get(`${POSTHOG_INTERNAL_URL}/_health`, {
      timeout: 5000,
    });

    if (response.status >= 200 && response.status < 300) {
      return res.json({
        success: true,
        data: {
          status: "running",
          url: "https://posthog.localcloudkit.com:3030",
        },
      });
    }

    return res.json({ success: true, data: { status: "failed" } });
  } catch {
    try {
      const reachable = await checkTcpPort("posthog-web", 8000);
      return res.json({
        success: true,
        data: { status: reachable ? "starting" : "stopped" },
      });
    } catch {
      return res.json({ success: true, data: { status: "stopped" } });
    }
  }
});

export default router;
