import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export const state = {
  logs: [],
  emulatorStatus: {
    running: false,
    endpoint: process.env.AWS_ENDPOINT_URL || "http://localhost:4566",
    health: "unknown",
    uptime: null,
  },
};

// Set after Socket.IO is initialized in server.js
export let io = null;

export function setIo(socketIoInstance) {
  io = socketIoInstance;
}

export function addLog(level, message, source = "api") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    source,
  };

  state.logs.push(logEntry);

  if (state.logs.length > 1000) {
    state.logs.splice(0, state.logs.length - 1000);
  }

  if (io) io.emit("log", logEntry);

  logger.log(level, message, { source });
}
