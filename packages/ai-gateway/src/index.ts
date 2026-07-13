export type AIProviderName =
  | "bedrock"
  | "groq"
  | "nvidia"
  | "gemini"
  | "openrouter"
  | "cloudflare"
  | "huggingface";

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

export const PROVIDER_ORDER: AIProviderName[] = [
  "groq",
  "openrouter",
  "cloudflare",
  "gemini",
  "nvidia",
  "bedrock",
  "huggingface",
];

export const PROVIDER_MODELS: Record<AIProviderName, string> = {
  bedrock: "openai.gpt-oss-120b",
  groq: "llama-3.1-8b-instant",
  nvidia: "meta/llama-3.1-8b-instruct",
  gemini: "gemini-1.5-flash",
  openrouter: "meta-llama/llama-3.1-8b-instruct:free",
  cloudflare: "@cf/meta/llama-3.1-8b-instruct",
  huggingface: "mistralai/Mistral-7B-Instruct-v0.3",
};

export const PROVIDER_ENV_KEYS: Record<AIProviderName, string> = {
  bedrock: "AWS_BEARER_TOKEN_BEDROCK",
  groq: "GROQ_API_KEY",
  nvidia: "NVIDIA_NIM_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  cloudflare: "CLOUDFLARE_AI_TOKEN",
  huggingface: "HUGGINGFACE_API_KEY",
};

export const PROVIDER_EXTRA_ENV: Partial<Record<AIProviderName, string>> = {
  cloudflare: "CLOUDFLARE_ACCOUNT_ID",
};

export function isProviderAvailable(name: AIProviderName): boolean {
  const key = PROVIDER_ENV_KEYS[name];
  if (!process.env[key]) return false;
  const extra = PROVIDER_EXTRA_ENV[name];
  if (extra && !process.env[extra]) return false;
  return true;
}

export function getAvailableProviders(): AIProviderName[] {
  return PROVIDER_ORDER.filter(isProviderAvailable);
}

export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }

  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      /* fall through */
    }
  }

  const trimmed = raw
    .replace(/^(Here's|Here is|The|This|I've|Based on|Sure)[\s\S]*?[:\n]/i, "")
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  return fallback;
}

export async function parseWithRetry<T>(
  raw: string,
  retryFn: () => Promise<string>,
  fallback: T,
  maxRetries = 1
): Promise<T> {
  const first = safeParseJSON<T | null>(raw, null);
  if (first !== null) return first as T;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const retry = await retryFn();
      const parsed = safeParseJSON<T | null>(retry, null);
      if (parsed !== null) return parsed as T;
    } catch {
      /* try again */
    }
  }

  return fallback;
}
