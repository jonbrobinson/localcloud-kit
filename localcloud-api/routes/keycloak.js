import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";

const router = express.Router();

router.get("/keycloak/status", async (req, res) => {
  try {
    const response = await axios.get("http://keycloak:8080/health/ready", { timeout: 5000 });
    const healthy = response.data?.status === "UP";
    res.json({ success: true, data: { status: healthy ? "running" : "stopped" } });
  } catch {
    try {
      const reachable = await checkTcpPort("keycloak", 8080);
      res.json({ success: true, data: { status: reachable ? "running" : "stopped" } });
    } catch {
      res.json({ success: true, data: { status: "stopped" } });
    }
  }
});

export default router;
