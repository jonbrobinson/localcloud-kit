import express from "express";
import { execAsync, internalEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

// List REST APIs, optionally filtered by project
router.get("/apigateway/apis", async (req, res) => {
  try {
    const { projectName } = req.query;
    const args = projectName ? ` "${projectName}"` : "";
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/list_apis.sh${args}`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `API Gateway list warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to list API Gateway APIs: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list APIs", message: error.message });
  }
});

// Get a specific REST API
router.get("/apigateway/apis/:apiId", async (req, res) => {
  try {
    const { apiId } = req.params;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway get-rest-api --rest-api-id "${apiId}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `API Gateway get warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to get API Gateway API: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get API", message: error.message });
  }
});

// Delete a REST API
router.delete("/apigateway/apis/:apiId", async (req, res) => {
  try {
    const { apiId } = req.params;
    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway delete-rest-api --rest-api-id "${apiId}"`,
      { env: awsEnv() }
    );
    addLog("success", `API Gateway ${apiId} deleted`, "automation");
    res.json({ success: true, data: { apiId, message: "API deleted" } });
  } catch (error) {
    addLog("error", `Failed to delete API Gateway API: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to delete API", message: error.message });
  }
});

export default router;
