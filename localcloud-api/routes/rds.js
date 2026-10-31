import express from "express";
import {
  RDS_ENGINES,
  RDS_INSTANCE_CLASSES,
  RdsValidationError,
  createInstance,
  deleteInstance,
  getInstance,
  instanceAction,
  listDeletedIdentifiers,
  listInstances,
  setPgAdminRegistration,
} from "../lib/rds.js";
import { invalidateResourceCache } from "../lib/resourceCache.js";
import { addLog } from "../lib/context.js";

const router = express.Router();

function sendError(res, error, fallback) {
  const status = error instanceof RdsValidationError ? 400 : /not found/i.test(error.message) ? 404 : 500;
  if (status === 500) addLog("error", `${fallback}: ${error.message}`, "automation");
  res.status(status).json({ success: false, error: status === 500 ? fallback : error.message, message: error.message });
}

// Engines, versions, and instance classes the create form offers
router.get("/rds/options", async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        engines: RDS_ENGINES,
        instanceClasses: RDS_INSTANCE_CLASSES,
        deletedIdentifiers: await listDeletedIdentifiers(),
      },
    });
  } catch (error) {
    sendError(res, error, "Failed to load RDS options");
  }
});

router.get("/rds/instances", async (req, res) => {
  try {
    res.json({ success: true, data: await listInstances(req.query.projectName) });
  } catch (error) {
    sendError(res, error, "Failed to list RDS instances");
  }
});

router.get("/rds/instances/:id", async (req, res) => {
  try {
    res.json({ success: true, data: await getInstance(req.params.id, req.query.projectName) });
  } catch (error) {
    sendError(res, error, "Failed to describe RDS instance");
  }
});

router.post("/rds/instances", async (req, res) => {
  try {
    const { projectName, ...config } = req.body;
    if (!projectName) {
      return res.status(400).json({ success: false, error: "projectName is required" });
    }
    const data = await createInstance(projectName, config);
    invalidateResourceCache(projectName);
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error, "Failed to create RDS instance");
  }
});

// :action is start | stop | reboot (validated in instanceAction)
router.post("/rds/instances/:id/:action", async (req, res) => {
  try {
    await instanceAction(req.params.id, req.params.action);
    if (req.body?.projectName) invalidateResourceCache(req.body.projectName);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, `Failed to ${req.params.action} RDS instance`);
  }
});

router.put("/rds/instances/:id/pgadmin", async (req, res) => {
  try {
    const { enabled, password, projectName } = req.body || {};
    await setPgAdminRegistration(req.params.id, Boolean(enabled), password);
    if (projectName) invalidateResourceCache(projectName);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Failed to update pgAdmin registration");
  }
});

router.delete("/rds/instances/:id", async (req, res) => {
  try {
    await deleteInstance(req.params.id);
    if (req.query.projectName) invalidateResourceCache(req.query.projectName);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error, "Failed to delete RDS instance");
  }
});

export default router;
