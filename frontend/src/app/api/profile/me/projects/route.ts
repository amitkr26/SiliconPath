import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCandidateProjects, createCandidateProject } from "@/lib/candidate-profile-store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await getCandidateProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, technologies, project_url, github_url, start_date, end_date } = body;

  if (!title) {
    return NextResponse.json({ error: "Project title is required" }, { status: 400 });
  }

  const project = await createCandidateProject(user.id, {
    title: String(title).trim(),
    description: description ? String(description).trim() : null,
    technologies: Array.isArray(technologies) ? technologies.map(String) : [],
    project_url: project_url ? String(project_url).trim() : null,
    github_url: github_url ? String(github_url).trim() : null,
    start_date: start_date ? String(start_date).trim() : null,
    end_date: end_date ? String(end_date).trim() : null,
  });

  return NextResponse.json({ project }, { status: 201 });
}
