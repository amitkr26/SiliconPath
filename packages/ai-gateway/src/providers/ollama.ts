import type {
  ChatMessage,
  GatewayRequest,
  GatewayResponse,
  EmbeddingResult,
  EmbeddingVector,
  ChatUsage,
} from "../types";
import type { ProviderConfig } from "../types";
import { BaseProvider } from "./base";

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
    num_ctx?: number;
  };
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: { role: string; content: string };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_p?: number;
    stop?: string[];
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response?: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaEmbedRequest {
  model: string;
  input: string | string[];
}

interface OllamaEmbedResponse {
  embeddings: number[][];
}

interface OllamaTagsResponse {
  models: Array<{ name: string; model: string; size: number }>;
}

export class OllamaProvider extends BaseProvider {
  readonly name = "ollama" as const;

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      apiKey: config.apiKey ?? "",
      defaultModel: config.defaultModel || "llama3.2",
    });
  }

  isAvailable(): boolean {
    return this.config.enabled;
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const start = Date.now();
    const model = options?.model ?? this.getDefaultModel();
    try {
      const ollamaMessages = this.convertMessages(messages);
      const body: OllamaChatRequest = {
        model,
        messages: ollamaMessages,
        stream: false,
      };

      if (options?.temperature !== undefined || options?.maxTokens !== undefined || options?.topP !== undefined) {
        body.options = {};
        if (options.temperature !== undefined) body.options.temperature = options.temperature;
        if (options.maxTokens !== undefined) body.options.num_predict = options.maxTokens;
        if (options.topP !== undefined) body.options.top_p = options.topP;
        if (options.stop) body.options.stop = Array.isArray(options.stop) ? options.stop : [options.stop];
      }

      const data = await this.fetchJson<OllamaChatResponse>("/api/chat", body);
      const latencyMs = Date.now() - start;
      const content = data.message?.content ?? "";
      const usage: ChatUsage = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      };

      this.recordCall(true, latencyMs, usage.promptTokens, usage.completionTokens, 0);
      return this.createResponse(content, model, usage, latencyMs);
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  async generate(
    prompt: string,
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const start = Date.now();
    const model = options?.model ?? this.getDefaultModel();
    try {
      const body: OllamaGenerateRequest = {
        model,
        prompt,
        stream: false,
      };

      if (options?.temperature !== undefined || options?.maxTokens !== undefined || options?.topP !== undefined) {
        body.options = {};
        if (options.temperature !== undefined) body.options.temperature = options.temperature;
        if (options.maxTokens !== undefined) body.options.num_predict = options.maxTokens;
        if (options.topP !== undefined) body.options.top_p = options.topP;
        if (options.stop) body.options.stop = Array.isArray(options.stop) ? options.stop : [options.stop];
      }

      const data = await this.fetchJson<OllamaGenerateResponse>("/api/generate", body);
      const latencyMs = Date.now() - start;
      const content = data.response ?? "";
      const usage: ChatUsage = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      };

      this.recordCall(true, latencyMs, usage.promptTokens, usage.completionTokens, 0);
      return this.createResponse(content, model, usage, latencyMs);
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  async *stream(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): AsyncIterable<GatewayResponse> {
    const model = options?.model ?? this.getDefaultModel();
    const start = Date.now();
    const ollamaMessages = this.convertMessages(messages);
    const body: OllamaChatRequest = {
      model,
      messages: ollamaMessages,
      stream: true,
    };

    if (options?.temperature !== undefined || options?.maxTokens !== undefined || options?.topP !== undefined) {
      body.options = {};
      if (options.temperature !== undefined) body.options.temperature = options.temperature;
      if (options.maxTokens !== undefined) body.options.num_predict = options.maxTokens;
      if (options.topP !== undefined) body.options.top_p = options.topP;
      if (options.stop) body.options.stop = Array.isArray(options.stop) ? options.stop : [options.stop];
    }

    let res: Response;
    try {
      res = await this.makeRequest("/api/chat", body);
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
      return;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`));
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(new Error("No response body"));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let chunk: OllamaChatResponse;
          try {
            chunk = JSON.parse(trimmed) as OllamaChatResponse;
          } catch {
            continue;
          }

          const text = chunk.message?.content ?? "";
          accumulated += text;

          if (chunk.prompt_eval_count) inputTokens = chunk.prompt_eval_count;
          if (chunk.eval_count) outputTokens = chunk.eval_count;

          const latencyMs = Date.now() - start;
          const done = chunk.done;
          const finishReason = done ? "stop" : null;

          yield this.createResponse(
            accumulated,
            model,
            { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens },
            latencyMs,
            finishReason,
          );
        }
      }
    } finally {
      reader.releaseLock();
      const latencyMs = Date.now() - start;
      this.recordCall(true, latencyMs, inputTokens, outputTokens, 0);
    }
  }

  async embed(
    input: string | string[],
    options?: Partial<GatewayRequest>,
  ): Promise<EmbeddingResult> {
    const model = options?.model ?? this.getDefaultModel();
    const inputs = Array.isArray(input) ? input : [input];
    const start = Date.now();

    try {
      const body: OllamaEmbedRequest = {
        model,
        input: inputs.length === 1 ? inputs[0] : inputs,
      };

      const data = await this.fetchJson<OllamaEmbedResponse>("/api/embeddings", body);

      const vectors: EmbeddingVector[] = data.embeddings.map((embedding, index) => ({
        index,
        embedding,
      }));

      const usage: ChatUsage = {
        promptTokens: inputs.length * 100,
        completionTokens: 0,
        totalTokens: inputs.length * 100,
      };

      this.recordCall(true, Date.now() - start, usage.promptTokens, 0, 0);
      return { model, provider: this.name, vectors, usage };
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  protected async makeRequest(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.getTimeout());
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

    try {
      return await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: combinedSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected getHeaders(): Record<string, string> {
    return { "Content-Type": "application/json" };
  }

  protected getCostRates(_model: string): { input: number; output: number } | null {
    return { input: 0, output: 0 };
  }

  private convertMessages(messages: ChatMessage[]): OllamaChatMessage[] {
    const result: OllamaChatMessage[] = [];

    for (const msg of messages) {
      if (typeof msg.content === "string") {
        const ollamaMsg: OllamaChatMessage = {
          role: msg.role === "tool" ? "user" : msg.role,
          content: msg.content,
        };

        if (msg.role === "user" && typeof msg.content === "string") {
          const images: string[] = [];
          const textParts: string[] = [];
          const rawParts = msg.content.match(/!\[.*?\]\((.*?)\)/g);
          if (rawParts) {
            for (const part of rawParts) {
              const urlMatch = part.match(/\((.*?)\)/);
              if (urlMatch) images.push(urlMatch[1]);
            }
            ollamaMsg.content = msg.content.replace(/!\[.*?\]\(.*?\)/g, "").trim();
          }
          if (images.length > 0) ollamaMsg.images = images;
        }

        result.push(ollamaMsg);
      } else {
        let text = "";
        const images: string[] = [];
        for (const part of msg.content) {
          if (part.type === "text" && part.text) {
            text += part.text;
          } else if (part.type === "image_url" && part.image_url) {
            images.push(part.image_url.url);
          }
        }
        const ollamaMsg: OllamaChatMessage = {
          role: msg.role === "tool" ? "user" : msg.role,
          content: text || " ",
        };
        if (images.length > 0) ollamaMsg.images = images;
        result.push(ollamaMsg);
      }
    }

    if (result.length === 0) {
      result.push({ role: "user", content: " " });
    }

    return result;
  }
}
