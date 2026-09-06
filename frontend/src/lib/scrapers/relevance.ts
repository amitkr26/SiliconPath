/**
 * Shared role-level relevance module for BerojgarDegreeWala.
 * Single source of truth for determining whether an opportunity is
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
 * Design principle: INCLUSIVE for electronics/research, EXCLUSIVE for
 * clearly-irrelevant roles. When ambiguous, err on the side of inclusion.
 */

// ============================================================
// ELECTRONICS / SEMICONDUCTOR / VLSI / EMBEDDED / HARDWARE
// ============================================================

const ELECTRONICS_KEYWORDS = [
  // Core domain
  "electronics", "electronic", "semiconductor", "vlsi", "asic",
  "fpga", "rtl", "verilog", "systemverilog", "vhdl",
  "embedded", "firmware", "hardware", "pcb", "board",
  "analog", "rf", "rfic", "mixed-signal", "signal processing",
  "digital design", "physical design", "verification",
  "microcontroller", "microprocessor", "soc", "chip",
  "fabrication", "lithography", "cleanroom", "wafer",
  "mems", "nanoelectronics", "nanotech",
  // Specific roles
  "electronics engineer", "electronics and communication",
  "ece", "eee", "eie",  // common Indian branch abbreviations
  "instrumentation", "control systems",
  // Tools & methodologies
  "cadence", "synopsys", "mentor", "vivado", "quartus",
  "primetime", "sta", "drc", "lvs", "gdsii",
  "uvm", "sva", "coverage",
  // Industry
  "chip design", "silicon", "wafer", "foundry",
  "intel", "qualcomm", "amd", "nvidia", "arm", "tsmc",
  "synopsys", "cadence", "marvell", "broadcom", "micron",
  "texas instruments", "nxp", "infineon", "stmicro",
  "globalfoundries", "UMC",
];

// ============================================================
// RESEARCH / ACADEMIC
// ============================================================

const RESEARCH_KEYWORDS = [
  "jrf", "junior research fellow",
  "srf", "senior research fellow",
  "research associate", "ra ",
  "phd", "doctoral", "doctorate",
  "research fellow", "fellowship",
  "research scientist", "research engineer",
  "postdoc", "post-doctoral",
  "project assistant", "project staff", "project fellow",
  "research project", "research position",
  "gated", "net qualified", "csir-ugc",
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
  "clerk", "stenographer", "lower division clerk",
  "peon", "chowkidar", "watchman", "safaiwala",
  "driver", "cook", "nurse",
  // Generic management (not technical)
  "general manager", "deputy manager admin",
  "manager hr", "manager finance",
  // Generic non-technical government
  "civil engineer",  // but "civil services" or "civil works at electronics lab" could be relevant
  "mechanical engineer",  // unless at semiconductor fab
  "chemical engineer",
  "metallurgical",
  "textile",
  "agriculture",
];

// ============================================================
// PSU ORG RELEVANCE — some PSUs are inherently electronics-focused
// ============================================================

/** PSUs where ALL roles should be considered potentially relevant */
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
  "barc", "bhabha atomic",  // nuclear/atomic has electronics instrumentation
]);

/** PSUs where only specific roles are relevant (need title check) */
const MIXED_PSUS = new Set([
  "hal", "hindustan aeronautics",
  "bsnl", "bharat sanchar",
  "railtel",
  "iti limited", "indian telephone",
  "isro", "indian space",
  "drdo", "defence research",
  "csir",
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
 */
export function isClearlyIrrelevant(title: string): boolean {
  const t = title.toLowerCase();
  // Check for trade keywords that indicate non-technical roles
  // Be conservative: only exclude if the title is clearly about a non-technical trade
  const hasTradeKeyword = IRRELEVANT_KEYWORDS.some((kw) => t.includes(kw));

  // Special case: "electrician" alone is irrelevant, but "electronics" is relevant
  if (hasTradeKeyword) {
    // If it also has electronics/research keywords, it might be relevant
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
 * Classify an opportunity's role relevance to the platform.
 *
 * Returns:
 * - "relevant": clearly electronics/semiconductor/research — always include
 * - "possibly_relevant": from a relevant org but title is ambiguous — include with caution
 * - "irrelevant": clearly not electronics/research — exclude
 */
export function classifyRoleRelevance(
  title: string,
  description?: string | null,
  orgName?: string | null,
  tags?: string[] | null,
): "relevant" | "possibly_relevant" | "irrelevant" {
  const combined = [title, description, orgName, ...(tags || [])].filter(Boolean).join(" ");

  // 1. Clearly irrelevant — exclude even if from a relevant org
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

  // 4. From an electronics-focused PSU — include (org-level signal)
  if (orgName && isElectronicsPSU(orgName)) {
    return "relevant";
  }

  // 5. From a mixed PSU — include only if title has some technical signal
  if (orgName && isMixedPSU(orgName)) {
    // Check for broader technical keywords
    const technicalSignals = [
      "engineer", "scientist", "technician", "technical",
      "developer", "designer", "research", "fellow",
      "intern", "apprentice", "trainee",
    ];
    const t = title.toLowerCase();
    if (technicalSignals.some((s) => t.includes(s))) {
      return "possibly_relevant";
    }
    return "irrelevant";
  }

  // 6. Unknown org — if title has technical signals, include
  const t = title.toLowerCase();
  const technicalSignals = [
    "engineer", "scientist", "technician", "technical",
    "developer", "designer", "research", "fellow",
    "intern", "apprentice", "trainee", "project",
  ];
  if (technicalSignals.some((s) => t.includes(s))) {
    return "possibly_relevant";
  }

  // 7. Default: possibly relevant (be inclusive)
  return "possibly_relevant";
}

/**
 * Main relevance gate — should this opportunity be included in the
 * public electronics-focused opportunity pool?
 *
 * Returns true if the opportunity is relevant to the platform's domain.
 * Used by scrapers at ingestion time and by the public query as a safety layer.
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
  if (combined.includes("hardware") || combined.includes("pcb") || combined.includes("board")) {
    tags.add("Hardware");
  }
  if (combined.includes("analog") || combined.includes("rf") || combined.includes("rfic")) {
    tags.add("Analog/RF");
  }
  if (combined.includes("verification") || combined.includes("uvm")) {
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
  if (combined.includes("apprentice")) tags.add("Apprentice");

  // Organization type tags
  if (combined.includes("govt") || combined.includes("government") ||
      combined.includes("railway") || combined.includes("psu")) {
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
