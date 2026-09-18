import { NextRequest, NextResponse } from "next/server";
import { requireEmployerRole } from "@/lib/employer-auth";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import {
  getCandidateExperiences,
  getCandidateEducations,
  getCandidateProjects,
  getCandidateCertifications,
  getCandidateAchievements,
} from "@/lib/candidate-profile-store";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";


export const dynamic = "force-dynamic";

import { PUBLIC_PROFILE_FIELDS } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } | Promise<{ username: string }> }
) {
  const user = await requireEmployerRole(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const resolvedParams = params instanceof Promise ? await params : params;
  const username = resolvedParams?.username;
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const cleanUser = username.toLowerCase().replace(/^@/, "");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUser);

  try {
    let query = supabaseAdmin
      .from("user_profiles")
      .select(PUBLIC_PROFILE_FIELDS);

    if (isUuid) {
      query = query.eq("id", cleanUser);
    } else {
      query = query.eq("username", cleanUser);
    }

    const { data: candidate, error } = await query.maybeSingle();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const [experiences, educations, projects, certifications, achievements] = await Promise.all([
      getCandidateExperiences(candidate.id),
      getCandidateEducations(candidate.id),
      getCandidateProjects(candidate.id),
      getCandidateCertifications(candidate.id),
      getCandidateAchievements(candidate.id),
    ]);

    const completeness = calculateProfileCompleteness({
      profile: candidate,
      experiences,
      educations,
      projects,
    });

    const fullCandidate = {
      ...candidate,
      experiences,
      educations,
      projects,
      certifications,
      achievements,
      completeness,
    };

    return NextResponse.json({ candidate: fullCandidate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch candidate" }, { status: 500 });
  }
}
