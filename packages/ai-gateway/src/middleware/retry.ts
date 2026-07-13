import type { GatewayResponse } from "../types/gateway";
import type { Middleware, MiddlewareContext } from "./index";

function isRetryableError(error: Error & { code?: string; status?: number; retryable?: boolean }): boolean {
  if (error.retryable === true) return true;
  if (error.name === "AbortError") return true;
  if (error.code === "TIMEOUT") return true;
  if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") return true;
  if (error.code === "RATE_LIMITED") return true;
  if (error.code === "SERVER_ERROR") return true;
  if (error.status === 429) return true;
  if (typeof error.status === "number" && error.status >= 500) return true;
  const msg = error.message ?? "";
  if (/timeout/i.test(msg)) return true;
  if (/rate.?limit/i.test(msg)) return true;
  if (/\b429\b/.test(msg)) return true;
  if (/\b5\d{2}\b/.test(msg)) return true;
  if (/ECONNRESET|ECONNREFUSED/i.test(msg)) return true;
  return false;
}

export function createRetryMiddleware(
  maxRetries: number,
  baseDelayMs: number = 1000,
): Middleware {
  return {
    name: "retry",

    async before(context: MiddlewareContext): Promise<MiddlewareContext> {
      return context;
    },

    async after(
      _context: MiddlewareContext,
      response,
    ): Promise<typeof response> {
      return response;
    },

    async error(
      context: MiddlewareContext,
      error: Error,
    ): Promise<GatewayResponse | null> {
      if (context.retryCount >= maxRetries) {
        return null;
      }

      if (!isRetryableError(error as Error & { code?: string; status?: number; retryable?: boolean })) {
        return null;
      }

      const delay = baseDelayMs * Math.pow(2, context.retryCount);
      const jitter = delay * 0.1 * Math.random();
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));

      return context.reExecute(
        context.request,
        context.provider,
        context.retryCount + 1,
      );
    },
  };
}
