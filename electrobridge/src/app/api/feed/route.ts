import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get connections and followed users
  const { data: connections } = await supabase
    .from("connections")
    .select("user_id_1, user_id_2")
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);
  
  const connectedIds: string[] = [];
  if (connections) {
    connections.forEach((c) => {
      if (c.user_id_1 === user.id) connectedIds.push(c.user_id_2);
      if (c.user_id_2 === user.id) connectedIds.push(c.user_id_1);
    });
  }

  const { data: following } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);
  
  const followingIds = (following || []).map((f) => f.following_id);
  const relevantIds = Array.from(new Set(connectedIds.concat(followingIds)));

  // Build query
  let query = supabase
    .from("feed_posts")
    .select("*, user_profile:user_profiles!user_id(full_name, username, avatar_url, headline), opportunity:opportunities(*), user_reaction:feed_post_likes!left(reaction), has_reposted:feed_post_reposts!left(user_id)")
    .order("created_at", { ascending: false });

  if (relevantIds.length > 0) {
    query = query.or(`user_id.in.(${relevantIds.join(",")}),visibility.eq.public`);
  } else {
    query = query.eq("visibility", "public");
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Process results to include user reaction
  const posts = (data || []).map((post: any) => ({
    ...post,
    user_reaction: post.user_reaction?.find((r: any) => r.user_id === user.id)?.reaction || null,
    has_reposted: post.has_reposted?.some((r: any) => r.user_id === user.id) || false,
  }));

  return NextResponse.json({ posts, count: count || 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("feed_posts").insert({
    user_id: user.id,
    content: body.content,
    post_type: body.post_type || "post",
    tags: body.tags || [],
    visibility: body.visibility || "public",
    opportunity_id: body.opportunity_id || null,
  }).select("*, user_profile:user_profiles!user_id(full_name, username, avatar_url, headline)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
