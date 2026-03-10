import express from "express";
import {
  createResources,
  createSingleResource,
  destroyResources,
  destroySingleResource,
  listResources,
} from "../lib/resources.js";

const router = express.Router();

router.get("/resources/list", async (req, res) => {
  const { projectName } = req.query;
  const resources = await listResources(projectName);
  res.json({ success: true, data: resources });
});

router.post("/resources/create", async (req, res) => {
  const result = await createResources(req.body);
  res.json(result);
});

router.post("/resources/create-single", async (req, res) => {
  try {
    const { projectName, resourceType, ...config } = req.body;

    if (!projectName || !resourceType) {
      return res.status(400).json({
        success: false,
        error: "projectName and resourceType are required",
      });
    }

    const result = await createSingleResource(projectName, resourceType, config);
    res.json({
      success: true,
      message: `${resourceType} resource created successfully`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/resources/destroy", async (req, res) => {
  const result = await destroyResources(req.body);
  res.json(result);
});

router.post("/resources/destroy-single", async (req, res) => {
  try {
    const { projectName, resourceType, resourceName } = req.body;

    if (!projectName || !resourceType) {
      return res.status(400).json({
        success: false,
        error: "projectName and resourceType are required",
      });
    }

    const result = await destroySingleResource(projectName, resourceType, resourceName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/resources/status", async (req, res) => {
  const { projectName } = req.query;
  const resources = await listResources(projectName);
  res.json({ success: true, data: resources });
});

export default router;
