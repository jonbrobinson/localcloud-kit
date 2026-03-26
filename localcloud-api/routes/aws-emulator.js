import express from "express";
import axios from "axios";
import { internalEndpoint, userEndpoint } from "../lib/aws.js";
import { state, addLog } from "../lib/context.js";

const router = express.Router();

export async function checkEmulatorStatus() {
  try {
    addLog("info", `Checking AWS Emulator health at ${internalEndpoint}`, "aws-emulator");
    const response = await axios.get(`${internalEndpoint}/_localstack/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      state.emulatorStatus.running = true;
      state.emulatorStatus.health = "healthy";
      addLog("info", "AWS Emulator is running and healthy", "aws-emulator");
    } else {
      state.emulatorStatus.running = false;
      state.emulatorStatus.health = "unhealthy";
      addLog("warn", "AWS Emulator is running but unhealthy", "aws-emulator");
    }
  } catch (error) {
    state.emulatorStatus.running = false;
    state.emulatorStatus.health = "unknown";
    addLog("error", `AWS Emulator health check failed: ${error.message}`, "aws-emulator");
  }
}

router.get("/aws-emulator/status", (req, res) => {
  res.json({
    success: true,
    data: { ...state.emulatorStatus, endpoint: userEndpoint },
  });
});

router.get("/aws-emulator/logs", (req, res) => {
  res.json({ success: true, data: state.logs });
});

export default router;
