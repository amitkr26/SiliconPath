import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isAdminConfigured } from "@/lib/supabase";
import { mapDbOpportunityToClient } from "@/lib/utils";
import { GARBAGE_TITLE_PATTERNS } from "@/lib/scrapers/utils";

export const dynamic = 'force-dynamic';

// A row is displayable only if it has a real title that is not a nav/menu heading or test entry.
function isDisplayableOpportunity(o: { title?: string | null; organization?: string | null; stipend?: string | null; salary_range?: string | null; apply_url?: string | null; apply_link?: string | null } | null): boolean {
  if (!o || !o.title) return false;
  const t = o.title.trim();
  if (t.length < 5) return false;
  if (GARBAGE_TITLE_PATTERNS.test(t)) return false;

  const titleLower = t.toLowerCase();
  const orgLower = (o.organization || "").toLowerCase();
  const fullStr = JSON.stringify(o).toLowerCase();
  const apply = (o.apply_url || o.apply_link || "").toLowerCase();

  // Safeguard: Exclude test entries and fake data
  if (
    titleLower.includes("qa audit test") ||
    titleLower.includes("ui verified") ||
    titleLower.includes("lead risc-v soc architect") ||
    titleLower.includes("senior asic verification engineer (uvm)") ||
    titleLower.includes("senior physical design engineer (sta)") ||
    titleLower.includes("test position") ||
    titleLower.startsWith("test ") ||
    /\d{13}/.test(t) ||
    orgLower.includes("qa test") ||
    orgLower.includes("semiconductor lab test") ||
    orgLower.includes("qualcomm vlsi lab") ||
    fullStr.includes("1,80,00,000") ||
    fullStr.includes("2,40,00,000") ||
    apply === "https://berojgardegreewala.vercel.app" ||
    apply === "https://berojgardegreewala.vercel.app/"
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const category = searchParams.get("category") || "All";
    const eligibility = searchParams.get("eligibility") || "All";
    const location = searchParams.get("location") || "All";
    const deadline = searchParams.get("deadline") || "All";
    const search = searchParams.get("search") || "";

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Base query: STRICT 100% VERIFIED AND ACTIVE OPENINGS ONLY
    let supabaseQuery = supabaseAdmin
      .from("opportunities")
      .select("*, organizations(*)", { count: "exact" })
      .eq("is_active", true)
      .neq("verification_status", "rejected");

    // 1. SMART CATEGORY FILTER
    if (category && category !== "All") {
      if (category === "Research Fellowship" || category === "jrf" || category === "srf" || category === "fellowship") {
        supabaseQuery = supabaseQuery.or(
          "category.ilike.%Research Fellowship%,category.ilike.%JRF%,category.ilike.%SRF%,category.ilike.%Fellowship%,category.ilike.%Research%,title.ilike.%JRF%,title.ilike.%SRF%,title.ilike.%Fellow%"
        );
      } else if (category === "PhD Scholarship" || category === "phd" || category === "scholarship") {
        supabaseQuery = supabaseQuery.or(
          "category.ilike.%PhD%,category.ilike.%Scholarship%,category.ilike.%Doctoral%,title.ilike.%PhD%,title.ilike.%Doctoral%"
        );
      } else if (category === "Full-time" || category === "job" || category === "private" || category === "govt-job") {
        supabaseQuery = supabaseQuery.or(
          "category.ilike.%Job%,category.ilike.%Full-time%,category.ilike.%Govt%,category.ilike.%Private%,title.ilike.%Engineer%,title.ilike.%Scientist%,title.ilike.%Technician%,title.ilike.%Manager%,title.ilike.%Architect%"
        );
      } else if (category === "Internship" || category === "internship") {
        supabaseQuery = supabaseQuery.or(
          "category.ilike.%Internship%,category.ilike.%Intern%,category.ilike.%Apprentice%,title.ilike.%Intern%,title.ilike.%Apprentice%"
        );
      } else if (category === "Trainee" || category === "trainee") {
        supabaseQuery = supabaseQuery.or(
          "category.ilike.%Trainee%,title.ilike.%Trainee%,title.ilike.%Fellow%"
        );
      } else {
        supabaseQuery = supabaseQuery.or(`category.ilike.%${category}%,title.ilike.%${category}%`);
      }
    }

    // 2. SMART DEGREE / ELIGIBILITY FILTER
    if (eligibility && eligibility !== "All") {
      if (eligibility === "B.Tech") {
        supabaseQuery = supabaseQuery.or(
          "eligibility.ilike.%B.Tech%,eligibility.ilike.%BTech%,eligibility.ilike.%Bachelor%,eligibility.ilike.%B.E%,eligibility.ilike.%BE%,title.ilike.%B.Tech%,title.ilike.%BTech%"
        );
      } else if (eligibility === "M.Tech") {
        supabaseQuery = supabaseQuery.or(
          "eligibility.ilike.%M.Tech%,eligibility.ilike.%MTech%,eligibility.ilike.%Master%,eligibility.ilike.%M.E%,eligibility.ilike.%ME%,title.ilike.%M.Tech%,title.ilike.%MTech%"
        );
      } else if (eligibility === "PhD") {
        supabaseQuery = supabaseQuery.or(
          "eligibility.ilike.%PhD%,eligibility.ilike.%Doctorate%,title.ilike.%PhD%,category.ilike.%PhD%"
        );
      } else {
        supabaseQuery = supabaseQuery.ilike("eligibility", `%${eligibility}%`);
      }
    }

    // 3. SMART LOCATION FILTER
    if (location && location !== "All" && location !== "All India") {
      if (location === "India") {
        supabaseQuery = supabaseQuery.or("location.ilike.%India%,location.is.null");
      } else if (location === "Bangalore") {
        supabaseQuery = supabaseQuery.or("location.ilike.%Bangalore%,location.ilike.%Bengaluru%");
      } else if (location === "Hyderabad") {
        supabaseQuery = supabaseQuery.ilike("location", "%Hyderabad%");
      } else if (location === "Pune") {
        supabaseQuery = supabaseQuery.ilike("location", "%Pune%");
      } else if (location === "Mumbai") {
        supabaseQuery = supabaseQuery.ilike("location", "%Mumbai%");
      } else if (location === "Delhi / NCR" || location === "Delhi") {
        supabaseQuery = supabaseQuery.or("location.ilike.%Delhi%,location.ilike.%Noida%,location.ilike.%Gurugram%,location.ilike.%NCR%");
      } else if (location === "Chennai") {
        supabaseQuery = supabaseQuery.ilike("location", "%Chennai%");
      } else if (location === "Remote / WFH" || location === "Remote") {
        supabaseQuery = supabaseQuery.or("location.ilike.%Remote%,location.ilike.%WFH%");
      } else if (location === "Abroad" || location === "International") {
        supabaseQuery = supabaseQuery
          .not("location", "ilike", "%India%")
          .not("location", "ilike", "%Delhi%")
          .not("location", "ilike", "%Bangalore%")
          .not("location", "ilike", "%Hyderabad%")
          .not("location", "ilike", "%Pune%");
      } else {
        supabaseQuery = supabaseQuery.ilike("location", `%${location}%`);
      }
    }

    // 4. DEADLINE WINDOW FILTER
    if (deadline && deadline !== "All") {
      const now = new Date();
      if (deadline === "This Week" || deadline === "Within 7 days") {
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gte("deadline", now.toISOString().split("T")[0]).lte("deadline", weekLater.toISOString().split("T")[0]);
      } else if (deadline === "This Month" || deadline === "Within 30 days") {
        const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gte("deadline", now.toISOString().split("T")[0]).lte("deadline", monthLater.toISOString().split("T")[0]);
      } else if (deadline === "Later") {
        const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        supabaseQuery = supabaseQuery.gt("deadline", monthLater.toISOString().split("T")[0]);
      }
    }

    // 5. SMART TEXT SEARCH FILTER
    if (search && search.trim().length > 0) {
      const cleanSearch = search.replace(/[{}()"\\,.]/g, "").trim().slice(0, 100);
      const searchTerms = cleanSearch.split(/\s+/).filter((w) => w.length >= 2);

      if (searchTerms.length > 0) {
        // NOTE: only text columns here — ilike on text[] (specialization/tags)
        // throws "operator does not exist: text[] ~~* unknown" and the whole
        // query silently fails. apply_url/source_url carry org names.
        const conditions = searchTerms.map(term =>
          `title.ilike.%${term}%,category.ilike.%${term}%,eligibility.ilike.%${term}%,description.ilike.%${term}%,apply_url.ilike.%${term}%,source_url.ilike.%${term}%`
        ).join(",").split(",");

        // Match organization names via the organizations table (rows linked by FK)
        const { data: orgs } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .or(searchTerms.map((w) => `name.ilike.%${w}%`).join(","));
        if (orgs && orgs.length > 0) {
          const orgIds = orgs.map((o: { id: string }) => o.id);
          conditions.push(`organization_id.in.(${orgIds.join(",")})`);
        }

        supabaseQuery = supabaseQuery.or(conditions.join(","));
      }
    }

    // Order by newest first & paginate
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false }).range(start, end);

    const { data, count, error } = await supabaseQuery;

    if (error) {
      console.error("[GET /api/opportunities] Supabase error:", error);
      return NextResponse.json({ opportunities: [], total_count: 0, total_pages: 1, page: 1 }, { status: 200 });
    }

    const mappedData = (data ? data.map(mapDbOpportunityToClient) : []).filter(isDisplayableOpportunity);
    const totalCount = count !== null ? count : mappedData.length;
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
    return NextResponse.json({ opportunities: [], total_count: 0, total_pages: 1, page: 1 }, { status: 200 });
  }
}