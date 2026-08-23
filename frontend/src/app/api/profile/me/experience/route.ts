import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCandidateExperiences, createCandidateExperience } from "@/lib/candidate-profile-store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const experiences = await getCandidateExperiences(user.id);
  return NextResponse.json({ experiences });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { company_name, role_title, employment_type, location, start_date, end_date, is_current, description, skills_used } = body;

  if (!company_name || !role_title || !start_date) {
    return NextResponse.json({ error: "Company name, role title, and start date are required" }, { status: 400 });
  }

  if (is_current && end_date) {
    return NextResponse.json({ error: "A current role cannot have an end date" }, { status: 400 });
  }

  const experience = await createCandidateExperience(user.id, {
    company_name: String(company_name).trim(),
    role_title: String(role_title).trim(),
    employment_type: employment_type || "Full-time",
    location: location ? String(location).trim() : null,
    start_date: String(start_date).trim(),
    end_date: is_current ? null : (end_date ? String(end_date).trim() : null),
    is_current: Boolean(is_current),
    description: description ? String(description).trim() : null,
    skills_used: Array.isArray(skills_used) ? skills_used.map(String) : [],
  });

  return NextResponse.json({ experience }, { status: 201 });
}
