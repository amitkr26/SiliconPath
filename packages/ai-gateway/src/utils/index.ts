import type { ZodSchema } from "zod";
import type { ProviderName } from "../types/provider";

export { hashPrompt } from "./hash";
export { sanitizePrompt } from "./sanitize";

const COST_PER_1K_TOKENS: Record<ProviderName, { input: number; output: number }> = {
  gemini: { input: 0.000075, output: 0.0003 },
  openai: { input: 0.005, output: 0.015 },
  anthropic: { input: 0.003, output: 0.015 },
  openrouter: { input: 0.0001, output: 0.0003 },
  groq: { input: 0.00005, output: 0.0001 },
  together: { input: 0.0001, output: 0.0003 },
  deepseek: { input: 0.00014, output: 0.00028 },
  ollama: { input: 0, output: 0 },
};

export function validateResponse<T>(data: unknown, schema: ZodSchema<T>): T {
  return schema.parse(data);
}

export function calculateCost(
  provider: ProviderName,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  void model;
  const rates = COST_PER_1K_TOKENS[provider];
  return (inputTokens * rates.input + outputTokens * rates.output) / 1000;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function now(): number {
  return Date.now();
}

export function generateId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
