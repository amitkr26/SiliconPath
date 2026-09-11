import { NextResponse } from "next/server";
import { requireAdmin } from "@berojgardegreewala/api";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try { await requireAdmin(request); } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunity_id");

  let query = supabaseAdmin!
    .from("applications")
    .select("*, opportunity:opportunities(id, title, organization:organizations(name), slug), user:user_profiles!applications_user_id_fkey(id, display_name, avatar_url, headline)");
  if (opportunityId) query = query.eq("opportunity_id", opportunityId);
  query = query.order("created_at", { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return apiError(error, "admin-applications-list");
  // P0.4: preserve legacy `organization` string contract on the embedded opportunity.
  const applications = (data || []).map((app: any) => ({
    ...app,
    opportunity: app.opportunity
      ? { ...app.opportunity, organization: app.opportunity.organization?.name ?? null }
      : app.opportunity,
  }));
  return NextResponse.json({ applications: applications || [] });
}
