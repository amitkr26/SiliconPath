import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, type HttpStatusCode } from "@berojgardegreewala/api";

// Centralized error handling — consistent JSON shape for every failure:
//   { "success": false, "error": { "code": "...", "message": "..." } }
// Stack traces only in development; never in production.

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError("Resource not found", 404, "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number =
    err instanceof AppError ? err.statusCode : err?.status || 500;
  const code: string =
    err instanceof AppError ? err.code : "INTERNAL_ERROR";
  const message: string =
    err instanceof AppError ? err.message : "Internal server error";

  if (!(err instanceof AppError) || status >= 500) {
    // Log real error details server-side (stack traces never reach the client)
    console.error("[error]", err instanceof Error ? err.stack : String(err));
  }

  const body = {
    success: false,
    error: {
      code,
      message,
      ...(err instanceof AppError && err.details !== undefined
        ? { details: err.details }
        : {}),
    },
  };

  res.status(status as HttpStatusCode).json(body);
};