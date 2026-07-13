import type { ProviderName, ProviderHealth } from "../types";
import { healthMonitor } from "../telemetry/health";

const DEFAULT_INTERVAL_MS = 60_000;

const PROVIDER_ENDPOINTS: Record<ProviderName, string | null> = {
  gemini: "https://generativelanguage.googleapis.com/v1/models",
  openai: "https://api.openai.com/v1/models",
  anthropic: "https://api.anthropic.com/v1/messages",
  openrouter: "https://openrouter.ai/api/v1/models",
  groq: "https://api.groq.com/openai/v1/models",
  together: "https://api.together.xyz/v1/models",
  deepseek: "https://api.deepseek.com/v1/models",
  ollama: "http://localhost:11434/api/tags",
};

async function probeProvider(provider: ProviderName): Promise<{ success: boolean; latencyMs: number }> {
  const endpoint = PROVIDER_ENDPOINTS[provider];
  if (!endpoint) {
    return { success: false, latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    return { success: response.ok || response.status === 401 || response.status === 403, latencyMs };
  } catch {
    const latencyMs = Date.now() - start;
    return { success: false, latencyMs };
  }
}

class HealthCheckService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastChecks = new Map<ProviderName, ProviderHealth>();
  private intervalMs = DEFAULT_INTERVAL_MS;

  start(): void {
    if (this.running) return;
    this.running = true;

    this.runCheck();

    this.timer = setInterval(() => {
      this.runCheck();
    }, this.intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkProvider(name: ProviderName): Promise<ProviderHealth> {
    const { success, latencyMs } = await probeProvider(name);

    if (success) {
      healthMonitor.recordSuccess(name, latencyMs);
    } else {
      healthMonitor.recordFailure(name, "HEALTH_CHECK_FAILED");
    }

    const health = healthMonitor.getHealth(name);
    this.lastChecks.set(name, health);

    const prevHealth = this.lastChecks.get(name);
    if (prevHealth && prevHealth.status !== health.status) {
      console.log(
        JSON.stringify({
          level: health.status === "unhealthy" ? "error" : "warn",
          message: `[HealthCheck] Provider "${name}" status: ${prevHealth.status} → ${health.status}`,
          provider: name,
          latencyMs,
          success,
        }),
      );
    }

    return health;
  }

  async checkAll(): Promise<Record<ProviderName, ProviderHealth>> {
    const providers: ProviderName[] = [
      "gemini",
      "openai",
      "anthropic",
      "openrouter",
      "groq",
      "together",
      "deepseek",
      "ollama",
    ];

    const results = await Promise.allSettled(
      providers.map(async (name) => {
        const health = await this.checkProvider(name);
        return { name, health };
      }),
    );

    const record = {} as Record<ProviderName, ProviderHealth>;
    for (const result of results) {
      if (result.status === "fulfilled") {
        record[result.value.name] = result.value.health;
      }
    }

    return record;
  }

  getLastCheck(provider: ProviderName): ProviderHealth | null {
    return this.lastChecks.get(provider) ?? null;
  }

  isRunning(): boolean {
    return this.running;
  }

  private async runCheck(): Promise<void> {
    try {
      await this.checkAll();
    } catch (err) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "[HealthCheck] Periodic check failed",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
}

export const healthCheckService = new HealthCheckService();
export { HealthCheckService };
