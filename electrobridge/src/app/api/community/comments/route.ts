import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.post_id || !body.content) {
    return NextResponse.json({ error: "post_id and content required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("community_comments").insert({
    post_id: body.post_id,
    user_id: user.id,
    content: body.content,
  }).select("*, user_profiles(full_name)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // update comment_count
  const { data: currentPost } = await supabase.from("community_posts").select("comment_count").eq("id", body.post_id).single();
  if (currentPost) {
    await supabase.from("community_posts").update({ comment_count: (currentPost.comment_count || 0) + 1 }).eq("id", body.post_id);
  }

  return NextResponse.json(data, { status: 201 });
}
