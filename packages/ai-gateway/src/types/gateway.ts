import type {
  ChatMessage,
  ChatChoice,
  ChatUsage,
  ProviderName,
  ToolDefinition,
  EmbeddingOptions,
  EmbeddingResult,
  ImageGenerationOptions,
  ImageGenerationResult,
  VisionOptions,
  SpeechOptions,
  SpeechResult,
} from "./provider";

export type GatewayMode =
  | "generate"
  | "chat"
  | "stream"
  | "embed"
  | "vision"
  | "image"
  | "speech";

export interface GatewayRequest {
  mode: GatewayMode;
  messages?: ChatMessage[];
  prompt?: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  stream?: boolean;
  feature?: string;
  userId?: string;
  cacheTtl?: number;
  signal?: AbortSignal;
  embedding?: EmbeddingOptions;
  vision?: VisionOptions;
  image?: ImageGenerationOptions;
  speech?: SpeechOptions;
  responseFormat?: "json" | "text";
}

export interface GatewayResponse {
  text?: string;
  message?: ChatMessage;
  choices?: ChatChoice[];
  usage?: ChatUsage;
  provider: ProviderName;
  model: string;
  latencyMs: number;
  cached: boolean;
  streaming?: boolean;
  embedding?: EmbeddingResult;
  image?: ImageGenerationResult;
  speech?: SpeechResult;
}

export interface GatewayError {
  code: string;
  message: string;
  provider: ProviderName;
  model: string;
  retryable: boolean;
  recoverable: boolean;
}
