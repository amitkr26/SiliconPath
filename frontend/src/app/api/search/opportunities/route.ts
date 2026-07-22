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
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (q) {
    query = query.or(`title.ilike.%${q}%,organization.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data, count, error } = await query
    .order("posted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError(error, "search-opportunities");
  return NextResponse.json({ opportunities: data || [], count: count || 0 });
}
