import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("recommendations")
    .select("*, author:user_profiles!author_id(full_name, avatar_url, headline)")
    .eq("recipient_id", userId);

  if (!user || user.id !== userId) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendations: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.id === userId) return NextResponse.json({ error: "Cannot recommend yourself" }, { status: 400 });

  const { content, relationship } = await request.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase.from("recommendations").insert({
    author_id: user.id,
    recipient_id: userId,
    content,
    relationship: relationship || "",
  }).select("*, author:user_profiles!author_id(full_name, avatar_url, headline)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
