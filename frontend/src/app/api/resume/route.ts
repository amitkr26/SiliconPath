import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resumeSchema, validateOrThrow } from "@/lib/validation";

function calculateAtsScore(resume: any): { score: number; feedback: string[] } {
  let score = 50;
  const feedback: string[] = [];

  if (resume.full_name && resume.full_name.trim().length > 2) score += 5;
  if (resume.headline && resume.headline.trim().length > 5) score += 5;
  if (resume.summary && resume.summary.trim().length > 30) {
    score += 10;
  } else {
    feedback.push("Add a more detailed professional summary highlighting your core hardware expertise.");
  }

  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  if (skills.length >= 5) {
    score += 15;
  } else {
    feedback.push("Include at least 5-8 relevant technical skills (e.g., Verilog, SystemVerilog, UVM, STA, OpenROAD).");
  }

  const edu = Array.isArray(resume.education) ? resume.education : [];
  if (edu.length > 0) {
    score += 10;
  } else {
    feedback.push("Add your degree and university education details.");
  }

  const exp = Array.isArray(resume.experience) ? resume.experience : [];
  const proj = Array.isArray(resume.projects) ? resume.projects : [];
  if (exp.length > 0 || proj.length > 0) {
    score += 10;
  } else {
    feedback.push("Add hands-on academic projects or industry experience.");
  }

  return {
    score: Math.min(100, Math.max(40, score)),
    feedback: feedback.length > 0 ? feedback : ["Great profile! Strong alignment with semiconductor industry expectations."],
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check user_profiles resume_data first, then fallback to resumes table
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("resume_data, display_name, headline, bio, location, email, skills")
    .eq("id", user.id)
    .maybeSingle();

  let resumeData: any = profile?.resume_data || {};

  if (!resumeData || Object.keys(resumeData).length === 0) {
    const { data: resTable } = await supabaseAdmin
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (resTable) {
      resumeData = resTable;
    } else if (profile) {
      resumeData = {
        full_name: profile.display_name || "",
        headline: profile.headline || "",
        summary: profile.bio || "",
        location: profile.location || "",
        email: profile.email || user.email || "",
        skills: profile.skills || [],
      };
    }
  }

  const { score, feedback } = calculateAtsScore(resumeData);

  return NextResponse.json({
    resume: resumeData,
    ...resumeData,
    ats_score: score,
    ats_feedback: feedback,
  });
}

export async function POST(request: NextRequest) {
  return PATCH(request);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates = validateOrThrow(resumeSchema, body);
  const { score, feedback } = calculateAtsScore(updates);

  const payloadWithMeta = {
    ...updates,
    ats_score: score,
    ats_feedback: feedback,
    updated_at: new Date().toISOString(),
  };

  // Persist into user_profiles.resume_data (DB1 truth)
  await supabaseAdmin
    .from("user_profiles")
    .update({
      resume_data: payloadWithMeta,
      ...(updates.headline ? { headline: updates.headline } : {}),
      ...(updates.location ? { location: updates.location } : {}),
      ...(updates.skills ? { skills: updates.skills } : {}),
    })
    .eq("id", user.id);

  // Also upsert into resumes table if present
  try {
    await supabaseAdmin
      .from("resumes")
      .upsert({ user_id: user.id, ...payloadWithMeta }, { onConflict: "user_id" });
  } catch {
    /* ignore if resumes table is omitted */
  }

  return NextResponse.json({
    success: true,
    resume: payloadWithMeta,
    ...payloadWithMeta,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabaseAdmin
    .from("user_profiles")
    .update({ resume_data: null })
    .eq("id", user.id);

  try {
    await supabaseAdmin.from("resumes").delete().eq("user_id", user.id);
  } catch {
    /* ignore */
  }

  return NextResponse.json({ success: true });
}