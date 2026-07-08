export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLevel = (process.env.LOG_LEVEL as keyof typeof LogLevel) || "INFO";
const levelNum = LogLevel[currentLevel as keyof typeof LogLevel] ?? LogLevel.INFO;

function ts(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (levelNum <= LogLevel.DEBUG) console.debug(`[${ts()}] [DEBUG]`, ...args);
  },
  info: (...args: unknown[]) => {
    if (levelNum <= LogLevel.INFO) console.info(`[${ts()}] [INFO]`, ...args);
  },
  warn: (...args: unknown[]) => {
    if (levelNum <= LogLevel.WARN) console.warn(`[${ts()}] [WARN]`, ...args);
  },
  error: (...args: unknown[]) => {
    if (levelNum <= LogLevel.ERROR) console.error(`[${ts()}] [ERROR]`, ...args);
  },
};
