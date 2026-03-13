import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";

const router = express.Router();

router.get("/keycloak/status", async (req, res) => {
  try {
    const response = await axios.get("http://keycloak:9000/health/ready", { timeout: 5000 });
    const kcStatus = response.data?.status;
    if (kcStatus === "UP") {
      res.json({ success: true, data: { status: "running" } });
    } else {
      // Health endpoint reachable but reporting not-UP (e.g. DOWN) — something is wrong
      res.json({ success: true, data: { status: "failed" } });
    }
  } catch {
    // Health endpoint not reachable — check whether the container port is up at all
    try {
      const reachable = await checkTcpPort("keycloak", 8080);
      // Port is open but HTTP not ready yet → Keycloak is still booting
      res.json({ success: true, data: { status: reachable ? "starting" : "stopped" } });
    } catch {
      res.json({ success: true, data: { status: "stopped" } });
    }
  }
});

export default router;
