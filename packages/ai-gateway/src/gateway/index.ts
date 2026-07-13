import type {
  ChatMessage,
  ProviderName,
  VisionOptions,
  ImageGenerationOptions,
  ImageGenerationResult,
  SpeechOptions,
  SpeechResult,
} from "../types/provider";
import type {
  GatewayRequest,
  GatewayMode,
  GatewayResponse,
} from "../types/gateway";
import type { AIGatewayConfig } from "../types/config";
import type { BaseProvider } from "../registry";
import {
  providerRegistry,
  type ProviderRegistry,
} from "../registry";
import {
  applyMiddleware,
  setMiddlewareChain,
  InMemoryTelemetryCollector,
  type TelemetryCollector,
  type Middleware,
} from "../middleware";
import { createRetryMiddleware } from "../middleware/retry";
import { createFailoverMiddleware } from "../middleware/failover";
import { createCircuitBreakerMiddleware } from "../middleware/circuit-breaker";
import { createRateLimiterMiddleware } from "../middleware/rate-limiter";
import { createQueueMiddleware } from "../middleware/queue";
import { createTimeoutMiddleware } from "../middleware/timeout";
import { responseCache, type ResponseCache } from "../cache";
import { safeParseJSON } from "../index";

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: AIGatewayConfig = {
  fallbackOrder: [
    "gemini",
    "openai",
    "anthropic",
    "openrouter",
    "groq",
    "together",
    "deepseek",
    "ollama",
  ],
  defaultModel: "gemini-2.0-flash",
  defaultMaxTokens: 1024,
  defaultTemperature: 0.7,
  globalTimeoutMs: 30_000,
  globalMaxRetries: 3,
  cacheEnabled: true,
  cacheTtlMs: 300_000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60_000,
  rateLimitPerMinute: 60,
  queueMaxSize: 100,
  healthCheckIntervalMs: 30_000,
  logLevel: "info",
  analyticsEnabled: true,
};

// ---------------------------------------------------------------------------
// AIGateway
// ---------------------------------------------------------------------------

class AIGateway {
  private readonly config: AIGatewayConfig;
  private readonly registry: ProviderRegistry;
  private readonly cache: ResponseCache;
  private readonly telemetry: TelemetryCollector;
  private initialized = false;

  constructor(config?: Partial<AIGatewayConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = providerRegistry;
    this.cache = responseCache;
    this.telemetry = new InMemoryTelemetryCollector();
  }

  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  init(): void {
    if (this.initialized) return;

    const middlewares: Middleware[] = [
      createFailoverMiddleware(),
      createRetryMiddleware(
        this.config.globalMaxRetries,
        1000,
      ),
      createCircuitBreakerMiddleware(
        this.config.circuitBreakerThreshold,
        this.config.circuitBreakerResetMs,
      ),
      createRateLimiterMiddleware(this.config.rateLimitPerMinute),
      createQueueMiddleware(this.config.queueMaxSize),
      createTimeoutMiddleware(this.config.globalTimeoutMs),
    ];

    setMiddlewareChain(middlewares);
    this.initialized = true;
  }

  // -----------------------------------------------------------------------
  // Provider selection
  // -----------------------------------------------------------------------

  private selectProvider(request: GatewayRequest): BaseProvider | null {
    for (const name of this.config.fallbackOrder) {
      const provider = this.registry.get(name);
      if (provider && provider.isAvailable() && provider.isHealthy()) {
        return provider;
      }
    }
    return this.registry.getByPriority()[0] ?? null;
  }

  // -----------------------------------------------------------------------
  // Request helpers
  // -----------------------------------------------------------------------

  private buildRequest(
    mode: GatewayMode,
    overrides: Partial<GatewayRequest>,
  ): GatewayRequest {
    return {
      mode,
      model: this.config.defaultModel,
      maxTokens: this.config.defaultMaxTokens,
      temperature: this.config.defaultTemperature,
      ...overrides,
    };
  }

  private isCacheable(request: GatewayRequest): boolean {
    if (request.mode === "stream") return false;
    if (request.cacheTtl === 0) return false;
    if (request.signal) return false;
    return true;
  }

  private buildCacheKey(request: GatewayRequest): string {
    return this.cache.buildKey({
      prompt: request.prompt,
      model: request.model,
      temperature: request.temperature,
      systemPrompt: request.systemPrompt,
      messages: request.messages,
    });
  }

  private extractText(response: GatewayResponse): string {
    if (response.text) return response.text;
    if (response.message) return response.message.content;
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content;
    }
    return "";
  }

  // -----------------------------------------------------------------------
  // Core request processing
  // -----------------------------------------------------------------------

  private async processRequest(
    request: GatewayRequest,
  ): Promise<GatewayResponse> {
    this.init();
    const startTime = Date.now();

    // Check cache
    if (this.isCacheable(request) && this.config.cacheEnabled) {
      const cacheKey = this.buildCacheKey(request);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.telemetry.record({
          timestamp: startTime,
          provider: cached.provider,
          model: cached.model,
          mode: request.mode,
          latencyMs: Date.now() - startTime,
          success: true,
          retryCount: 0,
          cacheHit: true,
          tokens: cached.usage,
        });
        return { ...cached, cached: true, latencyMs: Date.now() - startTime };
      }
    }

    // Select provider
    const provider = this.selectProvider(request);
    if (!provider) {
      throw Object.assign(
        new Error("No available providers in the registry"),
        { code: "NO_PROVIDERS", retryable: false, recoverable: false },
      );
    }

    // Execute through middleware chain
    const response = await applyMiddleware(request, provider, {
      startTime,
      retryCount: 0,
      previousProviders: [],
      cache: this.cache,
      telemetry: this.telemetry,
      registry: this.registry,
      config: this.config,
    });

    // Cache successful response
    if (this.isCacheable(request) && this.config.cacheEnabled) {
      const cacheKey = this.buildCacheKey(request);
      const ttl = request.cacheTtl ?? this.config.cacheTtlMs;
      await this.cache.set(cacheKey, response, ttl);
    }

    return response;
  }

  // -----------------------------------------------------------------------
  // Public API — generate
  // -----------------------------------------------------------------------

  async generate(
    prompt: string,
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const request = this.buildRequest("chat", {
      messages,
      prompt,
      systemPrompt: options?.systemPrompt,
      ...options,
      mode: "chat",
    });

    const response = await this.processRequest(request);
    return {
      ...response,
      text: this.extractText(response),
    };
  }

  // -----------------------------------------------------------------------
  // Public API — chat
  // -----------------------------------------------------------------------

  async chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse> {
    const request = this.buildRequest("chat", {
      messages,
      ...options,
      mode: "chat",
    });

    const response = await this.processRequest(request);
    return {
      ...response,
      text: this.extractText(response),
    };
  }

  // -----------------------------------------------------------------------
  // Public API — stream
  // -----------------------------------------------------------------------

  async *stream(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): AsyncIterable<GatewayResponse> {
    this.init();

    const request = this.buildRequest("stream", {
      messages,
      ...options,
      mode: "stream",
      stream: true,
    });

    const provider = this.selectProvider(request);
    if (!provider) {
      throw Object.assign(
        new Error("No available providers in the registry"),
        { code: "NO_PROVIDERS", retryable: false, recoverable: false },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.config.globalTimeoutMs,
    );

    const originalSignal = request.signal;
    if (originalSignal) {
      if (originalSignal.aborted) {
        controller.abort();
      } else {
        originalSignal.addEventListener(
          "abort",
          () => controller.abort(),
          { once: true },
        );
      }
    }

    const streamRequest: GatewayRequest = {
      ...request,
      signal: controller.signal,
    };

    const startTime = Date.now();

    try {
      const stream = provider.executeStream(streamRequest);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      this.telemetry.record({
        timestamp: startTime,
        provider: provider.name,
        model: request.model ?? provider.config.model,
        mode: "stream",
        latencyMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        retryCount: 0,
        cacheHit: false,
      });
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  // -----------------------------------------------------------------------
  // Public API — embed
  // -----------------------------------------------------------------------

  async embed(
    input: string | string[],
    options?: Partial<GatewayRequest>,
  ): Promise<{
    embeddings: number[][];
    model: string;
    usage: import("../types/provider").ChatUsage;
  }> {
    const request = this.buildRequest("embed", {
      embedding: { input, ...options?.embedding },
      ...options,
      mode: "embed",
    });

    const response = await this.processRequest(request);

    if (response.embedding) {
      return response.embedding;
    }

    return {
      embeddings: [],
      model: response.model,
      usage: response.usage ?? {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Public API — summarize
  // -----------------------------------------------------------------------

  async summarize(
    text: string,
    options?: Partial<GatewayRequest>,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a precise summarizer. Provide a concise summary of the given text. " +
          "Focus on key points and main ideas. Be thorough but brief. " +
          "Do not add commentary or meta-statements — return only the summary.",
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, options);
    return this.extractText(response);
  }

  // -----------------------------------------------------------------------
  // Public API — rewrite
  // -----------------------------------------------------------------------

  async rewrite(
    text: string,
    options?: Partial<GatewayRequest>,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a skilled editor. Rewrite the given text to improve clarity, grammar, " +
          "and style while preserving the original meaning and tone. " +
          "Return only the rewritten text without explanation.",
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, options);
    return this.extractText(response);
  }

  // -----------------------------------------------------------------------
  // Public API — classify
  // -----------------------------------------------------------------------

  async classify(
    text: string,
    categories: string[],
    options?: Partial<GatewayRequest>,
  ): Promise<Record<string, number>> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are a text classifier. Classify the given text into exactly one of these categories: ${categories.join(", ")}. ` +
          "Respond with ONLY a valid JSON object where keys are category names and values are confidence scores between 0 and 1. " +
          "The scores must sum to 1. Do not include any explanation, code fences, or markdown — return only the raw JSON object.",
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      ...options,
      responseFormat: "json",
    });

    const raw = this.extractText(response);
    const scores = safeParseJSON<Record<string, number>>(raw, {});

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total > 0 && Math.abs(total - 1) > 0.01) {
      for (const key of Object.keys(scores)) {
        scores[key] = scores[key] / total;
      }
    }

    const result: Record<string, number> = {};
    for (const cat of categories) {
      result[cat] = scores[cat] ?? 0;
    }
    return result;
  }

  // -----------------------------------------------------------------------
  // Public API — extract
  // -----------------------------------------------------------------------

  async extract(
    text: string,
    schema: string,
    options?: Partial<GatewayRequest>,
  ): Promise<Record<string, unknown>> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a data extraction assistant. Extract structured data from the given text " +
          "that matches the provided schema. Respond with ONLY a valid JSON object matching the schema. " +
          "Do not include any explanation, code fences, or markdown — return only the raw JSON object.\n\n" +
          `Schema: ${schema}`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      ...options,
      responseFormat: "json",
    });

    const raw = this.extractText(response);
    return safeParseJSON<Record<string, unknown>>(raw, {});
  }

  // -----------------------------------------------------------------------
  // Public API — match (cosine similarity via embeddings)
  // -----------------------------------------------------------------------

  async match(
    text1: string,
    text2: string,
    options?: Partial<GatewayRequest>,
  ): Promise<number> {
    const [result1, result2] = await Promise.all([
      this.embed(text1, options),
      this.embed(text2, options),
    ]);

    const vec1 = result1.embeddings[0];
    const vec2 = result2.embeddings[0];

    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      return 0;
    }

    const len = Math.min(vec1.length, vec2.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += vec1[i] * vec2[i];
      normA += vec1[i] * vec1[i];
      normB += vec2[i] * vec2[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;
    return dot / denom;
  }

  // -----------------------------------------------------------------------
  // Public API — translate
  // -----------------------------------------------------------------------

  async translate(
    text: string,
    targetLang: string,
    options?: Partial<GatewayRequest>,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are a professional translator. Translate the given text to ${targetLang}. ` +
          "Preserve the original tone, meaning, and formatting. " +
          "Return only the translated text without any explanation.",
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, options);
    return this.extractText(response);
  }

  // -----------------------------------------------------------------------
  // Public API — vision
  // -----------------------------------------------------------------------

  async vision(
    options: VisionOptions & { prompt?: string },
  ): Promise<GatewayResponse> {
    const request = this.buildRequest("vision", {
      vision: {
        imageUrl: options.imageUrl,
        detail: options.detail,
      },
      prompt: options.prompt,
      messages: [
        {
          role: "user",
          content: options.prompt ?? "Describe this image in detail.",
        },
      ],
      ...options,
      mode: "vision",
    });

    return this.processRequest(request);
  }

  // -----------------------------------------------------------------------
  // Public API — image generation
  // -----------------------------------------------------------------------

  async image(
    options: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    const request = this.buildRequest("image", {
      image: options,
      messages: [
        { role: "user", content: options.prompt },
      ],
      mode: "image",
    });

    const response = await this.processRequest(request);
    return (
      response.image ?? {
        url: "",
        revisedPrompt: options.prompt,
      }
    );
  }

  // -----------------------------------------------------------------------
  // Public API — speech
  // -----------------------------------------------------------------------

  async speech(options: SpeechOptions): Promise<SpeechResult> {
    const request = this.buildRequest("speech", {
      speech: options,
      messages: [
        { role: "user", content: options.text },
      ],
      mode: "speech",
    });

    const response = await this.processRequest(request);
    return (
      response.speech ?? {
        audioData: Buffer.alloc(0),
        format: options.format ?? "mp3",
        durationMs: 0,
      }
    );
  }

  // -----------------------------------------------------------------------
  // Utility accessors
  // -----------------------------------------------------------------------

  getConfig(): Readonly<AIGatewayConfig> {
    return this.config;
  }

  getTelemetry(): TelemetryCollector {
    return this.telemetry;
  }

  getCache(): ResponseCache {
    return this.cache;
  }

  getRegistry(): ProviderRegistry {
    return this.registry;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const gateway = new AIGateway();
export { AIGateway };
