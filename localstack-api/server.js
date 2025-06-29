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
  endpoint: "http://localhost:4566",
  health: "unknown",
  uptime: null,
};

let projectConfig = {
  projectName: "localstack-template",
  environment: "dev",
  awsRegion: "us-east-1",
  awsEndpoint: "http://localhost:4566",
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
    const response = await axios.get(
      `${localstackStatus.endpoint}/_localstack/health`,
      {
        timeout: 5000,
      }
    );

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

async function startLocalStack() {
  try {
    addLog("info", "Starting LocalStack...", "localstack");

    // Change to the parent directory where docker-compose.yml is located
    const parentDir = path.join(__dirname, "..");

    const { stdout, stderr } = await execAsync("docker-compose up -d", {
      cwd: parentDir,
    });

    if (stderr) {
      addLog("warn", `LocalStack start warning: ${stderr}`, "localstack");
    }

    addLog("success", "LocalStack started successfully", "localstack");

    // Wait a bit and check status
    setTimeout(checkLocalStackStatus, 5000);

    return { success: true, message: "LocalStack started successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to start LocalStack: ${error.message}`,
      "localstack"
    );
    return { success: false, error: error.message };
  }
}

async function stopLocalStack() {
  try {
    addLog("info", "Stopping LocalStack...", "localstack");

    const parentDir = path.join(__dirname, "..");

    const { stdout, stderr } = await execAsync("docker-compose down", {
      cwd: parentDir,
    });

    if (stderr) {
      addLog("warn", `LocalStack stop warning: ${stderr}`, "localstack");
    }

    localstackStatus.running = false;
    localstackStatus.health = "unknown";

    addLog("success", "LocalStack stopped successfully", "localstack");

    return { success: true, message: "LocalStack stopped successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to stop LocalStack: ${error.message}`,
      "localstack"
    );
    return { success: false, error: error.message };
  }
}

async function restartLocalStack() {
  try {
    addLog("info", "Restarting LocalStack...", "localstack");

    await stopLocalStack();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await startLocalStack();

    return { success: true, message: "LocalStack restarted successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to restart LocalStack: ${error.message}`,
      "localstack"
    );
    return { success: false, error: error.message };
  }
}

// Resource Management Functions
async function createResources(request) {
  try {
    const { projectName, environment, approach, resources, template } = request;

    addLog(
      "info",
      `Creating resources for ${projectName}-${environment} using ${approach}`,
      "automation"
    );

    const parentDir = path.join(__dirname, "..");
    let command;

    switch (approach) {
      case "shell":
        command = `cd scripts/shell && ./create_resources.sh ${projectName} ${environment}`;
        break;
      default:
        throw new Error(`Unsupported automation approach: ${approach}`);
    }

    // Add resource flags for shell scripts
    if (approach === "shell") {
      const resourceFlags = [];
      if (resources.s3) resourceFlags.push("--s3");
      if (resources.dynamodb) resourceFlags.push("--dynamodb");
      if (resources.lambda) resourceFlags.push("--lambda");
      if (resources.apigateway) resourceFlags.push("--apigateway");

      if (resourceFlags.length > 0) {
        command += ` ${resourceFlags.join(" ")}`;
      }
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: parentDir,
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: projectConfig.awsEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Resource creation warning: ${stderr}`, "automation");
    }

    addLog(
      "success",
      `Resources created successfully for ${projectName}-${environment}`,
      "automation"
    );

    return { success: true, message: "Resources created successfully" };
  } catch (error) {
    addLog(
      "error",
      `Failed to create resources: ${error.message}`,
      "automation"
    );
    return { success: false, error: error.message };
  }
}

async function destroyResources(request) {
  try {
    const { projectName, environment, approach, resources } = request;

    addLog(
      "info",
      `Destroying resources for ${projectName}-${environment} using ${approach}`,
      "automation"
    );

    const parentDir = path.join(__dirname, "..");
    let command;

    switch (approach) {
      case "shell":
        command = `cd scripts/shell && ./destroy_resources.sh ${projectName} ${environment}`;
        break;
      default:
        throw new Error(`Unsupported automation approach: ${approach}`);
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: parentDir,
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: projectConfig.awsEndpoint,
        AWS_DEFAULT_REGION: projectConfig.awsRegion,
      },
    });

    if (stderr) {
      addLog("warn", `Resource destruction warning: ${stderr}`, "automation");
    }

    addLog(
      "success",
      `Resources destroyed successfully for ${projectName}-${environment}`,
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

async function listResources(projectName, environment, approach) {
  try {
    const parentDir = path.join(__dirname, "..");
    let command;

    switch (approach) {
      case "shell":
        command = `cd scripts/shell && ./list_resources.sh ${projectName} ${environment}`;
        break;
      default:
        throw new Error(`Unsupported automation approach: ${approach}`);
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: parentDir,
      env: {
        ...process.env,
        AWS_ENDPOINT_URL: projectConfig.awsEndpoint,
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

// API Routes

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "LocalStack Manager API",
    vendor: "CloudStack Solutions",
    version: "1.0.0",
  });
});

// LocalStack Management
app.get("/localstack/status", (req, res) => {
  res.json({ success: true, data: localstackStatus });
});

app.post("/localstack/start", async (req, res) => {
  const result = await startLocalStack();
  res.json(result);
});

app.post("/localstack/stop", async (req, res) => {
  const result = await stopLocalStack();
  res.json(result);
});

app.post("/localstack/restart", async (req, res) => {
  const result = await restartLocalStack();
  res.json(result);
});

app.get("/localstack/logs", (req, res) => {
  res.json({ success: true, data: logs });
});

// Resource Management
app.get("/resources/list", async (req, res) => {
  const { projectName, environment, approach } = req.query;
  const resources = await listResources(projectName, environment, approach);
  res.json({ success: true, data: resources });
});

app.post("/resources/create", async (req, res) => {
  const result = await createResources(req.body);
  res.json(result);
});

app.post("/resources/destroy", async (req, res) => {
  const result = await destroyResources(req.body);
  res.json(result);
});

app.get("/resources/status", async (req, res) => {
  const { projectName, environment } = req.query;
  const resources = await listResources(projectName, environment, "shell");
  res.json({ success: true, data: resources });
});

// Configuration Management
app.get("/config/project", (req, res) => {
  res.json({ success: true, data: projectConfig });
});

app.put("/config/project", (req, res) => {
  projectConfig = { ...projectConfig, ...req.body };
  addLog("info", "Project configuration updated", "gui");
  res.json({ success: true, message: "Configuration updated successfully" });
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
  addLog(
    "info",
    `LocalStack Manager API server running on port ${PORT}`,
    "api"
  );
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 LocalStack Manager                    ║
║                                                              ║
║  📊 Dashboard: http://localhost:3030                        ║
║  🔧 API Server: http://localhost:${PORT}                    ║
║                                                              ║
║  💼 Powered by CloudStack Solutions                         ║
║  🏢 Enterprise AWS Development Tools                        ║
║  📦 LocalStack Manager v1.0.0                               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
