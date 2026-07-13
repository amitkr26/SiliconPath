import type {
  ProviderName,
  ProviderConfig,
  ProviderHealth,
  ProviderMetrics,
  ProviderStatus,
} from "../types/provider";
import type { GatewayRequest, GatewayResponse } from "../types/gateway";

export interface BaseProvider {
  readonly name: ProviderName;
  readonly config: ProviderConfig;
  health: ProviderHealth;
  metrics: ProviderMetrics;

  isAvailable(): boolean;
  isHealthy(): boolean;
  checkHealth(): Promise<ProviderHealth>;
  execute(request: GatewayRequest): Promise<GatewayResponse>;
  executeStream(request: GatewayRequest): AsyncIterable<GatewayResponse>;
}

export class ProviderRegistry {
  private providers = new Map<ProviderName, BaseProvider>();

  register(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  unregister(name: ProviderName): void {
    this.providers.delete(name);
  }

  get(name: ProviderName): BaseProvider | null {
    return this.providers.get(name) ?? null;
  }

  getAll(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailable(): BaseProvider[] {
    return this.getAll().filter((p) => p.isAvailable());
  }

  getHealthy(): BaseProvider[] {
    return this.getAll().filter((p) => p.isHealthy() && p.isAvailable());
  }

  getByPriority(): BaseProvider[] {
    return this.getHealthy().sort(
      (a, b) => a.config.priority - b.config.priority,
    );
  }

  getStatus(): Record<ProviderName, ProviderStatus> {
    const status = {} as Record<ProviderName, ProviderStatus>;
    for (const [name, provider] of this.providers) {
      status[name] = provider.health.status;
    }
    return status;
  }

  size(): number {
    return this.providers.size;
  }

  clear(): void {
    this.providers.clear();
  }
}

export const providerRegistry = new ProviderRegistry();
