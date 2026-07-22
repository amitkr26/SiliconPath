import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";

export const maxDuration = 30;

// POST /api/resume/ai-suggest
// Body: { section: "summary"|"skills"|"experience", context: {...profile fields} }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { section, context } = body as {
    section: "summary" | "skills" | "experience";
    context: Record<string, unknown>;
  };

  if (!section || !context) {
    return NextResponse.json({ error: "section and context required" }, { status: 400 });
  }

  const prompts: Record<string, string> = {
    summary: `You are a professional resume writer specializing in semiconductor, VLSI, and electronics careers.
Write a compelling professional summary (3-4 sentences, 80-120 words) for:
Name: ${context.name || "Engineer"}
Current/target role: ${context.headline || "VLSI/Electronics Engineer"}
Experience: ${context.experience_years || "Fresher"} years
Skills: ${Array.isArray(context.skills) ? context.skills.join(", ") : context.skills || "Verilog, VLSI design"}
Location: ${context.location || "India"}
Education: ${context.education || "B.Tech ECE"}
Open to: ${context.open_to_work ? "jobs" : ""} ${context.open_to_research ? ", research" : ""}

Write ONLY the summary paragraph. No headings, no bullet points. Professional tone.`,

    skills: `You are a resume expert for semiconductor and electronics careers.
Based on this engineer's profile, list 10-15 relevant technical skills in CSV format:
Role: ${context.headline || ""}
Experience: ${context.experience || ""}
Education: ${context.education || ""}
Self-listed skills: ${context.skills || ""}
Domain: ${context.domain || "VLSI/Embedded/Electronics"}

Return ONLY a comma-separated list of skills. No explanation.`,

    experience: `Improve this job experience bullet point for a semiconductor/VLSI engineer resume.
Make it results-oriented using action verbs. Keep it under 2 lines.
Original: ${context.description || "Worked on VLSI design"}
Role: ${context.role || "Engineer"}
Company: ${context.company || ""}

Return ONLY the improved bullet point.`,
  };

  const prompt = prompts[section];
  if (!prompt) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  try {
    const result = await callAI(prompt, undefined, { feature: "resume-suggest" });
    return NextResponse.json({ suggestion: result.text.trim() });
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
