import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { parseSearchQuery } from "@/lib/ai/search-parser";
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
      dbQuery = dbQuery.or(
        `organization.ilike.%${filters.organization_hint}%,title.ilike.%${filters.organization_hint}%`
      );
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
