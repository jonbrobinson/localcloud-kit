import express from "express";
import { execAsync, internalEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

// List IAM roles
router.get("/iam/roles", async (req, res) => {
  try {
    const { pathPrefix = "" } = req.query;
    const cmd = pathPrefix
      ? `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-roles --path-prefix "${pathPrefix}" --output json`
      : `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-roles --output json`;

    const { stdout, stderr } = await execAsync(cmd, { env: awsEnv() });
    if (stderr) addLog("warn", `IAM list-roles warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    res.json({ success: true, data: data.Roles || [] });
  } catch (error) {
    addLog("error", `Failed to list IAM roles: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list IAM roles", message: error.message });
  }
});

// Get a single IAM role
router.get("/iam/roles/:roleName", async (req, res) => {
  try {
    const { roleName } = req.params;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam get-role --role-name "${roleName}" --output json`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM get-role warning: ${stderr}`, "automation");
    const data = JSON.parse(stdout);
    res.json({ success: true, data: data.Role });
  } catch (error) {
    addLog("error", `Failed to get IAM role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get IAM role", message: error.message });
  }
});

// Create IAM role
router.post("/iam/roles", async (req, res) => {
  try {
    const { roleName, trustPolicy, description, path = "/" } = req.body;

    if (!roleName || !trustPolicy) {
      return res.status(400).json({ success: false, error: "roleName and trustPolicy are required" });
    }

    // Validate trustPolicy is valid JSON
    let trustPolicyStr;
    try {
      trustPolicyStr = typeof trustPolicy === "string" ? trustPolicy : JSON.stringify(trustPolicy);
      JSON.parse(trustPolicyStr); // validate
    } catch {
      return res.status(400).json({ success: false, error: "trustPolicy must be valid JSON" });
    }

    let cmd = `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam create-role --role-name "${roleName}" --assume-role-policy-document '${trustPolicyStr.replace(/'/g, "'\"'\"'")}'`;
    if (description) cmd += ` --description "${description}"`;
    if (path && path !== "/") cmd += ` --path "${path}"`;

    const { stdout, stderr } = await execAsync(cmd, { env: awsEnv() });
    if (stderr) addLog("warn", `IAM create-role warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    addLog("success", `IAM role ${roleName} created`, "automation");
    res.json({ success: true, data: data.Role });
  } catch (error) {
    addLog("error", `Failed to create IAM role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to create IAM role", message: error.message });
  }
});

// Attach managed policy to role
router.post("/iam/roles/:roleName/policies", async (req, res) => {
  try {
    const { roleName } = req.params;
    const { policyArn } = req.body;

    if (!policyArn) {
      return res.status(400).json({ success: false, error: "policyArn is required" });
    }

    const { stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam attach-role-policy --role-name "${roleName}" --policy-arn "${policyArn}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM attach-role-policy warning: ${stderr}`, "automation");

    addLog("success", `Policy ${policyArn} attached to role ${roleName}`, "automation");
    res.json({ success: true, data: { roleName, policyArn, message: "Policy attached successfully" } });
  } catch (error) {
    addLog("error", `Failed to attach policy to role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to attach policy", message: error.message });
  }
});

// List policies attached to a role
router.get("/iam/roles/:roleName/policies", async (req, res) => {
  try {
    const { roleName } = req.params;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-attached-role-policies --role-name "${roleName}" --output json`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM list-attached-role-policies warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    res.json({ success: true, data: data.AttachedPolicies || [] });
  } catch (error) {
    addLog("error", `Failed to list role policies: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list role policies", message: error.message });
  }
});

// Detach managed policy from role
router.delete("/iam/roles/:roleName/policies/:policyName", async (req, res) => {
  try {
    const { roleName, policyName } = req.params;
    const { policyArn } = req.query;

    if (!policyArn) {
      return res.status(400).json({ success: false, error: "policyArn query parameter is required" });
    }

    const { stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam detach-role-policy --role-name "${roleName}" --policy-arn "${policyArn}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM detach-role-policy warning: ${stderr}`, "automation");

    addLog("success", `Policy ${policyArn} detached from role ${roleName}`, "automation");
    res.json({ success: true, data: { roleName, policyArn, message: "Policy detached successfully" } });
  } catch (error) {
    addLog("error", `Failed to detach policy from role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to detach policy", message: error.message });
  }
});

// Delete IAM role (detaches policies first)
router.delete("/iam/roles/:roleName", async (req, res) => {
  try {
    const { roleName } = req.params;

    // Detach all managed policies first
    try {
      const { stdout } = await execAsync(
        `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-attached-role-policies --role-name "${roleName}" --output json`,
        { env: awsEnv() }
      );
      const policies = JSON.parse(stdout).AttachedPolicies || [];
      for (const policy of policies) {
        await execAsync(
          `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam detach-role-policy --role-name "${roleName}" --policy-arn "${policy.PolicyArn}"`,
          { env: awsEnv() }
        );
      }
    } catch {
      // Ignore errors during cleanup
    }

    const { stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam delete-role --role-name "${roleName}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM delete-role warning: ${stderr}`, "automation");

    addLog("success", `IAM role ${roleName} deleted`, "automation");
    res.json({ success: true, data: { roleName, message: `IAM role ${roleName} deleted successfully` } });
  } catch (error) {
    addLog("error", `Failed to delete IAM role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to delete IAM role", message: error.message });
  }
});

// List IAM users
router.get("/iam/users", async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-users --output json`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM list-users warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    res.json({ success: true, data: data.Users || [] });
  } catch (error) {
    addLog("error", `Failed to list IAM users: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list IAM users", message: error.message });
  }
});

// List managed policies
router.get("/iam/policies", async (req, res) => {
  try {
    const { scope = "Local" } = req.query;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} iam list-policies --scope ${scope} --output json`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `IAM list-policies warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    res.json({ success: true, data: data.Policies || [] });
  } catch (error) {
    addLog("error", `Failed to list IAM policies: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to list IAM policies", message: error.message });
  }
});

// ── STS Session Credentials ──────────────────────────────────────────────────

// Get temporary session credentials (sts:GetSessionToken)
router.post("/iam/sessions/token", async (req, res) => {
  try {
    const { durationSeconds = 3600, serialNumber, tokenCode } = req.body;

    let cmd = `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} sts get-session-token --duration-seconds ${durationSeconds} --output json`;
    if (serialNumber) cmd += ` --serial-number "${serialNumber}"`;
    if (tokenCode) cmd += ` --token-code "${tokenCode}"`;

    const { stdout, stderr } = await execAsync(cmd, { env: awsEnv() });
    if (stderr) addLog("warn", `STS get-session-token warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    addLog("success", "STS session token generated", "automation");
    res.json({ success: true, data: data.Credentials });
  } catch (error) {
    addLog("error", `Failed to get session token: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get session token", message: error.message });
  }
});

// Assume a role and get temporary credentials (sts:AssumeRole)
router.post("/iam/sessions/assume-role", async (req, res) => {
  try {
    const { roleArn, sessionName, durationSeconds = 3600, externalId, policy } = req.body;

    if (!roleArn || !sessionName) {
      return res.status(400).json({ success: false, error: "roleArn and sessionName are required" });
    }

    let cmd = `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} sts assume-role --role-arn "${roleArn}" --role-session-name "${sessionName}" --duration-seconds ${durationSeconds} --output json`;
    if (externalId) cmd += ` --external-id "${externalId}"`;
    if (policy) {
      const policyStr = typeof policy === "string" ? policy : JSON.stringify(policy);
      cmd += ` --policy '${policyStr.replace(/'/g, "'\"'\"'")}'`;
    }

    const { stdout, stderr } = await execAsync(cmd, { env: awsEnv() });
    if (stderr) addLog("warn", `STS assume-role warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    addLog("success", `STS assumed role ${roleArn} as session "${sessionName}"`, "automation");
    res.json({ success: true, data: { credentials: data.Credentials, assumedRoleUser: data.AssumedRoleUser } });
  } catch (error) {
    addLog("error", `Failed to assume role: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to assume role", message: error.message });
  }
});

// Get caller identity (sts:GetCallerIdentity)
router.get("/iam/sessions/identity", async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} sts get-caller-identity --output json`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `STS get-caller-identity warning: ${stderr}`, "automation");

    const data = JSON.parse(stdout);
    res.json({ success: true, data });
  } catch (error) {
    addLog("error", `Failed to get caller identity: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get caller identity", message: error.message });
  }
});

export default router;
