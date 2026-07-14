// AI Gateway - centralized AI interface for SiliconPath

// Core types
export type {
  ProviderName,
  ProviderStatus,
  ProviderConfig,
  ChatMessage,
  ChatChoice,
  ChatUsage,
  EmbeddingVector,
  EmbeddingResult,
  EmbeddingOptions,
} from "./types/provider";

export type { ContentPart } from "./types";

export type {
  GatewayMode,
  GatewayRequest,
  GatewayResponse,
} from "./types/gateway";

// Core singleton
export { gateway, AIGateway } from "./gateway";

// Prompt templates
export { templates, TemplateEngine } from "./prompts";
export type { PromptTemplate } from "./prompts";

// Utilities
export { safeParseJSON, parseWithRetry, hashPrompt, sanitizePrompt, validateResponse, calculateCost, truncate, now, generateId, sleep } from "./utils";

// Telemetry
export { telemetry, TelemetryCollector } from "./telemetry";



// Phase 4 backward-compatible exports
export type { AIProviderName, AIProviderInterface, AIOptions, AIResponse, ProviderQuota, AILogEntry } from "./types/phase4";
export { PROVIDER_ORDER, PROVIDER_MODELS, PROVIDER_ENV_KEYS, PROVIDER_EXTRA_ENV } from "./config/providers";
export { isProviderAvailable, getAvailableProviders } from "./config/availability";
