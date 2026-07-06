import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
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
    let jsonText = aiResponse.text.trim();
    if (jsonText.startsWith("\`\`\`")) {
      jsonText = jsonText.replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/, "").trim();
    }
    const atsData = JSON.parse(jsonText);
    atsScore = atsData.score || 0;
    atsFeedback = atsData.feedback || [];
  } catch {
    atsScore = 50;
    atsFeedback = ["ATS scoring temporarily unavailable. Resume saved without score."];
  }

  const profileData = {
    full_name: body.full_name || "",
    headline: body.headline || "",
    about: body.summary || body.about || "",
    city: body.location?.split(',')[0]?.trim() || "",
    country: body.location?.split(',')[1]?.trim() || "",
    education: body.education || [],
    skills: body.skills || [],
    experience: body.experience || [],
    projects: body.projects || [],
    publications: body.publications || [],
    resume_ats_score: atsScore,
    updated_at: new Date().toISOString(),
  };

  // We are assuming the user_profiles row already exists (created on signup)
  const { error } = await supabase.from("user_profiles").update(profileData).eq("id", user.id);

  if (error) {
    // If the columns don't exist yet, we catch it
    console.error("Error updating user_profiles:", error);
    return NextResponse.json({ error: "Database schema must be updated with canonical fields. Run the SQL migration." }, { status: 500 });
  }

  return NextResponse.json({ success: true, ats_score: atsScore, ats_feedback: atsFeedback });
}
