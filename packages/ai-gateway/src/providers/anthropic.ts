import type {
  ChatMessage,
  GatewayRequest,
  GatewayResponse,
  EmbeddingResult,
  ChatUsage,
  ToolCall,
  VisionOptions,
} from "../types";
import type { ProviderConfig } from "../types";
import { BaseProvider } from "./base";

const ANTHROPIC_COST_RATES: Record<string, { input: number; output: number }> = {
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-latest": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
  "claude-4-opus": { input: 15.0, output: 75.0 },
  "claude-4-sonnet": { input: 3.0, output: 15.0 },
};

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; source?: unknown }>;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: {
    type?: string;
    text?: string;
    stop_reason?: string;
    content_block_index?: number;
    partial_json?: string;
  };
  message?: {
    id: string;
    model: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  content_block?: {
    type: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  };
}

export class AnthropicProvider extends BaseProvider {
  readonly name = "anthropic" as const;

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || "https://api.anthropic.com/v1",
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      defaultModel: config.defaultModel || "claude-3-5-sonnet-20241022",
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const start = Date.now();
    const model = options?.model ?? this.getDefaultModel();
    try {
      const { system, msgs } = this.convertMessages(messages);
      const body = this.buildRequestBody(msgs, system, options);
      const data = await this.fetchJson<AnthropicResponse>("/messages", body);
      const response = this.parseResponse(data, model, Date.now() - start);
      this.recordCall(
        true,
        response.latencyMs,
        response.usage.promptTokens,
        response.usage.completionTokens,
        this.calculateCost(model, response.usage.promptTokens, response.usage.completionTokens),
      );
      return response;
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  async generate(
    prompt: string,
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    return this.chat([{ role: "user", content: prompt }], options);
  }

  async *stream(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): AsyncIterable<GatewayResponse> {
    const model = options?.model ?? this.getDefaultModel();
    const start = Date.now();
    const { system, msgs } = this.convertMessages(messages);
    const body = this.buildRequestBody(msgs, system, { ...options, stream: true });

    let res: Response;
    try {
      res = await this.makeRequest("/messages", body);
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

    let accumulated = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let finishReason: string | null = null;
    const toolCalls: ToolCall[] = [];

    try {
      for await (const raw of this.parseSseStream(res)) {
        let event: AnthropicStreamEvent;
        try {
          event = JSON.parse(raw) as AnthropicStreamEvent;
        } catch {
          continue;
        }

        switch (event.type) {
          case "message_start":
            if (event.message?.usage) {
              inputTokens = event.message.usage.input_tokens;
            }
            break;

          case "content_block_start":
            if (event.content_block?.type === "tool_use") {
              toolCalls.push({
                id: event.content_block.id ?? `call_${Date.now()}`,
                type: "function",
                function: {
                  name: event.content_block.name ?? "",
                  arguments: "",
                },
              });
            }
            break;

          case "content_block_delta":
            if (event.delta?.type === "text_delta" && event.delta.text) {
              accumulated += event.delta.text;
            } else if (event.delta?.type === "input_json_delta" && event.delta.partial_json) {
              if (toolCalls.length > 0) {
                toolCalls[toolCalls.length - 1].function.arguments += event.delta.partial_json;
              }
            }
            break;

          case "content_block_stop":
            break;

          case "message_delta":
            if (event.delta?.stop_reason) {
              finishReason = event.delta.stop_reason;
            }
            if (event.usage?.output_tokens) {
              outputTokens = event.usage.output_tokens;
            }
            break;

          case "message_stop":
            break;
        }
      }
    } finally {
      const latencyMs = Date.now() - start;
      const usage: ChatUsage = {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      };

      this.recordCall(
        true,
        latencyMs,
        inputTokens,
        outputTokens,
        this.calculateCost(model, inputTokens, outputTokens),
      );

      yield this.createResponse(
        accumulated,
        model,
        usage,
        latencyMs,
        finishReason,
        toolCalls.length > 0 ? toolCalls : undefined,
      );
    }
  }

  async embed(
    input: string | string[],
    options?: Partial<GatewayRequest>,
  ): Promise<EmbeddingResult> {
    this.recordCall(false, 0, 0, 0, 0);
    throw new Error(
      `${this.name}: Embeddings are not supported by Anthropic. Use OpenAI or another provider.`,
    );
  }

  async vision(
    options: VisionOptions & { prompt?: string },
  ): Promise<GatewayResponse> {
    const model = options.model ?? this.getDefaultModel();
    const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [];

    for (const imgUrl of options.images) {
      if (imgUrl.startsWith("data:")) {
        const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: match[1],
              data: match[2],
            },
          });
        }
      } else {
        content.push({
          type: "image",
          source: { type: "url", media_type: "image/jpeg", data: imgUrl } as unknown as { type: string; media_type: string; data: string },
        });
      }
    }

    const promptText = options.prompt;
    if (promptText) {
      content.push({ type: "text", text: promptText });
    }

    const messages: ChatMessage[] = [{ role: "user", content: content as unknown as ChatMessage["content"] }];

    return this.chat(messages, {
      model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
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
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: combinedSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey ?? "",
      "anthropic-version": "2023-06-01",
      ...(this.config.headers ?? {}),
    };
  }

  protected getCostRates(model: string): { input: number; output: number } | null {
    return ANTHROPIC_COST_RATES[model] ?? null;
  }

  private convertMessages(messages: ChatMessage[]): {
    system: string | undefined;
    msgs: AnthropicMessage[];
  } {
    let system: string | undefined;
    const msgs: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        const text = typeof msg.content === "string"
          ? msg.content
          : msg.content.map((p) => p.text ?? "").join("");
        system = system ? `${system}\n\n${text}` : text;
        continue;
      }

      if (msg.role === "user" || msg.role === "assistant") {
        if (typeof msg.content === "string") {
          msgs.push({ role: msg.role, content: msg.content });
        } else {
          const contentParts: Array<{ type: string; text?: string; source?: unknown }> = [];
          for (const part of msg.content) {
            if (part.type === "text" && part.text) {
              contentParts.push({ type: "text", text: part.text });
            } else if (part.type === "image_url" && part.image_url) {
              contentParts.push({
                type: "image",
                source: {
                  type: "url",
                  url: part.image_url.url,
                },
              });
            }
          }
          msgs.push({
            role: msg.role,
            content: contentParts.length > 0
              ? contentParts as unknown as string
              : " ",
          });
        }
      } else if (msg.role === "tool") {
        msgs.push({
          role: "user",
          content: JSON.stringify({
            tool_result: msg.tool_call_id,
            content: msg.content,
          }),
        });
      }
    }

    if (msgs.length === 0) {
      msgs.push({ role: "user", content: " " });
    }

    if (msgs[0]?.role === "assistant") {
      msgs.unshift({ role: "user", content: " " });
    }

    return { system, msgs };
  }

  private buildRequestBody(
    messages: AnthropicMessage[],
    system: string | undefined,
    options?: Partial<GatewayRequest>,
  ): AnthropicRequest {
    const body: AnthropicRequest = {
      model: options?.model ?? this.getDefaultModel(),
      max_tokens: options?.maxTokens ?? 4096,
      messages,
    };

    if (system) body.system = system;
    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) {
      body.stop_sequences = Array.isArray(options.stop) ? options.stop : [options.stop];
    }
    if (options?.stream) body.stream = true;

    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    return body;
  }

  private parseResponse(
    data: AnthropicResponse,
    model: string,
    latencyMs: number,
  ): GatewayResponse {
    let content = "";
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === "text" && block.text) {
        content += block.text;
      } else if (block.type === "tool_use" && block.id && block.name) {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input ?? {}),
          },
        });
      }
    }

    const usage: ChatUsage = {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    };

    const finishReason = this.mapFinishReason(data.stop_reason);

    return this.createResponse(
      content,
      model,
      usage,
      latencyMs,
      finishReason,
      toolCalls.length > 0 ? toolCalls : undefined,
    );
  }

  private mapFinishReason(reason: string | null): string {
    switch (reason) {
      case "end_turn": return "stop";
      case "stop_sequence": return "stop";
      case "max_tokens": return "length";
      case "tool_use": return "tool_calls";
      default: return reason ?? "stop";
    }
  }
}
