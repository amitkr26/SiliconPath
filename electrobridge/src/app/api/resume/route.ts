import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("user_resumes").select("*").eq("user_id", user.id).maybeSingle();
  return NextResponse.json(data || null);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const atsPrompt = `
You are an ATS (Applicant Tracking System) expert for electronics and semiconductor jobs.

Analyze this resume for ATS optimization:
Name: ${body.full_name || ""}
Skills: ${(body.skills || []).join(", ")}
Education: ${JSON.stringify(body.education || [])}
Experience: ${JSON.stringify(body.experience || [])}

Score this resume from 0-100 for ATS compatibility for electronics/semiconductor JRF, PhD, and industry roles.
Return ONLY valid JSON (no markdown):
{
  "score": 74,
  "feedback": [
    "Add more semiconductor-specific keywords like VLSI, CMOS, semiconductor",
    "Quantify research achievements with metrics",
    "Include relevant publications or projects"
  ]
}`;

  let atsScore = 0;
  let atsFeedback: string[] = [];

  try {
    const aiResponse = await callAI(atsPrompt, undefined, { feature: "resume_ats" });
    const atsData = JSON.parse(aiResponse.text.replace(/```json|```/g, "").trim());
    atsScore = atsData.score || 0;
    atsFeedback = atsData.feedback || [];
  } catch {
    atsScore = 50;
    atsFeedback = ["ATS scoring temporarily unavailable. Resume saved without score."];
  }

  const resumeData = {
    user_id: user.id,
    full_name: body.full_name || "",
    email: body.email || "",
    phone: body.phone || "",
    linkedin: body.linkedin || "",
    github: body.github || "",
    education: body.education || [],
    skills: body.skills || [],
    experience: body.experience || [],
    projects: body.projects || [],
    publications: body.publications || [],
    ats_score: atsScore,
    ats_feedback: atsFeedback,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from("user_resumes").select("id").eq("user_id", user.id).maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from("user_resumes").update(resumeData).eq("user_id", user.id));
  } else {
    ({ error } = await supabase.from("user_resumes").insert(resumeData));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, ats_score: atsScore, ats_feedback: atsFeedback });
}
