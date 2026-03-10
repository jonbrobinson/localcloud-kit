import express from "express";
import fs from "fs";
import { execAsync, awsEnv } from "../lib/aws.js";
import { addLog } from "../lib/context.js";
import { upload } from "../lib/upload.js";
import { listAllBuckets } from "../lib/resources.js";
import { listBucketContents } from "../lib/s3.js";

const router = express.Router();

router.get("/s3/buckets", async (req, res) => {
  const { projectName } = req.query;
  const buckets = await listAllBuckets(projectName);
  res.json({ success: true, data: buckets });
});

router.get("/s3/bucket/:bucketName/contents", async (req, res) => {
  const { projectName } = req.query;
  const { bucketName } = req.params;
  const contents = await listBucketContents(projectName, bucketName);
  res.json({ success: true, data: contents });
});

router.get("/s3/bucket/:bucketName/object/*", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { bucketName } = req.params;
    const objectKey = req.params[0];

    if (!projectName || !bucketName || !objectKey) {
      return res.status(400).json({
        success: false,
        error: "projectName, bucketName, and objectKey are required",
      });
    }

    const command = `/bin/sh /app/scripts/shell/download_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}'`;
    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    console.log("[S3 Download] Raw stdout:", JSON.stringify(stdout));
    console.log("[S3 Download] Raw stderr:", JSON.stringify(stderr));
    addLog("info", `[S3 Download] Raw stdout: ${JSON.stringify(stdout)}`);
    addLog("info", `[S3 Download] Raw stderr: ${JSON.stringify(stderr)}`);

    let metadata = {};
    if (stderr) {
      const metadataMatch = stderr.match(/<!--METADATA:(.*?)-->/);
      if (metadataMatch) {
        try {
          metadata = JSON.parse(metadataMatch[1]);
        } catch (e) {
          addLog("warn", `Failed to parse object metadata: ${e.message}`, "automation");
        }
      }
    }

    addLog("success", `Object downloaded: ${objectKey} from bucket ${bucketName}`, "automation");
    res.json({ success: true, data: { content: stdout, metadata } });
  } catch (error) {
    addLog("error", `Failed to download object: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post(
  "/s3/bucket/:bucketName/upload-multipart",
  upload.single("file"),
  async (req, res) => {
    try {
      const { projectName } = req.query;
      const { bucketName } = req.params;
      const { objectKey } = req.body;
      const file = req.file;

      if (!projectName || !bucketName || !objectKey || !file) {
        return res.status(400).json({
          success: false,
          error: "projectName, bucketName, objectKey, and file are required",
        });
      }

      addLog(
        "info",
        `Uploading file: ${objectKey} (${(file.size / 1024).toFixed(2)} KB) to bucket ${bucketName}`,
        "automation"
      );

      const command = `/bin/sh /app/scripts/shell/upload_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}' '${file.path}'`;
      const { stderr } = await execAsync(command, { env: awsEnv() });

      try { fs.unlinkSync(file.path); } catch (e) { console.warn("Failed to cleanup temp file:", e); }

      if (stderr) {
        addLog("warn", `S3 upload warning: ${stderr}`, "automation");
      }

      addLog(
        "success",
        `Object uploaded: ${objectKey} (${(file.size / 1024).toFixed(2)} KB) to bucket ${bucketName}`,
        "automation"
      );

      res.json({ success: true, message: "File uploaded successfully", size: file.size, filename: objectKey });
    } catch (error) {
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch (e) { console.warn("Failed to cleanup temp file on error:", e); }
      }
      addLog("error", `Failed to upload object: ${error.message}`, "automation");
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post("/s3/bucket/:bucketName/upload", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { bucketName } = req.params;
    const { objectKey, content } = req.body;

    if (!projectName || !bucketName || !objectKey || content === undefined) {
      return res.status(400).json({
        success: false,
        error: "projectName, bucketName, objectKey, and content are required",
      });
    }

    const tempFile = `/tmp/${objectKey.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(content) && content.length > 0;

    if (isBase64) {
      fs.writeFileSync(tempFile, Buffer.from(content, "base64"));
    } else {
      fs.writeFileSync(tempFile, content);
    }

    const command = `/bin/sh /app/scripts/shell/upload_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}' '${tempFile}'`;
    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    try { fs.unlinkSync(tempFile); } catch (e) { console.warn("Failed to cleanup temp file:", e); }

    if (stderr) {
      addLog("warn", `S3 upload warning: ${stderr}`, "automation");
    }

    addLog("success", `Object uploaded: ${objectKey} to bucket ${bucketName}`, "automation");
    res.json({ success: true, message: stdout });
  } catch (error) {
    addLog("error", `Failed to upload object: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/s3/bucket/:bucketName/object/*", async (req, res) => {
  try {
    const { projectName } = req.query;
    const { bucketName } = req.params;
    const objectKey = req.params[0];

    if (!projectName || !bucketName || !objectKey) {
      return res.status(400).json({
        success: false,
        error: "projectName, bucketName, and objectKey are required",
      });
    }

    const command = `/bin/sh /app/scripts/shell/delete_s3_object.sh '${projectName}' '${bucketName}' '${objectKey}'`;
    const { stdout, stderr } = await execAsync(command, { env: awsEnv() });

    if (stderr) {
      addLog("warn", `S3 delete-object warning: ${stderr}`, "automation");
    }

    addLog("success", `Object deleted: ${objectKey} from bucket ${bucketName}`, "automation");
    res.json({ success: true, message: stdout });
  } catch (error) {
    addLog("error", `Failed to delete object: ${error.message}`, "automation");
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
