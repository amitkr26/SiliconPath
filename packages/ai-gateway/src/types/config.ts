import type { ProviderName } from "./provider";

export interface AIGatewayConfig {
  fallbackOrder: ProviderName[];
  defaultModel: string;
  defaultMaxTokens: number;
  defaultTemperature: number;
  globalTimeoutMs: number;
  globalMaxRetries: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
  rateLimitPerMinute: number;
  queueMaxSize: number;
  healthCheckIntervalMs: number;
  logLevel: "debug" | "info" | "warn" | "error";
  analyticsEnabled: boolean;
  analyticsDbUrl?: string;
}
