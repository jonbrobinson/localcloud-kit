import express from "express";
import axios from "axios";
import path from "path";
import { execAsync, userEndpoint, awsRegion } from "../lib/aws.js";
import { state, addLog } from "../lib/context.js";
import { listResources } from "../lib/resources.js";
import db from "../db.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "LocalCloud Kit API",
    vendor: "CloudStack Solutions",
    version: "0.5.3",
  });
});

router.get("/dashboard", async (req, res) => {
  try {
    const projectConfigRow = db
      .prepare(
        `SELECT p.name as projectName
         FROM user_profile u
         LEFT JOIN projects p ON u.active_project_id = p.id
         WHERE u.id = 1`
      )
      .get();
    const projectConfig = {
      projectName: projectConfigRow?.projectName || "default",
      awsEndpoint: userEndpoint,
      awsRegion,
    };

    const localstackStatusForDashboard = {
      ...state.localstackStatus,
      endpoint: userEndpoint,
    };

    const MAILPIT_URL = process.env.MAILPIT_INTERNAL_URL || "http://mailpit:8025";

    const [mailpitResult, resources, cacheResult] = await Promise.all([
      axios
        .get(`${MAILPIT_URL}/api/v1/info`, { timeout: 3000 })
        .then((r) => ({
          total: r.data.Messages ?? 0,
          unread: r.data.Unread ?? 0,
          status: "healthy",
        }))
        .catch(() => ({ total: 0, unread: 0, status: "unavailable" })),
      listResources(projectConfig.projectName),
      execAsync(`/bin/sh ${path.join("/app/scripts/shell", "list_cache.sh")}`)
        .then(({ stdout }) => JSON.parse(stdout))
        .catch(() => ({ status: "unknown", info: null })),
    ]);

    const redisStatus = cacheResult.status === "running" ? "running" : "stopped";
    const resourcesWithExtras = [...resources];
    resourcesWithExtras.push({
      id: "cache-redis",
      name: "Redis Cache",
      type: "cache",
      status: redisStatus === "running" ? "active" : "error",
      environment: "local",
      project: projectConfig.projectName,
      createdAt: new Date().toISOString(),
      details: { info: cacheResult.info, status: cacheResult.status },
    });
    resourcesWithExtras.push({
      id: "mailpit-inbox",
      name: "Inbox",
      type: "mailpit",
      status: mailpitResult.status === "healthy" ? "active" : "error",
      environment: "local",
      project: projectConfig.projectName,
      createdAt: new Date().toISOString(),
      details: {
        total: mailpitResult.total,
        unread: mailpitResult.unread,
        status: mailpitResult.status,
      },
    });

    res.json({
      success: true,
      data: {
        localstackStatus: localstackStatusForDashboard,
        projectConfig,
        mailpit: mailpitResult,
        resources: resourcesWithExtras,
        redis: { status: redisStatus, info: cacheResult.info },
      },
    });
  } catch (err) {
    addLog("error", `Dashboard aggregation failed: ${err.message}`, "api");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to load dashboard data",
    });
  }
});

export default router;
