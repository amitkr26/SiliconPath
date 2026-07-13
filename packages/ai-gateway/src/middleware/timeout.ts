import type { Middleware, MiddlewareContext } from "./index";

export function createTimeoutMiddleware(timeoutMs: number): Middleware {
  return {
    name: "timeout",

    async before(context: MiddlewareContext): Promise<MiddlewareContext> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      context.metadata.set("timeout:controller", controller);
      context.metadata.set("timeout:timer", timer);

      const originalSignal = context.request.signal;
      if (originalSignal) {
        if (originalSignal.aborted) {
          controller.abort();
          clearTimeout(timer);
        } else {
          originalSignal.addEventListener(
            "abort",
            () => {
              controller.abort();
              clearTimeout(timer);
            },
            { once: true },
          );
        }
      }

      return {
        ...context,
        request: {
          ...context.request,
          signal: controller.signal,
        },
      };
    },

    async after(
      context: MiddlewareContext,
      response,
    ): Promise<typeof response> {
      const timer = context.metadata.get(
        "timeout:timer",
      ) as ReturnType<typeof setTimeout> | undefined;
      if (timer) clearTimeout(timer);
      return response;
    },

    async error(
      context: MiddlewareContext,
      error: Error,
    ): Promise<null> {
      const timer = context.metadata.get(
        "timeout:timer",
      ) as ReturnType<typeof setTimeout> | undefined;
      if (timer) clearTimeout(timer);

      if (error.name === "AbortError") {
        (error as Error & { code?: string }).code = "TIMEOUT";
        (error as Error & { retryable?: boolean }).retryable = true;
        (error as Error & { recoverable?: boolean }).recoverable = true;
      }
      return null;
    },
  };
}
