export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  constructor(message = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMITED", { retryAfter });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export function handleError(err: unknown): { status: number; body: { error: string; code: string; details?: unknown } } {
  if (err instanceof AppError) {
    return { status: err.statusCode, body: { error: err.message, code: err.code, details: err.details } };
  }
  if (err instanceof Error) {
    return { status: 500, body: { error: err.message, code: "INTERNAL_ERROR" } };
  }
  return { status: 500, body: { error: "Unknown error", code: "UNKNOWN_ERROR" } };
}