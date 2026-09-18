import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-utils";
import { PUBLIC_PROFILE_FIELDS } from "@/lib/utils";

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
    .select(PUBLIC_PROFILE_FIELDS, { count: "exact" })
    .eq("is_profile_public", true);

  if (q) {
    const cleanQ = q.replace(/[{}()"\\,.]/g, "").slice(0, 100);
    query = query.or(`display_name.ilike.%${cleanQ}%,headline.ilike.%${cleanQ}%,current_org.ilike.%${cleanQ}%,about.ilike.%${cleanQ}%`);
  }
  if (location) {
    const cleanLocation = location.replace(/[{}()"\\,.]/g, "").slice(0, 100);
    query = query.or(`city.ilike.%${cleanLocation}%,preferred_location.ilike.%${cleanLocation}%`);
  }
  if (skills) {
    query = query.contains("skills", skills.split(","));
  }

  const { data, count, error } = await query
    .order("connection_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError(error, "people-search");
  return NextResponse.json({ people: data || [], count: count || 0 });
}
