import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  
  if (user.id !== userId) {
    try { await supabase.rpc("increment_profile_views", { profile_id: userId }); } catch {}
  }
  
  return NextResponse.json(data);
}

const ALLOWED_PROFILE_FIELDS = [
  "display_name", "bio", "headline", "location", "skills", "interests",
  "linkedin_url", "github_url", "website_url", "avatar_url",
  "experience_years", "current_role", "current_company",
];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
