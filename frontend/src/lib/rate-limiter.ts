/**
 * Durable rate limiter. In-memory Maps do not work on Vercel serverless (each
 * invocation is isolated), so production uses Upstash Redis when configured and
 * falls back to a per-instance Map only for local dev.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const localBuckets = new Map<string, { count: number; resetAt: number }>();

async function upstashLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const base = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `ratelimit:${key}`;

  const incrRes = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const { result: count } = (await incrRes.json()) as { result: number };

  if (count === 1) {
    await fetch(`${base}/expire/${encodeURIComponent(redisKey)}/${windowSeconds}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  }

  const resetAt = Date.now() + windowSeconds * 1000;
  return { success: count <= max, remaining: Math.max(0, max - count), resetAt };
}

function localLimit(key: string, max: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const bucket = localBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: max - 1, resetAt: now + windowSeconds * 1000 };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= max,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (hasUpstash) {
    try {
      return await upstashLimit(key, max, windowSeconds);
    } catch (e) {
      console.error("Upstash rate limit failed, falling back to local limit:", e);
      return localLimit(key, max, windowSeconds);
    }
  }
  return localLimit(key, max, windowSeconds);
}

// Backwards-compatible alias for older callers.
export const checkRateLimit = rateLimit;
