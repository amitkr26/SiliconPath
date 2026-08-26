import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

// v2 schema: feed_posts.author_id (was user_id).
// Uses supabaseAdmin for DB ops after strict auth + ownership verification.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Fetch post to verify existence and ownership
  const { data: post, error: fetchErr } = await supabaseAdmin
    .from("feed_posts")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: You cannot delete another engineer's post" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("feed_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = resolvedParams?.id;
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Fetch post to verify existence and ownership
  const { data: post, error: fetchErr } = await supabaseAdmin
    .from("feed_posts")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: You cannot edit another engineer's post" }, { status: 403 });
  }

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") patch.content = body.content;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("feed_posts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
