import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Fields a user may update on their own profile. Prevents mass assignment.
 * Professional title column is `job_title` (current_role is a reserved word).
 */
const UPDATABLE_FIELDS = [
  "display_name",
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

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Sync to DB2 (social replica)
  try {
    const { syncProfile } = await import("@/lib/db");
    await syncProfile(userId);
  } catch (e) {
    console.error("[Profile Get] Sync profile to DB2 failed:", e);
  }

  if (user.id !== userId) {
    try {
      await supabase.rpc("increment_profile_views", { profile_id: userId });
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

  // Sync to DB2 (social replica)
  try {
    const { syncProfile } = await import("@/lib/db");
    await syncProfile(userId);
  } catch (e) {
    console.error("[Profile Patch] Sync profile to DB2 failed:", e);
  }

  return NextResponse.json({ success: true });
}
