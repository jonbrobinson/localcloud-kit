import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cron from "node-cron";

import { setIo, addLog } from "./lib/context.js";
import { internalEndpoint } from "./lib/aws.js";
import { listResources } from "./lib/resources.js";
import { getCachedResources, setCachedResources } from "./lib/resourceCache.js";
import db from "./db.js";

import healthRouter from "./routes/health.js";
import localstackRouter, { checkLocalStackStatus } from "./routes/localstack.js";
import resourcesRouter from "./routes/resources.js";
import configRouter from "./routes/config.js";
import profileRouter from "./routes/profile.js";
import projectsRouter from "./routes/projects.js";
import savedConfigsRouter from "./routes/savedConfigs.js";
import s3Router from "./routes/s3.js";
import dynamodbRouter from "./routes/dynamodb.js";
import cacheRouter from "./routes/cache.js";
import mailpitRouter from "./routes/mailpit.js";
import secretsRouter from "./routes/secrets.js";
import postgresRouter from "./routes/postgres.js";
import keycloakRouter from "./routes/keycloak.js";
import lambdaRouter from "./routes/lambda.js";
import apigatewayRouter from "./routes/apigateway.js";
import ssmRouter from "./routes/ssm.js";
import iamRouter from "./routes/iam.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_IO_ORIGIN || "https://app-local.localcloudkit.com:3030",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/ws/socket.io",
});

setIo(io);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "https://app-local.localcloudkit.com:3030",
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use(healthRouter);
app.use(localstackRouter);
app.use(resourcesRouter);
app.use(configRouter);
app.use(profileRouter);
app.use(projectsRouter);
app.use(savedConfigsRouter);
app.use(s3Router);
app.use(dynamodbRouter);
app.use(cacheRouter);
app.use(mailpitRouter);
app.use(secretsRouter);
app.use(postgresRouter);
app.use(keycloakRouter);
app.use(lambdaRouter);
app.use(apigatewayRouter);
app.use(ssmRouter);
app.use(iamRouter);

// Socket.IO connection handling
io.on("connection", (socket) => {
  addLog("info", "Client connected", "gui");
  socket.on("disconnect", () => {
    addLog("info", "Client disconnected", "gui");
  });
});

// Scheduled tasks
cron.schedule("*/30 * * * * *", () => {
  checkLocalStackStatus();
});

// Background resource cache refresh — runs every 30 seconds server-side
// so dashboard requests always hit a warm cache
cron.schedule("*/30 * * * * *", async () => {
  try {
    const profileRow = db
      .prepare(
        `SELECT p.name AS projectName
         FROM user_profile u
         LEFT JOIN projects p ON u.active_project_id = p.id
         WHERE u.id = 1`
      )
      .get();
    const projectName = profileRow?.projectName || "default";
    const resources = await listResources(projectName);
    setCachedResources(projectName, resources);
  } catch (err) {
    addLog("warn", `Resource cache background refresh failed: ${err.message}`, "api");
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
    `\nLocalStack endpoint: ${process.env.LOCALSTACK_ENDPOINT || internalEndpoint}`
  );
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 LocalCloud Kit                    ║
║  💼 Powered by CloudStack Solutions                         ║
║  📦 LocalCloud Kit v1.0.0                               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
