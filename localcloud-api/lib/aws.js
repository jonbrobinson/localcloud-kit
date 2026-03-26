import { exec } from "child_process";
import { promisify } from "util";

export const execAsync = promisify(exec);

export const internalEndpoint = "http://aws-emulator:4566";
export const userEndpoint = "http://localhost:4566";
export const awsRegion = process.env.AWS_DEFAULT_REGION || "us-east-1";

export const awsEnv = () => ({
  ...process.env,
  AWS_ENDPOINT_URL: internalEndpoint,
  AWS_DEFAULT_REGION: awsRegion,
});
