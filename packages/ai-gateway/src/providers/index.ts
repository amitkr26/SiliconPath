import type { ProviderName, ProviderConfig } from "../types";
import { BaseProvider } from "./base";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { OpenRouterProvider } from "./openrouter";
import { GroqProvider } from "./groq";
import { TogetherProvider } from "./together";
import { DeepSeekProvider } from "./deepseek";
import { OllamaProvider } from "./ollama";

export { BaseProvider, ProviderError } from "./base";
export { GeminiProvider } from "./gemini";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
export { OpenRouterProvider } from "./openrouter";
export { GroqProvider } from "./groq";
export { TogetherProvider } from "./together";
export { DeepSeekProvider } from "./deepseek";
export { OllamaProvider } from "./ollama";

const PROVIDER_CLASSES: Record<ProviderName, new (config: ProviderConfig) => BaseProvider> = {
  gemini: GeminiProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  openrouter: OpenRouterProvider,
  groq: GroqProvider,
  together: TogetherProvider,
  deepseek: DeepSeekProvider,
  ollama: OllamaProvider,
};

export function createProvider(config: ProviderConfig): BaseProvider {
  const ProviderClass = PROVIDER_CLASSES[config.name];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${config.name}`);
  }
  return new ProviderClass(config);
}

export function createProviderByName(name: ProviderName): BaseProvider | null {
  const apiKey = getApiKeyForProvider(name);

  if (name !== "ollama" && !apiKey) {
    return null;
  }

  const config: ProviderConfig = {
    name,
    apiKey: apiKey ?? undefined,
    enabled: true,
  };

  return createProvider(config);
}

export function getAvailableProviders(): ProviderName[] {
  const providers: ProviderName[] = [];
  const allProviders: ProviderName[] = [
    "openai",
    "anthropic",
    "gemini",
    "groq",
    "openrouter",
    "together",
    "deepseek",
    "ollama",
  ];

  for (const name of allProviders) {
    if (name === "ollama") {
      providers.push(name);
    } else if (getApiKeyForProvider(name)) {
      providers.push(name);
    }
  }

  return providers;
}

function getApiKeyForProvider(name: ProviderName): string | null {
  const envKeyMap: Record<ProviderName, string> = {
    gemini: "GEMINI_API_KEY",
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    groq: "GROQ_API_KEY",
    together: "TOGETHER_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    ollama: "",
  };

  const envKey = envKeyMap[name];
  if (!envKey) return null;

  const key = process.env[envKey];
  return key || null;
}
