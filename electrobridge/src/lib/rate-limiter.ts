/**
 * Durable rate limiter.
 *
 * The previous implementation used an in-memory Map. On Vercel serverless each
 * invocation runs in an isolated container, so that state was never shared and
 * the limit was effectively a no-op. This version uses Upstash Redis when
 * configured, and falls back to a per-instance Map only for local development.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Local-dev fallback only. Not shared across serverless instances.
const localBuckets = new Map<string, { count: number; resetAt: number }>();

async function upstashLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const base = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const redisKey = `ratelimit:${key}`;

  // INCR then set expiry on first hit (atomic-enough for rate limiting).
  const incrRes = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const { result: count } = (await incrRes.json()) as { result: number };

  if (count === 1) {
    await fetch(
      `${base}/expire/${encodeURIComponent(redisKey)}/${windowSeconds}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
  }

  const resetAt = Date.now() + windowSeconds * 1000;
  return {
    success: count <= max,
    remaining: Math.max(0, max - count),
    resetAt,
  };
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

/**
 * @param key    unique identifier (e.g. `subscribe:<ip>`)
 * @param max    max requests allowed in the window
 * @param windowSeconds  window length in seconds
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (hasUpstash) {
    try {
      return await upstashLimit(key, max, windowSeconds);
    } catch (e) {
      console.error("Upstash rate limit failed, allowing request:", e);
      return { success: true, remaining: max, resetAt: Date.now() + windowSeconds * 1000 };
    }
  }
  return localLimit(key, max, windowSeconds);
}
