import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Deterministic, local ATS heuristic (no AI call). Scores completeness +
// semiconductor keyword coverage. 0-100.
function scoreResume(body: {
  summary?: string;
  skills?: string[];
  education?: unknown[];
  experience?: unknown[];
  projects?: unknown[];
}): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  if ((body.summary || "").trim().length >= 60) score += 15;
  else feedback.push("Add a 2-3 line professional summary.");

  const skills = body.skills || [];
  if (skills.length >= 5) score += 20;
  else feedback.push("List at least 5 relevant skills.");

  if ((body.education || []).length >= 1) score += 15;
  else feedback.push("Add your education.");

  if ((body.experience || []).length >= 1) score += 25;
  else feedback.push("Add at least one experience or research entry.");

  if ((body.projects || []).length >= 1) score += 10;
  else feedback.push("Add a project to strengthen your profile.");

  const kw = [
    "vlsi", "rtl", "verilog", "systemverilog", "uvm", "cmos", "asic", "fpga",
    "physical design", "verification", "synthesis", "semiconductor", "soc", "dft",
  ];
  const hay = (skills.join(" ") + " " + (body.summary || "")).toLowerCase();
  const hits = kw.filter((k) => hay.includes(k)).length;
  score += Math.min(15, hits * 3);
  if (hits < 3) feedback.push("Include more semiconductor keywords (VLSI, RTL, UVM, CMOS, etc.).");

  return { score: Math.min(100, score), feedback };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("resumes").select("*").eq("user_id", user.id).maybeSingle();
  return NextResponse.json(data || null);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { score, feedback } = scoreResume(body);

  const row = {
    user_id: user.id,
    full_name: body.full_name || "",
    headline: body.headline || "",
    summary: body.summary || "",
    location: body.location || "",
    email: body.email || "",
    phone: body.phone || "",
    education: body.education || [],
    experience: body.experience || [],
    projects: body.projects || [],
    skills: body.skills || [],
    ats_score: score,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("resumes").upsert(row, { onConflict: "user_id" });
  if (error) {
    return NextResponse.json(
      { error: "Could not save resume. Ensure the resumes migration has been run." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, ats_score: score, ats_feedback: feedback });
}
