import { createClient } from "redis";
import { logger } from "./context.js";

let client;

function redisOptions() {
  return {
    socket: {
      host: process.env.REDIS_HOST || "redis",
      port: Number(process.env.REDIS_PORT || 6379),
    },
  };
}

export async function getRedis() {
  if (client?.isOpen) {
    return client;
  }

  if (client) {
    try {
      await client.disconnect();
    } catch {
      // ignore a stale client
    }
    client = null;
  }

  client = createClient(redisOptions());
  client.on("error", (err) => {
    logger.error(`Redis client error: ${err.message}`);
  });
  await client.connect();
  return client;
}

export function parseServerInfo(info) {
  const pick = (name) => {
    const match = info.match(new RegExp(`^${name}:(.*)$`, "m"));
    return match ? `${name}:${match[1].trim()}` : null;
  };
  return ["redis_version", "tcp_port", "uptime_in_seconds"]
    .map(pick)
    .filter(Boolean)
    .join(" ");
}

/** Redis stores strings. Objects/arrays are stringified once; strings are stored as-is. */
export function asRedisString(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
