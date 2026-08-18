import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunityId") || searchParams.get("opportunity_id");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("saved_opportunities")
    .select("id, user_id, opportunity_id, opportunities(*, organizations(*))", { count: "exact" })
    .eq("user_id", user.id);

  if (opportunityId) {
    query = query.eq("opportunity_id", opportunityId);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("GET /api/bookmarks DB Error:", error);
    const { data: fallback, count: fCount } = await supabaseAdmin
      .from("saved_opportunities")
      .select("id, user_id, opportunity_id", { count: "exact" })
      .eq("user_id", user.id);
    return NextResponse.json({ bookmarks: fallback || [], count: fCount || 0 });
  }

  const mapped = (data || []).map((b: any) => ({
    ...b,
    opportunities: b.opportunities ? {
      ...b.opportunities,
      organization: b.opportunities.organizations?.name || b.opportunities.organization || "Semiconductor Institute",
    } : null,
  }));

  return NextResponse.json({ bookmarks: mapped, count: count || 0 });
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
  const { data: existing } = await supabaseAdmin
    .from("saved_opportunities")
    .select("*, opportunities(*)")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ bookmark: existing, alreadyBookmarked: true }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("saved_opportunities")
    .insert({ user_id: user.id, opportunity_id: opportunityId })
    .select("*, opportunities(*)")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: found } = await supabaseAdmin
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