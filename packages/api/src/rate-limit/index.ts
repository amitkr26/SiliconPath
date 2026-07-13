import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = `${config.keyPrefix}:${getClientKey(request)}`;
    const now = Date.now();

    let record = memoryStore.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + config.windowMs };
      memoryStore.set(key, record);
    }

    record.count++;

    if (record.count > config.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(config.maxRequests - record.count));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));
    return null;
  };
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

export const rateLimiters = {
  api: createRateLimiter({ windowMs: 60_000, maxRequests: 120, keyPrefix: "api" }),
  auth: createRateLimiter({ windowMs: 60_000, maxRequests: 10, keyPrefix: "auth" }),
  search: createRateLimiter({ windowMs: 60_000, maxRequests: 30, keyPrefix: "search" }),
  scrape: createRateLimiter({ windowMs: 60_000, maxRequests: 5, keyPrefix: "scrape" }),
  ai: createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyPrefix: "ai" }),
};

export async function applyRateLimit(
  request: NextRequest,
  limiter: keyof typeof rateLimiters
): Promise<NextResponse | null> {
  return rateLimiters[limiter](request);
}