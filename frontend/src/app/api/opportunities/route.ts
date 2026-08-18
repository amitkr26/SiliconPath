import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";
import { searchOpportunities } from "@/lib/opportunities-query";
import { isCanonicalCategory, normalizeCategoryParam } from "@/lib/categories";

export const dynamic = 'force-dynamic';

// A row is displayable only if it has a real title that is not a nav/menu heading or internal audit mock.
function isDisplayableOpportunity(o: { title?: string | null; organization?: string | null; stipend?: string | null; salary_range?: string | null; apply_url?: string | null; apply_link?: string | null } | null): boolean {
  if (!o || !o.title) return false;
  const t = o.title.trim();
  if (t.length < 4) return false;
  if (GARBAGE_TITLE_PATTERNS.test(t)) return false;

  const titleLower = t.toLowerCase();
  const orgLower = (o.organization || "").toLowerCase();

  // Safeguard: Exclude internal synthetic test seeds
  if (
    titleLower.includes("qa_audit_fixture") ||
    titleLower.includes("internal_synthetic_test") ||
    orgLower.includes("synthetic_qa_test_org")
  ) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = normalizeCategoryParam(searchParams.get("category"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    // Canonical category vocabulary — unknown values are rejected, never
    // silently treated as an unfiltered search (QA audit P2).
    if (category !== "All" && !isCanonicalCategory(category)) {
      return NextResponse.json(
        { error: `Invalid category "${category}". Use one of: jrf, srf, phd, job, internship, fellowship, scholarship, trainee, govt-job, private.` },
        { status: 400 }
      );
    }

    const { data, count } = await searchOpportunities({
      page,
      limit,
      category,
      eligibility: searchParams.get("eligibility") || "All",
      location: searchParams.get("location") || "All",
      deadline: searchParams.get("deadline") || "All",
      search: searchParams.get("search") || "",
    });

    const mappedData = (data ? data.map(mapDbOpportunityToClient) : []).filter(isDisplayableOpportunity);
    const totalCount = count;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json(
      {
        opportunities: mappedData,
        total_count: totalCount,
        total_pages: totalPages,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/opportunities] Unexpected error:", err);
    // QA audit: never fake HTTP 200 + empty results on a server error.
    return NextResponse.json(
      { error: "Failed to fetch opportunities. Please try again." },
      { status: 500 }
    );
  }
}
