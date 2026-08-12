import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { searchOpportunities } from "@/lib/opportunities-query";
import { isCanonicalCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

// Thin compatibility route over the canonical opportunities search service
// (QA audit P1). /api/search?q=DRDO&page=1 behaves like
// /api/opportunities?search=DRDO&page=1 — same filters, same pagination,
// same validation.
export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "All";

    if (category !== "All" && !isCanonicalCategory(category)) {
      return NextResponse.json(
        { error: `Invalid category "${category}". Use one of: jrf, srf, phd, job, internship, fellowship, scholarship, trainee, govt-job, private.` },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const q = searchParams.get("q") || "";

    const { data, count } = await searchOpportunities({
      page,
      limit,
      category,
      eligibility: searchParams.get("eligibility") || "All",
      location: searchParams.get("location") || "All",
      deadline: searchParams.get("deadline") || "All",
      search: q || searchParams.get("search") || "",
    });

    const opportunities = (data ? data.map(mapDbOpportunityToClient) : []).filter(
      (o: any) => o && o.title && o.title.trim().length >= 5
    );
    const totalPages = Math.max(1, Math.ceil(count / limit));

    return NextResponse.json(
      {
        q,
        opportunities,
        count,
        total_count: count,
        page,
        total_pages: totalPages,
        limit,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/search] Unexpected error:", err);
    return NextResponse.json({ opportunities: [], count: 0, total_count: 0, total_pages: 1, page: 1 }, { status: 200 });
  }
}
