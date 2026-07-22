import type { ChatMessage } from "../types/provider";
import type { GatewayRequest, GatewayResponse } from "../types/gateway";

const COOLDOWN_MS = 10 * 60 * 1000;
const providerCooldowns: Record<string, number> = {};

export type AIProvider = "bedrock" | "groq" | "nvidia" | "gemini" | "openrouter" | "cloudflare" | "huggingface" | "agentrouter" | "omnirouter";

export const PROVIDER_CONFIG: Record<AIProvider, { model: string; envKey: string; extraEnv?: string; costPer1kTokens?: number }> = {
  bedrock:     { model: "openai.gpt-oss-120b",              envKey: "AWS_BEARER_TOKEN_BEDROCK", costPer1kTokens: 0.003 },
  groq:        { model: "llama-3.1-8b-instant",             envKey: "GROQ_API_KEY",              costPer1kTokens: 0 },
  nvidia:      { model: "meta/llama-3.1-8b-instruct",       envKey: "NVIDIA_NIM_API_KEY",        costPer1kTokens: 0 },
  gemini:      { model: "gemini-1.5-flash",                 envKey: "GEMINI_API_KEY",            costPer1kTokens: 0.000075 },
  openrouter:  { model: "meta-llama/llama-3.1-8b-instruct:free", envKey: "OPENROUTER_API_KEY",  costPer1kTokens: 0 },
  cloudflare:  { model: "@cf/meta/llama-3.1-8b-instruct",   envKey: "CLOUDFLARE_AI_TOKEN",       extraEnv: "CLOUDFLARE_ACCOUNT_ID", costPer1kTokens: 0 },
  huggingface: { model: "mistralai/Mistral-7B-Instruct-v0.3", envKey: "HUGGINGFACE_API_KEY",    costPer1kTokens: 0 },
  agentrouter: { model: "gpt-3.5-turbo",                    envKey: "AGENTROUTER_API_KEY",       costPer1kTokens: 0 },
  omnirouter:  { model: "auto",                             envKey: "OMNIROUTER_BASE_URL",       costPer1kTokens: 0 },
};

export type AILogEntry = {
  feature: string; provider: AIProvider; model: string;
  prompt_length: number; response_length: number; success: boolean; error_message: string | null;
  cost_estimate?: number;
};
type LogFn = (entry: AILogEntry) => Promise<void> | void;

function estimateCost(provider: AIProvider, promptLen: number, responseLen: number): number {
  const cfg = PROVIDER_CONFIG[provider];
  if (!cfg?.costPer1kTokens) return 0;
  const totalTokens = Math.ceil(promptLen / 4) + Math.ceil(responseLen / 4);
  return parseFloat(((totalTokens / 1000) * cfg.costPer1kTokens).toFixed(6));
}

export const DEFAULT_PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "gemini",
  "openrouter",
  "nvidia",
  "agentrouter",
  "omnirouter",
  "cloudflare",
  "bedrock",
  "huggingface",
];

export class AIGateway {
  private logFn: LogFn = () => {};

  setLogger(fn: LogFn) { this.logFn = fn; }

  async generate(request: GatewayRequest, feature = "unknown"): Promise<{ text: string; provider: AIProvider; model: string }> {
    const preferred = request.model as AIProvider | undefined;
    const order: AIProvider[] = preferred && DEFAULT_PROVIDER_ORDER.includes(preferred)
      ? [preferred, ...DEFAULT_PROVIDER_ORDER.filter((p) => p !== preferred)]
      : DEFAULT_PROVIDER_ORDER;

    const promptText = request.messages.map((m) => m.content).join("\n");
    const systemPrompt = request.systemPrompt;

    for (const provider of order) {
      const now = Date.now();
      if (providerCooldowns[provider] && now - providerCooldowns[provider] < COOLDOWN_MS) continue;

      const cfg = PROVIDER_CONFIG[provider];
      if (!cfg) continue;
      if (provider !== "omnirouter" && (!process.env[cfg.envKey] || (cfg.extraEnv && !process.env[cfg.extraEnv]))) continue;

      try {
        const text = await this.callProvider(provider, promptText, systemPrompt);
        const cost = estimateCost(provider, promptText.length, text.length);
        this.logFn({ feature, provider, model: cfg.model, prompt_length: promptText.length, response_length: text.length, success: true, error_message: null, cost_estimate: cost });
        return { text, provider, model: cfg.model };
      } catch (error) {
        providerCooldowns[provider] = Date.now();
        this.logFn({ feature, provider, model: cfg.model, prompt_length: promptText.length, response_length: 0, success: false, error_message: error instanceof Error ? error.message : String(error), cost_estimate: 0 });
      }
    }
    throw new Error("All AI providers failed. Please try again later.");
  }

  async generateAdvanced(prompt: string, systemPrompt?: string, feature = "advanced"): Promise<{ text: string; provider: AIProvider; model: string }> {
    for (const provider of DEFAULT_PROVIDER_ORDER) {
      const now = Date.now();
      if (providerCooldowns[provider] && now - providerCooldowns[provider] < COOLDOWN_MS) continue;
      const cfg = PROVIDER_CONFIG[provider];
      if (!cfg) continue;
      if (provider !== "omnirouter" && (!process.env[cfg.envKey] || (cfg.extraEnv && !process.env[cfg.extraEnv]))) continue;
      try {
        const text = await this.callProvider(provider, prompt, systemPrompt);
        const cost = estimateCost(provider, prompt.length, text.length);
        this.logFn({ feature, provider, model: cfg.model, prompt_length: prompt.length, response_length: text.length, success: true, error_message: null, cost_estimate: cost });
        return { text, provider, model: cfg.model };
      } catch (error) {
        providerCooldowns[provider] = Date.now();
        this.logFn({ feature, provider, model: cfg.model, prompt_length: prompt.length, response_length: 0, success: false, error_message: error instanceof Error ? error.message : String(error), cost_estimate: 0 });
      }
    }
    throw new Error("All advanced AI providers failed");
  }

  private async callProvider(provider: AIProvider, prompt: string, systemPrompt?: string): Promise<string> {
    switch (provider) {
      case "bedrock": return this.callBedrock(prompt, systemPrompt);
      case "groq": return this.callGroq(prompt, systemPrompt);
      case "nvidia": return this.callNvidia(prompt, systemPrompt);
      case "gemini": return this.callGemini(prompt, systemPrompt);
      case "openrouter": return this.callOpenRouter(prompt, systemPrompt);
      case "cloudflare": return this.callCloudflare(prompt, systemPrompt);
      case "huggingface": return this.callHuggingFace(prompt);
      case "agentrouter": return this.callAgentRouter(prompt, systemPrompt);
      case "omnirouter": return this.callOmniRouter(prompt, systemPrompt);
    }
  }

  private async callAgentRouter(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.AGENTROUTER_API_KEY;
    if (!apiKey) throw new Error("AGENTROUTER_API_KEY missing");
    const baseUrl = process.env.AGENTROUTER_BASE_URL || "https://agentrouter.org/v1";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: PROVIDER_CONFIG.agentrouter.model, messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`AgentRouter error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async callBedrock(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch("https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: PROVIDER_CONFIG.bedrock.model, messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }], max_tokens: 1024, temperature: 0.3 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Bedrock error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async callGemini(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PROVIDER_CONFIG.gemini.model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }] }], generationConfig: { maxOutputTokens: 1024, temperature: 0.3 } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  private async callGroq(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: PROVIDER_CONFIG.groq.model, messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }], max_tokens: 1024, temperature: 0.3 }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async callNvidia(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: PROVIDER_CONFIG.nvidia.model, messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }], temperature: 0.3, top_p: 0.7, max_tokens: 1024, stream: false }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`NVIDIA NIM error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.choices?.[0]?.message?.content) throw new Error("NVIDIA NIM: empty response");
    return data.choices[0].message.content;
  }

  private async callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://berojgardegreewala.vercel.app", "X-Title": "BerojgarDegreeWala" },
      body: JSON.stringify({ model: PROVIDER_CONFIG.openrouter.model, messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }], max_tokens: 1024 }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async callCloudflare(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Cloudflare error: ${res.status}`);
    const data = await res.json();
    return data.result?.response || "";
  }

  private async callHuggingFace(prompt: string): Promise<string> {
    const res = await fetch(`https://api-inference.huggingface.co/models/${PROVIDER_CONFIG.huggingface.model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 512, temperature: 0.3 } }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data[0]?.generated_text || "" : data.generated_text || "";
  }

  private async callOmniRouter(prompt: string, systemPrompt?: string): Promise<string> {
    const baseUrl = process.env.OMNIROUTER_BASE_URL || "http://localhost:20128/v1";
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { 
        ...(process.env.OMNIROUTER_API_KEY ? { Authorization: `Bearer ${process.env.OMNIROUTER_API_KEY}` } : {}),
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        model: PROVIDER_CONFIG.omnirouter.model, 
        messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }] 
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`OmniRouter error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export const gateway = new AIGateway();
