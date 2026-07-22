import { NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunity_id");

  let query = supabaseAdmin!
    .from("applications")
    .select("*, opportunity:opportunities(id, title, organization, slug), user:user_profiles!applications_user_id_fkey(id, full_name, avatar_url, headline)");
  if (opportunityId) query = query.eq("opportunity_id", opportunityId);
  query = query.order("created_at", { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data || [] });
}
