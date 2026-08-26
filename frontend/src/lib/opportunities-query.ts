// Canonical opportunities search service (QA audit P1).
// The full filter/search query builder used by GET /api/opportunities and
// the thin /api/search compatibility route. Single source of truth — the
// routes stay thin, filters keep working everywhere.

import { supabaseAdmin } from "@/lib/supabase";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";

export interface OpportunityQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  eligibility?: string;
  location?: string;
  deadline?: string;
  experience?: string;
  sort?: string;
  search?: string;
  includeExpired?: boolean;
}

export interface OpportunityQueryResult {
  data: any[];
  count: number;
}

/**
 * Builds and runs the canonical opportunities query: STRICT verified+active
 * openings, smart category/eligibility/location/deadline/experience filters, safe text
 * search (no text[] columns — see commit c1715d5), org-name lookup via the
 * organizations FK table, newest first, paginated.
 */
export async function searchOpportunities(
  params: OpportunityQueryParams
): Promise<OpportunityQueryResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const category = params.category || "All";
  const eligibility = params.eligibility || "All";
  const location = params.location || "All";
  const deadline = params.deadline || "All";
  const experience = params.experience || "All";
  const sort = params.sort || "fresher";
  const search = params.search || "";
  const includeExpired = Boolean(params.includeExpired);

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  // Canonical Indian Standard Time date calculation
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const today = istDate.toISOString().split("T")[0];

  // Base query: STRICT 100% VERIFIED AND CURRENT ACTIVE OPENINGS ONLY
  // ponytail: DB-level filter uses buildAvailabilityDbFilter() for best-effort
  // pre-filter. isCurrentlyAvailable() post-filter handles the full logic.
  let supabaseQuery = supabaseAdmin
    .from("opportunities")
    .select("*, organizations(*)", { count: "exact" })
    .eq("is_active", true)
    .neq("verification_status", "rejected");

  if (!includeExpired) {
    supabaseQuery = supabaseQuery
      .neq("verification_status", "expired")
      .or(buildAvailabilityDbFilter(today));
  }

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

  // 4. SMART EXPERIENCE LEVEL FILTER (Fresher-First)
  if (experience && experience !== "All") {
    if (experience === "Fresher" || experience === "0-1 Years" || experience === "0–1 Years") {
      supabaseQuery = supabaseQuery.or(
        "eligibility.ilike.%Fresher%,eligibility.ilike.%0-1%,eligibility.ilike.%0 - 1%,eligibility.ilike.%0 year%,eligibility.ilike.%1 year%,eligibility.is.null,title.ilike.%Fresher%,title.ilike.%Intern%,title.ilike.%Trainee%,title.ilike.%JRF%,title.ilike.%Graduate%"
      );
    } else if (experience === "0-2 Years" || experience === "0–2 Years") {
      supabaseQuery = supabaseQuery.or(
        "eligibility.ilike.%Fresher%,eligibility.ilike.%0-1%,eligibility.ilike.%0-2%,eligibility.ilike.%0 - 2%,eligibility.ilike.%1-2%,eligibility.ilike.%2 year%,eligibility.is.null,title.ilike.%Fresher%,title.ilike.%Intern%,title.ilike.%Trainee%,title.ilike.%JRF%"
      );
    } else if (experience === "2+ Years" || experience === "Experienced") {
      supabaseQuery = supabaseQuery.or(
        "eligibility.ilike.%2+%,eligibility.ilike.%3+%,eligibility.ilike.%4+%,eligibility.ilike.%5+%,title.ilike.%Senior%,title.ilike.%Lead%,title.ilike.%Principal%"
      );
    }
  }

  // 5. DEADLINE WINDOW FILTER
  if (deadline && deadline !== "All") {
    if (deadline === "This Week" || deadline === "Within 7 days") {
      const weekLater = new Date(istDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      supabaseQuery = supabaseQuery
        .gte("deadline", today)
        .lte("deadline", weekLater.toISOString().split("T")[0]);
    } else if (deadline === "This Month" || deadline === "Within 30 days") {
      const monthLater = new Date(istDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      supabaseQuery = supabaseQuery
        .gte("deadline", today)
        .lte("deadline", monthLater.toISOString().split("T")[0]);
    } else if (deadline === "Later") {
      const monthLater = new Date(istDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      supabaseQuery = supabaseQuery.gt("deadline", monthLater.toISOString().split("T")[0]);
    }
  }

  // 6. SMART TEXT SEARCH FILTER
  if (search && search.trim().length > 0) {
    const cleanSearch = search.replace(/[{}()"\\,.]/g, "").trim().slice(0, 100);
    const searchTerms = cleanSearch.split(/\s+/).filter((w) => w.length >= 2);

    if (searchTerms.length > 0) {
      // NOTE: only text columns here — ilike on text[] (specialization/tags)
      // throws "operator does not exist: text[] ~~* unknown" and the whole
      // query silently fails. apply_url/source_url carry org names.
      const conditions = searchTerms
        .map(
          (term) =>
            `title.ilike.%${term}%,category.ilike.%${term}%,eligibility.ilike.%${term}%,description.ilike.%${term}%,apply_url.ilike.%${term}%,source_url.ilike.%${term}%`
        )
        .join(",")
        .split(",");

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

  // 7. ORDERING & SORTING LOGIC
  if (sort === "closing_soon") {
    // Closing soon: prioritize deadlines that are closest to today
    supabaseQuery = supabaseQuery
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else if (sort === "newest") {
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
  } else {
    // Default "fresher" prioritization: newest verified openings
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
  }

  // Paginate
  supabaseQuery = supabaseQuery.range(start, end);

  const { data, count, error } = await supabaseQuery;
  if (error) {
    console.error("[searchOpportunities] Supabase error:", error);
    return { data: [], count: 0 };
  }

  // Post-filter: canonical availability logic
  const filtered = includeExpired
    ? (data || [])
    : (data || []).filter((opp: any) => isCurrentlyAvailable(opp, today));

  return { data: filtered, count: includeExpired ? (count !== null ? count : (data || []).length) : filtered.length };
}
