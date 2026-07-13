import type { ProviderName } from "../types/provider";
import type { Middleware, MiddlewareContext } from "./index";

export function createQueueMiddleware(
  maxSize: number,
  maxConcurrent: number = 10,
): Middleware {
  const active = new Map<ProviderName, number>();
  const queues = new Map<ProviderName, Array<() => void>>();

  function releaseSlot(provider: ProviderName): void {
    const count = active.get(provider) ?? 1;
    if (count <= 1) {
      active.delete(provider);
    } else {
      active.set(provider, count - 1);
    }

    const queue = queues.get(provider);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      next();
    }
  }

  return {
    name: "queue",

    async before(context: MiddlewareContext): Promise<MiddlewareContext> {
      const providerActive = active.get(context.provider) ?? 0;

      if (providerActive >= maxConcurrent) {
        const queue = queues.get(context.provider) ?? [];
        if (queue.length >= maxSize) {
          throw Object.assign(
            new Error(
              `Queue full for provider "${context.provider}" (${queue.length}/${maxSize})`,
            ),
            { code: "QUEUE_FULL", retryable: false, recoverable: true },
          );
        }

        await new Promise<void>((resolve) => {
          queue.push(resolve);
          queues.set(context.provider, queue);
        });
      }

      active.set(context.provider, (active.get(context.provider) ?? 0) + 1);
      return context;
    },

    async after(
      context: MiddlewareContext,
      response,
    ): Promise<typeof response> {
      releaseSlot(context.provider);
      return response;
    },

    async error(
      context: MiddlewareContext,
      _error: Error,
    ): Promise<null> {
      releaseSlot(context.provider);
      return null;
    },
  };
}
