import express from "express";
import { execAsync, internalEndpoint, userEndpoint, awsRegion, awsEnv } from "../lib/aws.js";
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

// Get API resources
router.get("/apigateway/apis/:apiId/resources", async (req, res) => {
  try {
    const { apiId } = req.params;
    const { stdout, stderr } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway get-resources --rest-api-id "${apiId}"`,
      { env: awsEnv() }
    );
    if (stderr) addLog("warn", `API Gateway get-resources warning: ${stderr}`, "automation");
    res.json({ success: true, data: JSON.parse(stdout) });
  } catch (error) {
    addLog("error", `Failed to get API resources: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to get resources", message: error.message });
  }
});

// Create resource, add method, add integration, deploy (simplified)
router.post("/apigateway/apis/:apiId/configure", async (req, res) => {
  try {
    const { apiId } = req.params;
    const { pathPart = "hello", httpMethod = "GET", stageName = "dev" } = req.body;

    const { stdout: resourcesOut } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway get-resources --rest-api-id "${apiId}"`,
      { env: awsEnv() }
    );
    const resources = JSON.parse(resourcesOut);
    const rootId = resources.items?.[0]?.id;
    if (!rootId) {
      return res.status(400).json({ success: false, error: "Could not find root resource" });
    }

    const { stdout: createOut } = await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway create-resource --rest-api-id "${apiId}" --parent-id "${rootId}" --path-part "${pathPart}" --output json`,
      { env: awsEnv() }
    );
    const newResource = JSON.parse(createOut);
    const resourceId = newResource.id;

    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway put-method --rest-api-id "${apiId}" --resource-id "${resourceId}" --http-method "${httpMethod}" --authorization-type NONE`,
      { env: awsEnv() }
    );

    const requestTemplates = JSON.stringify({ "application/json": '{"statusCode": 200}' });
    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway put-integration --rest-api-id "${apiId}" --resource-id "${resourceId}" --http-method "${httpMethod}" --type MOCK --request-templates '${requestTemplates}'`,
      { env: awsEnv() }
    );

    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway put-method-response --rest-api-id "${apiId}" --resource-id "${resourceId}" --http-method "${httpMethod}" --status-code 200`,
      { env: awsEnv() }
    ).catch(() => {});

    const responseTemplates = JSON.stringify({ "application/json": '{"body":"Hello from API Gateway"}' });
    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway put-integration-response --rest-api-id "${apiId}" --resource-id "${resourceId}" --http-method "${httpMethod}" --status-code 200 --response-templates '${responseTemplates}'`,
      { env: awsEnv() }
    ).catch(() => {});

    await execAsync(
      `aws --endpoint-url=${internalEndpoint} --region=${awsRegion} apigateway create-deployment --rest-api-id "${apiId}" --stage-name "${stageName}"`,
      { env: awsEnv() }
    );

    const invokeUrl = `${userEndpoint}/restapis/${apiId}/${stageName}/_user_request_/${pathPart}`;
    addLog("success", `API Gateway configured: ${pathPart} ${httpMethod} deployed to ${stageName}`, "automation");
    res.json({
      success: true,
      data: { pathPart, httpMethod, stageName, resourceId, invokeUrl },
    });
  } catch (error) {
    addLog("error", `Failed to configure API Gateway: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: "Failed to configure", message: error.message });
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
