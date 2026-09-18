/**
 * BDW AI Provider — Career Intelligence Engine
 *
 * Connects to any OpenAI-compatible model endpoint (local inference, cloud GPU,
 * private API, or managed service). The provider is intentionally thin: it
 * validates configuration, makes the HTTP call, and returns raw text. All
 * domain logic (RAG, tools, grounding) lives in the application layer.
 *
 * Environment variables:
 *   BDW_AI_ENABLED      – "true" to activate (default: disabled)
 *   BDW_AI_BASE_URL     – OpenAI-compatible endpoint (e.g. http://localhost:8000/v1)
 *   BDW_AI_MODEL        – model identifier sent to the endpoint
 *   BDW_AI_API_KEY      – bearer token (optional for local servers)
 *   BDW_AI_TIMEOUT_MS   – request timeout in milliseconds (default: 30000)
 */

export interface BDWProviderConfig {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  timeoutMs: number;
}

export function loadBDWConfig(): BDWProviderConfig {
  const enabled = process.env.BDW_AI_ENABLED === "true";
  const baseUrl = (process.env.BDW_AI_BASE_URL || "").replace(/\/+$/, "");
  const model = process.env.BDW_AI_MODEL || "bdw-career-ai";
  const apiKey = process.env.BDW_AI_API_KEY || null;
  const timeoutMs = parseInt(process.env.BDW_AI_TIMEOUT_MS || "30000", 10) || 30000;

  return { enabled, baseUrl, model, apiKey, timeoutMs };
}

export function isBDWConfigValid(config: BDWProviderConfig): boolean {
  return config.enabled && config.baseUrl.length > 0;
}

/**
 * Call the BDW AI model endpoint (OpenAI-compatible /chat/completions).
 * Returns the assistant message content as a plain string.
 */
export async function callBDWEndpoint(
  config: BDWProviderConfig,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!isBDWConfigValid(config)) {
    throw new Error("BDW AI provider is not configured or disabled");
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: 2048,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`BDW AI error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("BDW AI returned empty or malformed response");
  }
  return content;
}

/**
 * Health check: can we reach the BDW endpoint?
 * Returns true if the endpoint responds (even with an error status).
 */
export async function healthCheck(config: BDWProviderConfig): Promise<boolean> {
  if (!isBDWConfigValid(config)) return false;
  try {
    const res = await fetch(`${config.baseUrl}/models`, {
      method: "GET",
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
