import type { ProviderName } from "../types";

interface TokenEntry {
  provider: ProviderName;
  model: string;
  inputTokens: number;
  outputTokens: number;
  feature: string;
  userId: string;
  timestamp: string;
}

interface TokenCounts {
  input: number;
  output: number;
}

function addCounts(target: TokenCounts, input: number, output: number): void {
  target.input += input;
  target.output += output;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

class UsageTracker {
  private entries: TokenEntry[] = [];

  recordUsage(
    provider: ProviderName,
    model: string,
    inputTokens: number,
    outputTokens: number,
    feature?: string,
    userId?: string,
  ): void {
    this.entries.push({
      provider,
      model,
      inputTokens,
      outputTokens,
      feature: feature ?? "unknown",
      userId: userId ?? "anonymous",
      timestamp: todayKey(),
    });
  }

  getTotalTokens(): { input: number; output: number; total: number } {
    let input = 0;
    let output = 0;
    for (const entry of this.entries) {
      input += entry.inputTokens;
      output += entry.outputTokens;
    }
    return { input, output, total: input + output };
  }

  getTokensByProvider(): Record<string, { input: number; output: number }> {
    const result: Record<string, { input: number; output: number }> = {};
    for (const entry of this.entries) {
      if (!result[entry.provider]) {
        result[entry.provider] = { input: 0, output: 0 };
      }
      addCounts(result[entry.provider], entry.inputTokens, entry.outputTokens);
    }
    return result;
  }

  getTokensByFeature(): Record<string, { input: number; output: number }> {
    const result: Record<string, { input: number; output: number }> = {};
    for (const entry of this.entries) {
      if (!result[entry.feature]) {
        result[entry.feature] = { input: 0, output: 0 };
      }
      addCounts(result[entry.feature], entry.inputTokens, entry.outputTokens);
    }
    return result;
  }

  getTokensByUser(): Record<string, { input: number; output: number }> {
    const result: Record<string, { input: number; output: number }> = {};
    for (const entry of this.entries) {
      if (!result[entry.userId]) {
        result[entry.userId] = { input: 0, output: 0 };
      }
      addCounts(result[entry.userId], entry.inputTokens, entry.outputTokens);
    }
    return result;
  }

  getTokensByDay(days: number): Record<string, { input: number; output: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const result: Record<string, { input: number; output: number }> = {};
    for (const entry of this.entries) {
      if (entry.timestamp >= cutoffStr) {
        if (!result[entry.timestamp]) {
          result[entry.timestamp] = { input: 0, output: 0 };
        }
        addCounts(result[entry.timestamp], entry.inputTokens, entry.outputTokens);
      }
    }
    return result;
  }

  getProviderRanking(): Array<{
    provider: string;
    totalTokens: number;
    totalCost: number;
  }> {
    const byProvider = this.getTokensByProvider();
    const costByProvider: Record<string, number> = {};

    for (const entry of this.entries) {
      const key = entry.provider;
      const tokenCost =
        (entry.inputTokens / 1_000_000) * 1.0 +
        (entry.outputTokens / 1_000_000) * 2.0;
      costByProvider[key] = (costByProvider[key] ?? 0) + tokenCost;
    }

    const ranking: Array<{
      provider: string;
      totalTokens: number;
      totalCost: number;
    }> = [];

    for (const [provider, counts] of Object.entries(byProvider)) {
      ranking.push({
        provider,
        totalTokens: counts.input + counts.output,
        totalCost: Math.round((costByProvider[provider] ?? 0) * 1_000_000) / 1_000_000,
      });
    }

    ranking.sort((a, b) => b.totalTokens - a.totalTokens);
    return ranking;
  }

  reset(): void {
    this.entries = [];
  }
}

export const usageTracker = new UsageTracker();
export { UsageTracker };
