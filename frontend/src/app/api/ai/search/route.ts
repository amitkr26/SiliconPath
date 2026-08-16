import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { parseSearchQuery } from "@/lib/ai/search-parser";
import { resolveOrganization } from "@/lib/organizations/resolve";
import { serverError } from "@berojgardegreewala/api";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }

  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    const filters = await parseSearchQuery(query);

    let dbQuery = supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (filters.category) {
      dbQuery = dbQuery.eq("category", filters.category);
    }

    if (filters.location) {
      dbQuery = dbQuery.ilike("location", `%${filters.location}%`);
    }

    if (filters.eligibility) {
      dbQuery = dbQuery.ilike("eligibility", `%${filters.eligibility}%`);
    }

    if (filters.organization_hint) {
      // P0.4: no legacy `organization` text column — resolve the hint to a real
      // organization_id when it matches an existing org, else fall back to title.
      const { data: orgRows } = await supabaseAdmin
        .from("organizations")
        .select("id, name, slug, website");
      const matched = resolveOrganization({
        sourceUrl: null,
        title: null,
        name: filters.organization_hint,
        organizations: orgRows ?? [],
      });
      if (matched.organizationId) {
        dbQuery = dbQuery.eq("organization_id", matched.organizationId);
      } else {
        dbQuery = dbQuery.ilike("title", `%${filters.organization_hint}%`);
      }
    }

    if (filters.tags.length > 0) {
      dbQuery = dbQuery.contains("tags", filters.tags);
    }

    const { data: opportunities, error } = await dbQuery;

    if (error) throw error;

    return NextResponse.json({
      opportunities: opportunities || [],
      filters,
      count: opportunities?.length || 0,
    });
  } catch (error) {
    console.error("Error in AI search:", error);
    return serverError("Search failed");
  }
}
