import type { ProviderName } from "../types/provider";
import type { Middleware, MiddlewareContext } from "./index";

interface CircuitState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureAt: number;
}

export function createCircuitBreakerMiddleware(
  failureThreshold: number,
  resetTimeoutMs: number,
): Middleware {
  const circuits = new Map<ProviderName, CircuitState>();

  function ensureCircuit(provider: ProviderName): CircuitState {
    let circuit = circuits.get(provider);
    if (!circuit) {
      circuit = { state: "closed", failureCount: 0, lastFailureAt: 0 };
      circuits.set(provider, circuit);
    }
    return circuit;
  }

  return {
    name: "circuit-breaker",

    async before(context: MiddlewareContext): Promise<MiddlewareContext> {
      const circuit = ensureCircuit(context.provider);

      if (circuit.state === "open") {
        if (Date.now() - circuit.lastFailureAt >= resetTimeoutMs) {
          circuit.state = "half-open";
        } else {
          const retryAfter = Math.ceil(
            (resetTimeoutMs - (Date.now() - circuit.lastFailureAt)) / 1000,
          );
          throw Object.assign(
            new Error(
              `Circuit breaker is OPEN for provider "${context.provider}". ` +
                `Retry after ${retryAfter}s.`,
            ),
            {
              code: "CIRCUIT_OPEN",
              retryable: true,
              recoverable: true,
            },
          );
        }
      }

      return context;
    },

    async after(
      context: MiddlewareContext,
      response,
    ): Promise<typeof response> {
      const circuit = ensureCircuit(context.provider);
      if (circuit.state === "half-open") {
        circuit.state = "closed";
        circuit.failureCount = 0;
      }
      return response;
    },

    async error(
      context: MiddlewareContext,
      _error: Error,
    ): Promise<null> {
      const circuit = ensureCircuit(context.provider);
      circuit.failureCount++;
      circuit.lastFailureAt = Date.now();

      if (circuit.state === "half-open") {
        circuit.state = "open";
      } else if (circuit.failureCount >= failureThreshold) {
        circuit.state = "open";
      }

      return null;
    },
  };
}
