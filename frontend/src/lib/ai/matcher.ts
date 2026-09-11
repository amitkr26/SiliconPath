import { callAI, AIProvider } from "./providers";
import { logger } from "@/lib/logger";

export interface UserProfile {
  qualification: string;
  specialization: string;
  hasNET: boolean;
  hasGATE: boolean;
  preferredLocation: string;
  lookingFor: string[];
}

export interface MatchResult {
  index: number;
  score: number;
  reason: string;
}

const PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "openrouter",
  "cloudflare",
  "gemini",
  "nvidia",
  "bedrock",
  "huggingface"
];

function extractJSON(text: string): MatchResult[] {
  // Try parsing the whole text first
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  // Try extracting using regex for markdown codeblocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // Try extracting everything between the first '[' and the last ']'
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.substring(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  throw new Error("Could not extract valid JSON array from response");
}

export async function matchOpportunities(
  userProfile: UserProfile,
  opportunities: any[]
): Promise<MatchResult[]> {
  const prompt = `You are a career advisor for electronics researchers in India.

User Profile:
- Qualification: ${userProfile.qualification}
- Specialization: ${userProfile.specialization}
- NET Qualified: ${userProfile.hasNET}
- GATE Qualified: ${userProfile.hasGATE}
- Preferred Location: ${userProfile.preferredLocation}
- Looking For: ${(userProfile.lookingFor ?? []).join(", ")}

Here are available opportunities:
${opportunities
  .map(
    (o, i) =>
      `${i + 1}. ${o.title} at ${o.organization} | ${o.category} | ${o.location} | Eligibility: ${o.eligibility} | Tags: ${o.tags?.join(", ")}`
  )
  .join("\n")}

Return ONLY a JSON array of the top 10 most relevant opportunity numbers with match reasons:
[
  { "index": 1, "score": 95, "reason": "Perfect match - thin film + NET qualified + DRDO" },
  { "index": 3, "score": 87, "reason": "Strong match - spintronics research aligns well" }
]`;

  let lastError: any = null;

  for (const provider of PROVIDER_ORDER) {
    try {
      logger.debug("[AI Matcher] Trying provider", { provider });
      const response = await callAI(prompt, "You are a helpful assistant that returns ONLY strict JSON format data in response to prompt requests.", {
        preferredProvider: provider,
        feature: "matcher",
      });

      logger.debug("[AI Matcher] Raw response from provider", { provider, text: response.text });
      const matches = extractJSON(response.text);

      // Validate matches array structure
      if (!Array.isArray(matches)) {
        throw new Error("Parsed result is not an array");
      }

      // Filter out invalid indexes
      const validMatches = matches.filter(
        (m) => typeof m.index === "number" && m.index > 0 && m.index <= opportunities.length
      );

      if (validMatches.length === 0) {
        throw new Error("No valid opportunity matches found in JSON array");
      }

      return validMatches.map((m) => ({
        ...opportunities[m.index - 1],
        matchScore: m.score,
        matchReason: m.reason,
      }));
    } catch (err: any) {
      logger.warn("[AI Matcher] Provider failed parsing or execution", { provider, error: err instanceof Error ? err.message : String(err) });
      lastError = err;
      continue;
    }
  }

  throw new Error(
    `Failed to match opportunities: ${lastError?.message || "All AI providers failed to return valid JSON."}`
  );
}
