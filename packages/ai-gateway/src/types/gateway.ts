import type { ChatMessage } from "./provider";

export type GatewayMode = "generate" | "chat" | "embed";

export interface GatewayRequest {
  mode?: GatewayMode;
  messages: ChatMessage[];
  model?: string;
  signal?: AbortSignal;
  systemPrompt?: string;
}

export interface GatewayResponse {
  choices: { index: number; message: ChatMessage; finishReason: string }[];
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  latency: number;
  provider: string;
  error?: string;
}
