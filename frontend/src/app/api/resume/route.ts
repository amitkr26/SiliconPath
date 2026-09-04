import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";
import { validateOrThrow } from "@/lib/validation";

export const dynamic = "force-dynamic";

const resumeSchema = z.object({
  full_name: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  website: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  skills: z.array(z.string()).optional().default([]),
  education: z.array(z.any()).optional().default([]),
  experience: z.array(z.any()).optional().default([]),
  projects: z.array(z.any()).optional().default([]),
  certifications: z.array(z.any()).optional().default([]),
  publications: z.array(z.any()).optional().default([]),
  awards: z.array(z.any()).optional().default([]),
}).passthrough();

function calculateAtsScore(resume: any) {
  let score = 40;
  const feedback: string[] = [];

  if (resume.full_name && resume.full_name.length > 2) score += 5;
  if (resume.email && resume.email.includes("@")) score += 5;
  if (resume.phone && resume.phone.length >= 8) score += 5;
  if (resume.headline && resume.headline.length > 5) score += 5;
  if (resume.summary && resume.summary.length > 20) score += 5;

  const skillsCount = Array.isArray(resume.skills) ? resume.skills.length : 0;
  if (skillsCount >= 5) score += 10;
  else feedback.push("Add at least 5 key technical semiconductor skills (e.g. Verilog, UVM, STA).");

  const expCount = Array.isArray(resume.experience) ? resume.experience.length : 0;
  if (expCount >= 1) score += 10;
  else feedback.push("Add detailed internship, research lab, or industry experience.");

  const eduCount = Array.isArray(resume.education) ? resume.education.length : 0;
  if (eduCount >= 1) score += 10;
  else feedback.push("Add your academic background (Degree, University, Graduation Year).");

  const projCount = Array.isArray(resume.projects) ? resume.projects.length : 0;
  if (projCount >= 1) score += 5;

  return {
    score: Math.min(100, Math.max(40, score)),
    feedback: feedback.length > 0 ? feedback : ["Great profile! Strong alignment with semiconductor industry ATS standards."],
  };
}

export async function GET(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  if (!user) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Query physical user_resumes table
  const { data: resumeRow } = await supabaseAdmin
    .from("user_resumes")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let resumeData: any = resumeRow || null;

  // 2. Fallback to user_profiles if no user_resumes row exists yet
  if (!resumeData) {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("display_name, headline, bio, location, email, skills")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      resumeData = {
        full_name: profile.display_name || "",
        headline: profile.headline || "",
        summary: profile.bio || "",
        location: profile.location || "",
        email: profile.email || user.email || "",
        skills: profile.skills || [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        publications: [],
      };
    } else {
      resumeData = {};
    }
  }

  // 3. Query multi-resume versions if present
  let versions: any[] = [];
  try {
    const { data: vList } = await supabaseAdmin
      .from("resume_versions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (vList) versions = vList;
  } catch {}

  const { score, feedback } = calculateAtsScore(resumeData);

  return NextResponse.json({
    resume: resumeData,
    versions,
    ...resumeData,
    ats_score: resumeData.ats_score || score,
    ats_feedback: resumeData.ats_feedback || feedback,
  });
}

export async function POST(request: NextRequest) {
  return PATCH(request);
}

export async function PATCH(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  if (!user) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates = validateOrThrow(resumeSchema, body);
  const { score, feedback } = calculateAtsScore(updates);

  const payload = {
    user_id: user.id,
    full_name: updates.full_name || "",
    email: updates.email || user.email || "",
    phone: updates.phone || "",
    headline: updates.headline || "",
    summary: updates.summary || "",
    location: updates.location || "",
    linkedin: updates.linkedin || "",
    github: updates.github || "",
    website: updates.website || "",
    education: updates.education || [],
    skills: updates.skills || [],
    experience: updates.experience || [],
    projects: updates.projects || [],
    publications: updates.publications || [],
    certifications: updates.certifications || [],
    awards: updates.awards || [],
    ats_score: score,
    ats_feedback: feedback,
    updated_at: new Date().toISOString(),
  };

  // Upsert into user_resumes
  const { error: upsertError } = await supabaseAdmin
    .from("user_resumes")
    .upsert(payload, { onConflict: "user_id" });

  if (upsertError) {
    console.error("user_resumes upsert error:", upsertError);
  }

  // Also persist to resume_versions table
  let savedVersion = null;
  try {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const versionId = body.version_id && UUID_REGEX.test(body.version_id) ? body.version_id : undefined;
    const versionName = body.version_name || "Primary Resume";
    const targetDomain = body.target_domain || null;
    const targetRole = body.target_role || updates.headline || null;
    const styleData = body.style || null;

    const versionPayload = {
      ...(versionId ? { id: versionId } : {}),
      user_id: user.id,
      version_name: versionName,
      target_domain: targetDomain,
      target_role: targetRole,
      is_master: body.is_master ?? true,
      structured_data: { data: updates, style: styleData },
      ats_score: score,
      ats_feedback: feedback,
      updated_at: new Date().toISOString(),
    };

    const { data: vData } = await supabaseAdmin
      .from("resume_versions")
      .upsert(versionPayload)
      .select()
      .maybeSingle();

    savedVersion = vData;
  } catch (vErr) {
    console.error("resume_versions upsert error:", vErr);
  }

  // Sync profile metadata if provided
  await supabaseAdmin
    .from("user_profiles")
    .update({
      ...(updates.headline ? { headline: updates.headline } : {}),
      ...(updates.location ? { location: updates.location } : {}),
      ...(updates.skills && updates.skills.length > 0 ? { skills: updates.skills } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    resume: payload,
    version: savedVersion,
    ...payload,
  });
}

export async function DELETE(request: NextRequest) {
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  if (!user) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  if (versionId) {
    await supabaseAdmin
      .from("resume_versions")
      .delete()
      .eq("id", versionId)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, deletedVersionId: versionId });
  }

  await supabaseAdmin
    .from("user_resumes")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}