import type { ProviderName } from "../types";

interface CostRate {
  inputPer1M: number;
  outputPer1M: number;
}

export const COST_RATES: Record<string, CostRate> = {
  "gemini/gemini-1.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "gemini/gemini-1.5-pro": { inputPer1M: 1.25, outputPer1M: 5.0 },
  "gemini/gemini-2.0-flash": { inputPer1M: 0.1, outputPer1M: 0.4 },
  "openai/gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
  "openai/gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "openai/text-embedding-3-small": { inputPer1M: 0.02, outputPer1M: 0 },
  "anthropic/claude-3-5-sonnet": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "anthropic/claude-3-haiku": { inputPer1M: 0.25, outputPer1M: 1.25 },
  "deepseek/deepseek-chat": { inputPer1M: 0.14, outputPer1M: 0.28 },
  "ollama/*": { inputPer1M: 0, outputPer1M: 0 },
  "groq/*": { inputPer1M: 0.1, outputPer1M: 0.7 },
  "together/*": { inputPer1M: 0.1, outputPer1M: 0.3 },
  "openrouter/*": { inputPer1M: 0.1, outputPer1M: 0.3 },
  __default: { inputPer1M: 1.0, outputPer1M: 2.0 },
};

const DEFAULT_RATE: CostRate = { inputPer1M: 1.0, outputPer1M: 2.0 };

interface CostRecord {
  provider: ProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  feature: string;
  timestamp: string;
}

function lookupRate(provider: ProviderName, model: string): CostRate {
  const specific = `${provider}/${model}`;
  if (specific in COST_RATES) {
    return COST_RATES[specific];
  }

  const wildcard = `${provider}/*`;
  if (wildcard in COST_RATES) {
    return COST_RATES[wildcard];
  }

  return DEFAULT_RATE;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

class CostTracker {
  private records: CostRecord[] = [];

  calculateCost(
    provider: ProviderName,
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const rate = lookupRate(provider, model);
    const inputCost = (inputTokens / 1_000_000) * rate.inputPer1M;
    const outputCost = (outputTokens / 1_000_000) * rate.outputPer1M;
    return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
  }

  recordCost(
    provider: ProviderName,
    model: string,
    inputTokens: number,
    outputTokens: number,
    feature?: string,
  ): void {
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);
    this.records.push({
      provider,
      model,
      inputTokens,
      outputTokens,
      cost,
      feature: feature ?? "unknown",
      timestamp: todayKey(),
    });
  }

  getTotalCost(): number {
    let total = 0;
    for (const record of this.records) {
      total += record.cost;
    }
    return Math.round(total * 1_000_000) / 1_000_000;
  }

  getCostByProvider(): Record<string, number> {
    const byProvider: Record<string, number> = {};
    for (const record of this.records) {
      const key = record.provider;
      byProvider[key] = (byProvider[key] ?? 0) + record.cost;
    }
    for (const key of Object.keys(byProvider)) {
      byProvider[key] = Math.round(byProvider[key]! * 1_000_000) / 1_000_000;
    }
    return byProvider;
  }

  getCostByFeature(): Record<string, number> {
    const byFeature: Record<string, number> = {};
    for (const record of this.records) {
      const key = record.feature;
      byFeature[key] = (byFeature[key] ?? 0) + record.cost;
    }
    for (const key of Object.keys(byFeature)) {
      byFeature[key] = Math.round(byFeature[key]! * 1_000_000) / 1_000_000;
    }
    return byFeature;
  }

  getCostByDay(days: number): Record<string, number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const byDay: Record<string, number> = {};
    for (const record of this.records) {
      if (record.timestamp >= cutoffStr) {
        byDay[record.timestamp] = (byDay[record.timestamp] ?? 0) + record.cost;
      }
    }
    for (const key of Object.keys(byDay)) {
      byDay[key] = Math.round(byDay[key]! * 1_000_000) / 1_000_000;
    }
    return byDay;
  }

  getProjectedCost(days: number): number {
    if (this.records.length === 0) return 0;

    const timestamps = this.records.map((r) => new Date(r.timestamp).getTime());
    const earliest = Math.min(...timestamps);
    const now = Date.now();
    const elapsedDays = Math.max((now - earliest) / (24 * 60 * 60 * 1000), 1);

    const totalCost = this.getTotalCost();
    const dailyRate = totalCost / elapsedDays;
    return Math.round(dailyRate * days * 1_000_000) / 1_000_000;
  }

  reset(): void {
    this.records = [];
  }
}

export const costTracker = new CostTracker();
export { CostTracker };
