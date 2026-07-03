import { callAI } from "./providers";

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

  const response = await callAI(prompt, undefined, {
    preferredProvider: "groq",
    feature: "matcher",
  });

  const matches: MatchResult[] = JSON.parse(
    response.text.replace(/```json|```/g, "").trim()
  );

  return matches.map((m) => ({
    ...opportunities[m.index - 1],
    matchScore: m.score,
    matchReason: m.reason,
  }));
}
