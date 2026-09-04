import { gateway } from "@berojgardegreewala/ai-gateway";
import type { AIProvider } from "@berojgardegreewala/ai-gateway";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  // P0.4: ai_usage_log lives on Supabase db1 (migration 20260501000004), not Neon.
  // Repointed 2026-08-16 — previously wrote to Neon where the table does not exist, so
  // every AI log insert silently failed.
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from("ai_usage_log").insert({
      feature: entry.feature,
      provider: entry.provider,
      model: entry.model,
      prompt_length: entry.prompt_length,
      response_length: entry.response_length,
      success: entry.success,
      error_message: entry.error_message,
      cost_estimate: entry.cost_estimate ?? 0,
    });
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
