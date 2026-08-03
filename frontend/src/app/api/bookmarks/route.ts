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

  const body = await request.json().catch(() => ({}));
  const opportunityId = body.opportunityId || body.opportunity_id;

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  // Check if already bookmarked to keep operation idempotent and prevent 409 ApiError exceptions
  const { data: existing } = await supabase
    .from("saved_opportunities")
    .select("*, opportunities(*)")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ bookmark: existing, alreadyBookmarked: true }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("saved_opportunities")
    .insert({ user_id: user.id, opportunity_id: opportunityId })
    .select("*, opportunities(*)")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: found } = await supabase
        .from("saved_opportunities")
        .select("*, opportunities(*)")
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunityId)
        .maybeSingle();
      return NextResponse.json({ bookmark: found, alreadyBookmarked: true }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data }, { status: 201 });
}