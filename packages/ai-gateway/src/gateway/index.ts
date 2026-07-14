import type { ChatMessage } from "../types/provider";
import type { GatewayRequest, GatewayMode, GatewayResponse } from "../types/gateway";

const DEFAULT_TIMEOUT = 30_000;

export class AIGateway {
  async generate(request: GatewayRequest): Promise<GatewayResponse> {
    const { messages, model, signal } = request;
    if (!messages || messages.length === 0) {
      return { choices: [], error: "No messages provided", usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, latency: 0, provider: "none" };
    }
    const providerName = this.selectProvider();
    const start = Date.now();

    try {
      const text = await this.callProvider(providerName, messages, { model: model || "gemini-1.5-flash", signal });
      const elapsed = Date.now() - start;
      return {
        choices: [{ index: 0, message: { role: "assistant", content: text }, finishReason: "stop" }],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        latency: elapsed,
        provider: providerName,
      };
    } catch (error) {
      return {
        choices: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        latency: Date.now() - start,
        provider: providerName,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private selectProvider(): string {
    if (process.env.GROQ_API_KEY) return "groq";
    if (process.env.GEMINI_API_KEY) return "gemini";
    if (process.env.OPENROUTER_API_KEY) return "openrouter";
    return "none";
  }

  private async callProvider(provider: string, messages: ChatMessage[], options: { model: string; signal?: AbortSignal }): Promise<string> {
    const TIMEOUT_MS = DEFAULT_TIMEOUT;

    if (provider === "gemini") {
      const promptText = messages.map(m => m.content).join("\n");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { maxOutputTokens: 1024, temperature: 0.3 } }),
        signal: options.signal || AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const body = JSON.stringify({ model: options.model, messages, max_tokens: 1024, temperature: 0.3 });
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let url = "";

    switch (provider) {
      case "groq":
        url = "https://api.groq.com/openai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${process.env.GROQ_API_KEY}`;
        break;
      case "openrouter":
        url = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
        headers["HTTP-Referer"] = "https://siliconpath.vercel.app";
        break;
      case "bedrock":
        url = "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions";
        headers["Authorization"] = `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`;
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    const res = await fetch(url, { method: "POST", headers, body, signal: options.signal || AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`${provider} error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export const gateway = new AIGateway();
