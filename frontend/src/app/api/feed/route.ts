import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedPostSchema, validateOrThrow } from "@/lib/validation";

interface AuthorRow {
  id: string;
  display_name: string | null;
  headline: string | null;
  avatar_url: string | null;
}

interface PostRow {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  like_count: number | null;
  comment_count: number | null;
}

// GET: posts from the current user's connections + own posts (v2 schema).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Accepted connections (either direction).
  const { data: conns } = await db
    .from("connections")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const authorIds = new Set<string>([user.id]);
  (conns || []).forEach((c: { requester_id: string; addressee_id: string }) => {
    authorIds.add(c.requester_id === user.id ? c.addressee_id : c.requester_id);
  });

  const { data: postRows, error } = await db
    .from("feed_posts")
    .select("id, author_id, content, created_at, like_count, comment_count")
    .in("author_id", Array.from(authorIds))
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (postRows || []) as PostRow[];
  const uniqueAuthorIds = Array.from(new Set(rows.map((p) => p.author_id)));

  const authorsById: Record<string, AuthorRow> = {};
  if (uniqueAuthorIds.length > 0) {
    const { data: authors } = await db
      .from("user_profiles")
      .select("id, display_name, headline, avatar_url")
      .in("id", uniqueAuthorIds);
    (authors || []).forEach((a: AuthorRow) => {
      authorsById[a.id] = a;
    });
  }

  // Current user's reactions on these posts.
  const postIds = rows.map((p) => p.id);
  const reactedPostIds = new Set<string>();
  if (postIds.length > 0) {
    const { data: reactions } = await db
      .from("post_reactions")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    (reactions || []).forEach((r: { post_id: string }) => reactedPostIds.add(r.post_id));
  }

  const posts = rows.map((p) => ({
    id: p.id,
    author_id: p.author_id,
    content: p.content,
    created_at: p.created_at,
    like_count: p.like_count || 0,
    comment_count: p.comment_count || 0,
    user_reaction: reactedPostIds.has(p.id) ? "like" : null,
    author: authorsById[p.author_id] || null,
  }));

  return NextResponse.json({ posts });
}

// POST: create a post (v2 schema: author_id + content).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db2 } = await import("@/lib/db");
  const db = db2 || supabase;

  const raw = await request.json();
  const body = validateOrThrow<{ content: string }>(feedPostSchema, raw);

  const { data, error } = await db
    .from("feed_posts")
    .insert({ author_id: user.id, content: body.content })
    .select("id, author_id, content, created_at, like_count, comment_count")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
