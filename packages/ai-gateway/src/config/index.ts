import type { ProviderName, ProviderConfig } from "../types/provider";
import type { AIGatewayConfig } from "../types/config";

const DEFAULT_FALLBACK_ORDER: ProviderName[] = [
  "gemini",
  "openai",
  "anthropic",
  "openrouter",
  "groq",
  "together",
  "deepseek",
  "ollama",
];

const PROVIDER_ENV_KEYS: Record<ProviderName, string> = {
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  groq: "GROQ_API_KEY",
  together: "TOGETHER_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  ollama: "OLLAMA_API_KEY",
};

const DEFAULT_MODELS: Record<ProviderName, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  openrouter: "meta-llama/llama-3.1-8b-instruct:free",
  groq: "llama-3.1-8b-instant",
  together: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  deepseek: "deepseek-chat",
  ollama: "llama3.1:8b",
};

const DEFAULT_BASE_URLS: Partial<Record<ProviderName, string>> = {
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
  deepseek: "https://api.deepseek.com/v1",
  together: "https://api.together.xyz/v1",
};

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

function parseFallbackOrder(): ProviderName[] {
  const raw = process.env.AI_GATEWAY_FALLBACK_ORDER;
  if (!raw) return [...DEFAULT_FALLBACK_ORDER];
  const parsed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0) as ProviderName[];
  return parsed.length > 0 ? parsed : [...DEFAULT_FALLBACK_ORDER];
}

export const DEFAULT_CONFIG: AIGatewayConfig = {
  fallbackOrder: [...DEFAULT_FALLBACK_ORDER],
  defaultModel: "gemini-2.0-flash",
  defaultMaxTokens: 4096,
  defaultTemperature: 0.7,
  globalTimeoutMs: 30_000,
  globalMaxRetries: 2,
  cacheEnabled: true,
  cacheTtlMs: 60_000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60_000,
  rateLimitPerMinute: 60,
  queueMaxSize: 100,
  healthCheckIntervalMs: 30_000,
  logLevel: "info",
  analyticsEnabled: true,
};

export function loadConfig(): AIGatewayConfig {
  return {
    fallbackOrder: parseFallbackOrder(),
    defaultModel: envStr("AI_GATEWAY_DEFAULT_MODEL", DEFAULT_CONFIG.defaultModel),
    defaultMaxTokens: envInt("AI_GATEWAY_DEFAULT_MAX_TOKENS", DEFAULT_CONFIG.defaultMaxTokens),
    defaultTemperature: envInt("AI_GATEWAY_DEFAULT_TEMPERATURE", DEFAULT_CONFIG.defaultTemperature),
    globalTimeoutMs: envInt("AI_GATEWAY_GLOBAL_TIMEOUT_MS", DEFAULT_CONFIG.globalTimeoutMs),
    globalMaxRetries: envInt("AI_GATEWAY_GLOBAL_MAX_RETRIES", DEFAULT_CONFIG.globalMaxRetries),
    cacheEnabled: envBool("AI_GATEWAY_CACHE_ENABLED", DEFAULT_CONFIG.cacheEnabled),
    cacheTtlMs: envInt("AI_GATEWAY_CACHE_TTL_MS", DEFAULT_CONFIG.cacheTtlMs),
    circuitBreakerThreshold: envInt(
      "AI_GATEWAY_CIRCUIT_BREAKER_THRESHOLD",
      DEFAULT_CONFIG.circuitBreakerThreshold,
    ),
    circuitBreakerResetMs: envInt(
      "AI_GATEWAY_CIRCUIT_BREAKER_RESET_MS",
      DEFAULT_CONFIG.circuitBreakerResetMs,
    ),
    rateLimitPerMinute: envInt("AI_GATEWAY_RATE_LIMIT_PER_MINUTE", DEFAULT_CONFIG.rateLimitPerMinute),
    queueMaxSize: envInt("AI_GATEWAY_QUEUE_MAX_SIZE", DEFAULT_CONFIG.queueMaxSize),
    healthCheckIntervalMs: envInt(
      "AI_GATEWAY_HEALTH_CHECK_INTERVAL_MS",
      DEFAULT_CONFIG.healthCheckIntervalMs,
    ),
    logLevel: envStr("AI_GATEWAY_LOG_LEVEL", DEFAULT_CONFIG.logLevel) as AIGatewayConfig["logLevel"],
    analyticsEnabled: envBool("AI_GATEWAY_ANALYTICS_ENABLED", DEFAULT_CONFIG.analyticsEnabled),
    analyticsDbUrl: process.env.AI_GATEWAY_ANALYTICS_DB_URL,
  };
}

export function getApiKey(name: ProviderName): string | null {
  const envKey = PROVIDER_ENV_KEYS[name];
  if (!envKey) return null;
  return process.env[envKey] ?? null;
}

export function loadProviderConfig(name: ProviderName): ProviderConfig | null {
  const apiKey = getApiKey(name);
  if (!apiKey) return null;

  const base = DEFAULT_BASE_URLS[name];

  return {
    name,
    apiKey,
    ...(base ? { baseUrl: base } : {}),
    model: envStr(`AI_GATEWAY_${name.toUpperCase()}_MODEL`, DEFAULT_MODELS[name]),
    timeoutMs: envInt(`AI_GATEWAY_${name.toUpperCase()}_TIMEOUT_MS`, 30_000),
    maxRetries: envInt(`AI_GATEWAY_${name.toUpperCase()}_MAX_RETRIES`, 2),
    priority: envInt(`AI_GATEWAY_${name.toUpperCase()}_PRIORITY`, 0),
    weight: envInt(`AI_GATEWAY_${name.toUpperCase()}_WEIGHT`, 1),
    maxTokens: envInt(`AI_GATEWAY_${name.toUpperCase()}_MAX_TOKENS`, 4096),
    temperature: envInt(`AI_GATEWAY_${name.toUpperCase()}_TEMPERATURE`, 7) / 10,
    enabled: envBool(`AI_GATEWAY_${name.toUpperCase()}_ENABLED`, true),
  };
}
