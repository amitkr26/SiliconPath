import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("saved_opportunities")
    .select("*, opportunities(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookmarks: data || [], count: count || 0 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { opportunityId } = body;

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .insert({ user_id: user.id, opportunity_id: opportunityId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already bookmarked" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data }, { status: 201 });
}