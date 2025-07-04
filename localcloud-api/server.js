const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { promisify } = require("util");
const axios = require("axios");
const winston = require("winston");
const cron = require("node-cron");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const execAsync = promisify(exec);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3030",
    methods: ["GET", "POST"],
  },
});

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// In-memory storage for logs and status
let logs = [];
let localstackStatus = {
  running: false,
  endpoint: process.env.AWS_ENDPOINT_URL || "http://localhost:4566",
  health: "unknown",
  uptime: null,
};

// Internal endpoint for Docker networking (used by backend)
const internalEndpoint = "http://localstack:4566";
// User-friendly endpoint for GUI display
const userEndpoint = "http://localhost:4566";

// Default project configuration (hardcoded for local development)
let projectConfig = {
  projectName: "localstack-dev",
  awsEndpoint: "http://localstack:4566",
  awsRegion: "us-east-1",
};

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to add log entry
function addLog(level, message, source = "api") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    source,
  };
  logs.push(logEntry);

  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }

  // Emit to connected clients
  io.emit("log", logEntry);

  logger.log(level, message, { source });
}

// LocalStack Management Functions
async function checkLocalStackStatus() {
  try {
    const response = await axios.get(`${internalEndpoint}/_localstack/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      localstackStatus.running = true;
      localstackStatus.health = "healthy";
      addLog("info", "LocalStack is running and healthy", "localstack");
    } else {
      localstackStatus.running = false;
      localstackStatus.health = "unhealthy";
      addLog("warn", "LocalStack is running but unhealthy", "localstack");
    }
  } catch (error) {
    localstackStatus.running = false;
    localstackStatus.health = "unknown";
    addLog(
      "error",
      `LocalStack health check failed: ${error.message}`,
      "localstack"
    );
  }
}

// Resource Management Functions
async function createResources(request) {
  try {
    const { projectName, resources, template } = request;

    addLog("info", `Creating resources for ${projectName}`, "automation");

    // Create resources individually for better control
    const createdResources = [];
    const errors = [];

    // Create S3 bucket if requested
    if (resources.s3) {
      try {
        const result = await createSingleResource(projectName, "s3");
        createdResources.push(result);
        addLog("success", `S3 bucket created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`S3: ${error.message}`);
        addLog(
          "error",
          `Failed to create S3 bucket: ${error.message}`,
          "automation"
        );
      }
    }

    // Create DynamoDB table if requested
    if (resources.dynamodb) {
      try {
        const result = await createSingleResource(projectName, "dynamodb");
        createdResources.push(result);
        addLog(
          "success",
          `DynamoDB table created: ${result.name}`,
          "automation"
        );
      } catch (error) {
        errors.push(`DynamoDB: ${error.message}`);
        addLog(
          "error",
          `Failed to create DynamoDB table: ${error.message}`,
          "automation"
        );
      }
    }

    // Create Lambda function if requested
    if (resources.lambda) {
      try {
        const result = await createSingleResource(projectName, "lambda");
        createdResources.push(result);
        addLog(
          "success",
          `Lambda function created: ${result.name}`,
          "automation"
        );
      } catch (error) {
        errors.push(`Lambda: ${error.message}`);
        addLog(
          "error",
          `Failed to create Lambda function: ${error.message}`,
          "automation"
        );
      }
    }

    // Create API Gateway if requested
    if (resources.apigateway) {
      try {
        const result = await createSingleResource(projectName, "apigateway");
        createdResources.push(result);
        addLog("success", `API Gateway created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`API Gateway: ${error.message}`);
        addLog(
          "error",
          `Failed to create API Gateway: ${error.message}`,
          "automation"
        );
      }
    }

    if (errors.length > 0) {
      addLog(
        "warn",
        `Some resources failed to create: ${errors.join(", ")}`,
        "automation"
      );
      return {
        success: createdResources.length > 0,
        message: `Created ${
          createdResources.length
        } resources successfully. Errors: ${errors.join(", ")}`,
        createdResources,
        errors,
      };
    }

    addLog(
      "success",
      `All ${createdResources.length} resources created successfully for ${projectName}`,
      "automation"
    );
    return {
      success: true,
      message: `All ${createdResources.length} resources created successfully`,
      createdResources,
    };
  } catch (error) {
    addLog(
      "error",
      `Failed to create resources: ${error.message}`,
      "automation"
    );
    return { success: false, error: error.message };
  }
}

async function createSingleResource(projectName, resourceType, config = {}) {
  try {
    let command = `./create_single_resource.sh ${projectName} ${resourceType}`;

    // For DynamoDB with configuration, pass the config as JSON
    if (resourceType === "dynamodb" && config.dynamodbConfig) {
      const configJson = JSON.stringify(config.dynamodbConfig);
      command += ` --config '${configJson}'`;
    }

    // For S3 with configuration, pass the config as JSON
    if (resourceType === "s3" && config.s3Config) {
      const configJson = JSON.stringify(config.s3Config);
      command += ` --config '${configJson}'`;
    }

    // Add logging for debugging
    console.log("[DEBUG] Running command:", command);

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    // Log stdout and stderr
    console.log("[DEBUG] Script stdout:", stdout);
    console.log("[DEBUG] Script stderr:", stderr);

    if (stderr) {
      addLog(
        "warn",
        `Single resource creation warning: ${stderr}`,
        "automation"
      );
    }

    // Parse the output to get resource details
    try {
      const resourceInfo = JSON.parse(stdout);
      return resourceInfo;
    } catch (parseError) {
      // If output is not JSON, create a basic resource info object
      return {
        id: `${resourceType}-${projectName}-${resourceType}`,
        name: `${projectName}-${resourceType}`,
        type: resourceType,
        status: "active",
        project: projectName,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    throw new Error(`Failed to create ${resourceType}: ${error.message}`);
  }
}

async function destroyResources(request) {
  try {
    const { projectName, resourceIds } = request;

    addLog(
      "info",
      `Destroying specific resources for ${projectName}: ${
        resourceIds ? resourceIds.join(", ") : "all resources"
      }`,
      "automation"
    );

    let command = `./destroy_resources.sh ${projectName} local`;

    // Add specific resource IDs if provided
    if (resourceIds && resourceIds.length > 0) {
      command += ` ${resourceIds.join(" ")}`;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Resource destruction warning: ${stderr}`, "automation");
    }

    addLog(
      "success",
      `Resources destroyed successfully for ${projectName}`,
      "automation"
    );

    return { success: true, message: "Resources destroyed successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to destroy resources: ${error.message}`,
      "automation"
    );
    return { success: false, error: error.message };
  }
}

async function destroySingleResource(projectName, resourceType, resourceName) {
  try {
    let command = `./destroy_single_resource.sh ${projectName} ${resourceType} ${resourceName}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Resource destruction warning: ${stderr}`, "automation");
    }

    addLog(
      "success",
      `Resource destroyed successfully for ${projectName}`,
      "automation"
    );

    return { success: true, message: "Resource destroyed successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to destroy resource: ${error.message}`,
      "automation"
    );
    return { success: false, error: error.message };
  }
}

async function listResources(projectName) {
  try {
    let command = `./list_resources.sh ${projectName} local --all`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Resource listing warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON array
    let resources = [];
    try {
      resources = JSON.parse(stdout);
      if (!Array.isArray(resources)) {
        addLog(
          "error",
          "Resource listing output is not a JSON array",
          "automation"
        );
        resources = [];
      }
    } catch (err) {
      addLog(
        "error",
        `Failed to parse resource listing JSON: ${err.message}`,
        "automation"
      );
      resources = [];
    }

    return resources;
  } catch (error) {
    addLog("error", `Failed to list resources: ${error.message}`, "automation");
    return [];
  }
}

async function listAllBuckets(projectName) {
  try {
    let command = `./list_resources.sh ${projectName} local --all`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Bucket listing warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON array and filter for S3 buckets only
    let allResources = [];
    try {
      allResources = JSON.parse(stdout);
      if (!Array.isArray(allResources)) {
        addLog(
          "error",
          "Resource listing output is not a JSON array",
          "automation"
        );
        return [];
      }
    } catch (err) {
      addLog(
        "error",
        `Failed to parse resource listing JSON: ${err.message}`,
        "automation"
      );
      return [];
    }

    // Filter for S3 buckets only and map to AWS-style property names
    const buckets = allResources
      .filter((resource) => resource.type === "s3")
      .map((bucket) => ({
        Name: bucket.name,
        CreationDate: bucket.createdAt,
      }));
    return buckets;
  } catch (error) {
    addLog("error", `Failed to list buckets: ${error.message}`, "automation");
    return [];
  }
}

async function listBucketContents(projectName, bucketName) {
  try {
    let command = `./list_bucket_contents.sh ${projectName} dev`;

    if (bucketName) {
      command += ` ${bucketName}`;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Bucket listing warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON
    let contents = [];
    try {
      // Debug: Log the raw output
      addLog("info", `Bucket listing raw output: "${stdout}"`, "automation");

      contents = JSON.parse(stdout);
      if (!Array.isArray(contents)) {
        addLog(
          "error",
          "Bucket listing output is not a JSON array",
          "automation"
        );
        contents = [];
      }
    } catch (err) {
      addLog(
        "error",
        `Failed to parse bucket listing JSON: ${err.message}. Raw output: "${stdout}"`,
        "automation"
      );
      contents = [];
    }

    return contents;
  } catch (error) {
    addLog(
      "error",
      `Failed to list bucket contents: ${error.message}`,
      "automation"
    );
    return [];
  }
}

async function listDynamoDBTables(projectName) {
  try {
    let command = `./list_dynamodb_tables.sh ${projectName} --all`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `DynamoDB table listing warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON array
    let tables = [];
    try {
      tables = JSON.parse(stdout);
      if (!Array.isArray(tables)) {
        addLog(
          "error",
          "DynamoDB table listing output is not a JSON array",
          "automation"
        );
        tables = [];
      }
    } catch (err) {
      addLog(
        "error",
        `Failed to parse DynamoDB table listing JSON: ${err.message}`,
        "automation"
      );
      tables = [];
    }

    return tables;
  } catch (error) {
    addLog(
      "error",
      `Failed to list DynamoDB tables: ${error.message}`,
      "automation"
    );
    return [];
  }
}

async function scanDynamoDBTable(projectName, tableName, limit = 100) {
  try {
    let command = `./scan_dynamodb_table.sh ${projectName} ${tableName} ${limit}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `DynamoDB scan warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON
    let result = { items: [], count: 0, scannedCount: 0 };
    try {
      result = JSON.parse(stdout);
    } catch (err) {
      addLog(
        "error",
        `Failed to parse DynamoDB scan JSON: ${err.message}`,
        "automation"
      );
    }

    return result;
  } catch (error) {
    addLog(
      "error",
      `Failed to scan DynamoDB table: ${error.message}`,
      "automation"
    );
    return { items: [], count: 0, scannedCount: 0 };
  }
}

async function queryDynamoDBTable(
  projectName,
  tableName,
  partitionKey,
  partitionValue,
  sortKey,
  sortValue,
  limit = 100
) {
  try {
    let command = `./query_dynamodb_table.sh ${projectName} ${tableName} "${partitionKey}" "${partitionValue}" "${
      sortKey || ""
    }" "${sortValue || ""}" ${limit}`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `DynamoDB query warning: ${stderr}`, "automation");
    }

    // Parse the output as JSON
    let result = { items: [], count: 0, scannedCount: 0 };
    try {
      result = JSON.parse(stdout);
    } catch (err) {
      addLog(
        "error",
        `Failed to parse DynamoDB query JSON: ${err.message}`,
        "automation"
      );
    }

    return result;
  } catch (error) {
    addLog(
      "error",
      `Failed to query DynamoDB table: ${error.message}`,
      "automation"
    );
    return { items: [], count: 0, scannedCount: 0 };
  }
}

async function getDynamoDBTableSchema(projectName, tableName) {
  try {
    let command = `aws dynamodb describe-table --table-name "${tableName}" --endpoint-url "${internalEndpoint}" --region "${projectConfig.awsRegion}"`;

    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog(
        "warn",
        `DynamoDB describe-table warning: ${stderr}`,
        "automation"
      );
    }

    // Parse the output as JSON
    let result = null;
    try {
      result = JSON.parse(stdout);
    } catch (err) {
      addLog(
        "error",
        `Failed to parse DynamoDB describe-table JSON: ${err.message}`,
        "automation"
      );
      return null;
    }

    return result;
  } catch (error) {
    addLog(
      "error",
      `Failed to get DynamoDB table schema: ${error.message}`,
      "automation"
    );
    return null;
  }
}

// API Routes

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "LocalCloud Kit API",
    vendor: "CloudStack Solutions",
    version: "1.0.0",
  });
});

// LocalStack Management
app.get("/localstack/status", (req, res) => {
  // Return user-friendly endpoint for GUI display
  const userFriendlyStatus = {
    ...localstackStatus,
    endpoint: userEndpoint,
  };
  res.json({ success: true, data: userFriendlyStatus });
});

app.get("/localstack/logs", (req, res) => {
  res.json({ success: true, data: logs });
});

// Resource Management
app.get("/resources/list", async (req, res) => {
  const { projectName } = req.query;
  const resources = await listResources(projectName);
  res.json({ success: true, data: resources });
});

app.post("/resources/create", async (req, res) => {
  const result = await createResources(req.body);
  res.json(result);
});

app.post("/resources/create-single", async (req, res) => {
  try {
    const { projectName, resourceType, ...config } = req.body;

    if (!projectName || !resourceType) {
      return res.status(400).json({
        success: false,
        error: "projectName and resourceType are required",
      });
    }

    const result = await createSingleResource(
      projectName,
      resourceType,
      config
    );
    res.json({
      success: true,
      message: `${resourceType} resource created successfully`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/resources/destroy", async (req, res) => {
  const result = await destroyResources(req.body);
  res.json(result);
});

app.post("/resources/destroy-single", async (req, res) => {
  try {
    const { projectName, resourceType, resourceName } = req.body;

    if (!projectName || !resourceType) {
      return res.status(400).json({
        success: false,
        error: "projectName and resourceType are required",
      });
    }

    const result = await destroySingleResource(
      projectName,
      resourceType,
      resourceName
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/resources/status", async (req, res) => {
  const { projectName } = req.query;
  const resources = await listResources(projectName);
  res.json({ success: true, data: resources });
});

// Configuration Management
app.get("/config/project", (req, res) => {
  // Return user-friendly endpoint for GUI display
  const userFriendlyConfig = {
    ...projectConfig,
    awsEndpoint: userEndpoint,
  };
  res.json({
    success: true,
    data: userFriendlyConfig,
  });
});

app.get("/config/templates", (req, res) => {
  const templates = [
    {
      id: "basic",
      name: "Basic Setup",
      description: "S3 bucket and DynamoDB table for basic storage needs",
      resources: { s3: true, dynamodb: true, lambda: false, apigateway: false },
    },
    {
      id: "serverless",
      name: "Serverless Application",
      description: "Complete serverless stack with Lambda and API Gateway",
      resources: { s3: true, dynamodb: true, lambda: true, apigateway: true },
    },
    {
      id: "storage",
      name: "Storage Only",
      description: "S3 bucket for file storage",
      resources: {
        s3: true,
        dynamodb: false,
        lambda: false,
        apigateway: false,
      },
    },
    {
      id: "database",
      name: "Database Only",
      description: "DynamoDB table for data storage",
      resources: {
        s3: false,
        dynamodb: true,
        lambda: false,
        apigateway: false,
      },
    },
    {
      id: "api",
      name: "API Only",
      description: "API Gateway with Lambda function",
      resources: { s3: false, dynamodb: false, lambda: true, apigateway: true },
    },
  ];
  res.json({ success: true, data: templates });
});

// S3 Bucket Management
app.get("/s3/buckets", async (req, res) => {
  const { projectName } = req.query;
  const buckets = await listAllBuckets(projectName);
  res.json({ success: true, data: buckets });
});

app.get("/s3/bucket/:bucketName/contents", async (req, res) => {
  const { projectName } = req.query;
  const { bucketName } = req.params;
  const contents = await listBucketContents(projectName, bucketName);
  res.json({ success: true, data: contents });
});

app.get("/s3/bucket/:bucketName/object/:objectKey", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { bucketName, objectKey } = req.params;

    if (!projectName || !bucketName || !objectKey) {
      return res.status(400).json({
        success: false,
        error: "projectName, bucketName, and objectKey are required",
      });
    }

    const command = `/usr/bin/sh /app/scripts/shell/download_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}'`;
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    // Debug: Log the raw output
    console.log("[S3 Download] Raw stdout:", JSON.stringify(stdout));
    console.log("[S3 Download] Raw stderr:", JSON.stringify(stderr));
    addLog("info", `[S3 Download] Raw stdout: ${JSON.stringify(stdout)}`);
    addLog("info", `[S3 Download] Raw stderr: ${JSON.stringify(stderr)}`);

    // Parse metadata from stderr (it's output as a comment)
    let metadata = {};
    if (stderr) {
      const metadataMatch = stderr.match(/<!--METADATA:(.*?)-->/);
      if (metadataMatch) {
        try {
          metadata = JSON.parse(metadataMatch[1]);
        } catch (e) {
          addLog(
            "warn",
            `Failed to parse object metadata: ${e.message}`,
            "automation"
          );
        }
      }
    }

    addLog(
      "success",
      `Object downloaded: ${objectKey} from bucket ${bucketName}`,
      "automation"
    );

    res.json({
      success: true,
      data: {
        content: stdout,
        metadata: metadata,
      },
    });
  } catch (error) {
    addLog(
      "error",
      `Failed to download object: ${error.message}`,
      "automation"
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/s3/bucket/:bucketName/object/:objectKey", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { bucketName, objectKey } = req.params;

    if (!projectName || !bucketName || !objectKey) {
      return res.status(400).json({
        success: false,
        error: "projectName, bucketName, and objectKey are required",
      });
    }

    const command = `/usr/bin/sh /app/scripts/shell/delete_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}'`;
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `S3 delete-object warning: ${stderr}`, "automation");
    }

    addLog(
      "success",
      `Object deleted: ${objectKey} from bucket ${bucketName}`,
      "automation"
    );

    res.json({ success: true, message: stdout });
  } catch (error) {
    addLog("error", `Failed to delete object: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

// DynamoDB Table Management
app.get("/dynamodb/tables", async (req, res) => {
  try {
    const { projectName } = req.query;
    const tables = await listDynamoDBTables(projectName);
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/dynamodb/table/:tableName/scan", async (req, res) => {
  try {
    const { projectName, limit = "100" } = req.query;
    const { tableName } = req.params;
    const result = await scanDynamoDBTable(
      projectName,
      tableName,
      parseInt(limit)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/dynamodb/table/:tableName/query", async (req, res) => {
  try {
    const {
      projectName,
      partitionKey,
      partitionValue,
      sortKey,
      sortValue,
      limit = "100",
    } = req.query;
    const { tableName } = req.params;

    const result = await queryDynamoDBTable(
      projectName,
      tableName,
      partitionKey,
      partitionValue,
      sortKey,
      sortValue,
      parseInt(limit)
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/dynamodb/table/:tableName/item", async (req, res) => {
  try {
    const { projectName } = req.body;
    const { tableName } = req.params;
    const { item } = req.body;
    if (!projectName || !tableName || !item) {
      return res.status(400).json({
        success: false,
        error: "projectName, tableName, and item are required",
      });
    }
    // Stringify item for shell script
    const itemJson = JSON.stringify(item).replace(/'/g, "'''");
    const command = `/usr/bin/sh /app/scripts/shell/put_dynamodb_item.sh '${projectName}' '${tableName}' '${itemJson}'`;
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: internalEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });
    if (stderr) {
      addLog("warn", `DynamoDB put-item warning: ${stderr}`, "automation");
    }
    addLog(
      "success",
      `Item added to DynamoDB table ${tableName}`,
      "automation"
    );
    res.json({ success: true });
  } catch (error) {
    addLog(
      "error",
      `Failed to add item to DynamoDB: ${error.message}`,
      "automation"
    );
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/dynamodb/table/:tableName/schema", async (req, res) => {
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  addLog("info", "Client connected", "gui");

  socket.on("disconnect", () => {
    addLog("info", "Client disconnected", "gui");
  });
});

// Scheduled tasks
cron.schedule("*/30 * * * * *", () => {
  if (localstackStatus.running) {
    checkLocalStackStatus();
  }
});

// Initial status check
setTimeout(checkLocalStackStatus, 2000);

const PORT = process.env.PORT || 3031;

server.listen(PORT, () => {
  addLog("info", `LocalCloud Kit API server running on port ${PORT}`, "api");
  console.log(
    `LocalCloud Kit API server running on port ${PORT}`,
    `\nEnvironment: ${process.env.NODE_ENV || "local"}`,
    `\nLocalStack endpoint: ${
      process.env.LOCALSTACK_ENDPOINT || internalEndpoint
    }`
  );

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 LocalCloud Kit                    ║
║  💼 Powered by CloudStack Solutions                         ║
║  📦 LocalCloud Kit v1.0.0                               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
