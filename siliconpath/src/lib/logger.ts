/**
 * Minimal structured logger. Kept dependency-free on purpose. Levels can be
 * filtered later via LOG_LEVEL; for now everything routes to console with a level
 * tag so server logs are greppable. This module is imported across the app
 * (data layer, AI providers) — do not add heavy deps here.
 */
type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = ORDER[(process.env.LOG_LEVEL as Level) ?? "info"] ?? ORDER.info;

function emit(level: Level, args: unknown[]) {
  if (ORDER[level] < threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()}`;
  // eslint-disable-next-line no-console
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(line, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => emit("debug", args),
  info: (...args: unknown[]) => emit("info", args),
  warn: (...args: unknown[]) => emit("warn", args),
  error: (...args: unknown[]) => emit("error", args),
};
