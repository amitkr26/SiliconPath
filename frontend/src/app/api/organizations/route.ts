export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { serverError } from "@berojgardegreewala/api";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  location: string | null;
  country: string | null;
  website: string | null;
  is_verified: boolean;
}

interface OrgWithCount extends OrgRow {
  count: number;
}

/**
 * Public organizations directory.
 * v2 schema: reads `organizations` and counts active/verified opportunities
 * via `organization_id`.
 * QA audit: pagination was missing — page/per_page were ignored and every
 * page returned the full list (page1 === page2). Now honors page/per_page
 * (cap 100) with a deterministic order (name is UNIQUE).
 */
export async function GET(request: NextRequest) {
  if (!isAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "10", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const today = new Date().toISOString().split("T")[0];

    const { data: orgs, count: total, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("*", { count: "exact" })
      .order("name")
      .range((page - 1) * perPage, page * perPage - 1);
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

    const organizations: OrgWithCount[] = (orgs || [])
      .map((c: OrgRow): OrgWithCount => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: c.type,
        logo_url: c.logo_url,
        location: c.location,
        country: c.country,
        website: c.website,
        is_verified: c.is_verified,
        count: counts[c.id] || 0,
      }))
      .sort((a: OrgWithCount, b: OrgWithCount) => b.count - a.count);

    return NextResponse.json({
      organizations,
      total: total || 0,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil((total || 0) / perPage)),
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return serverError("Failed to fetch organizations");
  }
}
