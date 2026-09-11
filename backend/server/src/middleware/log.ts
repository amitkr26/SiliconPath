import type { NextFunction, Request, Response } from "express";

const SENSITIVE_HEADERS = ["authorization", "x-admin-password", "cookie"];

// Method, route, status, duration. Never logs tokens or credentials.
export function logMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const headers = SENSITIVE_HEADERS.some((h) => h in req.headers) ? " [auth]" : "";
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms${headers}`);
  });
  next();
}