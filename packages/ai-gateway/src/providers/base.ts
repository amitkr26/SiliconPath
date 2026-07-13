import type {
  ProviderName,
  ChatMessage,
  GatewayRequest,
  GatewayResponse,
  EmbeddingResult,
  ImageGenerationResult,
  ImageGenerationOptions,
  VisionOptions,
  SpeechOptions,
  SpeechResult,
} from "../types";
import type { ProviderConfig, ProviderHealth, ProviderMetrics, ProviderQuota } from "../types";

const DEFAULT_TIMEOUT = 60_000;

export abstract class BaseProvider {
  abstract readonly name: ProviderName;

  protected config: ProviderConfig;
  protected metrics: ProviderMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalLatencyMs: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    lastUsedAt: null,
  };
  protected health: ProviderHealth = {
    status: "healthy",
    latencyMs: 0,
    lastCheckedAt: Date.now(),
    consecutiveFailures: 0,
    successRate: 1,
  };

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract chat(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse>;
  abstract generate(
    prompt: string,
    options?: Partial<GatewayRequest>,
  ): Promise<GatewayResponse>;
  abstract stream(
    messages: ChatMessage[],
    options?: Partial<GatewayRequest>,
  ): AsyncIterable<GatewayResponse>;
  abstract embed(
    input: string | string[],
    options?: Partial<GatewayRequest>,
  ): Promise<EmbeddingResult>;

  vision?(
    options: VisionOptions & { prompt?: string },
  ): Promise<GatewayResponse>;
  image?(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  speech?(options: SpeechOptions): Promise<SpeechResult>;

  isAvailable(): boolean {
    return this.config.enabled && Boolean(this.config.apiKey);
  }

  getHealth(): ProviderHealth {
    return { ...this.health };
  }

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  getQuota(): ProviderQuota | null {
    return null;
  }

  recordCall(
    success: boolean,
    latencyMs: number,
    inputTokens: number,
    outputTokens: number,
    cost: number,
  ): void {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
      this.health.consecutiveFailures = 0;
      this.health.status = "healthy";
    } else {
      this.metrics.failedRequests++;
      this.health.consecutiveFailures++;
      if (this.health.consecutiveFailures >= 3) {
        this.health.status = "unhealthy";
      } else if (this.health.consecutiveFailures >= 1) {
        this.health.status = "degraded";
      }
    }
    this.health.lastCheckedAt = Date.now();
    this.health.latencyMs = latencyMs;
    this.health.successRate = this.metrics.totalRequests > 0
      ? this.metrics.successfulRequests / this.metrics.totalRequests
      : 1;
    this.metrics.totalLatencyMs += latencyMs;
    this.metrics.totalInputTokens += inputTokens;
    this.metrics.totalOutputTokens += outputTokens;
    this.metrics.totalCost += cost;
    this.metrics.lastUsedAt = Date.now();
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      lastUsedAt: null,
    };
    this.health = {
      status: "healthy",
      latencyMs: 0,
      lastCheckedAt: Date.now(),
      consecutiveFailures: 0,
      successRate: 1,
    };
  }

  protected abstract makeRequest(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response>;

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ProviderError(`${this.name}: Request timed out`, "TIMEOUT", this.name);
      }
      throw new ProviderError(`${this.name}: ${error.message}`, "PROVIDER_ERROR", this.name, error);
    }
    throw new ProviderError(
      `${this.name}: Unknown error`,
      "PROVIDER_ERROR",
      this.name,
      error,
    );
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }
    return headers;
  }

  protected getBaseUrl(): string {
    return this.config.baseUrl ?? "";
  }

  protected getTimeout(): number {
    return this.config.timeout ?? DEFAULT_TIMEOUT;
  }

  protected getDefaultModel(): string {
    return this.config.defaultModel ?? "";
  }

  protected async fetchJson<T>(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const res = await this.makeRequest(endpoint, body, signal);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(
        `${this.name}: HTTP ${res.status}: ${text.slice(0, 500)}`,
        `HTTP_${res.status}`,
        this.name,
      );
    }
    return (await res.json()) as T;
  }

  protected createResponse(
    content: string,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    latencyMs: number,
    finishReason: string | null = "stop",
    toolCalls?: import("../types").ToolCall[],
  ): GatewayResponse {
    return {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      model,
      provider: this.name,
      content,
      role: "assistant",
      finishReason,
      usage,
      latencyMs,
      toolCalls,
    };
  }

  protected calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const rates = this.getCostRates(model);
    if (!rates) return 0;
    return (
      (inputTokens / 1_000_000) * rates.input +
      (outputTokens / 1_000_000) * rates.output
    );
  }

  protected abstract getCostRates(
    model: string,
  ): { input: number; output: number } | null;

  protected async *parseSseStream(
    response: Response,
  ): AsyncIterable<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new ProviderError(`${this.name}: No response body`, "PROVIDER_ERROR", this.name);

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") return;
            if (data) yield data;
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6);
          if (data !== "[DONE]" && data) yield data;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export class ProviderError extends Error {
  code: string;
  provider: ProviderName;
  cause?: unknown;

  constructor(message: string, code: string, provider: ProviderName, cause?: unknown) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.provider = provider;
    this.cause = cause;
  }
}
