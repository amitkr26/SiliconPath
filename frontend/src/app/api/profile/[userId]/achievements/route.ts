import { NextRequest, NextResponse } from "next/server";
import { getCandidateAchievements } from "@/lib/candidate-profile-store";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } | Promise<{ userId: string }> }
) {
  // ponypfix: require authentication to access any user's structured career data
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = params instanceof Promise ? await params : params;
  const userId = resolvedParams?.userId;
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  let resolvedUserId = userId;

  if (!isUuid) {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("username", userId.toLowerCase())
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    resolvedUserId = profile.id;
  }

  const achievements = await getCandidateAchievements(resolvedUserId);
  return NextResponse.json({ achievements });
}
