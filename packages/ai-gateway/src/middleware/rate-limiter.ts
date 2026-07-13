import type { ProviderName } from "../types/provider";
import type { Middleware, MiddlewareContext } from "./index";

export function createRateLimiterMiddleware(
  requestsPerMinute: number,
): Middleware {
  const windows = new Map<ProviderName, number[]>();

  function cleanWindow(timestamps: number[], now: number): number[] {
    const windowMs = 60_000;
    const cleaned: number[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (now - timestamps[i] < windowMs) {
        cleaned.push(timestamps[i]);
      }
    }
    return cleaned;
  }

  return {
    name: "rate-limiter",

    async before(context: MiddlewareContext): Promise<MiddlewareContext> {
      const now = Date.now();
      let timestamps = windows.get(context.provider) ?? [];
      timestamps = cleanWindow(timestamps, now);

      if (timestamps.length >= requestsPerMinute) {
        const oldest = timestamps[0];
        const waitMs = 60_000 - (now - oldest) + 1;
        await new Promise((resolve) => setTimeout(resolve, waitMs));

        const afterWait = Date.now();
        timestamps = cleanWindow(
          windows.get(context.provider) ?? [],
          afterWait,
        );
      }

      timestamps.push(Date.now());
      windows.set(context.provider, timestamps);

      return context;
    },

    async after(
      _context: MiddlewareContext,
      response,
    ): Promise<typeof response> {
      return response;
    },

    async error(
      _context: MiddlewareContext,
      error: Error,
    ): Promise<null> {
      const msg = error.message ?? "";
      if (/429|rate.?limit/i.test(msg)) {
        (error as Error & { code?: string }).code = "RATE_LIMITED";
        (error as Error & { retryable?: boolean }).retryable = true;
        (error as Error & { recoverable?: boolean }).recoverable = true;
      }
      return null;
    },
  };
}
