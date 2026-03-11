import express from "express";
import { execAsync, internalEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

// List SSM parameters
router.get("/ssm/parameters", async (req, res) => {
  try {
    const { pathPrefix = "/", maxResults = "50" } = req.query;
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/list_parameters.sh "${pathPrefix}" "${maxResults}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `SSM list warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to list SSM parameters: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list parameters", message: error.message });
  }
});

// Create / put a parameter
router.post("/ssm/parameters", async (req, res) => {
  try {
    const { name, value, type = "String", description = "" } = req.body;

    if (!name || !value) {
      return res.status(400).json({ success: false, error: "Parameter name and value are required" });
    }

    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/create_parameter.sh "${name}" "${value}" "${type}" "${description}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `SSM create warning: ${stderr}`, "automation");
    addLog("success", `SSM parameter ${name} created`, "automation");
    res.json({ success: true, data: { name, message: stdout.trim() } });
  } catch (error) {
    addLog("error", `Failed to create SSM parameter: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to create parameter", message: error.message });
  }
});

// Get a parameter value (use *name for path-to-regexp v8; name can contain slashes)
router.get("/ssm/parameters/*name", async (req, res) => {
  try {
    const name = Array.isArray(req.params.name) ? req.params.name.join("/") : (req.params.name || "");
    const { withDecryption = "false" } = req.query;
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/get_parameter.sh "${name}" ${withDecryption}`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `SSM get warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    if (withDecryption !== "true" && data?.Parameter?.Value) {
      data.Parameter.Value = "***MASKED***";
    }
    res.json({ success: true, data });
  } catch (error) {
    addLog("error", `Failed to get SSM parameter: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get parameter", message: error.message });
  }
});

// Update a parameter
router.put("/ssm/parameters/*name", async (req, res) => {
  try {
    const name = Array.isArray(req.params.name) ? req.params.name.join("/") : (req.params.name || "");
    const { value, type = "String", description = "" } = req.body;

    if (!value) {
      return res.status(400).json({ success: false, error: "Parameter value is required" });
    }

    const { stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/create_parameter.sh "${name}" "${value}" "${type}" "${description}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `SSM update warning: ${stderr}`, "automation");
    addLog("success", `SSM parameter ${name} updated`, "automation");
    res.json({ success: true, data: { name, message: "Parameter updated successfully" } });
  } catch (error) {
    addLog("error", `Failed to update SSM parameter: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to update parameter", message: error.message });
  }
});

// Delete a parameter
router.delete("/ssm/parameters/*name", async (req, res) => {
  try {
    const name = Array.isArray(req.params.name) ? req.params.name.join("/") : (req.params.name || "");
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/delete_parameter.sh "${name}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `SSM delete warning: ${stderr}`, "automation");
    addLog("success", `SSM parameter ${name} deleted`, "automation");
    res.json({ success: true, data: { name, message: stdout.trim() } });
  } catch (error) {
    addLog("error", `Failed to delete SSM parameter: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to delete parameter", message: error.message });
  }
});

export default router;
