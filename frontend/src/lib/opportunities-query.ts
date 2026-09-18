// Canonical opportunities search service (QA audit P1).
// The full filter/search query builder used by GET /api/opportunities and
// the thin /api/search compatibility route. Single source of truth — the
// routes stay thin, filters keep working everywhere.

import { supabaseAdmin } from "@/lib/supabase-admin";
import { isCurrentlyAvailable, computeIstToday, buildAvailabilityDbFilter } from "@/lib/availability";

export interface OpportunityQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  field?: string;
  eligibility?: string;
  location?: string;
  deadline?: string;
  experience?: string;
  sort?: string;
  search?: string;
  includeExpired?: boolean;
}

const CORE_HARDWARE_KEYWORDS = [
  "vlsi", "asic", "fpga", "rtl", "verilog", "systemverilog", "vhdl", "soc",
  "system-on-chip", "system on chip", "physical design", "dft", "design verification",
  "uvm", "sta", "static timing", "synthesis", "cadence", "synopsys", "mentor",
  "vivado", "quartus", "layout", "drc", "lvs", "gdsii", "analog design", "rfic",
  "embedded", "firmware", "microcontroller", "microprocessor", "mcu", "rtos",
  "arm", "risc-v", "device driver", "bsp", "iot", "bare-metal", "dsp",
  "semiconductor", "chip", "chips", "wafer", "fab", "foundry", "lithography",
  "cleanroom", "mems", "packaging", "tsmc", "intel", "amd", "nvidia", "qualcomm",
  "texas instruments", "micron", "applied materials", "lam research", "stmicro",
  "nxp", "infineon", "graphcore", "tenstorrent", "tata electronics", "scl mohali",
  "electronics", "electronic", "analog", "rf", "pcb", "circuits", "hardware",
  "ece", "eee", "telecom", "radar", "antenna", "instrumentation", "power electronics",
  "avionics", "sensor", "photonics", "optics", "laser", "bel", "ecil", "sameer",
  "isro", "drdo", "jrf", "srf", "phd", "research associate", "project assistant",
  "microelectronics", "micro-electronics", "nanotechnology", "fellow",
  "iit", "iisc", "bits pilani", "nit"
];

const DISALLOWED_OPP_PATTERNS = [
  /\b(fitter|welder|carpenter|plumber|painter|mason|machinist|turner|draughtsman|stenographer|typist)\b/i,
  /\b(clerk|peon|chowkidar|safaiwala|cook|driver|nurse|nursing|hospital|medical|doctor|mbbs)\b/i,
  /\b(civil engineer|civil engineering|textile|agriculture|horticulture|zoology|botany)\b/i,
  /\b(banking|vkyc|kyc|insurance|wealth management|financial advisor)\b/i,
  /\b(publication of select list|publication of result|wait list against advt|result of walk-in)\b/i,
  /\b(compensation|benefits|payroll|talent acquisition|recruiter|human resources|hr generalist|hr business partner|hr specialist)\b/i,
  /\b(supply planner|sourcing manager|strategic sourcing|procurement|purchasing|commodity manager|global supply planner)\b/i,
  /\b(information technology|it desktop|it support|helpdesk|service desk|workplace technology|sysadmin)\b/i,
  /\b(accountant|accounting|financial analyst|finance manager|tax manager|treasury|audit|bookkeeper)\b/i,
  /\b(legal counsel|paralegal|contracts manager|compliance officer|patent agent)\b/i,
  /\b(real estate|facilities specialist|workplace experience|office manager|executive assistant|administrative assistant)\b/i,
  /\b(sales manager|sales representative|business development|account executive|marketing manager|brand manager)\b/i,
  /\b(chief of staff|business operations manager|program manager, product software|program manager, architecture)\b/i,
  /\b(vp of information technology|staff compensation analyst|staff npi global supply planner)\b/i,
  /undefined/i
];

export function isHardwareOpportunity(opp: any): boolean {
  if (!opp) return false;
  const title = (opp.title || "").trim();
  const desc = (opp.description || "").trim();
  const org = (opp.organization || opp.organizations?.name || "").trim();
  const tags = Array.isArray(opp.tags) ? opp.tags.join(" ") : "";
  const combined = `${title} ${desc} ${org} ${tags}`.toLowerCase();

  for (const dis of DISALLOWED_OPP_PATTERNS) {
    if (dis.test(title)) return false;
  }

  return CORE_HARDWARE_KEYWORDS.some((term) => {
    const reg = new RegExp(`\\b${term.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, "\\$&")}\\b`, "i");
    return reg.test(combined);
  });
}

/**
 * Assigns a fresher-relevance tier score (lower number = higher priority).
 * Tier 1: Pure entry-level, fresher, intern, trainee, JRF/SRF, graduate, apprentice, 0-1/0-2 years.
 * Tier 2: Junior engineer, associate engineer, engineer 1.
 * Tier 3: Core hardware/electronics engineer roles.
 * Tier 4: Senior, Staff, Lead, Principal, Architect, Director, Manager.
 */
export function getFresherPriorityTier(opp: any): number {
  const title = (opp.title || "").toLowerCase();
  const cat = (opp.category || "").toLowerCase();
  const elig = (opp.eligibility || "").toLowerCase();
  const combined = `${title} ${cat} ${elig}`;

  if (
    /\b(intern|internship|co-op|coop|trainee|apprentice|fresher|graduate|campus|college|jrf|srf|fellow|fellowship|phd|m\.?tech|b\.?tech|0\s*-\s*1|0\s*-\s*2|entry\s*level|entry-level)\b/i.test(combined)
  ) {
    if (!/\b(senior|lead|principal|staff|director|manager|architect|head|vp)\b/i.test(title)) {
      return 1;
    }
  }
  if (/\b(junior|associate|engineer\s*1|engineer\s*i\b|level\s*1|level\s*i\b)\b/i.test(title)) {
    return 2;
  }
  if (/\b(senior|sr\b|principal|staff|chief|lead|architect|director|head|vp|manager)\b/i.test(title)) {
    return 4;
  }
  return 3;
}

/**
 * Interleaves opportunities so that no single organization has more than
 * maxConsecutive opportunities in a row, ensuring high employer diversity in the feed.
 */
export function interleaveByOrganization(opps: any[], maxConsecutive = 2): any[] {
  if (opps.length <= 2) return opps;

  const result: any[] = [];
  const pool = [...opps];
  const orgConsecutiveCount: Record<string, number> = {};
  let lastOrg: string | null = null;

  while (pool.length > 0) {
    let chosenIndex = -1;

    for (let i = 0; i < pool.length; i++) {
      const oppOrg = (pool[i].organization || pool[i].organizations?.name || "Other").trim().toLowerCase();
      const currentConsecutive = lastOrg === oppOrg ? (orgConsecutiveCount[oppOrg] || 0) : 0;
      if (currentConsecutive < maxConsecutive) {
        chosenIndex = i;
        break;
      }
    }

    if (chosenIndex === -1) {
      chosenIndex = 0;
    }

    const [chosen] = pool.splice(chosenIndex, 1);
    const chosenOrg = (chosen.organization || chosen.organizations?.name || "Other").trim().toLowerCase();

    if (lastOrg === chosenOrg) {
      orgConsecutiveCount[chosenOrg] = (orgConsecutiveCount[chosenOrg] || 0) + 1;
    } else {
      lastOrg = chosenOrg;
      orgConsecutiveCount[chosenOrg] = 1;
    }

    result.push(chosen);
  }

  return result;
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
  const field = params.field || "All";
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
    .neq("verification_status", "rejected")
    .neq("verification_status", "pending")
    .neq("verification_status", "link_unavailable");

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

  // 1b. HARDWARE FIELD FILTER (VLSI, Semiconductor, Embedded, Analog)
  if (field && field !== "All") {
    const f = field.toLowerCase();
    if (f === "vlsi") {
      supabaseQuery = supabaseQuery.or(
        "title.ilike.%VLSI%,title.ilike.%ASIC%,title.ilike.%FPGA%,title.ilike.%RTL%,title.ilike.%Verilog%,title.ilike.%SystemVerilog%,title.ilike.%Physical Design%,title.ilike.%DFT%,title.ilike.%Verification%,title.ilike.%EDA%,title.ilike.%Synthesis%"
      );
    } else if (f === "semiconductor") {
      supabaseQuery = supabaseQuery.or(
        "title.ilike.%Semiconductor%,title.ilike.%Fab%,title.ilike.%Foundry%,title.ilike.%Wafer%,title.ilike.%Lithography%,title.ilike.%Cleanroom%,title.ilike.%MEMS%,title.ilike.%Packaging%,title.ilike.%Silicon%"
      );
    } else if (f === "embedded") {
      supabaseQuery = supabaseQuery.or(
        "title.ilike.%Embedded%,title.ilike.%Firmware%,title.ilike.%Microcontroller%,title.ilike.%RTOS%,title.ilike.%ARM%,title.ilike.%RISC-V%,title.ilike.%Driver%,title.ilike.%DSP%"
      );
    } else if (f === "analog") {
      supabaseQuery = supabaseQuery.or(
        "title.ilike.%Analog%,title.ilike.%RF%,title.ilike.%RFIC%,title.ilike.%Mixed%,title.ilike.%Circuits%,title.ilike.%Power Electronics%"
      );
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
      .order("posted_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  } else if (sort === "newest" || sort === "fresher") {
    // Freshness first: Authoritative posted_date DESC, fallback to created_at DESC, deterministic id DESC
    supabaseQuery = supabaseQuery
      .order("posted_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  } else {
    // Default: newest authoritative openings first
    supabaseQuery = supabaseQuery
      .order("posted_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  }

  // To support fresher-first tiering and organization interleaving without
  // single-employer clustering, fetch a wide candidate window:
  const fetchLimit = Math.min(800, Math.max(end + 1, 150));
  supabaseQuery = supabaseQuery.range(0, fetchLimit - 1);

  const { data, count, error } = await supabaseQuery;
  if (error) {
    console.error("[searchOpportunities] Supabase error:", error);
    return { data: [], count: 0 };
  }

  // Post-filter: canonical availability & strict hardware domain logic
  let filtered = (data || [])
    .filter((opp: any) => includeExpired || isCurrentlyAvailable(opp, today))
    .filter((opp: any) => isHardwareOpportunity(opp));

  // Sort: Fresher priority first (Tier 1 -> Tier 2 -> Tier 3 -> Tier 4)
  if (sort === "fresher") {
    filtered.sort((a: any, b: any) => {
      const tierA = getFresherPriorityTier(a);
      const tierB = getFresherPriorityTier(b);
      if (tierA !== tierB) return tierA - tierB;
      const dateA = a.posted_date || a.created_at || "1970-01-01";
      const dateB = b.posted_date || b.created_at || "1970-01-01";
      return dateB.localeCompare(dateA);
    });
  } else if (sort === "closing_soon") {
    filtered.sort((a: any, b: any) => {
      const dA = a.deadline || "9999-12-31";
      const dB = b.deadline || "9999-12-31";
      return dA.localeCompare(dB);
    });
  }

  // Apply Organization Interleaving so no company monopolizes the feed (max 2 consecutive)
  const diversified = interleaveByOrganization(filtered, 2);

  // Return the paged slice
  const paged = diversified.slice(start, end + 1);

  return {
    data: paged,
    count: count !== null && count !== undefined ? count : diversified.length,
  };
}
