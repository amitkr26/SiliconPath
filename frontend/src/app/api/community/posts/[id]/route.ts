import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("community_posts")
    .select("*, user_profiles(full_name)")
    .eq("id", id)
    .single();

  if (error || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const { data: comments } = await supabase
    .from("community_comments")
    .select("*, user_profiles(full_name)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ...post, comments: comments || [] });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: post } = await supabase.from("community_posts").select("user_id").eq("id", id).single();
  if (!post || post.user_id !== user.id) {
    return NextResponse.json({ error: "Not your post" }, { status: 403 });
  }

  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
