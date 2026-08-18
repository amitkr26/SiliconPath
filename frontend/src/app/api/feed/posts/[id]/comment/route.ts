import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, parentCommentId } = await request.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("feed_post_comments").insert({
    post_id: id,
    user_id: user.id,
    content,
    parent_comment_id: parentCommentId || null,
  }).select("*, user_profile:user_profiles!feed_post_comments_user_id_profile_fkey(display_name, username, avatar_url)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep the denormalized count in sync (mirrors the like route's read-modify-write).
  const { data: postRow } = await supabaseAdmin
    .from("feed_posts")
    .select("comment_count")
    .eq("id", id)
    .maybeSingle();
  await supabaseAdmin
    .from("feed_posts")
    .update({ comment_count: ((postRow?.comment_count as number) || 0) + 1 })
    .eq("id", id);

  // Notify post author (v2 feed_posts uses author_id).
  const { data: post } = await supabaseAdmin
    .from("feed_posts")
    .select("author_id")
    .eq("id", id)
    .single();

  if (post && post.author_id !== user.id) {
    await createNotification({
      userId: post.author_id,
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
  
  const { data, error } = await supabaseAdmin
    .from("feed_post_comments")
    .select("*, user_profile:user_profiles!feed_post_comments_user_id_profile_fkey(display_name, username, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}
