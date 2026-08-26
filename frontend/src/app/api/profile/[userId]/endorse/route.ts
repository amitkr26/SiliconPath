import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTargetUserId(param: string): Promise<string> {
  if (UUID_REGEX.test(param)) return param;
  const { data: prof } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .ilike("username", param)
    .maybeSingle();
  return prof?.id || param;
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.userId;
  if (!rawId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = await resolveTargetUserId(rawId);
  if (user.id === targetId) {
    return NextResponse.json({ error: "Cannot endorse yourself" }, { status: 400 });
  }

  const { skill } = await request.json();
  if (!skill) return NextResponse.json({ error: "Skill required" }, { status: 400 });

  // Check if endorsement already exists
  const { data: existing } = await supabaseAdmin
    .from("skill_endorsements")
    .select("id")
    .eq("profile_owner_id", targetId)
    .eq("endorser_id", user.id)
    .eq("skill", skill)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already endorsed for this skill" }, { status: 409 });
  }

  const { error } = await supabaseAdmin.from("skill_endorsements").insert({
    profile_owner_id: targetId,
    endorser_id: user.id,
    skill,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification({
    userId: targetId,
    type: "skill_endorsement",
    actorId: user.id,
    entityType: "skill",
    message: `endorsed your skill "${skill}"`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.userId;
  if (!rawId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = await resolveTargetUserId(rawId);
  const { skill } = await request.json();
  await supabaseAdmin.from("skill_endorsements").delete()
    .eq("profile_owner_id", targetId)
    .eq("endorser_id", user.id)
    .eq("skill", skill);

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } | Promise<{ userId: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const rawId = resolvedParams?.userId;
  if (!rawId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = await resolveTargetUserId(rawId);
  const { data, error } = await supabaseAdmin
    .from("skill_endorsements")
    .select("*, endorser:user_profiles!skill_endorsements_endorser_id_profile_fkey(display_name, avatar_url)")
    .eq("profile_owner_id", targetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ endorsements: data || [] });
}
