import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Toggle a like using feed_post_likes + feed_posts.like_count.
// like_count is maintained by the on_post_like trigger
// (update_post_likes_count, SECURITY DEFINER) — no manual increment here.
export async function POST(_request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const postId = resolvedParams?.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabaseAdmin
    .from("feed_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("feed_post_likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  }

  await supabaseAdmin.from("feed_post_likes").insert({ post_id: postId, user_id: user.id, reaction: "like" });
  return NextResponse.json({ liked: true });
}
