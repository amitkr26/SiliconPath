export type AIProviderName = "bedrock" | "groq" | "nvidia" | "gemini" | "openrouter" | "cloudflare" | "huggingface";

export const PROVIDER_ORDER: AIProviderName[] = [
  "groq", "openrouter", "cloudflare", "gemini", "nvidia", "bedrock", "huggingface",
];

export const PROVIDER_MODELS: Record<AIProviderName, string> = {
  bedrock: "openai.gpt-oss-120b",
  groq: "llama-3.1-8b-instant",
  nvidia: "meta/llama-3.1-8b-instruct",
  gemini: "gemini-1.5-flash",
  openrouter: "meta-llama/llama-3.1-8b-instruct:free",
  cloudflare: "@cf/meta/llama-3.1-8b-instruct",
  huggingface: "mistralai/Mistral-7B-Instruct-v0.3",
};

export const PROVIDER_ENV_KEYS: Record<AIProviderName, string> = {
  bedrock: "AWS_BEARER_TOKEN_BEDROCK",
  groq: "GROQ_API_KEY",
  nvidia: "NVIDIA_NIM_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  cloudflare: "CLOUDFLARE_AI_TOKEN",
  huggingface: "HUGGINGFACE_API_KEY",
};

export const PROVIDER_EXTRA_ENV: Partial<Record<AIProviderName, string>> = {
  cloudflare: "CLOUDFLARE_ACCOUNT_ID",
};
