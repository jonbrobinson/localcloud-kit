import { execAsync, awsEnv } from "./aws.js";
import { addLog } from "./context.js";

export async function listBucketContents(projectName, bucketName) {
  try {
    let command = `./list_bucket_contents.sh ${projectName} dev`;
    if (bucketName) {
      command += ` ${bucketName}`;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: awsEnv(),
      maxBuffer: 20 * 1024 * 1024,
    });

    if (stderr) {
      addLog("warn", `Bucket listing warning: ${stderr}`, "automation");
    }

    try {
      const parsed = JSON.parse(stdout);
      const contents = parsed == null ? [] : parsed;
      if (!Array.isArray(contents)) {
        addLog("error", "Bucket listing output is not a JSON array", "automation");
        return [];
      }
      if (bucketName) {
        addLog(
          "info",
          `Listed s3://${bucketName} (${contents.length} objects) for project ${projectName}`,
          "automation"
        );
      }
      return contents;
    } catch (err) {
      const preview = stdout.length > 200 ? `${stdout.slice(0, 200)}…` : stdout;
      addLog(
        "error",
        `Failed to parse bucket listing JSON: ${err.message}. Output preview: ${preview}`,
        "automation"
      );
      return [];
    }
  } catch (error) {
    addLog("error", `Failed to list bucket contents: ${error.message}`, "automation");
    return [];
  }
}
