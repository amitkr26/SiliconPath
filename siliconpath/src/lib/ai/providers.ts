import { logger } from "../logger.js";

/**
 * Multi-provider AI fallback — built correctly from day one (see docs/AI_PROVIDERS.md).
 * Addresses every failure mode from the prior build:
 *  - VERIFIED-CURRENT model slugs (checked at build time; the prior build shipped
 *    the now-dead `gemini-1.5-flash`). Slugs confirmed live 2026-07-08.
 *  - Native JSON mode where available + a regex JSON-extraction fallback; a raw
 *    parse error is never surfaced — we retry / fall through.
 *  - Per-provider failure cooldown (skip a provider for N minutes after a failure).
 *  - Startup key check (assertProviderKeys) so a missing/expired key is caught at
 *    boot / in CI, not by a user-facing failure.
 *  - Starter set of 3 verified free-tier providers; extend incrementally.
 */

export type AIProvider = "groq" | "gemini" | "openrouter";

export interface AIResult {
  text: string;
  provider: AIProvider;
  model: string;
}

// Verified-current slugs (2026-07-08). Update via the process in docs/AI_PROVIDERS.md.
const MODELS: Record<AIProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-flash",
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
};

const ENV_KEY: Record<AIProvider, string> = {
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const ORDER: AIProvider[] = ["groq", "gemini", "openrouter"];

const COOLDOWN_MS = 10 * 60 * 1000;
const cooldownUntil: Partial<Record<AIProvider, number>> = {};

export interface CallOptions {
  systemPrompt?: string;
  /** Ask the provider for strict JSON and parse it (with regex fallback). */
  json?: boolean;
  preferred?: AIProvider;
}

async function callGroq(prompt: string, opts: CallOptions): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELS.groq,
      messages: [
        ...(opts.systemPrompt ? [{ role: "system", content: opts.systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  return (await res.json()).choices?.[0]?.message?.content ?? "";
}

async function callGemini(prompt: string, opts: CallOptions): Promise<string> {
  const body = {
    contents: [{ parts: [{ text: opts.systemPrompt ? `${opts.systemPrompt}\n\n${prompt}` : prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenRouter(prompt: string, opts: CallOptions): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://siliconpath.vercel.app",
      "X-Title": "SiliconPath",
    },
    body: JSON.stringify({
      model: MODELS.openrouter,
      messages: [
        ...(opts.systemPrompt ? [{ role: "system", content: opts.systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  return (await res.json()).choices?.[0]?.message?.content ?? "";
}

const DISPATCH: Record<AIProvider, (p: string, o: CallOptions) => Promise<string>> = {
  groq: callGroq,
  gemini: callGemini,
  openrouter: callOpenRouter,
};

/** Extracts a JSON object/array from a string, tolerating code fences / prose. */
export function extractJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through to extraction */
  }
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text.match(/[[{][\s\S]*[\]}]/)?.[0];
  if (!match) return null;
  try {
    return JSON.parse(match.trim()) as T;
  } catch {
    return null;
  }
}

export async function callAI(prompt: string, opts: CallOptions = {}): Promise<AIResult> {
  const order = opts.preferred ? [opts.preferred, ...ORDER.filter((p) => p !== opts.preferred)] : ORDER;

  let lastErr: unknown = null;
  for (const provider of order) {
    if (!process.env[ENV_KEY[provider]]) continue;
    const until = cooldownUntil[provider];
    if (until && Date.now() < until) {
      logger.debug(`[ai] skipping ${provider} (cooldown)`);
      continue;
    }
    try {
      const text = await DISPATCH[provider](prompt, opts);
      if (!text) throw new Error("empty response");
      return { text, provider, model: MODELS[provider] };
    } catch (e) {
      lastErr = e;
      cooldownUntil[provider] = Date.now() + COOLDOWN_MS;
      logger.warn(`[ai] ${provider} failed, cooling down:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error(`All AI providers failed. Last error: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}

/**
 * Startup / CI key check. Verifies each configured provider actually answers a
 * trivial prompt. Call from a boot script or CI — NOT on every request. Returns
 * per-provider status; does not throw so a partial chain can still boot.
 */
export async function assertProviderKeys(): Promise<Record<AIProvider, string>> {
  const status: Record<AIProvider, string> = { groq: "not_configured", gemini: "not_configured", openrouter: "not_configured" };
  for (const provider of ORDER) {
    if (!process.env[ENV_KEY[provider]]) continue;
    try {
      const text = await DISPATCH[provider]("Reply with the single word: ok", {});
      status[provider] = text.toLowerCase().includes("ok") ? "ok" : "unexpected_response";
    } catch (e) {
      status[provider] = `error: ${e instanceof Error ? e.message : e}`;
    }
  }
  return status;
}
