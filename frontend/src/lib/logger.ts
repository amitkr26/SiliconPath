type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function makeLog(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => makeLog("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => makeLog("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => makeLog("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => makeLog("debug", msg, meta),
};
