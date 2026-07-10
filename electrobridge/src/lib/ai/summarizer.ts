import { callAI } from "./providers";

export interface AISummary {
  clean_title: string;
  summary: string;
  eligibility_points: string[];
  suggested_tags: string[];
  stipend_extracted: string | null;
  deadline_extracted: string | null;
}

export async function summarizeOpportunity(
  rawDescription: string,
  title: string,
  org: string
): Promise<AISummary> {
  const prompt = `You are helping summarize a research/job opportunity for electronics and semiconductor researchers.

Title: ${title}
Organization: ${org}
Raw Description: ${rawDescription}

Return ONLY a JSON object (no markdown, no explanation):
{
  "clean_title": "concise job title under 60 chars",
  "summary": "2 sentence summary of what the role involves and who should apply",
  "eligibility_points": ["point 1", "point 2", "point 3"],
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4"],
  "stipend_extracted": "stipend if mentioned or null",
  "deadline_extracted": "deadline if mentioned in YYYY-MM-DD format or null"
}`;

  const response = await callAI(prompt, undefined, {
    preferredProvider: "gemini",
    feature: "summarizer",
  });

  const raw = response.text.replace(/```json|```/gi, "").trim();
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  const jsonText = braceStart !== -1 && braceEnd > braceStart
    ? raw.slice(braceStart, braceEnd + 1)
    : raw;

  try {
    return JSON.parse(jsonText) as AISummary;
  } catch {
    return {
      clean_title: title,
      summary: "",
      eligibility_points: [],
      suggested_tags: [],
      stipend_extracted: null,
      deadline_extracted: null,
    } as AISummary;
  }
}
