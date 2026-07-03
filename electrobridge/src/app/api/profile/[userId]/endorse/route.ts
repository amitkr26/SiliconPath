import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.id === userId) return NextResponse.json({ error: "Cannot endorse yourself" }, { status: 400 });

  const { skill } = await request.json();
  if (!skill) return NextResponse.json({ error: "Skill required" }, { status: 400 });

  // Check if endorsement already exists
  const { data: existing } = await supabase
    .from("skill_endorsements")
    .select("id")
    .eq("profile_owner_id", userId)
    .eq("endorser_id", user.id)
    .eq("skill", skill)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already endorsed for this skill" }, { status: 409 });
  }

  const { error } = await supabase.from("skill_endorsements").insert({
    profile_owner_id: userId,
    endorser_id: user.id,
    skill,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification({
    userId,
    type: "skill_endorsement",
    actorId: user.id,
    entityType: "skill",
    message: `endorsed your skill "${skill}"`,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skill } = await request.json();
  await supabase.from("skill_endorsements").delete()
    .eq("profile_owner_id", userId)
    .eq("endorser_id", user.id)
    .eq("skill", skill);

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("skill_endorsements")
    .select("*, endorser:user_profiles!endorser_id(full_name, avatar_url)")
    .eq("profile_owner_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ endorsements: data || [] });
}
