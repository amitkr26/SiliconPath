import type {
  ProviderName,
  ProviderStatus,
  ProviderMetrics,
  ProviderHealth,
  ProviderQuota,
} from "./provider";
import type { GatewayMode } from "./gateway";

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  provider: ProviderName;
  model: string;
  mode: GatewayMode;
  feature?: string;
  userId?: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number;
  success: boolean;
  cached: boolean;
  retries: number;
  fallbackChain: ProviderName[];
  errorCode?: string;
  errorMessage?: string;
}

export interface HealthReport {
  provider: ProviderName;
  status: ProviderStatus;
  metrics: ProviderMetrics;
  health: ProviderHealth;
  quota: ProviderQuota | null;
}

export interface CostBreakdown {
  totalCost: number;
  byProvider: Record<string, number>;
  byFeature: Record<string, number>;
  byDay: Record<string, number>;
  periodStart: string;
  periodEnd: string;
}
