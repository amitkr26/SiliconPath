// Controlled opportunity taxonomy (Phase 5 of CONTENT_UPGRADE_PLAN.md).
// Primary categories are fixed; secondary categories come from a fixed list.
// AI/ scrapers may SUGGEST categories, but every final value must pass
// validateCategory() — no unrestricted category proliferation.

export const PRIMARY_CATEGORIES = [
  "jobs",
  "internships",
  "research",
  "fellowships",
  "admissions",
  "scholarships",
  "apprenticeships",
  "exams",
  "training",
  "workshops",
  "competitions",
  "hackathons",
  "other",
] as const;
export type PrimaryCategory = (typeof PRIMARY_CATEGORIES)[number];

export const SECONDARY_CATEGORIES = [
  "semiconductor",
  "electronics",
  "vlsi",
  "asic",
  "fpga",
  "rtl",
  "embedded systems",
  "firmware",
  "hardware design",
  "pcb",
  "testing & validation",
  "instrumentation",
  "research & development",
  "thin films",
  "materials",
  "spintronics",
  "ai/ml",
  "software",
  "telecom",
  "photonics",
] as const;
export type SecondaryCategory = (typeof SECONDARY_CATEGORIES)[number];

const PRIMARY_RULES: Array<{ keywords: string[]; category: PrimaryCategory }> = [
  { keywords: ["intern", "internship", "trainee engineer", "trainee"], category: "internships" },
  { keywords: ["apprentice"], category: "apprenticeships" },
  { keywords: ["fellowship", "fellow", "postdoc", "post doctoral"], category: "fellowships" },
  { keywords: ["jrf", "jr research", "junior research"], category: "research" },
  { keywords: ["srf", "sr research", "senior research", "research associate", "research assistant", "scientist", "research fellow"], category: "research" },
  { keywords: ["scholarship"], category: "scholarships" },
  { keywords: ["admission", "phd admission", "ph.d", "mtech admission", "mt tech", "b.tech admission", "apply for phd", "programme admission"], category: "admissions" },
  { keywords: ["exam", "gate ", "ugc net", "aieee", "jee ", "competitive examination", "written test"], category: "exams" },
  { keywords: ["workshop"], category: "workshops" },
  { keywords: ["training", "skill development"], category: "training" },
  { keywords: ["hackathon"], category: "hackathons" },
  { keywords: ["competition", "contest"], category: "competitions" },
];

// Legacy category values seen in the live DB → new primary category.
const LEGACY_MAP: Record<string, PrimaryCategory> = {
  jrf: "research",
  srf: "research",
  phd: "admissions",
  postdoc: "fellowships",
  fellowship: "fellowships",
  scholarship: "scholarships",
  internship: "internships",
  government: "jobs",
  industry: "jobs",
  job: "jobs",
  private: "jobs",
  trainee: "internships",
  apprentice: "apprenticeships",
  admission: "admissions",
  exam: "exams",
};

const SECONDARY_RULES: Array<{ keywords: string[]; secondary: SecondaryCategory }> = [
  { keywords: ["semiconductor", "semicon", "chip industry", "electronics industry"], secondary: "semiconductor" },
  { keywords: ["vlsi", "asic", "rtl", "verilog", "systemverilog", "uvm", "physical design", "fab", "foundry", "wafer", "chip design"], secondary: "vlsi" },
  { keywords: ["fpga"], secondary: "fpga" },
  { keywords: ["embedded", "microcontroller", "firmware", "rtos"], secondary: "embedded systems" },
  { keywords: ["pcb", "schematic", "layout engineer", "pcba"], secondary: "pcb" },
  { keywords: ["hardware", "board design", "soc design", "asic design", "chip"], secondary: "hardware design" },
  { keywords: ["test", "validation", "verification", "qa", "quality"], secondary: "testing & validation" },
  { keywords: ["instrumentation", "sensor", "signal processing", "control system"], secondary: "instrumentation" },
  { keywords: ["rd", "r&d", "research and development", "research engineer"], secondary: "research & development" },
  { keywords: ["thin film", "thin-film", "coating", "deposition"], secondary: "thin films" },
  { keywords: ["material", "metallurgy", "ceramic", "polymer"], secondary: "materials" },
  { keywords: ["spintronics", "magnet", "magnetic"], secondary: "spintronics" },
  { keywords: ["ai", "ml", "machine learning", "deep learning", "llm", "data science", "artificial intelligence"], secondary: "ai/ml" },
  { keywords: ["software", "full stack", "backend", "frontend", "devops", "cloud", "app development"], secondary: "software" },
  { keywords: ["telecom", "5g", "6g", "rf", "antenna", "wireless", "communication"], secondary: "telecom" },
  { keywords: ["photonics", "optical", "fiber", "laser", "optoelectronics"], secondary: "photonics" },
  { keywords: ["electronics", "electrical", "power electronics"], secondary: "electronics" },
];

/** Deterministic primary category from text (title+description+legacy category). */
export function classifyPrimaryCategory(input: { category?: string | null; title?: string | null; description?: string | null }): PrimaryCategory {
  const text = `${input.title || ""} ${input.description || ""}`.toLowerCase();
  const legacy = (input.category || "").toLowerCase().trim();
  if (LEGACY_MAP[legacy]) return LEGACY_MAP[legacy];
  for (const rule of PRIMARY_RULES) {
    for (const kw of rule.keywords) {
      // keyword trailing space (e.g. "gate ") requires word-boundary match
      if (kw.endsWith(" ")) {
        const re = new RegExp(`\\b${kw.trim()}\\b`, "i");
        if (re.test(text)) return rule.category;
      } else if (text.includes(kw)) {
        return rule.category;
      }
    }
  }
  return "other";
}

/** Deterministic secondary categories (max 3). */
export function classifySecondaryCategories(input: { title?: string | null; description?: string | null; tags?: string[] | null }): SecondaryCategory[] {
  const text = `${input.title || ""} ${(input.tags || []).join(" ")}`.toLowerCase();
  const found: SecondaryCategory[] = [];
  for (const rule of SECONDARY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      if (!found.includes(rule.secondary)) found.push(rule.secondary);
      if (found.length >= 3) break;
    }
  }
  return found;
}

export function isValidPrimaryCategory(c: string): c is PrimaryCategory {
  return (PRIMARY_CATEGORIES as readonly string[]).includes(c);
}

export function isValidSecondaryCategory(c: string): c is SecondaryCategory {
  return (SECONDARY_CATEGORIES as readonly string[]).includes(c);
}

/**
 * Final gate: AI/ scraper suggestions must pass through here.
 * Returns the validated primary (falling back to "other") and only valid
 * secondaries. Never returns an uncontrolled value.
 */
export function validateCategories(suggested: {
  primaryCategory?: string | null;
  secondaryCategories?: string[] | null;
}): { primaryCategory: PrimaryCategory; secondaryCategory: string[] } {
  const primary = isValidPrimaryCategory(String(suggested.primaryCategory || "").toLowerCase())
    ? (String(suggested.primaryCategory).toLowerCase() as PrimaryCategory)
    : "other";
  const secondary = (suggested.secondaryCategories || [])
    .map((c) => String(c).toLowerCase())
    .filter(isValidSecondaryCategory);
  return { primaryCategory: primary, secondaryCategory: secondary };
}

export function mapLegacyCategory(legacy: string | null | undefined): PrimaryCategory {
  return LEGACY_MAP[(legacy || "").toLowerCase().trim()] || "other";
}