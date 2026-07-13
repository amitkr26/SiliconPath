import type {
  ChatMessage,
  GatewayRequest,
  GatewayResponse,
  EmbeddingResult,
  EmbeddingVector,
  ChatUsage,
  ToolCall,
  VisionOptions,
  ImageGenerationResult,
  ImageGenerationOptions,
  SpeechOptions,
  SpeechResult,
} from "../types";
import type { ProviderConfig } from "../types";
import { BaseProvider } from "./base";

const OPENAI_COST_RATES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "o1": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 3.0, output: 12.0 },
  "o1-preview": { input: 15.0, output: 60.0 },
  "dall-e-3": { input: 0.0, output: 0.0 },
  "tts-1": { input: 0.0, output: 0.0 },
  "tts-1-hd": { input: 0.0, output: 0.0 },
  "whisper-1": { input: 0.0, output: 0.0 },
  "text-embedding-3-small": { input: 0.02, output: 0.0 },
  "text-embedding-3-large": { input: 0.13, output: 0.0 },
  "text-embedding-ada-002": { input: 0.1, output: 0.0 },
};

interface OpenAIChatResponse {
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

interface OpenAIStreamChunk {
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

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

interface OpenAISpeechResponse {
  audio: ArrayBuffer;
  contentType: string;
}

export class OpenAIProvider extends BaseProvider {
  readonly name = "openai" as const;

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || "https://api.openai.com/v1",
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      defaultModel: config.defaultModel || "gpt-4o",
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
      const data = await this.fetchJson<OpenAIChatResponse>(
        "/chat/completions",
        body,
      );
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
        let chunk: OpenAIStreamChunk;
        try {
          chunk = JSON.parse(raw) as OpenAIStreamChunk;
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
              if (tc.function?.arguments) {
                existing.arguments += tc.function.arguments;
              }
              if (tc.function?.name) {
                existing.name = tc.function.name;
              }
            }
          }
        }

        if (chunk.usage) {
          totalInput = chunk.usage.prompt_tokens;
          totalOutput = chunk.usage.completion_tokens;
        }

        const finishReason = choice.finish_reason;
        if (finishReason) {
          totalOutput = totalOutput || Math.ceil(accumulated.length / 4);
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
          {
            promptTokens: totalInput,
            completionTokens: totalOutput,
            totalTokens: totalInput + totalOutput,
          },
          Date.now() - start,
          finishReason,
          toolCalls,
        );
      }
    } finally {
      const latencyMs = Date.now() - start;
      if (totalInput === 0) {
        totalInput = Math.ceil(accumulated.length / 4);
      }
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
    input: string | string[],
    options?: Partial<GatewayRequest>,
  ): Promise<EmbeddingResult> {
    const model = options?.model ?? "text-embedding-3-small";
    const inputs = Array.isArray(input) ? input : [input];
    const start = Date.now();

    try {
      const body = { model, input: inputs };
      const data = await this.fetchJson<OpenAIEmbeddingResponse>("/embeddings", body);

      const vectors: EmbeddingVector[] = data.data.map((d) => ({
        index: d.index,
        embedding: d.embedding,
      }));

      const usage: ChatUsage = {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: 0,
        totalTokens: data.usage.total_tokens,
      };

      this.recordCall(true, Date.now() - start, usage.promptTokens, 0, 0);

      return { model, provider: this.name, vectors, usage };
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  async vision(
    options: VisionOptions & { prompt?: string },
  ): Promise<GatewayResponse> {
    const model = options.model ?? this.getDefaultModel();
    const content: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [];

    for (const imgUrl of options.images) {
      content.push({
        type: "image_url",
        image_url: { url: imgUrl, detail: "auto" },
      });
    }

    const promptText = options.prompt;
    if (promptText) {
      content.push({ type: "text", text: promptText });
    }

    const messages: ChatMessage[] = [{ role: "user", content: content as ChatMessage["content"] }];

    return this.chat(messages, {
      model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
  }

  async image(
    options: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    const model = options.model ?? "dall-e-3";

    try {
      const body: Record<string, unknown> = {
        model,
        prompt: options.prompt,
        n: options.n ?? 1,
        size: options.size ?? "1024x1024",
      };

      if (options.quality) body.quality = options.quality;
      if (options.style) body.style = options.style;
      if (options.responseFormat) body.response_format = options.responseFormat;

      const data = await this.fetchJson<OpenAIImageResponse>("/images/generations", body);

      const latencyMs = Date.now() - start;
      this.recordCall(true, latencyMs, 0, 0, 0);

      return {
        model,
        provider: this.name,
        images: data.data.map((d) => ({
          url: d.url,
          b64Json: d.b64_json,
          revisedPrompt: d.revised_prompt,
        })),
        latencyMs,
      };
    } catch (error) {
      this.recordCall(false, Date.now() - start, 0, 0, 0);
      this.handleError(error);
    }
  }

  async speech(options: SpeechOptions): Promise<SpeechResult> {
    const model = options.model ?? "tts-1";
    const start = Date.now();

    try {
      const body: Record<string, unknown> = {
        model,
        input: options.input,
        voice: options.voice ?? "alloy",
      };

      if (options.responseFormat) body.response_format = options.responseFormat;
      if (options.speed) body.speed = options.speed;

      const res = await this.makeRequest("/audio/speech", body);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
      }

      const audio = await res.arrayBuffer();
      const latencyMs = Date.now() - start;
      this.recordCall(true, latencyMs, 0, 0, 0);

      return {
        audio,
        model,
        provider: this.name,
        format: options.responseFormat ?? "mp3",
      };
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
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: combinedSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  protected getCostRates(model: string): { input: number; output: number } | null {
    return OPENAI_COST_RATES[model] ?? null;
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
    if (options?.frequencyPenalty !== undefined) body.frequency_penalty = options.frequencyPenalty;
    if (options?.presencePenalty !== undefined) body.presence_penalty = options.presencePenalty;
    if (options?.seed !== undefined) body.seed = options.seed;
    if (options?.user) body.user = options.user;
    if (options?.stream) body.stream = true;

    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools.map((t) => ({
        type: "function",
        function: t.function,
      }));
    }
    if (options?.tool_choice) body.tool_choice = options.tool_choice;

    return body;
  }

  private parseChatResponse(
    data: OpenAIChatResponse,
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
