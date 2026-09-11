import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCandidateEducations, createCandidateEducation } from "@/lib/candidate-profile-store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const educations = await getCandidateEducations(user.id);
  return NextResponse.json({ educations });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { institution, degree, field_of_study, start_year, end_year, grade, description } = body;

  if (!institution || !degree) {
    return NextResponse.json({ error: "Institution and degree are required" }, { status: 400 });
  }

  const education = await createCandidateEducation(user.id, {
    institution: String(institution).trim(),
    degree: String(degree).trim(),
    field_of_study: field_of_study ? String(field_of_study).trim() : null,
    start_year: start_year ? Number(start_year) : null,
    end_year: end_year ? Number(end_year) : null,
    grade: grade ? String(grade).trim() : null,
    description: description ? String(description).trim() : null,
  });

  return NextResponse.json({ education }, { status: 201 });
}
