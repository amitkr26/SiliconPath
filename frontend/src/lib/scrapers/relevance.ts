/**
 * Shared role-level relevance module for BerojgarDegreeWala.
 * SINGLE SOURCE OF TRUTH for determining whether an opportunity is
 * relevant to the platform's core domain:
 *
 *   Semiconductor + VLSI + Electronics + Embedded + Hardware + Research
 *   + Relevant government technical electronics opportunities
 *
 * Used by:
 * - india-psu-scraper.ts (ingestion filter)
 * - run-opportunity-scrape.ts (insert-time gate)
 * - page.tsx homepage feed (relevance-aware selection)
 *
 * RELEVANCE POLICY (Phase 2.6):
 * ─────────────────────────────────────────────────────────────
 * "relevant"          → Homepage featured, public search, all surfaces
 * "possibly_relevant" → Public search/browse ONLY. NOT homepage.
 * "irrelevant"        → Excluded from all public surfaces.
 *
 * Homepage = VERIFIED + ACTIVE + RELEVANT (high precision).
 * Search   = VERIFIED + ACTIVE + (RELEVANT | POSSIBLY_RELEVANT) (high recall).
 * Admin    = Everything (review/audit).
 *
 * DESIGN PRINCIPLE:
 * ROLE SIGNAL beats ORG SIGNAL when they conflict.
 * "Manager at BEL" → irrelevant (non-technical role wins over electronics org).
 * "VLSI Engineer at Unknown" → relevant (electronics role wins over unknown org).
 *
 * NEGATIVE CLASSIFICATION WINS:
 * If title matches IRRELEVANT_KEYWORDS, it's excluded even if from a
 * relevant org. The one exception: if the title ALSO has electronics/research
 * keywords (e.g. "Electronics Fitter" — trade + domain).
 * ─────────────────────────────────────────────────────────────
 */

// ============================================================
// ELECTRONICS / SEMICONDUCTOR / VLSI / EMBEDDED / HARDWARE
// ============================================================

const ELECTRONICS_KEYWORDS = [
  // Core domain — specific terms that unambiguously indicate electronics
  "electronics", "electronic", "semiconductor", "vlsi", "asic",
  "fpga", "rtl", "verilog", "systemverilog", "vhdl",
  "embedded", "firmware", "hardware", "pcb",
  "analog", "rf", "rfic", "mixed-signal", "signal processing",
  "digital design", "physical design",
  "microcontroller", "microprocessor", "chip",
  "fabrication", "lithography", "cleanroom", "wafer",
  "mems", "nanoelectronics", "nanotech",
  // Specific roles — compound terms that are unambiguously electronics
  "electronics engineer", "electronics and communication",
  "ece", "eee", "eie",  // common Indian branch abbreviations
  "instrumentation", "control systems",
  "design verification", "post silicon", "silicon verification",
  "static timing",  // STA in VLSI context (replaces bare "sta" which matched "staff")
  " system on chip", " system-on-chip",  // word-boundary safe (replaces bare "soc")
  "circuit board", "board design", "board test",  // replaces bare "board"
  // Tools & methodologies — VLSI-specific tool names
  "cadence", "synopsys", "mentor", "vivado", "quartus",
  "drc", "lvs", "gdsii",
  "uvm", "sva",
  // Industry companies — semiconductor/chip companies only
  "qualcomm", "amd", "nvidia", "tsmc",
  "marvell", "broadcom", "micron",
  "texas instruments", "nxp", "infineon", "stmicro",
  "globalfoundries", "umc", "graphcore", "tenstorrent",
];

// ============================================================
// RESEARCH / ACADEMIC
// ============================================================

const RESEARCH_KEYWORDS = [
  "jrf", "junior research fellow",
  "srf", "senior research fellow",
  "research associate",
  "phd", "doctoral", "doctorate",
  "research fellow", "fellowship",
  "research scientist", "research engineer",
  "postdoc", "post-doctoral",
  "project assistant", "project staff", "project fellow",
  "research project", "research position",
  "csir-ugc",
  "dst funded", "serb", "dbt",
];

// ============================================================
// CLEARLY IRRELEVANT — exclude these even if from a "relevant" org
// ============================================================

const IRRELEVANT_KEYWORDS = [
  // Non-technical trades
  "fitter", "welder", "carpenter", "plumber", "painter",
  "electrician general",  // but "electronics electrician" is OK
  "turner", "machinist", "millwright",
  "draughtsman", "stenographer", "typist",
  // Non-technical roles
  "hr ", "human resource", "human resources",
  "finance", "accountant", "accounting", "auditor",
  "admin", "administrative", "office assistant",
  "clerk", "lower division clerk",
  "peon", "chowkidar", "watchman", "safaiwala",
  "driver", "cook", "nurse", "nursing",
  "teacher", "tutor", "educator",
  "legal", "lawyer", "advocate",
  "medical officer", "medical staff",
  "marketing", "sales executive", "business development",
  // Management (non-technical)
  "general manager", "deputy manager",
  "manager hr", "manager finance", "manager admin",
  "office manager", "branch manager",
  // Generic non-technical government
  "civil engineer",  // but "civil works at electronics lab" could be relevant
  "mechanical engineer",  // unless at semiconductor fab
  "chemical engineer",
  "metallurgical",
  "textile",
  "agriculture",
];

// ============================================================
// PSU ORG RELEVANCE — organization-level signals
// ============================================================

/**
 * PSUs where ALL roles should be considered potentially relevant.
 * These are pure electronics/semiconductor/research organizations.
 */
const ELECTRONICS_PSUS = new Set([
  "bel", "bharat electronics",
  "ecil", "electronics corporation of india",
  "cdac", "centre for development of advanced",
  "sameer", "society for applied microwave",
  "npl", "national physical laboratory",
  "ceeri", "central electronics engg",
  "csio", "central scientific instruments",
  "nielit", "national institute of electronics",
  "cdot", "centre for development of telematics",
  "scl", "semi-conductor laboratory",
  "cmet", "centre for materials for electronics",
]);

/**
 * PSUs where only specific roles are relevant (need title check).
 * These orgs have electronics divisions but also other divisions.
 */
const MIXED_PSUS = new Set([
  "hal", "hindustan aeronautics",
  "bsnl", "bharat sanchar",
  "railtel",
  "iti limited", "indian telephone",
  "isro", "indian space",
  "drdo", "defence research",
  "csir",
  "barc", "bhabha atomic",  // has electronics instrumentation but also chemistry/biology
]);

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Check if a title/description mentions electronics-relevant keywords.
 * Returns true if ANY electronics keyword is found.
 */
export function hasElectronicsKeywords(text: string): boolean {
  const t = text.toLowerCase();
  return ELECTRONICS_KEYWORDS.some((kw) => t.includes(kw));
}

/**
 * Check if a title/description mentions research keywords.
 * Returns true if ANY research keyword is found.
 */
export function hasResearchKeywords(text: string): boolean {
  const t = text.toLowerCase();
  return RESEARCH_KEYWORDS.some((kw) => t.includes(kw));
}

/**
 * Check if a title is clearly irrelevant to the platform's domain.
 * Uses negative matching — returns true if the title contains
 * non-technical/trade/HR/finance keywords.
 *
 * IMPORTANT: If the title ALSO has electronics/research keywords,
 * it's NOT irrelevant (e.g. "Electronics Fitter" — trade + domain).
 */
export function isClearlyIrrelevant(title: string): boolean {
  const t = title.toLowerCase();
  const hasTradeKeyword = IRRELEVANT_KEYWORDS.some((kw) => t.includes(kw));

  if (hasTradeKeyword) {
    // Exception: if it also has electronics/research keywords, keep it
    if (hasElectronicsKeywords(title) || hasResearchKeywords(title)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Check if a PSU organization is inherently electronics-focused.
 * For these orgs, most roles are likely relevant.
 */
export function isElectronicsPSU(orgName: string): boolean {
  const lower = orgName.toLowerCase();
  return Array.from(ELECTRONICS_PSUS).some((psu) => lower.includes(psu));
}

/**
 * Check if a PSU organization is a mixed-focus org.
 * For these orgs, only roles with electronics/research keywords are relevant.
 */
export function isMixedPSU(orgName: string): boolean {
  const lower = orgName.toLowerCase();
  return Array.from(MIXED_PSUS).some((psu) => lower.includes(psu));
}

/**
 * Broader technical signals for mixed/unknown orgs.
 * NOTE: "apprentice" and "trainee" are INTENTIONALLY excluded —
 * generic multi-trade apprenticeships without electronics keywords
 * should not qualify. Electronics-specific apprenticeships are caught
 * by hasElectronicsKeywords() in steps 2-3.
 */
const TECHNICAL_SIGNALS = [
  "engineer", "scientist", "technician", "technical",
  "developer", "designer", "research", "fellow",
  "intern",
];

/**
 * Classify an opportunity's role relevance to the platform.
 *
 * Returns:
 * - "relevant": clearly electronics/semiconductor/research — always include
 * - "possibly_relevant": from a relevant org but title is ambiguous — search only
 * - "irrelevant": clearly not electronics/research — exclude
 *
 * POLICY:
 * - Homepage featured: ONLY "relevant"
 * - General public search: "relevant" + "possibly_relevant"
 * - Admin/review: all classifications
 *
 * RULE: ROLE SIGNAL beats ORG SIGNAL when they conflict.
 * "Manager at BEL" → irrelevant (non-technical role wins).
 * "VLSI at Unknown" → relevant (electronics role wins).
 */
export function classifyRoleRelevance(
  title: string,
  description?: string | null,
  orgName?: string | null,
  tags?: string[] | null,
): "relevant" | "possibly_relevant" | "irrelevant" {
  const combined = [title, description, orgName, ...(tags || [])].filter(Boolean).join(" ");

  // 1. Clearly irrelevant — ROLE SIGNAL WINS over org signal
  //    (unless title also has electronics/research keywords)
  if (isClearlyIrrelevant(title)) {
    return "irrelevant";
  }

  // 2. Has electronics keywords — clearly relevant
  if (hasElectronicsKeywords(combined)) {
    return "relevant";
  }

  // 3. Has research keywords — clearly relevant
  if (hasResearchKeywords(combined)) {
    return "relevant";
  }

  // 4. From an electronics-focused PSU — org signal (no role contradiction)
  if (orgName && isElectronicsPSU(orgName)) {
    return "relevant";
  }

  // 5. From a mixed PSU — only if title has strong technical signal
  if (orgName && isMixedPSU(orgName)) {
    const t = title.toLowerCase();
    if (TECHNICAL_SIGNALS.some((s) => t.includes(s))) {
      return "possibly_relevant";
    }
    return "irrelevant";
  }

  // 6. Unknown org — only if title has strong technical signal
  const t = title.toLowerCase();
  if (TECHNICAL_SIGNALS.some((s) => t.includes(s))) {
    return "possibly_relevant";
  }

  // 7. Default: IRRELEVANT (fail closed — don't include unknowns)
  return "irrelevant";
}

/**
 * Main relevance gate — should this opportunity be included in the
 * public electronics-focused opportunity pool?
 *
 * Returns true if the opportunity is relevant (not irrelevant).
 * Used by scrapers at ingestion time and by the public query as a safety layer.
 *
 * NOTE: This includes "possibly_relevant" for broad scraper filtering.
 * The homepage uses classifyRoleRelevance() directly to enforce
 * "relevant" only (high precision).
 */
export function isRelevantToPlatform(
  title: string,
  description?: string | null,
  orgName?: string | null,
  tags?: string[] | null,
): boolean {
  const relevance = classifyRoleRelevance(title, description, orgName, tags);
  return relevance !== "irrelevant";
}

/**
 * Generate content-derived tags based on the title and description.
 * Replaces the blanket "Electronics" tag that was previously hardcoded.
 */
export function deriveTags(
  title: string,
  description?: string | null,
  orgName?: string | null,
  existingTags?: string[] | null,
): string[] {
  const tags = new Set<string>();
  const combined = `${title} ${description || ""} ${orgName || ""}`.toLowerCase();

  // Add org name if present
  if (orgName) tags.add(orgName);

  // Electronics/semiconductor domain tags
  if (combined.includes("semiconductor") || combined.includes("chip") || combined.includes("silicon")) {
    tags.add("Semiconductor");
  }
  if (combined.includes("vlsi") || combined.includes("asic") || combined.includes("rtl")) {
    tags.add("VLSI");
  }
  if (combined.includes("fpga")) tags.add("FPGA");
  if (combined.includes("embedded") || combined.includes("firmware")) {
    tags.add("Embedded");
  }
  if (combined.includes("electronics") || combined.includes("electronic")) {
    tags.add("Electronics");
  }
  if (combined.includes("hardware") || combined.includes("pcb")) {
    tags.add("Hardware");
  }
  if (combined.includes("analog") || combined.includes(" rf ") || combined.includes("rfic")) {
    tags.add("Analog/RF");
  }
  if (combined.includes("design verification") || combined.includes("uvm")) {
    tags.add("Verification");
  }

  // Role type tags
  if (combined.includes("jrf") || combined.includes("junior research")) {
    tags.add("JRF");
  }
  if (combined.includes("srf") || combined.includes("senior research")) {
    tags.add("SRF");
  }
  if (combined.includes("phd") || combined.includes("doctoral")) {
    tags.add("PhD");
  }
  if (combined.includes("research")) tags.add("Research");
  if (combined.includes("fellow")) tags.add("Fellowship");
  if (combined.includes("scientist")) tags.add("Scientist");
  if (combined.includes("intern")) tags.add("Internship");

  // Organization type tags
  if (combined.includes("govt") || combined.includes("government") ||
      combined.includes("psu")) {
    tags.add("Govt Job");
  }

  // Preserve existing tags that are meaningful
  if (existingTags) {
    for (const tag of existingTags) {
      if (tag && tag !== "Electronics" && tag !== "Govt Job") {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags);
}

/**
 * Infer category from title — consistent with ISRO/DRDO/CSIR scrapers.
 * Returns a value that maps through CAT_MAP to a DB CHECK constraint value.
 */
export function inferCategoryFromTitle(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("JRF") || t.includes("JUNIOR RESEARCH FELLOW")) return "JRF";
  if (t.includes("SRF") || t.includes("SENIOR RESEARCH FELLOW")) return "SRF";
  if (t.includes("PHD") || t.includes("DOCTORAL") || t.includes("FELLOWSHIP")) return "Fellowship";
  if (t.includes("POSTDOC") || t.includes("POST-DOCTORAL")) return "PostDoc";
  if (t.includes("RESEARCH ASSOCIATE") || t.includes("RA ") || t.includes("PROJECT ASSISTANT")) return "JRF";
  if (t.includes("SCIENTIST") || t.includes("ENGINEER")) return "Govt Job";
  if (t.includes("INTERN") || t.includes("APPRENTICE")) return "Fellowship";
  if (t.includes("TECHNICIAN") || t.includes("TECHNICAL")) return "Govt Job";
  // Default: government (will map through CAT_MAP)
  return "Govt Job";
}
