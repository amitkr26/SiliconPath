import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/notifications";
import { apiError } from "@/lib/api-utils";

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

  if (error) return apiError(error, "feed-comment-create");

  // comment_count is maintained by the on_post_comment trigger
  // (update_post_comments_count) — no manual increment here.

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

  if (error) return apiError(error, "feed-comments-list");
  return NextResponse.json({ comments: data || [] });
}

/** DELETE /api/feed/posts/[id]/comment?commentId=X — delete own comment */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  // Verify ownership
  const { data: comment } = await supabaseAdmin
    .from("feed_post_comments")
    .select("id, user_id")
    .eq("id", commentId)
    .eq("post_id", id)
    .maybeSingle();

  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("feed_post_comments")
    .delete()
    .eq("id", commentId);

  if (error) return apiError(error, "feed-comment-delete");
  return NextResponse.json({ success: true });
}
