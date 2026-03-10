import express from "express";
import axios from "axios";
import { internalEndpoint, userEndpoint } from "../lib/aws.js";
import { state, addLog } from "../lib/context.js";

const router = express.Router();

export async function checkLocalStackStatus() {
  try {
    addLog("info", `Checking LocalStack health at ${internalEndpoint}`, "localstack");
    const response = await axios.get(`${internalEndpoint}/_localstack/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      state.localstackStatus.running = true;
      state.localstackStatus.health = "healthy";
      addLog("info", "LocalStack is running and healthy", "localstack");
    } else {
      state.localstackStatus.running = false;
      state.localstackStatus.health = "unhealthy";
      addLog("warn", "LocalStack is running but unhealthy", "localstack");
    }
  } catch (error) {
    state.localstackStatus.running = false;
    state.localstackStatus.health = "unknown";
    addLog("error", `LocalStack health check failed: ${error.message}`, "localstack");
  }
}

router.get("/localstack/status", (req, res) => {
  res.json({
    success: true,
    data: { ...state.localstackStatus, endpoint: userEndpoint },
  });
});

router.get("/localstack/logs", (req, res) => {
  res.json({ success: true, data: state.logs });
});

export default router;
