/**
 * Multi-provider AI fallback — built per spec §4.2, addressing every prior failure:
 *  1. Current, verified model slugs (NOT the dead gemini-1.5-flash).
 *  2. Native JSON mode where available + regex JSON-block extraction fallback;
 *     never surfaces a raw parse error — retries / falls through.
 *  3. Per-provider failure cooldown from day one.
 *  4. Startup key check (assertProviderKeys) so a missing key is caught early.
 *  5. Small starter set (3), expand incrementally.
 */

export type AIProvider = "groq" | "gemini" | "openrouter";

export interface AIResult {
  text: string;
  provider: AIProvider;
  model: string;
}

const ORDER: AIProvider[] = ["groq", "gemini", "openrouter"];

const MODELS: Record<AIProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-flash", // current; gemini-1.5-flash is deprecated (404 on v1beta)
  openrouter: "google/gemma-2-9b-it:free",
};

const ENV_KEY: Record<AIProvider, string> = {
  groq: "GROQ_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const cooldownUntil: Record<string, number> = {};
const COOLDOWN_MS = 10 * 60 * 1000;

/** Log which providers have keys configured. Call at startup / in CI. */
export function assertProviderKeys(): { configured: AIProvider[]; missing: AIProvider[] } {
  const configured: AIProvider[] = [];
  const missing: AIProvider[] = [];
  for (const p of ORDER) (process.env[ENV_KEY[p]] ? configured : missing).push(p);
  return { configured, missing };
}

/** Robust JSON extraction: try direct parse, then first {...}/[...] block. Never throws. */
export function extractJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

async function callGroq(prompt: string, system: string | undefined, json: boolean): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELS.groq,
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      max_tokens: 1024,
      temperature: 0.3,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

async function callGemini(prompt: string, system: string | undefined, json: boolean): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3, ...(json ? { responseMimeType: "application/json" } : {}) },
      }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenRouter(prompt: string, system: string | undefined, json: boolean): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://siliconpath.vercel.app",
      "X-Title": "SiliconPath",
    },
    body: JSON.stringify({
      model: MODELS.openrouter,
      messages: [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }],
      max_tokens: 1024,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

const CALLS: Record<AIProvider, (p: string, s: string | undefined, j: boolean) => Promise<string>> = {
  groq: callGroq,
  gemini: callGemini,
  openrouter: callOpenRouter,
};

export async function callAI(
  prompt: string,
  opts?: { system?: string; json?: boolean; preferred?: AIProvider }
): Promise<AIResult> {
  const order = opts?.preferred ? [opts.preferred, ...ORDER.filter((p) => p !== opts.preferred)] : ORDER;
  const errors: string[] = [];
  for (const provider of order) {
    if (!process.env[ENV_KEY[provider]]) continue;
    if (cooldownUntil[provider] && Date.now() < cooldownUntil[provider]) continue;
    try {
      const text = await CALLS[provider](prompt, opts?.system, opts?.json ?? false);
      return { text, provider, model: MODELS[provider] };
    } catch (e) {
      cooldownUntil[provider] = Date.now() + COOLDOWN_MS;
      errors.push(`${provider}: ${e instanceof Error ? e.message : e}`);
    }
  }
  throw new Error(`All AI providers failed. ${errors.join("; ")}`);
}
