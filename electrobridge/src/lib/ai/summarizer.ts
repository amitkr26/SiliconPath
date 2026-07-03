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
  return JSON.parse(response.text.replace(/```json|```/g, "").trim());
}
