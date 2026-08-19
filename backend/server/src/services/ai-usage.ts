import type { SupabaseClient } from "@supabase/supabase-js";
import { gateway, type AILogEntry } from "@berojgardegreewala/ai-gateway";

// Mirrors frontend/src/lib/ai/providers.ts logAIUsage: every gateway call
// emits a usage row into db1 `ai_usage_log` (fire-and-forget; failures are
// swallowed — usage telemetry must never break an AI response).
export function wireAiUsageLogging(supabaseAdmin: SupabaseClient | null): void {
  gateway.setLogger(async (entry: AILogEntry) => {
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
        cost_estimate: entry.cost_estimate ?? null,
      });
    } catch {
      // ignore telemetry failures
    }
  });
}
