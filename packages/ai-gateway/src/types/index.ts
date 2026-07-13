export type ProviderName =
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "groq"
  | "together"
  | "deepseek"
  | "ollama";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentPart[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string; detail?: "auto" | "low" | "high" };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GatewayRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string | string[];
  stream?: boolean;
  tools?: ToolDefinition[];
  tool_choice?: "auto" | "none" | "required" | { type: "function"; function: { name: string } };
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  user?: string;
}

export interface GatewayResponse {
  id: string;
  model: string;
  provider: ProviderName;
  content: string;
  role: "assistant";
  finishReason: string | null;
  usage: ChatUsage;
  toolCalls?: ToolCall[];
  latencyMs: number;
}

export interface ProviderConfig {
  name: ProviderName;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface EmbeddingVector {
  index: number;
  embedding: number[];
}

export interface EmbeddingResult {
  model: string;
  provider: ProviderName;
  vectors: EmbeddingVector[];
  usage: ChatUsage;
}

export interface ImageGenerationResult {
  model: string;
  provider: ProviderName;
  images: Array<{
    url?: string;
    b64Json?: string;
    revisedPrompt?: string;
  }>;
  latencyMs: number;
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  responseFormat?: "url" | "b64_json";
}

export interface VisionOptions {
  prompt: string;
  images: string[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface SpeechOptions {
  input: string;
  model?: string;
  voice?: string;
  responseFormat?: "mp3" | "opus" | "aac" | "flac";
  speed?: number;
}

export interface SpeechResult {
  audio: ArrayBuffer;
  model: string;
  provider: ProviderName;
  format: string;
}

export type { ProviderStatus, ProviderHealth, ProviderQuota, ProviderMetrics, ChatChoice, EmbeddingOptions } from "./provider";
export type { GatewayMode } from "./gateway";
export type { TelemetryEvent, HealthReport, CostBreakdown } from "./telemetry";
export type { AIGatewayConfig } from "./config";
