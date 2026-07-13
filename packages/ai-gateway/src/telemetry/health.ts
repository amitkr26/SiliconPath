import type { ProviderName, ProviderHealth, ProviderStatus } from "../types";

const MAX_RECORDED_REQUESTS = 100;

interface RequestRecord {
  success: boolean;
  latencyMs: number;
  timestamp: number;
}

interface ProviderRecord {
  requests: RequestRecord[];
  consecutiveFailures: number;
  totalLatencyMs: number;
}

function createEmptyRecord(): ProviderRecord {
  return { requests: [], consecutiveFailures: 0, totalLatencyMs: 0 };
}

function computeHealth(record: ProviderRecord): ProviderHealth {
  const now = Date.now();

  if (record.requests.length === 0) {
    return {
      status: "unknown",
      latencyMs: 0,
      lastCheckedAt: now,
      consecutiveFailures: 0,
      successRate: 1,
    };
  }

  const successes = record.requests.filter((r) => r.success).length;
  const successRate = successes / record.requests.length;
  const avgLatency = record.totalLatencyMs / record.requests.length;

  let status: ProviderStatus;
  if (successRate < 0.5 || record.consecutiveFailures > 5) {
    status = "unhealthy";
  } else if (successRate < 0.8 || record.consecutiveFailures > 2) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  return {
    status,
    latencyMs: Math.round(avgLatency * 100) / 100,
    lastCheckedAt: now,
    consecutiveFailures: record.consecutiveFailures,
    successRate: Math.round(successRate * 10000) / 10000,
  };
}

const ALL_PROVIDERS: ProviderName[] = [
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
  "groq",
  "together",
  "deepseek",
  "ollama",
];

class HealthMonitor {
  private records = new Map<ProviderName, ProviderRecord>();
  private periodicTimer: ReturnType<typeof setInterval> | null = null;
  private lastStatuses = new Map<ProviderName, ProviderStatus>();

  private getRecord(provider: ProviderName): ProviderRecord {
    let record = this.records.get(provider);
    if (!record) {
      record = createEmptyRecord();
      this.records.set(provider, record);
    }
    return record;
  }

  private addRequest(provider: ProviderName, success: boolean, latencyMs: number): void {
    const record = this.getRecord(provider);

    record.requests.push({ success, latencyMs, timestamp: Date.now() });

    if (success) {
      record.consecutiveFailures = 0;
    } else {
      record.consecutiveFailures++;
    }

    record.totalLatencyMs += latencyMs;

    while (record.requests.length > MAX_RECORDED_REQUESTS) {
      const removed = record.requests.shift()!;
      record.totalLatencyMs -= removed.latencyMs;
    }
  }

  recordSuccess(provider: ProviderName, latencyMs: number): void {
    this.addRequest(provider, true, latencyMs);
  }

  recordFailure(provider: ProviderName, errorCode: string): void {
    void errorCode;
    this.addRequest(provider, false, 0);
  }

  recordTimeout(provider: ProviderName): void {
    this.addRequest(provider, false, 0);
  }

  getHealth(provider: ProviderName): ProviderHealth {
    return computeHealth(this.getRecord(provider));
  }

  getAllHealth(): Record<ProviderName, ProviderHealth> {
    const result = {} as Record<ProviderName, ProviderHealth>;
    for (const provider of ALL_PROVIDERS) {
      result[provider] = this.getHealth(provider);
    }
    return result;
  }

  getStatus(provider: ProviderName): ProviderStatus {
    return this.getHealth(provider).status;
  }

  isHealthy(provider: ProviderName): boolean {
    return this.getStatus(provider) === "healthy";
  }

  isAvailable(provider: ProviderName): boolean {
    const status = this.getStatus(provider);
    return status === "healthy" || status === "degraded" || status === "unknown";
  }

  reset(provider: ProviderName): void {
    this.records.delete(provider);
    this.lastStatuses.delete(provider);
  }

  resetAll(): void {
    this.records.clear();
    this.lastStatuses.clear();
  }

  getAggregateHealth(): {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  } {
    const all = this.getAllHealth();
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const health of Object.values(all)) {
      switch (health.status) {
        case "healthy":
          healthy++;
          break;
        case "degraded":
          degraded++;
          break;
        case "unhealthy":
          unhealthy++;
          break;
      }
    }

    return { healthy, degraded, unhealthy, total: ALL_PROVIDERS.length };
  }

  startPeriodicCheck(intervalMs: number): void {
    this.stopPeriodicCheck();

    this.periodicTimer = setInterval(() => {
      for (const provider of ALL_PROVIDERS) {
        const current = this.getStatus(provider);
        const previous = this.lastStatuses.get(provider);

        if (previous !== undefined && previous !== current) {
          console.log(
            JSON.stringify({
              level: current === "unhealthy" ? "error" : "warn",
              message: `[Health] Provider "${provider}" status changed: ${previous} → ${current}`,
              provider,
              previousStatus: previous,
              currentStatus: current,
              health: this.getHealth(provider),
            }),
          );
        }

        this.lastStatuses.set(provider, current);
      }

      const aggregate = this.getAggregateHealth();
      console.log(
        JSON.stringify({
          level: "info",
          message: "[Health] Aggregate status",
          ...aggregate,
        }),
      );
    }, intervalMs);
  }

  stopPeriodicCheck(): void {
    if (this.periodicTimer !== null) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }
}

export const healthMonitor = new HealthMonitor();
export { HealthMonitor };
