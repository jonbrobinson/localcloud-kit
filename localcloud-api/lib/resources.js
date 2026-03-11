import { execAsync, internalEndpoint, awsRegion, awsEnv } from "./aws.js";
import { addLog } from "./context.js";

export async function createResources(request) {
  try {
    const { projectName, resources } = request;

    addLog("info", `Creating resources for ${projectName}`, "automation");

    const createdResources = [];
    const errors = [];

    if (resources.s3) {
      try {
        const result = await createSingleResource(projectName, "s3");
        createdResources.push(result);
        addLog("success", `S3 bucket created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`S3: ${error.message}`);
        addLog("error", `Failed to create S3 bucket: ${error.message}`, "automation");
      }
    }

    if (resources.dynamodb) {
      try {
        const result = await createSingleResource(projectName, "dynamodb");
        createdResources.push(result);
        addLog("success", `DynamoDB table created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`DynamoDB: ${error.message}`);
        addLog("error", `Failed to create DynamoDB table: ${error.message}`, "automation");
      }
    }

    if (resources.lambda) {
      try {
        const result = await createSingleResource(projectName, "lambda");
        createdResources.push(result);
        addLog("success", `Lambda function created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`Lambda: ${error.message}`);
        addLog("error", `Failed to create Lambda function: ${error.message}`, "automation");
      }
    }

    if (resources.apigateway) {
      try {
        const result = await createSingleResource(projectName, "apigateway");
        createdResources.push(result);
        addLog("success", `API Gateway created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`API Gateway: ${error.message}`);
        addLog("error", `Failed to create API Gateway: ${error.message}`, "automation");
      }
    }

    if (resources.secretsmanager) {
      try {
        const result = await createSingleResource(projectName, "secretsmanager");
        createdResources.push(result);
        addLog("success", `Secrets Manager secret created: ${result.name}`, "automation");
      } catch (error) {
        errors.push(`Secrets Manager: ${error.message}`);
        addLog("error", `Failed to create Secrets Manager secret: ${error.message}`, "automation");
      }
    }

    if (errors.length > 0) {
      addLog("warn", `Some resources failed to create: ${errors.join(", ")}`, "automation");
      return {
        success: createdResources.length > 0,
        message: `Created ${createdResources.length} resources successfully. Errors: ${errors.join(", ")}`,
        createdResources,
        errors,
      };
    }

    addLog("success", `All ${createdResources.length} resources created successfully for ${projectName}`, "automation");
    return {
      success: true,
      message: `All ${createdResources.length} resources created successfully`,
      createdResources,
    };
  } catch (error) {
    addLog("error", `Failed to create resources: ${error.message}`, "automation");
    return { success: false, error: error.message };
  }
}

function escapeConfigForShell(jsonStr) {
  return jsonStr.replace(/'/g, "'\"'\"'");
}

export async function createSingleResource(projectName, resourceType, config = {}) {
  try {
    let command = `./create_single_resource.sh ${projectName} ${resourceType}`;

    if (resourceType === "dynamodb" && config.dynamodbConfig) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.dynamodbConfig))}'`;
    }

    if (resourceType === "s3" && config.s3Config) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.s3Config))}'`;
    }

    if (resourceType === "secretsmanager" && config.secretsmanagerConfig) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.secretsmanagerConfig))}'`;
    }

    if (resourceType === "lambda" && config.lambdaConfig) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.lambdaConfig))}'`;
    }

    if (resourceType === "apigateway" && config.apigatewayConfig) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.apigatewayConfig))}'`;
    }

    if (resourceType === "ssm" && config.ssmConfig) {
      command += ` --config '${escapeConfigForShell(JSON.stringify(config.ssmConfig))}'`;
    }

    console.log("[DEBUG] Running command:", command);

    const { stdout, stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: awsEnv(),
    });

    console.log("[DEBUG] Script stdout:", stdout);
    console.log("[DEBUG] Script stderr:", stderr);

    if (stderr) {
      addLog("warn", `Single resource creation warning: ${stderr}`, "automation");
    }

    try {
      return JSON.parse(stdout);
    } catch {
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
    const message = error.stderr?.trim() || error.message;
    throw new Error(message);
  }
}

export async function destroyResources(request) {
  try {
    const { projectName, resourceIds } = request;

    addLog(
      "info",
      `Destroying specific resources for ${projectName}: ${resourceIds ? resourceIds.join(", ") : "all resources"}`,
      "automation"
    );

    let command = `./destroy_resources.sh ${projectName} local`;
    if (resourceIds && resourceIds.length > 0) {
      command += ` ${resourceIds.join(" ")}`;
    }

    const { stderr } = await execAsync(command, {
      cwd: "/app/scripts/shell",
      env: awsEnv(),
    });

    if (stderr) {
      addLog("warn", `Resource destruction warning: ${stderr}`, "automation");
    }

    addLog("success", `Resources destroyed successfully for ${projectName}`, "automation");
    return { success: true, message: "Resources destroyed successfully" };
  } catch (error) {
    addLog("error", `Failed to destroy resources: ${error.message}`, "automation");
    return { success: false, error: error.message };
  }
}

export async function destroySingleResource(projectName, resourceType, resourceName) {
  try {
    const { stderr } = await execAsync(
      `./destroy_single_resource.sh ${projectName} ${resourceType} ${resourceName}`,
      { cwd: "/app/scripts/shell", env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `Resource destruction warning: ${stderr}`, "automation");
    }

    addLog("success", `Resource destroyed successfully for ${projectName}`, "automation");
    return { success: true, message: "Resource destroyed successfully" };
  } catch (error) {
    addLog("error", `Failed to destroy resource: ${error.message}`, "automation");
    return { success: false, error: error.message };
  }
}

export async function listResources(projectName) {
  try {
    const { stdout, stderr } = await execAsync(
      `./list_resources.sh ${projectName} local --all`,
      { cwd: "/app/scripts/shell", env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `Resource listing warning: ${stderr}`, "automation");
    }

    try {
      const resources = JSON.parse(stdout);
      if (!Array.isArray(resources)) {
        addLog("error", "Resource listing output is not a JSON array", "automation");
        return [];
      }
      return resources;
    } catch (err) {
      addLog("error", `Failed to parse resource listing JSON: ${err.message}`, "automation");
      return [];
    }
  } catch (error) {
    addLog("error", `Failed to list resources: ${error.message}`, "automation");
    return [];
  }
}

export async function listAllBuckets(projectName) {
  try {
    const { stdout, stderr } = await execAsync(
      `./list_resources.sh ${projectName} local --all`,
      { cwd: "/app/scripts/shell", env: awsEnv() }
    );

    if (stderr) {
      addLog("warn", `Bucket listing warning: ${stderr}`, "automation");
    }

    try {
      const allResources = JSON.parse(stdout);
      if (!Array.isArray(allResources)) {
        addLog("error", "Resource listing output is not a JSON array", "automation");
        return [];
      }
      return allResources
        .filter((r) => r.type === "s3")
        .map((b) => ({ Name: b.name, CreationDate: b.createdAt }));
    } catch (err) {
      addLog("error", `Failed to parse resource listing JSON: ${err.message}`, "automation");
      return [];
    }
  } catch (error) {
    addLog("error", `Failed to list buckets: ${error.message}`, "automation");
    return [];
  }
}
