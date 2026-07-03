import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { comment } = await request.json();

  const { data: existing } = await supabase
    .from("feed_post_reposts")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("feed_post_reposts").delete().eq("id", existing.id);
    return NextResponse.json({ reposted: false });
  }

  await supabase.from("feed_post_reposts").insert({
    post_id: id,
    user_id: user.id,
    comment: comment || null,
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
      type: "post_repost",
      actorId: user.id,
      entityType: "feed_post",
      entityId: id,
      message: comment ? `reposted your post: "${comment.substring(0, 80)}${comment.length > 80 ? "..." : ""}"` : "reposted your post",
    });
  }

  return NextResponse.json({ reposted: true }, { status: 201 });
}
