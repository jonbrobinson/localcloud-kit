import express from "express";
import { execAsync, internalEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

// List Lambda functions, optionally filtered by project
router.get("/lambda/functions", async (req, res) => {
  try {
    const { projectName } = req.query;
    const args = projectName ? ` "${projectName}"` : "";
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/list_lambda_functions.sh${args}`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `Lambda list warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to list Lambda functions: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list Lambda functions", message: error.message });
  }
});

// Get a specific Lambda function
router.get("/lambda/functions/:functionName", async (req, res) => {
  try {
    const { functionName } = req.params;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} lambda get-function --function-name "${functionName}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `Lambda get warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to get Lambda function: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get Lambda function", message: error.message });
  }
});

// Delete a Lambda function
router.delete("/lambda/functions/:functionName", async (req, res) => {
  try {
    const { functionName } = req.params;
    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} lambda delete-function --function-name "${functionName}"`,
      { env: awsEnv() }
    );
    addLog("success", `Lambda function ${functionName} deleted`, "automation");
    res.json({ success: true, data: { functionName, message: "Function deleted" } });
  } catch (error) {
    addLog("error", `Failed to delete Lambda function: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to delete Lambda function", message: error.message });
  }
});

// Invoke a Lambda function
router.post("/lambda/functions/:functionName/invoke", async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body.payload ? JSON.stringify(req.body.payload) : "{}";
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} lambda invoke --function-name "${functionName}" --payload '${payload}' /dev/stdout`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `Lambda invoke warning: ${stderr}`, "automation");
    addLog("success", `Lambda function ${functionName} invoked`, "automation");
    res.json({ success: true, data: { functionName, result: stdout.trim() } });
  } catch (error) {
    addLog("error", `Failed to invoke Lambda function: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to invoke Lambda function", message: error.message });
  }
});

export default router;
