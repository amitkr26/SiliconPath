import { PROVIDER_ENV_KEYS, PROVIDER_EXTRA_ENV, PROVIDER_ORDER, type AIProviderName } from "./providers";

export function isProviderAvailable(name: AIProviderName): boolean {
  const key = PROVIDER_ENV_KEYS[name];
  if (!process.env[key]) return false;
  const extra = PROVIDER_EXTRA_ENV[name];
  if (extra && !process.env[extra]) return false;
  return true;
}

export function getAvailableProviders(): AIProviderName[] {
  return PROVIDER_ORDER.filter(isProviderAvailable);
}
