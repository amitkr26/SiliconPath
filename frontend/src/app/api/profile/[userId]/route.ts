import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PUBLIC_PROFILE_FIELDS, RESERVED_USERNAMES } from "@/lib/utils";
import {
  getCandidateExperiences,
  getCandidateEducations,
  getCandidateProjects,
  getCandidateCertifications,
  getCandidateAchievements,
} from "@/lib/candidate-profile-store";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import { apiError } from "@/lib/api-utils";


const UPDATABLE_FIELDS = [
  "display_name",
  "username",
  "headline",
  "bio",
  "location",
  "country",
  "job_title",
  "current_company",
  "experience_years",
  "skills",
  "interests",
  "linkedin_url",
  "github_url",
  "website_url",
  "avatar_url",
  "is_profile_public",
  "is_open_to_work",
  "email_notifications",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Accept either a profile id (UUID) or a username — public people pages link by username.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let query = supabase.from("user_profiles").select(PUBLIC_PROFILE_FIELDS);
  if (isUuid) query = query.eq("id", userId);
  else query = query.eq("username", userId);
  const { data, error } = await query.maybeSingle();

  if (error) return apiError(error, "profile-get");
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (user.id !== data.id) {
    try {
      await supabase.rpc("increment_profile_views", { profile_id: data.id });
    } catch {
      /* non-blocking */
    }
  }

  // Load candidate structured entities
  const [experiences, educations, projects, certifications, achievements] = await Promise.all([
    getCandidateExperiences(data.id),
    getCandidateEducations(data.id),
    getCandidateProjects(data.id),
    getCandidateCertifications(data.id),
    getCandidateAchievements(data.id),
  ]);

  const completeness = calculateProfileCompleteness({
    profile: data,
    experiences,
    educations,
    projects,
  });

  let mutual_connections_count = 0;
  if (user.id !== data.id) {
    try {
      const { data: allConns } = await supabaseAdmin
        .from("connections")
        .select("requester_id, addressee_id")
        .eq("status", "accepted");

      const myAccepted = new Set<string>();
      const theirAccepted = new Set<string>();

      (allConns || []).forEach((c: { requester_id: string; addressee_id: string }) => {
        if (c.requester_id === user.id) myAccepted.add(c.addressee_id);
        if (c.addressee_id === user.id) myAccepted.add(c.requester_id);
        if (c.requester_id === data.id) theirAccepted.add(c.addressee_id);
        if (c.addressee_id === data.id) theirAccepted.add(c.requester_id);
      });

      for (const friendId of myAccepted) {
        if (theirAccepted.has(friendId)) mutual_connections_count++;
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    ...data,
    experiences,
    educations,
    projects,
    certifications,
    achievements,
    completeness,
    mutual_connections_count,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  let user = null;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user;
    }
  }

  const supabase = await createClient();
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id !== userId) {
    return NextResponse.json({ error: "Forbidden: Cannot edit another user's profile" }, { status: 403 });
  }

  const body = await request.json();

  // Validate username uniqueness if present
  if (body.username) {
    const cleanUser = String(body.username).trim().toLowerCase().replace(/^@/, "");
    if (!/^[a-z0-9_]{3,40}$/.test(cleanUser)) {
      return NextResponse.json(
        { error: "Username must be 3–40 characters using letters, numbers, or underscores." },
        { status: 400 }
      );
    }
    if (RESERVED_USERNAMES.includes(cleanUser)) {
      return NextResponse.json({ error: "This username is reserved and cannot be used." }, { status: 400 });
    }
    const { data: existing } = await supabaseAdmin!
      .from("user_profiles")
      .select("id")
      .eq("username", cleanUser)
      .maybeSingle();

    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "This username is already taken by another user." }, { status: 400 });
    }
    body.username = cleanUser;
  }

  const sanitized: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in body) sanitized[key] = body[key];
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return apiError(error, "profile-update");

  return NextResponse.json({ success: true });
}
