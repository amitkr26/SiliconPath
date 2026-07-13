import type { GatewayRequest, GatewayResponse } from "../src/types/gateway";
import type { ProviderName } from "../src/types/provider";
import type { BaseProvider } from "../src/registry";
import type { Middleware, MiddlewareContext } from "../src/middleware";
import { applyMiddleware, setMiddlewareChain, InMemoryTelemetryCollector } from "../src/middleware";
import { createRetryMiddleware } from "../src/middleware/retry";
import { createFailoverMiddleware } from "../src/middleware/failover";
import { createCircuitBreakerMiddleware } from "../src/middleware/circuit-breaker";
import { createRateLimiterMiddleware } from "../src/middleware/rate-limiter";
import { createQueueMiddleware } from "../src/middleware/queue";
import { createTimeoutMiddleware } from "../src/middleware/timeout";
import { ResponseCache } from "../src/cache";
import { ProviderRegistry } from "../src/registry";
import type { AIGatewayConfig } from "../src/types/config";

const sampleRequest: GatewayRequest = {
  mode: "chat",
  messages: [{ role: "user", content: "hello" }],
};

const sampleResponse: GatewayResponse = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  latencyMs: 100,
  cached: false,
};

function createMockProvider(name: ProviderName, shouldFail = false): BaseProvider {
  const response: GatewayResponse = { ...sampleResponse, provider: name };
  return {
    name,
    config: {
      name,
      apiKey: "test",
      model: "test-model",
      timeoutMs: 5000,
      maxRetries: 0,
      priority: 1,
      weight: 1,
      maxTokens: 1024,
      temperature: 0.7,
      enabled: true,
    },
    health: {
      status: "healthy",
      latencyMs: 0,
      lastCheckedAt: Date.now(),
      consecutiveFailures: 0,
      successRate: 1,
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      lastUsedAt: null,
    },
    isAvailable() { return true; },
    isHealthy() { return this.health.status === "healthy"; },
    checkHealth() { return Promise.resolve(this.health); },
    execute: shouldFail
      ? () => Promise.reject(Object.assign(new Error("Provider error"), { retryable: true }))
      : () => Promise.resolve(response),
    executeStream: shouldFail
      ? () => { throw new Error("Stream error"); }
      : function* () { yield response; },
  } as unknown as BaseProvider;
}

const config: AIGatewayConfig = {
  fallbackOrder: ["gemini", "openai", "anthropic"],
  defaultModel: "gemini-2.0-flash",
  defaultMaxTokens: 1024,
  defaultTemperature: 0.7,
  globalTimeoutMs: 5000,
  globalMaxRetries: 3,
  cacheEnabled: false,
  cacheTtlMs: 300000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60000,
  rateLimitPerMinute: 100,
  queueMaxSize: 50,
  healthCheckIntervalMs: 30000,
  logLevel: "info",
  analyticsEnabled: false,
};

function buildContext(overrides?: Partial<MiddlewareContext>) {
  const context: Omit<MiddlewareContext, "request" | "provider" | "reExecute" | "metadata"> = {
    startTime: Date.now(),
    retryCount: 0,
    previousProviders: [],
    cache: new ResponseCache(),
    telemetry: new InMemoryTelemetryCollector(),
    registry: new ProviderRegistry(),
    config,
  };
  return {
    ...context,
    ...overrides,
  } as unknown as Omit<MiddlewareContext, "request" | "provider" | "reExecute" | "metadata">;
}

describe("Middleware chain", () => {
  beforeEach(() => {
    setMiddlewareChain([]);
  });

  it("executes a provider directly when no middleware chain is set", async () => {
    setMiddlewareChain([]);
    const provider = createMockProvider("gemini");
    const response = await applyMiddleware(sampleRequest, provider, buildContext());
    expect(response.provider).toBe("gemini");
  });

  it("passes request through middleware chain", async () => {
    const beforeFn = jest.fn((ctx: MiddlewareContext) => Promise.resolve(ctx));
    const testMiddleware: Middleware = {
      name: "test",
      before: beforeFn,
    };

    setMiddlewareChain([testMiddleware]);
    const provider = createMockProvider("gemini");
    await applyMiddleware(sampleRequest, provider, buildContext());
    expect(beforeFn).toHaveBeenCalled();
  });
});

describe("Retry middleware", () => {
  it("retries on retryable error", async () => {
    const provider = createMockProvider("gemini", true);
    const retryMiddleware = createRetryMiddleware(3, 10);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([retryMiddleware]);
    await expect(applyMiddleware(sampleRequest, provider, buildContext({
      registry,
    }))).rejects.toThrow();
  });

  it("does not retry non-retryable errors", async () => {
    const provider = {
      ...createMockProvider("gemini", true),
      execute: () => Promise.reject(new Error("Non-retryable error")),
    };
    const retryMiddleware = createRetryMiddleware(3, 10);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([retryMiddleware]);
    await expect(applyMiddleware(sampleRequest, provider, buildContext({
      registry,
    }))).rejects.toThrow("Non-retryable error");
  });
});

describe("Failover middleware", () => {
  it("fails over to next provider on error", async () => {
    const failingProvider = createMockProvider("gemini", true);
    const workingProvider = createMockProvider("openai", false);
    const failoverMiddleware = createFailoverMiddleware();

    const registry = new ProviderRegistry();
    registry.register(failingProvider);
    registry.register(workingProvider);

    setMiddlewareChain([failoverMiddleware]);
    const response = await applyMiddleware(sampleRequest, failingProvider, buildContext({
      registry,
    }));
    expect(response.provider).toBe("openai");
  });
});

describe("Circuit breaker middleware", () => {
  it("allows requests when circuit is closed", async () => {
    const cb = createCircuitBreakerMiddleware(3, 1000);
    const provider = createMockProvider("gemini", false);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([cb]);
    const response = await applyMiddleware(sampleRequest, provider, buildContext({ registry }));
    expect(response.provider).toBe("gemini");
  });

  it("opens circuit after threshold failures", async () => {
    const cb = createCircuitBreakerMiddleware(1, 10000);
    const provider = createMockProvider("gemini", true);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([cb]);
    await expect(applyMiddleware(sampleRequest, provider, buildContext({ registry }))).rejects.toThrow();

    await expect(applyMiddleware(sampleRequest, provider, buildContext({ registry }))).rejects.toThrow("Circuit breaker is OPEN");
  });
});

describe("Rate limiter middleware", () => {
  it("allows requests within limit", async () => {
    const rl = createRateLimiterMiddleware(100);
    const provider = createMockProvider("gemini", false);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([rl]);
    const response = await applyMiddleware(sampleRequest, provider, buildContext({ registry }));
    expect(response.provider).toBe("gemini");
  });
});

describe("Queue middleware", () => {
  it("allows requests within concurrency limit", async () => {
    const q = createQueueMiddleware(10, 10);
    const provider = createMockProvider("gemini", false);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([q]);
    const response = await applyMiddleware(sampleRequest, provider, buildContext({ registry }));
    expect(response.provider).toBe("gemini");
  });
});

describe("Timeout middleware", () => {
  it("allows requests that complete within timeout", async () => {
    const t = createTimeoutMiddleware(5000);
    const provider = createMockProvider("gemini", false);

    const registry = new ProviderRegistry();
    registry.register(provider);

    setMiddlewareChain([t]);
    const response = await applyMiddleware(sampleRequest, provider, buildContext({ registry }));
    expect(response.provider).toBe("gemini");
  });
});

describe("InMemoryTelemetryCollector", () => {
  it("records entries and provides stats", () => {
    const telemetry = new InMemoryTelemetryCollector();
    telemetry.record({
      timestamp: Date.now(),
      provider: "gemini",
      model: "gemini-2.0-flash",
      mode: "chat",
      latencyMs: 100,
      success: true,
      retryCount: 0,
      cacheHit: false,
    });

    expect(telemetry.getEntries().length).toBe(1);
    const stats = telemetry.getStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.successRate).toBe(1);
    expect(stats.avgLatencyMs).toBe(100);
  });

  it("filters entries by provider", () => {
    const telemetry = new InMemoryTelemetryCollector();
    telemetry.record({
      timestamp: Date.now(),
      provider: "gemini",
      model: "gemini-2.0-flash",
      mode: "chat",
      latencyMs: 100,
      success: true,
      retryCount: 0,
      cacheHit: false,
    });
    telemetry.record({
      timestamp: Date.now(),
      provider: "openai",
      model: "gpt-4o",
      mode: "chat",
      latencyMs: 200,
      success: true,
      retryCount: 0,
      cacheHit: false,
    });

    const geminiEntries = telemetry.getEntries("gemini");
    expect(geminiEntries).toHaveLength(1);
    expect(geminiEntries[0].provider).toBe("gemini");
  });
});
