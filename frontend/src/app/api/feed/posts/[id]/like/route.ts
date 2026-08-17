import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

// Toggle a like using feed_post_likes + feed_posts.like_count.
// Uses supabaseAdmin for DB ops (RLS bypass) after auth check.
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

  const { data: postRow } = await supabaseAdmin
    .from("feed_posts")
    .select("like_count")
    .eq("id", postId)
    .maybeSingle();
  const current = (postRow?.like_count as number | null) || 0;

  if (existing) {
    await supabaseAdmin.from("feed_post_likes").delete().eq("id", existing.id);
    await supabaseAdmin.from("feed_posts").update({ like_count: Math.max(0, current - 1) }).eq("id", postId);
    return NextResponse.json({ liked: false });
  }

  await supabaseAdmin.from("feed_post_likes").insert({ post_id: postId, user_id: user.id, reaction: "like" });
  await supabaseAdmin.from("feed_posts").update({ like_count: current + 1 }).eq("id", postId);
  return NextResponse.json({ liked: true });
}
