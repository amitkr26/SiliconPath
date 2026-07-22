import { gateway } from "@berojgardegreewala/ai-gateway";
import type { AIProvider } from "@berojgardegreewala/ai-gateway";
import { neonPrimary } from "@/lib/db";

export type { AIProvider };
export type AIResponse = { text: string; provider: AIProvider; model: string };

export interface AILogEntry {
  feature: string;
  provider: AIProvider;
  model: string | null;
  prompt_length: number;
  response_length: number;
  success: boolean;
  error_message: string | null;
  cost_estimate?: number;
}

async function logAIUsage(entry: AILogEntry) {
  if (!neonPrimary) return;
  try {
    await neonPrimary`
      INSERT INTO ai_usage_log (feature, provider, model, prompt_length, response_length, success, error_message, cost_estimate)
      VALUES (${entry.feature}, ${entry.provider}, ${entry.model},
              ${entry.prompt_length}, ${entry.response_length},
              ${entry.success}, ${entry.error_message}, ${entry.cost_estimate ?? 0})
    `;
  } catch {
    // silently fail — logging should never block the AI call
  }
}

gateway.setLogger(logAIUsage);

export async function callAI(
  prompt: string,
  systemPrompt?: string,
  options?: { preferredProvider?: AIProvider; feature?: string }
): Promise<AIResponse> {
  return gateway.generate(
    { messages: [{ role: "user", content: prompt }], systemPrompt, model: options?.preferredProvider },
    options?.feature || "unknown"
  );
}

export async function callAIAdvanced(prompt: string, systemPrompt?: string): Promise<AIResponse> {
  return gateway.generateAdvanced(prompt, systemPrompt, "advanced");
}
