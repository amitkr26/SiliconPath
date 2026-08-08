import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Accept either a profile id (UUID) or a username — public people pages link by username.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let query = supabase.from("user_profiles").select("*");
  if (isUuid) query = query.eq("id", userId);
  else query = query.eq("username", userId);
  const { data, error } = await query.maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const { syncProfile } = await import("@/lib/db");
    await syncProfile(data.id);
  } catch (e) {
    console.error("[Profile Get] Sync profile to DB2 failed:", e);
  }

  if (user.id !== data.id) {
    try {
      await supabase.rpc("increment_profile_views", { profile_id: data.id });
    } catch {
      /* non-blocking */
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate username uniqueness if present
  if (body.username) {
    const cleanUser = String(body.username).trim().toLowerCase().replace(/^@/, "");
    const { data: existing } = await supabase
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { syncProfile } = await import("@/lib/db");
    await syncProfile(userId);
  } catch (e) {
    console.error("[Profile Patch] Sync profile to DB2 failed:", e);
  }

  return NextResponse.json({ success: true });
}
