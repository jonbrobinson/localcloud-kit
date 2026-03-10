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
    });

    if (stderr) {
      addLog("warn", `Bucket listing warning: ${stderr}`, "automation");
    }

    addLog("info", `Bucket listing raw output: "${stdout}"`, "automation");

    try {
      const contents = JSON.parse(stdout);
      if (!Array.isArray(contents)) {
        addLog("error", "Bucket listing output is not a JSON array", "automation");
        return [];
      }
      return contents;
    } catch (err) {
      addLog("error", `Failed to parse bucket listing JSON: ${err.message}. Raw output: "${stdout}"`, "automation");
      return [];
    }
  } catch (error) {
    addLog("error", `Failed to list bucket contents: ${error.message}`, "automation");
    return [];
  }
}
