import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, parentCommentId } = await request.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase.from("feed_post_comments").insert({
    post_id: id,
    user_id: user.id,
    content,
    parent_comment_id: parentCommentId || null,
  }).select("*, user_profile:user_profiles!user_id(full_name, username, avatar_url)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify post author
  const { data: post } = await supabase
    .from("feed_posts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (post && post.user_id !== user.id) {
    await createNotification({
      userId: post.user_id,
      type: "post_comment",
      actorId: user.id,
      entityType: "feed_post",
      entityId: id,
      message: `commented on your post: "${content.substring(0, 80)}${content.length > 80 ? "..." : ""}"`,
    });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("feed_post_comments")
    .select("*, user_profile:user_profiles!user_id(full_name, username, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}
