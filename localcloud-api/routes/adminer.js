import express from "express";
import axios from "axios";

const router = express.Router();

const ADMINER_URL = process.env.ADMINER_INTERNAL_URL || "http://adminer:8080";

router.get("/adminer/status", async (req, res) => {
  const port = process.env.ADMINER_PORT || "8081";
  const appPort = process.env.APP_PORT || "3030";
  const urls = {
    uiUrl: `https://adminer.localcloudkit.com:${appPort}`,
    directUrl: `http://localhost:${port}`,
  };
  try {
    const response = await axios.get(`${ADMINER_URL}/`, { timeout: 3000 });
    res.json({ success: true, data: { status: response.status === 200 ? "running" : "stopped", ...urls } });
  } catch {
    res.json({ success: true, data: { status: "stopped", ...urls } });
  }
});

export default router;
