export type ProviderName =
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "groq"
  | "together"
  | "deepseek"
  | "ollama";

export type ProviderStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ProviderHealth {
  status: ProviderStatus;
  latencyMs: number;
  lastCheckedAt: number;
  consecutiveFailures: number;
  successRate: number;
}

export interface ProviderQuota {
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  lastUsedAt: number | null;
}

export interface ProviderConfig {
  name: ProviderName;
  apiKey: string;
  baseUrl?: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  priority: number;
  weight: number;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  toolCalls?: ToolCall[];
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface EmbeddingVector {
  embedding: number[];
  index: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}

export interface ImageGenerationResult {
  url: string;
  revisedPrompt?: string;
}

export interface VisionOptions {
  imageUrl: string;
  prompt?: string;
  detail?: "low" | "high" | "auto";
}

export interface SpeechOptions {
  text: string;
  voice?: string;
  speed?: number;
  format?: "mp3" | "wav" | "opus";
}

export interface SpeechResult {
  audioData: Buffer;
  format: string;
  durationMs: number;
}

export interface EmbeddingOptions {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResult {
  embeddings: number[][];
  model: string;
  usage: ChatUsage;
}
