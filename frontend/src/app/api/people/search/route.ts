import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const skills = searchParams.get("skills") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("user_profiles")
    .select("*", { count: "exact" })
    .eq("is_profile_public", true);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,current_org.ilike.%${q}%,about.ilike.%${q}%`);
  }
  if (location) {
    query = query.or(`city.ilike.%${location}%,preferred_location.ilike.%${location}%`);
  }
  if (skills) {
    query = query.contains("skills", skills.split(","));
  }

  const { data, count, error } = await query
    .order("connection_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ people: data || [], count: count || 0 });
}
