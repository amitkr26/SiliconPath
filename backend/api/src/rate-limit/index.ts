export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: Request): Promise<Response | null> {
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
      return new Response(
        JSON.stringify({ error: "Too many requests", code: "RATE_LIMITED", retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

function getClientKey(request: Request): string {
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

export async function applyRateLimit(request: Request, limiter: keyof typeof rateLimiters): Promise<Response | null> {
  return rateLimiters[limiter](request);
}

export function rateLimitHeaders(config: RateLimitConfig, current: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, config.maxRequests - current)),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + config.windowMs) / 1000)),
  };
}