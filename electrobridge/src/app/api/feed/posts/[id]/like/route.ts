import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reaction } = await request.json();

  // Check if already liked
  const { data: existing } = await supabase
    .from("feed_post_likes")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("feed_post_likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await supabase.from("feed_post_likes").insert({
      post_id: id,
      user_id: user.id,
      reaction: reaction || "like",
    });

    // Notify post author
    const { data: post } = await supabase
      .from("feed_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (post && post.user_id !== user.id) {
      await createNotification({
        userId: post.user_id,
        type: "post_like",
        actorId: user.id,
        entityType: "feed_post",
        entityId: id,
        message: `reacted ${reaction || "like"} to your post`,
      });
    }

    return NextResponse.json({ liked: true, reaction: reaction || "like" }, { status: 201 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("feed_post_likes").delete().eq("post_id", id).eq("user_id", user.id);
  return NextResponse.json({ liked: false });
}
