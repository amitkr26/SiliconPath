import type { GatewayRequest, GatewayResponse } from "../types/gateway";
import type { ProviderName, ChatUsage } from "../types/provider";
import type { AIGatewayConfig } from "../types/config";
import type { BaseProvider } from "../registry";
import type { ProviderRegistry } from "../registry";
import type { ResponseCache } from "../cache";

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export interface TelemetryEntry {
  timestamp: number;
  provider: ProviderName;
  model: string;
  mode: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
  cacheHit: boolean;
  tokens?: ChatUsage;
}

export interface TelemetryCollector {
  record(entry: TelemetryEntry): void;
  getEntries(provider?: ProviderName): TelemetryEntry[];
  getStats(provider?: ProviderName): {
    totalRequests: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

export class InMemoryTelemetryCollector implements TelemetryCollector {
  private entries: TelemetryEntry[] = [];

  record(entry: TelemetryEntry): void {
    this.entries.push(entry);
  }

  getEntries(provider?: ProviderName): TelemetryEntry[] {
    if (provider) return this.entries.filter((e) => e.provider === provider);
    return [...this.entries];
  }

  getStats(provider?: ProviderName) {
    const entries = this.getEntries(provider);
    const total = entries.length;
    if (total === 0) {
      return { totalRequests: 0, successRate: 0, avgLatencyMs: 0 };
    }
    const success = entries.filter((e) => e.success).length;
    const totalLatency = entries.reduce((sum, e) => sum + e.latencyMs, 0);
    return {
      totalRequests: total,
      successRate: success / total,
      avgLatencyMs: totalLatency / total,
    };
  }
}

// ---------------------------------------------------------------------------
// Middleware types
// ---------------------------------------------------------------------------

export interface MiddlewareContext {
  request: GatewayRequest;
  provider: ProviderName;
  startTime: number;
  retryCount: number;
  previousProviders: ProviderName[];
  cache: ResponseCache;
  telemetry: TelemetryCollector;
  registry: ProviderRegistry;
  config: AIGatewayConfig;
  metadata: Map<string, unknown>;
  reExecute: (
    request: GatewayRequest,
    provider: ProviderName,
    retryCount?: number,
    previousProviders?: ProviderName[],
  ) => Promise<GatewayResponse>;
}

export type MiddlewareNext = () => Promise<GatewayResponse>;

export interface Middleware {
  name: string;
  before?(context: MiddlewareContext): Promise<MiddlewareContext>;
  after?(
    context: MiddlewareContext,
    response: GatewayResponse,
  ): Promise<GatewayResponse>;
  error?(
    context: MiddlewareContext,
    error: Error,
  ): Promise<GatewayResponse | null>;
}

// ---------------------------------------------------------------------------
// Chain execution
// ---------------------------------------------------------------------------

async function executeChain(
  middlewares: Middleware[],
  ctx: MiddlewareContext,
  providerFn: (req: GatewayRequest) => Promise<GatewayResponse>,
  index: number,
): Promise<GatewayResponse> {
  if (index >= middlewares.length) {
    return providerFn(ctx.request);
  }

  const mw = middlewares[index];
  let currentCtx = ctx;

  if (mw.before) {
    currentCtx = await mw.before(currentCtx);
  }

  try {
    const response = await executeChain(
      middlewares,
      currentCtx,
      providerFn,
      index + 1,
    );
    if (mw.after) {
      return await mw.after(currentCtx, response);
    }
    return response;
  } catch (error) {
    if (mw.error) {
      const result = await mw.error(currentCtx, error as Error);
      if (result !== null) return result;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Module-level configuration (set once by the gateway at init)
// ---------------------------------------------------------------------------

let chain: Middleware[] | null = null;

export function setMiddlewareChain(middlewares: Middleware[]): void {
  chain = middlewares;
}

export function getMiddlewareChain(): Middleware[] | null {
  return chain;
}

export async function applyMiddleware(
  request: GatewayRequest,
  provider: BaseProvider,
  context: Omit<
    MiddlewareContext,
    "request" | "provider" | "reExecute" | "metadata"
  >,
): Promise<GatewayResponse> {
  if (!chain || chain.length === 0) {
    const response = await provider.execute(request);
    context.telemetry.record({
      timestamp: context.startTime,
      provider: response.provider,
      model: response.model,
      mode: request.mode,
      latencyMs: Date.now() - context.startTime,
      success: true,
      retryCount: context.retryCount,
      cacheHit: response.cached,
      tokens: response.usage,
    });
    return response;
  }

  const reExecute = async (
    req: GatewayRequest,
    providerName: ProviderName,
    newRetryCount?: number,
    newPreviousProviders?: ProviderName[],
  ): Promise<GatewayResponse> => {
    const target = context.registry.get(providerName);
    if (!target) {
      throw new Error(`Provider "${providerName}" not found in registry`);
    }
    return applyMiddleware(req, target, {
      ...context,
      retryCount: newRetryCount ?? 0,
      previousProviders:
        newPreviousProviders ?? context.previousProviders,
    });
  };

  const ctx: MiddlewareContext = {
    ...context,
    request,
    provider: provider.name,
    metadata: new Map(),
    reExecute,
  };

  try {
    const response = await executeChain(
      chain,
      ctx,
      async (req) => provider.execute(req),
      0,
    );
    context.telemetry.record({
      timestamp: context.startTime,
      provider: response.provider,
      model: response.model,
      mode: request.mode,
      latencyMs: Date.now() - context.startTime,
      success: true,
      retryCount: ctx.retryCount,
      cacheHit: response.cached,
      tokens: response.usage,
    });
    return response;
  } catch (error) {
    context.telemetry.record({
      timestamp: context.startTime,
      provider: ctx.provider,
      model: request.model ?? "unknown",
      mode: request.mode,
      latencyMs: Date.now() - context.startTime,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      retryCount: ctx.retryCount,
      cacheHit: false,
    });
    throw error;
  }
}
