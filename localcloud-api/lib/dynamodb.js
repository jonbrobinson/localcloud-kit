import { execAsync, internalEndpoint, awsRegion, awsEnv } from "./aws.js";
import { addLog } from "./context.js";

export async function listDynamoDBTables(projectName) {
  try {
    const { stdout, stderr } = await execAsync(
      `./list_dynamodb_tables.sh ${projectName} --all`,
      { cwd: "/app/scripts/shell", env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `DynamoDB table listing warning: ${stderr}`, "automation");
    }

    try {
      const tables = JSON.parse(stdout);
      if (!Array.isArray(tables)) {
        addLog("error", "DynamoDB table listing output is not a JSON array", "automation");
        return [];
      }
      return tables;
    } catch (err) {
      addLog("error", `Failed to parse DynamoDB table listing JSON: ${err.message}`, "automation");
      return [];
    }
  } catch (error) {
    addLog("error", `Failed to list DynamoDB tables: ${error.message}`, "automation");
    return [];
  }
}

export async function scanDynamoDBTable(projectName, tableName, limit = 100) {
  try {
    const { stdout, stderr } = await execAsync(
      `./scan_dynamodb_table.sh ${projectName} ${tableName} ${limit}`,
      { cwd: "/app/scripts/shell", env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `DynamoDB scan warning: ${stderr}`, "automation");
    }

    try {
      return JSON.parse(stdout);
    } catch (err) {
      addLog("error", `Failed to parse DynamoDB scan JSON: ${err.message}`, "automation");
      return { items: [], count: 0, scannedCount: 0 };
    }
  } catch (error) {
    addLog("error", `Failed to scan DynamoDB table: ${error.message}`, "automation");
    return { items: [], count: 0, scannedCount: 0 };
  }
}

export async function queryDynamoDBTable(
  projectName,
  tableName,
  partitionKey,
  partitionValue,
  sortKey,
  sortValue,
  limit = 100,
  indexName = ""
) {
  try {
    const command = `./query_dynamodb_table.sh ${projectName} ${tableName} "${partitionKey}" "${partitionValue}" "${sortKey || ""}" "${sortValue || ""}" ${limit} "${indexName || ""}"`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: awsEnv(),
    });

    if (stderr) {
      addLog("warn", `DynamoDB query warning: ${stderr}`, "automation");
    }

    try {
      return JSON.parse(stdout);
    } catch (err) {
      addLog("error", `Failed to parse DynamoDB query JSON: ${err.message}`, "automation");
      return { items: [], count: 0, scannedCount: 0 };
    }
  } catch (error) {
    addLog("error", `Failed to query DynamoDB table: ${error.message}`, "automation");
    return { items: [], count: 0, scannedCount: 0 };
  }
}

export async function getDynamoDBTableSchema(projectName, tableName) {
  try {
    const { stdout, stderr } = await execAsync(
      `aws dynamodb describe-table --table-name "${tableName}" --endpoint-url "${internalEndpoint}" --region "${awsRegion}"`,
      { env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `DynamoDB describe-table warning: ${stderr}`, "automation");
    }

    try {
      return JSON.parse(stdout);
    } catch (err) {
      addLog("error", `Failed to parse DynamoDB describe-table JSON: ${err.message}`, "automation");
      return null;
    }
  } catch (error) {
    addLog("error", `Failed to get DynamoDB table schema: ${error.message}`, "automation");
    return null;
  }
}
