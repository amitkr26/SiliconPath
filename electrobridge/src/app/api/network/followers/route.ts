import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || user.id;

  const { data: follows, error } = await supabase
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("following_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!follows || follows.length === 0) return NextResponse.json({ followers: [] });

  const followerIds = follows.map((f) => f.follower_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .in("id", followerIds);

  // Check if current user follows back
  const { data: myFollowing } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingSet = new Set((myFollowing || []).map((f) => f.following_id));

  const followers = (profiles || []).map((p: any) => ({
    ...p,
    is_following_back: followingSet.has(p.id),
  }));

  return NextResponse.json({ followers, total: followers.length });
}
