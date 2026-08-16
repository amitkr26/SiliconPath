import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("opportunities")
    .select("*, organization:organizations(name)", { count: "exact" })
    .eq("is_active", true);

  if (q) {
    // P0.5: no legacy `organization` text filter — match the query against org
    // names in the (small) organizations table, then filter by organization_id.
    const { data: orgMatches } = await supabase
      .from("organizations")
      .select("id")
      .ilike("name", `%${q}%`)
      .limit(10);
    const orgIds = (orgMatches ?? []).map((o: any) => o.id);
    const titleTags = `title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`;
    query = orgIds.length > 0
      ? query.or(`${titleTags},organization_id.in.(${orgIds.join(",")})`)
      : query.or(titleTags);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError(error, "search-opportunities");
  // Preserve the wire contract: legacy `organization` text rendered as the embedded org name.
  const opportunities = (data || []).map((opp: any) => ({
    ...opp,
    organization: opp.organization?.name ?? null,
  }));
  return NextResponse.json({ opportunities, count: count || 0 });
}
