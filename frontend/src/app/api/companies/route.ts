import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/feature-flags";
import { apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  if (!FEATURES.LINKEDIN_ENABLED) {
    return NextResponse.json({ error: "Feature not yet available" }, { status: 503 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  let query = supabase
    .from("company_pages")
    .select("*")
    .order("follower_count", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(`name.ilike.%${q}%,industry.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return apiError(error, "companies-list");
  return NextResponse.json({ companies: data || [] });
}
