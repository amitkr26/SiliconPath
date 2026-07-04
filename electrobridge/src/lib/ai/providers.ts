import { neonPrimary } from "@/lib/db";

export type AIProvider = "bedrock" | "groq" | "nvidia" | "gemini" | "openrouter" | "cloudflare" | "huggingface";

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export interface AILogEntry {
  feature: string;
  provider: AIProvider;
  model: string | null;
  prompt_length: number;
  response_length: number;
  success: boolean;
  error_message: string | null;
}

async function logAIUsage(entry: AILogEntry) {
  if (!neonPrimary) return;
  try {
    await neonPrimary`
      INSERT INTO ai_usage_log (feature, provider, model, prompt_length, response_length, success, error_message)
      VALUES (${entry.feature}, ${entry.provider}, ${entry.model},
              ${entry.prompt_length}, ${entry.response_length},
              ${entry.success}, ${entry.error_message})
    `;
  } catch {
    // silently fail — logging should never block the AI call
  }
}

const PROVIDER_ORDER: AIProvider[] = [
  "groq",        // Tier 1: Ultra-Fast (Llama 3)
  "openrouter",  // Tier 2: High-Reliability
  "cloudflare",  // Tier 3: Edge Compute
  "gemini",      // Tier 4: Heavy NLP
  "nvidia",      // Tier 5: Enterprise Backup
  "bedrock",     // Backup
  "huggingface", // Final resort backup
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

// Simple in-memory cooldown cache for failed AI providers
const providerCooldowns: Record<string, number> = {};
const COOLDOWN_DURATION_MS = 10 * 60 * 1000; // 10 minutes cooldown

async function callBedrock(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(
    "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai.gpt-oss-120b",
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bedrock error ${response.status}: ${error}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? data.choices?.[0]?.message?.reasoning ?? "";
}

async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(
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
  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callNvidia(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt },
        ],
        temperature: 0.3,
        top_p: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA NIM error ${response.status}: ${error}`);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("NVIDIA NIM: empty response");
  }

  return data.choices[0].message.content;
}

async function callNvidiaAdvanced(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct-v0.3",
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt },
        ],
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 2048,
        stream: false,
      }),
      signal: AbortSignal.timeout(8000), // Slightly longer for advanced
    }
  );

  if (!response.ok) throw new Error(`NVIDIA Advanced error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://siliconpath.vercel.app",
      "X-Title": "SiliconPath",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt },
      ],
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callCloudflare(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_AI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(4000),
    }
  );
  if (!response.ok) throw new Error(`Cloudflare error: ${response.status}`);
  const data = await response.json();
  return data.result.response;
}

async function callHuggingFace(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 512, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!response.ok) throw new Error(`HuggingFace error: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data[0].generated_text : data.generated_text;
}

export async function callAI(
  prompt: string,
  systemPrompt?: string,
  options?: {
    preferredProvider?: AIProvider;
    feature?: string;
  }
): Promise<AIResponse> {
  const feature = options?.feature || "unknown";

  const order = options?.preferredProvider
    ? [options.preferredProvider, ...PROVIDER_ORDER.filter((p) => p !== options.preferredProvider)]
    : PROVIDER_ORDER;

  for (const provider of order) {
    const nowTime = Date.now();
    if (providerCooldowns[provider] && nowTime - providerCooldowns[provider] < COOLDOWN_DURATION_MS) {
      console.warn(`[AI] Skipping provider ${provider} due to failure cooldown.`);
      continue;
    }

    const model = PROVIDER_MODELS[provider];
    const envKey: Record<AIProvider, string> = {
      bedrock: "AWS_BEARER_TOKEN_BEDROCK",
      groq: "GROQ_API_KEY",
      nvidia: "NVIDIA_NIM_API_KEY",
      gemini: "GEMINI_API_KEY",
      openrouter: "OPENROUTER_API_KEY",
      cloudflare: "CLOUDFLARE_AI_TOKEN",
      huggingface: "HUGGINGFACE_API_KEY",
    };

    const extraEnv: Partial<Record<AIProvider, string>> = {
      cloudflare: "CLOUDFLARE_ACCOUNT_ID",
    };
    if (!process.env[envKey[provider]] || (extraEnv[provider] && !process.env[extraEnv[provider]!])) continue;

    try {
      let text: string;
      switch (provider) {
        case "bedrock":
          text = await callBedrock(prompt, systemPrompt);
          break;
        case "groq":
          text = await callGroq(prompt, systemPrompt);
          break;
        case "nvidia":
          text = await callNvidia(prompt, systemPrompt);
          break;
        case "gemini":
          text = await callGemini(prompt, systemPrompt);
          break;
        case "openrouter":
          text = await callOpenRouter(prompt, systemPrompt);
          break;
        case "cloudflare":
          text = await callCloudflare(prompt, systemPrompt);
          break;
        case "huggingface":
          text = await callHuggingFace(prompt);
          break;
        default:
          continue;
      }

      logAIUsage({
        feature,
        provider,
        model,
        prompt_length: prompt.length,
        response_length: text.length,
        success: true,
        error_message: null,
      });

      return { text, provider, model };
    } catch (error) {
      console.warn(`[AI] Provider ${provider} failed:`, error);
      providerCooldowns[provider] = Date.now();

      logAIUsage({
        feature,
        provider,
        model,
        prompt_length: prompt.length,
        response_length: 0,
        success: false,
        error_message: error instanceof Error ? error.message : String(error),
      });

      continue;
    }
  }

  throw new Error("All AI providers failed. Please try again later.");
}

export async function callAIAdvanced(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  const advancedOrder: AIProvider[] = ["nvidia", "gemini", "groq"];

  for (const provider of advancedOrder) {
    const nowTime = Date.now();
    if (providerCooldowns[provider] && nowTime - providerCooldowns[provider] < COOLDOWN_DURATION_MS) {
      console.warn(`[AI Advanced] Skipping provider ${provider} due to failure cooldown.`);
      continue;
    }

    const model = PROVIDER_MODELS[provider];

    try {
      let text: string;
      if (provider === "nvidia") {
        text = await callNvidiaAdvanced(prompt, systemPrompt);
      } else if (provider === "gemini") {
        text = await callGemini(prompt, systemPrompt);
      } else {
        text = await callGroq(prompt, systemPrompt);
      }

      logAIUsage({
        feature: "advanced",
        provider,
        model,
        prompt_length: prompt.length,
        response_length: text.length,
        success: true,
        error_message: null,
      });

      return { text, provider, model };
    } catch (error) {
      console.warn(`[AI Advanced] ${provider} failed:`, error);
      providerCooldowns[provider] = Date.now(); // Set cooldown on failure

      logAIUsage({
        feature: "advanced",
        provider,
        model,
        prompt_length: prompt.length,
        response_length: 0,
        success: false,
        error_message: error instanceof Error ? error.message : String(error),
      });

      continue;
    }
  }

  throw new Error("All advanced AI providers failed");
}
