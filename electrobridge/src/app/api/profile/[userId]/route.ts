import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Only these columns may be updated through the public PATCH endpoint.
 * This prevents mass-assignment / privilege escalation (e.g. setting `role`,
 * `is_profile_public` on someone else, `email`, or internal stat columns).
 */
const UPDATABLE_FIELDS = [
  "display_name",
  "headline",
  "bio",
  "location",
  "current_role",
  "current_company",
  "experience_years",
  "skills",
  "interests",
  "linkedin_url",
  "github_url",
  "website_url",
  "avatar_url",
  "is_profile_public",
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

  // Only count views for other people's public profiles
  if (user.id !== userId && data.is_profile_public) {
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

  // Strict whitelist: silently drop any field not explicitly allowed.
  const sanitized: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in body) sanitized[key] = body[key];
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
