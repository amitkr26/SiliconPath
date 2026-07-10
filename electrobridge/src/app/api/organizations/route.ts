import { NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";

/**
 * Public organizations directory.
 *
 * v2 schema alignment: reads the `organizations` table and counts active,
 * verified opportunities via `organization_id`. (The previous version queried
 * the legacy `company_pages` table and `opportunities.organization`, neither of
 * which exists in the v2 schema, causing a 42703 column error at build time.)
 */
export async function GET() {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: orgs, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .order("name");
    if (orgErr) throw orgErr;

    const { data: opportunities, error: oppErr } = await supabaseAdmin
      .from("opportunities")
      .select("organization_id")
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .or(`deadline.gte.${today},deadline.is.null`);
    if (oppErr) throw oppErr;

    const counts: Record<string, number> = {};
    (opportunities || []).forEach((o: { organization_id: string | null }) => {
      if (o.organization_id) counts[o.organization_id] = (counts[o.organization_id] || 0) + 1;
    });

    const organizations = (orgs || [])
      .map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: c.type,
        logo_url: c.logo_url,
        location: c.location,
        country: c.country,
        website: c.website,
        is_verified: c.is_verified,
        count: counts[c.id as string] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}
