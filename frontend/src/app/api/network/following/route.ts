import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || user.id;

  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id, created_at")
    .eq("follower_id", userId);

  if (!follows || follows.length === 0) return NextResponse.json({ following: [] });

  const followingIds = follows.map((f) => f.following_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .in("id", followingIds);

  return NextResponse.json({ following: profiles || [] });
}
