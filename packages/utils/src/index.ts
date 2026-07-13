import type { z } from "zod";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const entry = createLogEntry("info", message, meta);
    console.log(JSON.stringify(entry));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const entry = createLogEntry("warn", message, meta);
    console.warn(JSON.stringify(entry));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    const entry = createLogEntry("error", message, meta);
    console.error(JSON.stringify(entry));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    const entry = createLogEntry("debug", message, meta);
    console.debug(JSON.stringify(entry));
  },
};

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      404,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export function formatError(error: unknown): { message: string; status: number; code?: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.statusCode,
      code: error.code,
    };
  }
  if (error instanceof Error) {
    return {
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
      status: 500,
    };
  }
  return {
    message: "An unexpected error occurred",
    status: 500,
  };
}

export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first?.message || "Validation failed", result.error.issues);
  }
  return result.data;
}

export function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[{}()\.,"\\\[\]]/g, "")
    .trim()
    .slice(0, 100);
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.",
      "10.",
      "172.16.",
      "192.168.",
      "metadata",
    ];
    const host = parsed.hostname;
    if (blocked.some((b) => host.startsWith(b) || host === b)) {
      return false;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpired(deadline: string): boolean {
  return getDaysUntilDeadline(deadline) < 0;
}

export function getDaysAgo(date: string): string {
  const now = new Date();
  const posted = new Date(date);
  const diff = now.getTime() - posted.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function isNew(date: string, thresholdDays = 7): boolean {
  const now = new Date();
  const posted = new Date(date);
  const diff = now.getTime() - posted.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days < thresholdDays;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number; backoff?: boolean } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        const delay = backoff ? delayMs * Math.pow(2, i) : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Retry failed");
}

export {
  createSuccessResponse,
  createPaginatedResponse,
  createErrorResponse,
  getStatusFromError,
} from "./api-response";
export type {
  SuccessResponse,
  PaginatedResponse,
  ErrorResponse,
} from "./api-response";

export type {
  QueueJob,
  QueueAdapter,
  QueueOptions,
  QueuePriority,
} from "./queue";

export type {
  WorkerHandler,
  WorkerPool,
  WorkerPoolStatus,
  WorkerOptions,
} from "./worker";

export type {
  Service,
  ServiceQueryOptions,
  ServiceFactory,
  ServiceDependencies,
} from "./service";

export type {
  Metric,
  Trace,
  ObservabilityProvider,
  TelemetryProvider,
} from "./observability";
export { noopObservability, noopTelemetry } from "./observability";

export type {
  AnalyticsEvent,
  PageViewEvent,
  AnalyticsProvider,
  AnalyticsQuery,
  AnalyticsResult,
} from "./analytics";
export { noopAnalytics } from "./analytics";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 200);
}
