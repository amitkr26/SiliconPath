import { z } from "zod";
import type { GatewayResponse, ProviderConfig } from "../types";

const GatewayResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  provider: z.enum([
    "gemini",
    "openai",
    "anthropic",
    "openrouter",
    "groq",
    "together",
    "deepseek",
    "ollama",
  ]),
  content: z.string(),
  role: z.literal("assistant"),
  finishReason: z.string().nullable(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      }),
    )
    .optional(),
  latencyMs: z.number(),
});

const ProviderConfigSchema = z.object({
  name: z.enum([
    "gemini",
    "openai",
    "anthropic",
    "openrouter",
    "groq",
    "together",
    "deepseek",
    "ollama",
  ]),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  enabled: z.boolean(),
  defaultModel: z.string().optional(),
  timeout: z.number().positive().optional(),
  maxRetries: z.number().nonnegative().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export function validateStructuredOutput<T>(
  response: string,
  schema: z.ZodSchema<T>,
): T {
  let parsed: unknown;

  try {
    parsed = JSON.parse(response);
  } catch {
    const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1]!.trim());
      } catch {
        throw new Error("Failed to parse response as JSON (from code fence)");
      }
    } else {
      const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]!);
        } catch {
          throw new Error("Failed to parse response as JSON");
        }
      } else {
        throw new Error("No JSON found in response");
      }
    }
  }

  return schema.parse(parsed);
}

export function validateChatResponse(response: unknown): GatewayResponse {
  const result = GatewayResponseSchema.safeParse(response);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid gateway response: ${issues}`);
  }
  return result.data as GatewayResponse;
}

export function validateProviderConfig(config: unknown): ProviderConfig {
  const result = ProviderConfigSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid provider config: ${issues}`);
  }
  return result.data as ProviderConfig;
}
