import type { SourceHealth } from "../types";

interface SourceRecord {
  successes: number;
  failures: number;
  totalLatencyMs: number;
  lastError: string | null;
  lastSuccessAt: string | null;
}

export class EngineHealth {
  private readonly records = new Map<string, SourceRecord>();

  recordSuccess(sourceId: string, durationMs: number): void {
    const record = this.getOrCreate(sourceId);
    record.successes++;
    record.totalLatencyMs += durationMs;
    record.lastSuccessAt = new Date().toISOString();
  }

  recordFailure(sourceId: string, error: string): void {
    const record = this.getOrCreate(sourceId);
    record.failures++;
    record.lastError = error;
  }

  getSourceHealth(sourceId: string): {
    successRate: number;
    avgLatencyMs: number;
    lastError: string | null;
    lastSuccessAt: string | null;
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
  } {
    const record = this.records.get(sourceId);
    if (!record) {
      return {
        successRate: 0,
        avgLatencyMs: 0,
        lastError: null,
        lastSuccessAt: null,
        status: "unknown",
      };
    }

    const total = record.successes + record.failures;
    const successRate = total > 0 ? record.successes / total : 0;
    const avgLatencyMs =
      record.successes > 0
        ? Math.round(record.totalLatencyMs / record.successes)
        : 0;

    let status: "healthy" | "degraded" | "unhealthy" | "unknown";
    if (total === 0) {
      status = "unknown";
    } else if (successRate >= 0.95) {
      status = "healthy";
    } else if (successRate >= 0.7) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      successRate: Math.round(successRate * 100) / 100,
      avgLatencyMs,
      lastError: record.lastError,
      lastSuccessAt: record.lastSuccessAt,
      status,
    };
  }

  getAggregateHealth(): {
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    total: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let unknown = 0;

    for (const [sourceId] of this.records) {
      const h = this.getSourceHealth(sourceId);
      switch (h.status) {
        case "healthy":
          healthy++;
          break;
        case "degraded":
          degraded++;
          break;
        case "unhealthy":
          unhealthy++;
          break;
        default:
          unknown++;
          break;
      }
    }

    return {
      healthy,
      degraded,
      unhealthy,
      unknown,
      total: healthy + degraded + unhealthy + unknown,
    };
  }

  private getOrCreate(sourceId: string): SourceRecord {
    let record = this.records.get(sourceId);
    if (!record) {
      record = {
        successes: 0,
        failures: 0,
        totalLatencyMs: 0,
        lastError: null,
        lastSuccessAt: null,
      };
      this.records.set(sourceId, record);
    }
    return record;
  }
}
