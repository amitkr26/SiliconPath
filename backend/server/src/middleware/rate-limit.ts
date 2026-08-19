import type { NextFunction, Response } from "express";
import type { Request as ExpressRequest } from "express";
import { rateLimiters } from "@berojgardegreewala/api";

// Express adapter over the shared in-memory sliding-window rate limiters
// (same presets as the Next.js middleware: api 120/min, auth 10/min,
// search 30/min, scrape 5/min, ai 20/min).
// ponytail: in-memory per-process — like the Next middleware it does not
// share state across instances; upgrade path = Redis-backed limiter when
// the server runs multi-instance.
export function rateLimit(preset: keyof typeof rateLimiters) {
  const limiter = rateLimiters[preset];
  return async (req: ExpressRequest, res: Response, next: NextFunction) => {
    // The shared limiter reads x-forwarded-for via the Web Request API;
    // shim the Express headers in.
    const webRequest = {
      headers: {
        get: (name: string) => {
          const v = req.headers[name.toLowerCase()];
          return Array.isArray(v) ? v[0] : (v ?? "");
        },
      },
    } as unknown as globalThis.Request;
    const blocked = await limiter(webRequest);
    if (blocked) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests",
          retryAfter: Number(blocked.headers.get("Retry-After")),
        },
      });
      return;
    }
    next();
  };
}
