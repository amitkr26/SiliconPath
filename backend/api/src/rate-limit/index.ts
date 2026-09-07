export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const MAX_STORE_SIZE = 10_000;
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function pruneExpiredEntries(now: number): void {
  for (const [k, v] of memoryStore.entries()) {
    if (now > v.resetAt) {
      memoryStore.delete(k);
    }
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: Request): Promise<Response | null> {
    const key = `${config.keyPrefix}:${getClientKey(request)}`;
    const now = Date.now();

    // Bound memoryStore size: prune expired entries when approaching threshold
    if (memoryStore.size >= MAX_STORE_SIZE) {
      pruneExpiredEntries(now);
      if (memoryStore.size >= MAX_STORE_SIZE) {
        // Drop oldest 20% of entries to guarantee bounded memory consumption
        let deleted = 0;
        for (const k of memoryStore.keys()) {
          memoryStore.delete(k);
          deleted++;
          if (deleted >= MAX_STORE_SIZE * 0.2) break;
        }
      }
    }

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

const IPV4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

function getClientKey(request: Request): string {
  // If authenticated, limit by user token prefix to prevent cross-account IP throttling
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) {
      return `auth_${token.slice(0, 16)}`;
    }
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp = forwarded?.split(",")[0]?.trim();
  if (rawIp && (IPV4_REGEX.test(rawIp) || IPV6_REGEX.test(rawIp))) {
    return rawIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && (IPV4_REGEX.test(realIp) || IPV6_REGEX.test(realIp))) {
    return realIp;
  }

  return "unknown";
}

export const rateLimiters = {
  api: createRateLimiter({ windowMs: 60_000, maxRequests: 120, keyPrefix: "api" }),
  auth: createRateLimiter({ windowMs: 60_000, maxRequests: 10, keyPrefix: "auth" }),
  search: createRateLimiter({ windowMs: 60_000, maxRequests: 30, keyPrefix: "search" }),
  scrape: createRateLimiter({ windowMs: 60_000, maxRequests: 5, keyPrefix: "scrape" }),
  ai: createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyPrefix: "ai" }),
  // Brute-force speed bump for the X-Admin-Password header; the password is
  // still compared timing-safe, the limiter just caps scripted guessing.
  admin: createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyPrefix: "admin" }),
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