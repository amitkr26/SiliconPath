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

const GEMINI_COST_RATES: Record<string, { input: number; output: number }> = {
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },
};

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts: Array<{ text: string }>; role: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiEmbedResponse {
  embedding?: { values: number[] };
  embeddings?: Array<{ values: number[] }>;
  usageMetadata?: {
    tokenCount: number;
  };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts: Array<{ text: string }>; role: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider extends BaseProvider {
  readonly name = "gemini" as const;

  constructor(config: ProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || "https://generativelanguage.googleapis.com/v1beta",
      apiKey: config.apiKey || process.env.GEMINI_API_KEY,
      defaultModel: config.defaultModel || "gemini-2.0-flash",
    });
  }

  async chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const start = Date.now();
    const model = options?.model ?? this.getDefaultModel();
    try {
      const contents = this.convertMessages(messages);
      const body = this.buildGenerateBody(contents, options);
      const endpoint = `/models/${model}:generateContent?key=${this.config.apiKey}`;
      const data = await this.fetchJson<GeminiGenerateResponse>(endpoint, body);
      const response = this.parseGenerateResponse(data, model, Date.now() - start);
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
    const contents = this.convertMessages(messages);
    const body = this.buildGenerateBody(contents, { ...options, stream: true });
    const endpoint = `/models/${model}:streamGenerateContent?key=${this.config.apiKey}&alt=sse`;

    let res: Response;
    try {
      res = await this.makeRequest(endpoint, body);
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

    try {
      for await (const raw of this.parseSseStream(res)) {
        let chunk: GeminiStreamChunk;
        try {
          chunk = JSON.parse(raw) as GeminiStreamChunk;
        } catch {
          continue;
        }
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const finishReason = chunk.candidates?.[0]?.finishReason ?? null;
        accumulated += text;

        if (chunk.usageMetadata) {
          totalInput = chunk.usageMetadata.promptTokenCount;
          totalOutput = chunk.usageMetadata.candidatesTokenCount;
        }

        const latencyMs = Date.now() - start;
        yield this.createResponse(accumulated, model, {
          promptTokens: totalInput,
          completionTokens: totalOutput,
          totalTokens: totalInput + totalOutput,
        }, latencyMs, finishReason);
      }
    } finally {
      const latencyMs = Date.now() - start;
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
    const model = options?.model ?? "text-embedding-004";
    const inputs = Array.isArray(input) ? input : [input];
    const start = Date.now();

    try {
      const vectors: EmbeddingVector[] = [];
      for (let i = 0; i < inputs.length; i++) {
        const body = {
          content: { parts: [{ text: inputs[i] }] },
        };
        const endpoint = `/models/${model}:embedContent?key=${this.config.apiKey}`;
        const data = await this.fetchJson<GeminiEmbedResponse>(endpoint, body);
        if (data.embedding) {
          vectors.push({ index: i, embedding: data.embedding.values });
        }
      }

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

  async vision(
    options: VisionOptions & { prompt?: string },
  ): Promise<GatewayResponse> {
    const model = options.model ?? this.getDefaultModel();
    const parts: GeminiPart[] = [];

    for (const imgUrl of options.images) {
      if (imgUrl.startsWith("data:")) {
        const match = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      } else {
        parts.push({ text: `[Image: ${imgUrl}]` });
      }
    }

    parts.push({ text: options.prompt });

    const contents: GeminiContent[] = [{ role: "user", parts }];
    const body = this.buildGenerateBody(contents, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    const start = Date.now();
    try {
      const endpoint = `/models/${model}:generateContent?key=${this.config.apiKey}`;
      const data = await this.fetchJson<GeminiGenerateResponse>(endpoint, body);
      const response = this.parseGenerateResponse(data, model, Date.now() - start);
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
    return GEMINI_COST_RATES[model] ?? null;
  }

  private convertMessages(messages: ChatMessage[]): GeminiContent[] {
    const contents: GeminiContent[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        contents.unshift({
          role: "user",
          parts: [{ text: `[System Instruction] ${typeof msg.content === "string" ? msg.content : msg.content.map((p) => p.text ?? "").join("")}` }],
        });
        contents.splice(1, 0, { role: "model", parts: [{ text: "Understood." }] });
        continue;
      }

      const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
      const parts: GeminiPart[] = [];

      if (typeof msg.content === "string") {
        parts.push({ text: msg.content });
      } else {
        for (const part of msg.content) {
          if (part.type === "text" && part.text) {
            parts.push({ text: part.text });
          } else if (part.type === "image_url" && part.image_url) {
            parts.push({ text: `[Image: ${part.image_url.url}]` });
          }
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: " " }] });
    }

    if (contents[0]?.role === "model") {
      contents.unshift({ role: "user", parts: [{ text: " " }] });
    }

    return contents;
  }

  private buildGenerateBody(
    contents: GeminiContent[],
    options?: Partial<GatewayRequest>,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = { contents };

    if (options?.temperature !== undefined || options?.maxTokens !== undefined || options?.topP !== undefined) {
      const genConfig: Record<string, unknown> = {};
      if (options.temperature !== undefined) genConfig.temperature = options.temperature;
      if (options.maxTokens !== undefined) genConfig.maxOutputTokens = options.maxTokens;
      if (options.topP !== undefined) genConfig.topP = options.topP;
      if (options.stop) genConfig.stopSequences = Array.isArray(options.stop) ? options.stop : [options.stop];
      body.generationConfig = genConfig;
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: options.tools.map((t) => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
          })),
        },
      ];
    }

    return body;
  }

  private parseGenerateResponse(
    data: GeminiGenerateResponse,
    model: string,
    latencyMs: number,
  ): GatewayResponse {
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";
    const finishReason = candidate?.finishReason ?? "STOP";
    const usage: ChatUsage = {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    };

    const toolCalls: ToolCall[] | undefined = undefined;
    const fnParts = candidate?.content?.parts?.filter((p) => p.text === undefined) ?? [];

    return this.createResponse(content, model, usage, latencyMs, finishReason, toolCalls);
  }
}
