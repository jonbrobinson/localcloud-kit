import express from "express";
import { execAsync, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";
import {
  listDynamoDBTables,
  scanDynamoDBTable,
  queryDynamoDBTable,
  getDynamoDBTableSchema,
} from "../lib/dynamodb.js";

const router = express.Router();

router.get("/dynamodb/tables", async (req, res) => {
  try {
    const { projectName } = req.query;
    const tables = await listDynamoDBTables(projectName);
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/dynamodb/table/:tableName/scan", async (req, res) => {
  try {
    const { projectName, limit = "100" } = req.query;
    const { tableName } = req.params;
    const result = await scanDynamoDBTable(projectName, tableName, parseInt(limit));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/dynamodb/table/:tableName/query", async (req, res) => {
  try {
    const {
      projectName,
      partitionKey,
      partitionValue,
      sortKey,
      sortValue,
      limit = "100",
      indexName,
    } = req.query;
    const { tableName } = req.params;
    const result = await queryDynamoDBTable(
      projectName,
      tableName,
      partitionKey,
      partitionValue,
      sortKey,
      sortValue,
      parseInt(limit),
      indexName
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/dynamodb/table/:tableName/item", async (req, res) => {
  try {
    const { projectName, item } = req.body;
    const { tableName } = req.params;

    if (!projectName || !tableName || !item) {
      return res.status(400).json({
        success: false,
        error: "projectName, tableName, and item are required",
      });
    }

    const itemJson = JSON.stringify(item).replace(/'/g, "'''");
    const command = `/bin/sh /app/scripts/shell/put_dynamodb_item.sh '${projectName}' '${tableName}' '${itemJson}'`;
    const { stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `DynamoDB put-item warning: ${stderr}`, "automation");
    }
    addLog("success", `Item added to DynamoDB table ${tableName}`, "automation");
    res.json({ success: true });
  } catch (error) {
    addLog("error", `Failed to add item to DynamoDB: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/dynamodb/table/:tableName/item", async (req, res) => {
  try {
    const { projectName, partitionKey, partitionValue, sortKey, sortValue } = req.body;
    const { tableName } = req.params;

    if (!projectName || !tableName || !partitionKey || !partitionValue) {
      return res.status(400).json({
        success: false,
        error: "projectName, tableName, partitionKey, and partitionValue are required",
      });
    }

    let command = `/bin/sh /app/scripts/shell/delete_dynamodb_item.sh '${projectName}' '${tableName}' '${partitionKey}' '${partitionValue}'`;
    if (sortKey && sortValue) {
      command += ` '${sortKey}' '${sortValue}'`;
    }

    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `DynamoDB delete-item warning: ${stderr}`, "automation");
    }
    addLog("success", `Item deleted from DynamoDB table ${tableName}`, "automation");
    res.json({ success: true, message: stdout });
  } catch (error) {
    addLog("error", `Failed to delete item from DynamoDB: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/dynamodb/table/:tableName/schema", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { tableName } = req.params;

    if (!projectName || !tableName) {
      return res.status(400).json({
        success: false,
        error: "projectName and tableName are required",
      });
    }

    const result = await getDynamoDBTableSchema(projectName, tableName);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Table not found or failed to get schema",
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
