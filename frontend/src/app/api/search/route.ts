import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase-admin";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { searchOpportunities } from "@/lib/opportunities-query";
import { isCanonicalCategory, normalizeCategoryParam } from "@/lib/categories";

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
    const category = normalizeCategoryParam(searchParams.get("category"));

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

    // People search (network tab) — user_profiles, public profiles only.
    let people: any[] = [];
    let organizations: any[] = [];
    let news: any[] = [];

    if (q && supabaseAdmin) {
      const cleanQ = q.replace(/[{}()"\\,%_.]/g, "").slice(0, 100);
      const [peopleRes, orgsRes, newsRes] = await Promise.all([
        supabaseAdmin
          .from("user_profiles")
          .select("id, username, display_name, headline, current_company, location, skills, avatar_url")
          .eq("is_profile_public", true)
          .or(`display_name.ilike.%${cleanQ}%,headline.ilike.%${cleanQ}%,current_company.ilike.%${cleanQ}%`)
          .limit(20),
        supabaseAdmin
          .from("organizations")
          .select("id, name, slug, location, type, logo_url, is_verified")
          .ilike("name", `%${cleanQ}%`)
          .limit(10),
        supabaseAdmin
          .from("news_articles")
          .select("id, title, slug, summary, source_name, published_at, image_url")
          .ilike("title", `%${cleanQ}%`)
          .limit(10),
      ]);

      people = (peopleRes.data || []).map((p: any) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        headline: p.headline,
        current_org: p.current_company,
        city: p.location,
        avatar_url: p.avatar_url,
        skills: Array.isArray(p.skills) ? p.skills : [],
      }));

      organizations = orgsRes.data || [];
      news = newsRes.data || [];
    }

    const opportunities = (data ? data.map(mapDbOpportunityToClient) : []).filter(
      (o: any) => o && o.title && o.title.trim().length >= 5
    );
    const totalPages = Math.max(1, Math.ceil(count / limit));

    return NextResponse.json(
      {
        q,
        opportunities,
        people,
        organizations,
        news,
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
    // QA audit: no fake HTTP 200 empty results on server errors.
    return NextResponse.json(
      { error: "Failed to fetch search results. Please try again." },
      { status: 500 }
    );
  }
}
