import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { communityPostSchema, validateOrThrow } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "latest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("community_posts")
    .select("*, user_profiles(full_name)", { count: "exact" });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (sort === "trending") {
    query = query.order("upvotes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [], count: count || 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json();
  const body = validateOrThrow(communityPostSchema, raw);

  const { data, error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title: body.title,
    content: body.content,
    category: "general",
    tags: body.tags || [],
  }).select("*, user_profiles(full_name)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
