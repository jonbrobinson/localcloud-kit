import express from "express";
import { execAsync, internalEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

router.get("/secrets", async (req, res) => {
  try {
    const { maxResults = "100", nextToken = "" } = req.query;
    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/list_secrets.sh ${maxResults} ${nextToken}`,
      { env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `Secrets list warning: ${stderr}`, "automation");
    }

    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to list secrets: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list secrets", message: error.message });
  }
});

router.post("/secrets", async (req, res) => {
  try {
    const { secretName, secretValue, description, tags, kmsKeyId } = req.body;

    if (!secretName || !secretValue) {
      return res.status(400).json({ success: false, error: "Secret name and value are required" });
    }

    let command = `/bin/sh /app/scripts/shell/create_secret.sh "${secretName}" "${secretValue}"`;
    command += description ? ` "${description}"` : ` ""`;
    command += tags && Object.keys(tags).length > 0
      ? ` "${Object.entries(tags).map(([k, v]) => `Key=${k},Value=${v}`).join(" ")}"`
      : ` ""`;
    command += kmsKeyId ? ` "${kmsKeyId}"` : ` ""`;

    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `Secret creation warning: ${stderr}`, "automation");
    }
    addLog("success", `Secret ${secretName} created successfully`, "automation");

    res.json({ success: true, data: { secretName, message: stdout.trim() } });
  } catch (error) {
    addLog("error", `Failed to create secret: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to create secret", message: error.message });
  }
});

router.get("/secrets/:secretName", async (req, res) => {
  try {
    const { secretName } = req.params;
    const { versionId = "", versionStage = "AWSCURRENT", includeValue = "false" } = req.query;

    if (!secretName) {
      return res.status(400).json({ success: false, error: "Secret name is required" });
    }

    let command = `/bin/sh /app/scripts/shell/get_secret.sh "${secretName}"`;
    command += versionId ? ` "${versionId}"` : ` ""`;
    command += ` "${versionStage}"`;

    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `Get secret warning: ${stderr}`, "automation");
    }

    const secretData = JSON.parse(stdout);
    if (includeValue !== "true" && secretData.SecretString) {
      secretData.SecretString = "***MASKED***";
    }

    res.json({ success: true, data: secretData });
  } catch (error) {
    addLog("error", `Failed to get secret: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get secret", message: error.message });
  }
});

router.put("/secrets/:secretName", async (req, res) => {
  try {
    const { secretName } = req.params;
    const { secretValue, description, tags, kmsKeyId } = req.body;

    if (!secretName) {
      return res.status(400).json({ success: false, error: "Secret name is required" });
    }
    if (!secretValue) {
      return res.status(400).json({ success: false, error: "Secret value is required" });
    }

    let command = `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} secretsmanager update-secret --secret-id "${secretName}" --secret-string "${secretValue}"`;
    if (description) command += ` --description "${description}"`;
    if (kmsKeyId) command += ` --kms-key-id "${kmsKeyId}"`;

    const { stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `Update secret warning: ${stderr}`, "automation");
    }

    if (tags && Object.keys(tags).length > 0) {
      const tagString = Object.entries(tags).map(([k, v]) => `Key=${k},Value=${v}`).join(" ");
      await execAsync(
        `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} secretsmanager tag-resource --secret-id "${secretName}" --tags ${tagString}`,
        { env: awsEnv() }
      );
    }

    addLog("success", `Secret ${secretName} updated successfully`, "automation");
    res.json({ success: true, data: { secretName, message: "Secret updated successfully" } });
  } catch (error) {
    addLog("error", `Failed to update secret: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to update secret", message: error.message });
  }
});

router.delete("/secrets/:secretName", async (req, res) => {
  try {
    const { secretName } = req.params;
    const { forceDelete = "false" } = req.query;

    if (!secretName) {
      return res.status(400).json({ success: false, error: "Secret name is required" });
    }

    const { stdout, stderr } = await execAsync(
      `/bin/sh /app/scripts/shell/delete_secret.sh "${secretName}" ${forceDelete}`,
      { env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `Delete secret warning: ${stderr}`, "automation");
    }
    addLog("success", `Secret ${secretName} deleted successfully`, "automation");

    res.json({ success: true, data: { secretName, message: stdout.trim() } });
  } catch (error) {
    addLog("error", `Failed to delete secret: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to delete secret", message: error.message });
  }
});

export default router;
