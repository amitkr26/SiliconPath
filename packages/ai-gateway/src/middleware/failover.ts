import type { GatewayResponse } from "../types/gateway";
import type { BaseProvider } from "../registry";
import type { Middleware, MiddlewareContext } from "./index";

export function createFailoverMiddleware(): Middleware {
  return {
    name: "failover",

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
      _error: Error,
    ): Promise<GatewayResponse | null> {
      const tried = new Set(context.previousProviders);
      tried.add(context.provider);

      for (const name of context.config.fallbackOrder) {
        if (tried.has(name)) continue;

        const candidate: BaseProvider | null = context.registry.get(name);
        if (!candidate) continue;
        if (!candidate.isAvailable()) continue;
        if (!candidate.isHealthy()) continue;

        return context.reExecute(
          context.request,
          name,
          0,
          Array.from(tried),
        );
      }

      return null;
    },
  };
}
