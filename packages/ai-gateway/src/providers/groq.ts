import type {
  ChatMessage,
  GatewayRequest,
  GatewayResponse,
  ChatUsage,
  ToolCall,
} from "../types";
import type { ProviderConfig } from "../types";
import { BaseProvider } from "./base";

const GROQ_COST_RATES: Record<string, { input: number; output: number }> = {
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
  "gemma2-9b-it": { input: 0.2, output: 0.2 },
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.2-1b-preview": { input: 0.0, output: 0.0 },
  "llama-3.2-3b-preview": { input: 0.0, output: 0.0 },
  "llama-3.2-11b-vision-preview": { input: 0.0, output: 0.0 },
  "llama-3.2-90b-vision-preview": { input: 0.0, output: 0.0 },
  "whisper-large-v3": { input: 0.0, output: 0.0 },
  "distil-whisper-large-v3-en": { input: 0.0, output: 0.0 },
};

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string; tool_calls?: Array<{
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }> };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GroqStreamChunk {
  id: string;
  object: string;
  choices: Array<{
    index: number;
    delta: { role?: string; content?: string; tool_calls?: Array<{
      index: number;
      id?: string;
      type?: "function";
      function?: { name?: string; arguments?: string };
    }> };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqProvider extends BaseProvider {
  readonly name = "groq" as const;

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
      defaultModel: config.defaultModel || "llama-3.3-70b-versatile",
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const start = Date.now();
    const model = options?.model ?? this.getDefaultModel();
    try {
      const body = this.buildChatBody(messages, options);
      const data = await this.fetchJson<GroqChatResponse>("/chat/completions", body);
      const response = this.parseChatResponse(data, model, Date.now() - start);
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
    const body = this.buildChatBody(messages, { ...options, stream: true });

    let res: Response;
    try {
      res = await this.makeRequest("/chat/completions", body);
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

    let totalInput = 0;
    let totalOutput = 0;
    let accumulated = "";
    const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

    try {
      for await (const raw of this.parseSseStream(res)) {
        let chunk: GroqStreamChunk;
        try {
          chunk = JSON.parse(raw) as GroqStreamChunk;
        } catch {
          continue;
        }

        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const content = choice.delta?.content ?? "";
        accumulated += content;

        if (choice.delta?.tool_calls) {
          for (const tc of choice.delta.tool_calls) {
            const idx = tc.index;
            if (!toolCallsMap.has(idx)) {
              toolCallsMap.set(idx, {
                id: tc.id ?? `call_${Date.now()}_${idx}`,
                name: tc.function?.name ?? "",
                arguments: tc.function?.arguments ?? "",
              });
            } else {
              const existing = toolCallsMap.get(idx)!;
              if (tc.function?.arguments) existing.arguments += tc.function.arguments;
              if (tc.function?.name) existing.name = tc.function.name;
            }
          }
        }

        if (chunk.usage) {
          totalInput = chunk.usage.prompt_tokens;
          totalOutput = chunk.usage.completion_tokens;
        }

        const finishReason = choice.finish_reason;
        if (finishReason && totalOutput === 0) {
          totalOutput = Math.ceil(accumulated.length / 4);
        }

        const toolCalls: ToolCall[] | undefined =
          toolCallsMap.size > 0
            ? Array.from(toolCallsMap.values()).map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              }))
            : undefined;

        yield this.createResponse(
          accumulated,
          model,
          { promptTokens: totalInput, completionTokens: totalOutput, totalTokens: totalInput + totalOutput },
          Date.now() - start,
          finishReason,
          toolCalls,
        );
      }
    } finally {
      const latencyMs = Date.now() - start;
      if (totalInput === 0) totalInput = Math.ceil(accumulated.length / 4);
      this.recordCall(
        true,
        latencyMs,
        totalInput,
        totalOutput,
        this.calculateCost(model, totalInput, totalOutput),
      );
    }
  }

  async embed(
    _input: string | string[],
    _options?: Partial<GatewayRequest>,
  ): Promise<import("../types").EmbeddingResult> {
    this.recordCall(false, 0, 0, 0, 0);
    throw new Error(`${this.name}: Embeddings are not supported by Groq.`);
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

  protected getCostRates(model: string): { input: number; output: number } | null {
    return GROQ_COST_RATES[model] ?? null;
  }

  private buildChatBody(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options?.model ?? this.getDefaultModel(),
      messages: messages.map((m) => {
        const msg: Record<string, unknown> = { role: m.role };
        if (m.content) msg.content = m.content;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        return msg;
      }),
    };

    if (options?.temperature !== undefined) body.temperature = options.temperature;
    if (options?.maxTokens !== undefined) body.max_tokens = options.maxTokens;
    if (options?.topP !== undefined) body.top_p = options.topP;
    if (options?.stop) body.stop = options.stop;
    if (options?.stream) body.stream = true;
    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools.map((t) => ({ type: "function", function: t.function }));
    }
    if (options?.tool_choice) body.tool_choice = options.tool_choice;

    return body;
  }

  private parseChatResponse(
    data: GroqChatResponse,
    model: string,
    latencyMs: number,
  ): GatewayResponse {
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";
    const finishReason = choice?.finish_reason ?? "stop";
    const usage: ChatUsage = {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };

    const toolCalls: ToolCall[] | undefined = choice?.message?.tool_calls?.map((tc) => ({
      id: tc.id,
      type: "function" as const,
      function: tc.function,
    }));

    return this.createResponse(content, model, usage, latencyMs, finishReason, toolCalls);
  }
}
