import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { feedPostSchema, validateOrThrow } from "@/lib/validation";
import { apiError } from "@/lib/api-utils";

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
// Uses supabaseAdmin for DB reads (RLS policies may be misconfigured for v2
// columns) after verifying the user session via getUser().
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const db = supabaseAdmin;

  // Accepted connections (either direction).
  const { data: conns } = await db
    .from("connections")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");

  const connectedUserIds = new Set<string>([user.id]);
  (conns || []).forEach((c: any) => {
    if (c.requester_id === user.id && c.addressee_id) connectedUserIds.add(c.addressee_id);
    else if (c.addressee_id === user.id && c.requester_id) connectedUserIds.add(c.requester_id);
  });

  const scope = searchParams.get("scope") || searchParams.get("filter");
  let postQuery = db
    .from("feed_posts")
    .select("id, author_id, content, created_at, like_count, comment_count")
    .order("created_at", { ascending: false });

  // Default to connection-scoped feed unless scope=global is explicitly requested
  if (scope !== "global" && scope !== "all") {
    postQuery = postQuery.in("author_id", Array.from(connectedUserIds));
  }

  const { data: postRows, error } = await postQuery
    .range(offset, offset + limit - 1);

  if (error) return apiError(error, "feed-list");

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
      .from("feed_post_likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    (reactions || []).forEach((r: { post_id: string }) => reactedPostIds.add(r.post_id));
  }

  const posts = rows.map((p) => ({
    id: p.id,
    user_id: p.author_id,
    author_id: p.author_id,
    content: p.content,
    created_at: p.created_at,
    likes_count: p.like_count || 0,
    comments_count: p.comment_count || 0,
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

  const raw = await request.json();
  const body = validateOrThrow<{ content: string }>(feedPostSchema, raw);

  const { data, error } = await supabaseAdmin
    .from("feed_posts")
    .insert({ author_id: user.id, content: body.content })
    .select("id, author_id, content, created_at, like_count, comment_count")
    .single();

  if (error) return apiError(error, "feed-create");
  return NextResponse.json({
    ...data,
    user_id: data.author_id,
    likes_count: data.like_count || 0,
    comments_count: data.comment_count || 0,
  }, { status: 201 });
}
