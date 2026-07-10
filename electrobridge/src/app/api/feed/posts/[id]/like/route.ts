import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Toggle a like using v2 post_reactions + feed_posts.like_count.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: postRow } = await supabase
    .from("feed_posts")
    .select("like_count")
    .eq("id", postId)
    .maybeSingle();
  const current = (postRow?.like_count as number | null) || 0;

  if (existing) {
    await supabase.from("post_reactions").delete().eq("id", existing.id);
    await supabase.from("feed_posts").update({ like_count: Math.max(0, current - 1) }).eq("id", postId);
    return NextResponse.json({ liked: false });
  }

  await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, kind: "like" });
  await supabase.from("feed_posts").update({ like_count: current + 1 }).eq("id", postId);
  return NextResponse.json({ liked: true });
}
