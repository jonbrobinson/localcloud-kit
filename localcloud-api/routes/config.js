import express from "express";
import { userEndpoint, awsRegion } from "../lib/aws.js";
import db from "../db.js";

const router = express.Router();

router.get("/config/project", (req, res) => {
  const row = db
    .prepare(
      `SELECT p.name as projectName
       FROM user_profile u
       LEFT JOIN projects p ON u.active_project_id = p.id
       WHERE u.id = 1`
    )
    .get();
  res.json({
    success: true,
    data: {
      projectName: row?.projectName || "default",
      awsEndpoint: userEndpoint,
      awsRegion,
    },
  });
});

router.get("/config/templates", (req, res) => {
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
      resources: { s3: true, dynamodb: false, lambda: false, apigateway: false },
    },
    {
      id: "database",
      name: "Database Only",
      description: "DynamoDB table for data storage",
      resources: { s3: false, dynamodb: true, lambda: false, apigateway: false },
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

export default router;
