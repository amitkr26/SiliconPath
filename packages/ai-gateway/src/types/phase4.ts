import type { AIProviderName } from "../config/providers";

export type { AIProviderName };

export interface AIProviderInterface {
  name: AIProviderName;
  call(prompt: string, options?: AIOptions): Promise<AIResponse>;
  isAvailable(): boolean;
  getQuota(): ProviderQuota;
}

export interface AIOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
}

export interface AIResponse {
  text: string;
  provider: AIProviderName;
  model: string;
}

export interface ProviderQuota {
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface AILogEntry {
  feature: string;
  provider: AIProviderName;
  model: string | null;
  promptLength: number;
  responseLength: number;
  success: boolean;
  errorMessage: string | null;
  latencyMs: number;
}
