import express from "express";
import axios from "axios";
import { checkTcpPort } from "../lib/tcp.js";

const router = express.Router();

router.get("/postgres/status", async (req, res) => {
  try {
    const reachable = await checkTcpPort("postgres", 5432);
    res.json({
      success: true,
      data: {
        status: reachable ? "running" : "stopped",
        host: "localhost",
        port: 5432,
        user: "localcloud",
        database: "localcloud",
      },
    });
  } catch {
    res.json({ success: true, data: { status: "stopped" } });
  }
});

router.get("/pgadmin/status", async (req, res) => {
  try {
    const response = await axios.get("http://pgadmin:80/misc/ping", { timeout: 3000 });
    res.json({
      success: true,
      data: { status: response.status === 200 ? "running" : "stopped" },
    });
  } catch {
    res.json({ success: true, data: { status: "stopped" } });
  }
});

export default router;
