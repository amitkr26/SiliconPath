import { callAI } from "./providers";

export interface AIFilters {
  category: string | null;
  location: string | null;
  tags: string[];
  organization_hint: string | null;
  eligibility: string | null;
}

export async function parseSearchQuery(query: string): Promise<AIFilters> {
  try {
    const prompt = `Extract search filters from this query for an electronics job platform.
Query: "${query}"

Return ONLY JSON:
{
  "category": "JRF|SRF|PhD|Govt Job|Private Job|Fellowship|null",
  "location": "city name or null",
  "tags": ["tag1", "tag2"],
  "organization_hint": "org name or null",
  "eligibility": "NET|GATE|MSc|BTech|null"
}`;

    const response = await callAI(prompt, undefined, {
      preferredProvider: "groq",
      feature: "search-parser",
    });

    return JSON.parse(response.text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      category: null,
      location: null,
      tags: [],
      organization_hint: null,
      eligibility: null,
    };
  }
}
