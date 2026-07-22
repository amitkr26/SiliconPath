import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// v2 schema: feed_posts.author_id (was user_id).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const { error } = await db.from("feed_posts").delete().eq("id", id).eq("author_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const body = await request.json();
  // Whitelist: only content is editable.
  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") patch.content = body.content;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await db.from("feed_posts").update(patch).eq("id", id).eq("author_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
