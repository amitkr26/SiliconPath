import { logger } from "./logger.js";

export type AIProvider = "bedrock" | "groq" | "nvidia" | "gemini" | "openrouter" | "cloudflare" | "huggingface";

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

const PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "openrouter",
  "cloudflare",
  "gemini",
  "nvidia",
  "bedrock",
  "huggingface",
];

const PROVIDER_MODELS: Record<AIProvider, string> = {
  bedrock: "openai.gpt-oss-120b",
  groq: "llama-3.1-8b-instant",
  nvidia: "meta/llama-3.1-8b-instruct",
  gemini: "gemini-1.5-flash",
  openrouter: "google/gemma-2-9b-it:free",
  cloudflare: "@cf/meta/llama-3.1-8b-instruct",
  huggingface: "mistralai/Mistral-7B-Instruct-v0.3",
};

const providerCooldowns: Record<string, number> = {};
const COOLDOWN_MS = 10 * 60 * 1000;

const ENV_KEYS: Record<AIProvider, string> = {
  bedrock: "AWS_BEARER_TOKEN_BEDROCK",
  groq: "GROQ_API_KEY",
  nvidia: "NVIDIA_NIM_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  cloudflare: "CLOUDFLARE_AI_TOKEN",
  huggingface: "HUGGINGFACE_API_KEY",
};

const EXTRA_ENV: Partial<Record<AIProvider, string>> = {
  cloudflare: "CLOUDFLARE_ACCOUNT_ID",
};

async function callBedrock(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai.gpt-oss-120b",
      messages: [...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []), { role: "user" as const, content: prompt }],
      max_tokens: 1024, temperature: 0.3,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Bedrock error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []), { role: "user" as const, content: prompt }],
      max_tokens: 1024, temperature: 0.3,
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

async function callNvidia(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []), { role: "user" as const, content: prompt }],
      temperature: 0.3, max_tokens: 1024, stream: false,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`NVIDIA error ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content;
}

async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  return (await res.json()).candidates[0].content.parts[0].text;
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json",
      "HTTP-Referer": "https://siliconpath.vercel.app", "X-Title": "SiliconPath",
    },
    body: JSON.stringify({
      model: "google/gemma-2-9b-it:free",
      messages: [...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []), { role: "user" as const, content: prompt }],
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  return (await res.json()).choices[0].message.content;
}

async function callCloudflare(prompt: string, systemPrompt?: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []), { role: "user" as const, content: prompt }] }),
      signal: AbortSignal.timeout(4000),
    }
  );
  if (!res.ok) throw new Error(`Cloudflare error ${res.status}`);
  return (await res.json()).result.response;
}

async function callHuggingFace(prompt: string): Promise<string> {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512, temperature: 0.3 } }),
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!res.ok) throw new Error(`HuggingFace error ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0].generated_text : data.generated_text;
}

export async function callAI(
  prompt: string,
  systemPrompt?: string,
  options?: { preferredProvider?: AIProvider; feature?: string }
): Promise<AIResponse> {
  const order = options?.preferredProvider
    ? [options.preferredProvider, ...PROVIDER_ORDER.filter((p) => p !== options.preferredProvider)]
    : PROVIDER_ORDER;

  for (const provider of order) {
    if (providerCooldowns[provider] && Date.now() - providerCooldowns[provider] < COOLDOWN_MS) {
      logger.debug(`[AI] Skipping ${provider} (cooldown)`);
      continue;
    }
    if (!process.env[ENV_KEYS[provider]]) continue;
    if (EXTRA_ENV[provider] && !process.env[EXTRA_ENV[provider]!]) continue;

    try {
      let text: string;
      switch (provider) {
        case "bedrock": text = await callBedrock(prompt, systemPrompt); break;
        case "groq": text = await callGroq(prompt, systemPrompt); break;
        case "nvidia": text = await callNvidia(prompt, systemPrompt); break;
        case "gemini": text = await callGemini(prompt, systemPrompt); break;
        case "openrouter": text = await callOpenRouter(prompt, systemPrompt); break;
        case "cloudflare": text = await callCloudflare(prompt, systemPrompt); break;
        case "huggingface": text = await callHuggingFace(prompt); break;
        default: continue;
      }
      return { text, provider, model: PROVIDER_MODELS[provider] };
    } catch (error) {
      logger.warn(`[AI] ${provider} failed:`, error instanceof Error ? error.message : error);
      providerCooldowns[provider] = Date.now();
    }
  }
  throw new Error("All AI providers failed.");
}
