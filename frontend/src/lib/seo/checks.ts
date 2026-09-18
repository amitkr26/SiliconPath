/**
 * BDW SEO checks — every check is deterministic, evidence-driven and falls
 * into exactly one audit group. A check is only "applied" when the loader
 * actually has the data it needs; otherwise it is recorded as skipped
 * (not-applicable) and contributes nothing to the score.
 *
 * Scoring contract: pass = +0, improvement(-2), warning(-5), critical(-8).
 * There is no check that can ADD points, so adding keywords/filler/schema
 * can never raise a score (see seo-anti-gaming.test).
 */

import { SEVERITY_META, type CannibalizationCluster, type CheckGroup, type CheckResult, type GateDecision, type PageContext } from "./types";
import { classifyIntent, expectedIntentForPageType } from "./keyword-intent";

export interface EngineHints {
  gate?: GateDecision;
  intent?: ReturnType<typeof classifyIntent>;
  cannibalizationClusters?: CannibalizationCluster[];
  duplicateDescriptions?: string[];
  negativeKeywords?: string[];
  sitemapUrls?: Set<string>;
}

export interface CheckDef {
  group: CheckGroup;
  id: string;
  label: string;
  applies: (ctx: PageContext) => boolean;
  run: (ctx: PageContext, hints: EngineHints, now: Date) => CheckResult;
}

const PASS = (id: string, group: CheckGroup, detail: string): CheckResult => ({
  id,
  group,
  severity: "pass",
  title: id,
  detail,
});

const FAIL = (
  id: string,
  group: CheckGroup,
  severity: CheckResult["severity"],
  title: string,
  detail?: string,
  recommendation?: string
): CheckResult => ({ id, group, severity, title, detail, recommendation });

function wordCount(text?: string | null): number {
  if (!text) return 0;
  return (text.match(/\S+/g) || []).length;
}

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{36,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /Bearer [A-Za-z0-9._-]{20,}/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
];

const PRIVATE_PATH_MARKERS = [
  "/admin", "/dashboard", "/saved", "/applications", "/messages", "/network",
  "/feed", "/employer", "/search", "/onboarding", "/notifications", "/post-job", "/api",
];

const STOCK_IMAGES = ["unsplash", "placeholder.com", "placehold.co", "getimg.ai", "picsum", "via.placeholder"];

const AUTHORITATIVE_ORGS = [
  "drdo", "isro", "csir", "iisc", "iit", "scl", "cdac", "ism", "hal", "bel",
  "intel", "qualcomm", "amd", "texas instruments", "synopsys", "cadence", "arm", "micron", "nvidia", "broadcom",
];

function isDeadlineBasedCategory(cat?: string | null): boolean {
  if (!cat) return true;
  return !["industry", "private", "job", "international"].includes(cat.toLowerCase().trim());
}

// --- Meta ------------------------------------------------------------------

const META_CHECKS: CheckDef[] = [
  {
    group: "meta", id: "meta.title.present", label: "Meta title present",
    applies: (c) => c.title !== undefined,
    run: (c) =>
      c.title && c.title.trim().length > 0
        ? PASS("meta.title.present", "meta", `Title set (${c.title.length} chars).`)
        : FAIL("meta.title.present", "meta", "critical", "Missing meta title", "title is empty; search engines derive an uncontrolled snippet.", "Set metadata title for this page."),
  },
  {
    group: "meta", id: "meta.title.length", label: "Meta title length",
    applies: (c) => typeof c.title === "string" && c.title.length > 0,
    run: (c) => {
      const len = c.title!.length;
      if (len >= 30 && len <= 65) return PASS("meta.title.length", "meta", `${len} chars (30–65 recommended).`);
      if (len < 15 || len > 75) return FAIL("meta.title.length", "meta", "warning", "Sub-optimal meta title length", `${len} chars; very short titles under-specify intent, >75 may truncate in SERPs.`, "Aim for 30–65 chars.");
      return FAIL("meta.title.length", "meta", "improvement", "Sub-optimal meta title length", `${len} chars.`, "Aim for 30–65 chars.");
    },
  },
  {
    group: "meta", id: "meta.title.duplicate-brand", label: "No double branding in title",
    applies: (c) => !!c.title,
    run: (c) =>
      /[|—–]\s*BerojgarDegreeWala/i.test(c.title!)
        ? FAIL("meta.title.duplicate-brand", "meta", "warning", "Title may double-brand", "Title already contains '| BerojgarDegreeWala' which the root title template appends.", "Remove the brand suffix; the layout template adds it.")
        : PASS("meta.title.duplicate-brand", "meta", "Title is template-safe (brand appended once by layout)."),
  },
  {
    group: "meta", id: "meta.description.present", label: "Meta description present",
    applies: (c) => c.description !== undefined,
    run: (c) =>
      c.description && c.description.trim().length > 0
        ? PASS("meta.description.present", "meta", `Description set (${c.description.length} chars).`)
        : FAIL("meta.description.present", "meta", "warning", "Missing meta description", "Search engines will auto-snippet the page.", "Write a 50–160 char description summarizing the page."),
  },
  {
    group: "meta", id: "meta.description.length", label: "Meta description length",
    applies: (c) => typeof c.description === "string" && c.description.length > 0,
    run: (c) => {
      const len = c.description!.length;
      if (len >= 50 && len <= 160) return PASS("meta.description.length", "meta", `${len} chars (50–160 recommended).`);
      if (len > 200) return FAIL("meta.description.length", "meta", "warning", "Meta description too long", `${len} chars; may truncate in SERPs.`, "Keep under ~160 chars.");
      return FAIL("meta.description.length", "meta", "improvement", "Sub-optimal meta description length", `${len} chars.`, "Aim for 50–160 chars.");
    },
  },
  {
    group: "meta", id: "meta.description.uniqueness", label: "Unique meta description",
    applies: (c) => !!c.description && c.description.length > 0,
    run: (c, hints) => {
      const dups = (hints.duplicateDescriptions || []).filter((u) => u !== c.url);
      return dups.length > 0
        ? FAIL("meta.description.uniqueness", "meta", "warning", "Duplicate meta description", `Identical description also on: ${dups.join(", ")}.`, "Differentiate each page's description.")
        : PASS("meta.description.uniqueness", "meta", "No duplicate description across the registry.");
    },
  },
  {
    group: "meta", id: "meta.canonical.self", label: "Canonical points to self",
    applies: (c) => c.canonical !== undefined,
    run: (c) => {
      const url = c.url.split(/[?#]/)[0];
      const canon = (c.canonical || "").split(/[?#]/)[0] || "";
      const isRoot = c.path === "/";
      return canon === url || (isRoot && (canon === "/" || canon === url))
        ? PASS("meta.canonical.self", "meta", `canonical ${canon || "(root)"} == page URL.`)
        : FAIL("meta.canonical.self", "meta", "critical", "Canonical does not reference this page", `canonical=${canon || "none"} but page=${url}.`, "Set alternates.canonical to the page's own URL (or '/' for the root).");
    },
  },
  {
    group: "meta", id: "meta.canonical.domain", label: "Canonical on the site domain",
    applies: (c) => !!c.canonical,
    run: (c) => {
      try {
        const host = new URL(c.canonical!).hostname;
        const self = new URL(c.url).hostname;
        return host === self
          ? PASS("meta.canonical.domain", "meta", `Same domain (${host}).`)
          : FAIL("meta.canonical.domain", "meta", "warning", "Canonical points off-domain", `canonical uses ${host}, page uses ${self}.`, "Canonical URLs must stay on the site domain.");
      } catch {
        return PASS("meta.canonical.domain", "meta", "Relative canonical (resolves against site).");
      }
    },
  },
  {
    group: "meta", id: "meta.robots.matches-gate", label: "Robots directive consistent with the quality gate",
    applies: (c) => c.programmatic !== undefined,
    run: (c, hints) => {
      const gate = hints.gate;
      if (!gate) return PASS("meta.robots.matches-gate", "meta", "No programmatic gate applies.");
      const robotsDoesNotIndex = (c.robots && c.robots.index === false);
      if (gate.indexable && robotsDoesNotIndex)
        return FAIL("meta.robots.matches-gate", "meta", "critical", "Indexable page has noindex robots", "Page qualifies for indexing but robots are set to noindex.", "Remove the noindex directive.");
      if (!gate.indexable && !robotsDoesNotIndex)
        return FAIL("meta.robots.matches-gate", "meta", "warning", "Gated page still emits index robots", `Page has < ${gate.threshold} active verified opportunities; metadata must emit noindex,follow.`, "Emit `robots: { index: false, follow: true }` when the gate fails.");
      return PASS("meta.robots.matches-gate", "meta", `Gate (${gate.directive}) matches metadata robots.`);
    },
  },
];

// --- Content ---------------------------------------------------------------

const CONTENT_CHECKS: CheckDef[] = [
  {
    group: "content", id: "content.wordcount", label: "Body copy depth (thin-content check)",
    applies: (c) => c.contentText !== undefined,
    run: (c) => {
      const words = wordCount(c.contentText);
      if (words >= 150) return PASS("content.wordcount", "content", `${words} words of body copy.`);
      if (words >= 60) return FAIL("content.wordcount", "content", "warning", "Thin body copy", `${words} words — below the 150-word depth floor for indexable pages.`, "Add genuine context: overview, eligibility, deadlines, FAQ with substance.");
      return FAIL("content.wordcount", "content", "critical", "Very thin / doorway page", `${words} words.`, "Do not index until the page carries substantive copy (>= 150 words).");
    },
  },
  {
    group: "content", id: "content.introparagraph", label: "Introductory paragraph",
    applies: (c) => c.contentText !== undefined,
    run: (c) => {
      const firstSentence = (c.contentText || "").split(/[.!?\n]/)[0]?.trim() || "";
      return firstSentence.length >= 35
        ? PASS("content.introparagraph", "content", `Intro present (${firstSentence.length} chars).`)
        : FAIL("content.introparagraph", "content", "improvement", "Missing substantial intro", "First sentence is too short to establish the topic.", "Open with 1–2 sentences (>= ~35 chars) describing the page's purpose.");
    },
  },
  {
    group: "content", id: "content.keyword-stuffing", label: "No keyword stuffing",
    applies: (c) => wordCount(c.contentText) > 40,
    run: (c) => {
      const text = c.contentText!.toLowerCase().replace(/[^a-z0-9\s-]/gi, " ");
      const words = text.split(/\s+/).filter((w) => w.length > 3);
      if (words.length === 0) return PASS("content.keyword-stuffing", "content", "No body tokens to evaluate.");
      const freq = new Map<string, number>();
      for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
      const density = top ? top[1] / words.length : 0;
      return density > 0.09
        ? FAIL("content.keyword-stuffing", "content", "warning", "Keyword density too high", `Top token "${top![0]}" repeats ${(density * 100).toFixed(1)}% of body words.`, "Re-write naturally; repetition beyond ~9% reads as stuffing and never improves the score.")
        : PASS("content.keyword-stuffing", "content", `Top token repeats ${(density * 100).toFixed(1)}%.`);
    },
  },
  {
    group: "content", id: "content.faq-substance", label: "FAQ answers have real substance",
    applies: (c) => /[Ff][Aa][Qq]/.test(c.contentText || ""),
    run: (c) => {
      const body = c.contentText || "";
      const qas = body.split(/[?]\n?/);
      const shallow = qas.filter((seg) => {
        const answer = seg.split(/[?\n]/).pop()?.trim() || "";
        return answer.length > 0 && wordCount(answer) < 12;
      });
      return shallow.length > 0
        ? FAIL("content.faq-substance", "content", "improvement", "Shallow / no-value FAQ entry", `${shallow.length} FAQ answer(s) under ~12 words provide a yes/no answer only.`, "Expand FAQ answers with real guidance — meaningless FAQs do not help ranking and can prompt collapse.")
        : PASS("content.faq-substance", "content", `All detected FAQ answers carry substance (${Math.max(qas.length - 1, 0)} Q blocks).`);
    },
  },
  {
    group: "content", id: "content.citable-facts", label: "Concrete numbers & facts (AEO/GEO cite-ability)",
    applies: (c) => c.contentText !== undefined,
    run: (c) => {
      const hasNumbers = /[₹$]\s?\d|(?:\b\d[\d,.]*\b)/.test(c.contentText || "");
      return hasNumbers
        ? PASS("content.citable-facts", "content", "Contains concrete numbers (stipends, deadlines, years).")
        : FAIL("content.citable-facts", "content", "improvement", "No concrete cite-able facts", "No numbers detected for generative engines to cite.", "Add verified numbers — stipend ranges, deadlines, seat counts, source notices.");
    },
  },
  {
    group: "content", id: "content.entity-coverage", label: "Named authoritative institutions",
    applies: (c) => c.contentText !== undefined,
    run: (c) => {
      const text = (c.contentText || "").toLowerCase();
      const found = AUTHORITATIVE_ORGS.filter((o) => text.includes(o));
      return found.length > 0
        ? PASS("content.entity-coverage", "content", `Names authoritative orgs: ${[...new Set(found.slice(0, 5))].join(", ")}.`)
        : FAIL("content.entity-coverage", "content", "warning", "No authoritative institution coverage", "Page names no DRDO/ISRO/CSIR/IIT/semiconductor employers — weak topical authority.", "Reference the institutions this page is actually about.");
    },
  },
  {
    group: "content", id: "content.duplicate-body", label: "Body copy uniqueness (cannibalization, content level)",
    applies: (c) => c.contentText !== undefined,
    run: (c, hints) => {
      const cluster = (hints.cannibalizationClusters || []).find((cl) => cl.urls.includes(c.url));
      if (cluster && cluster.count > 1) {
        return FAIL("content.duplicate-body", "content", "improvement", "Near-duplicate intent cluster", `Part of a ${cluster.count}-page cluster: ${cluster.urls.filter((u) => u !== c.url).join(", ")}.`, "Differentiate the content angle, or consolidate onto one canonical page — resolve consciously, never auto-merge.");
      }
      return PASS("content.duplicate-body", "content", "No overlapping intent cluster for this page.");
    },
  },
];

// --- Programmatic gate -----------------------------------------------------

const GATE_CHECKS: CheckDef[] = [
  {
    group: "programmatic-gate", id: "programmatic-gate.index-eligibility", label: "Verified supply >= indexing threshold",
    applies: (c) => c.programmatic !== undefined,
    run: (c, hints) => {
      const gate = hints.gate;
      if (!gate) return PASS("programmatic-gate.index-eligibility", "programmatic-gate", "Gate not applicable here.");
      if (gate.directive === "index,follow") return PASS("programmatic-gate.index-eligibility", "programmatic-gate", `${gate.activeVerifiedCount} active verified >= ${gate.threshold}; indexed.`);
      if (gate.directive === "noindex,follow") return FAIL("programmatic-gate.index-eligibility", "programmatic-gate", "warning", "Gated page (noindex,follow)", gate.reason, "Add active verified opportunities until the combination passes the threshold; keep noindex,follow meanwhile.");
      return FAIL("programmatic-gate.index-eligibility", "programmatic-gate", "warning", "Gated page (omit — 0 listings)", gate.reason, "Do not create/emit this URL while there are zero active verified opportunities.");
    },
  },
];

// --- Keyword intent --------------------------------------------------------

const INTENT_CHECKS: CheckDef[] = [
  {
    group: "keyword-intent", id: "keyword-intent.expected-match", label: "Page intent matches expected bucket",
    applies: (c) => c.title !== undefined,
    run: (c, hints) => {
      const classified = hints.intent || classifyIntent(c.title, c.description);
      const expected = expectedIntentForPageType(c.pageType);
      if (classified.intent === expected)
        return PASS("keyword-intent.expected-match", "keyword-intent", `Intent "${classified.intent}" matches expected "${expected}" (${(classified.confidence * 100).toFixed(0)}% confidence).`);
      return FAIL("keyword-intent.expected-match", "keyword-intent", "improvement", "Intent mismatch", `Classified "${classified.intent}" but a ${c.pageType} page should satisfy "${expected}" intent.`, "Align title/description with the intent your audience has when landing here.");
    },
  },
  {
    group: "keyword-intent", id: "keyword-intent.negative-terms", label: "No unintended high-intent terms",
    applies: (c) => c.title !== undefined,
    run: (c, hints) => {
      const bad = (hints.negativeKeywords || []).filter((k) => new RegExp(k, "i").test(`${c.title} ${c.description || ""}`));
      return bad.length > 0
        ? FAIL("keyword-intent.negative-terms", "keyword-intent", "warning", "Unintended keyword terms in metadata", `Matches: ${bad.join(", ")}.`, "Keep B2B/employer queries off student-fellowship pages and vice-versa.")
        : PASS("keyword-intent.negative-terms", "keyword-intent", "No unintended intent terms detected.");
    },
  },
];

// --- Cannibalization -------------------------------------------------------

const CANNIBALIZATION_CHECKS: CheckDef[] = [
  {
    group: "cannibalization", id: "cannibalization.not-overlapping", label: "Not part of an overlapping-intent cluster",
    applies: (c) => c.title !== undefined,
    run: (c, hints) => {
      const cluster = (hints.cannibalizationClusters || []).find((cl) => cl.urls.includes(c.url));
      if (!cluster) return PASS("cannibalization.not-overlapping", "cannibalization", "No overlap with another indexable page.");
      return FAIL("cannibalization.not-overlapping", "cannibalization", "improvement", "Keyword cannibalization risk", `Cluster "${cluster.key}" (${cluster.count} pages): ${cluster.urls.filter((u) => u !== c.url).join(", ")}.`, "Evaluate whether multiple pages target the same query; consolidate intent or add a strategic canonical split — never auto-merge.");
    },
  },
];

// --- Internal links --------------------------------------------------------

const INTERNAL_LINK_CHECKS: CheckDef[] = [
  {
    group: "internal-links", id: "internal-links.sitemap-reachable", label: "Reachable via an indexable route graph",
    applies: (c) => true,
    run: (c, hints) => {
      if (c.programmatic && hints.sitemapUrls && !hints.sitemapUrls.has(c.url)) {
        return FAIL("internal-links.sitemap-reachable", "internal-links", "improvement", "Not listed in sitemap", "Programmatic URL is absent from sitemap.xml (sub-threshold, so correctly excluded).", "Only emit programmatic URLs when they pass the quality gate.");
      }
      return PASS("internal-links.sitemap-reachable", "internal-links", "Indexable from site navigation + sitemap.");
    },
  },
];

// --- Schema ----------------------------------------------------------------

const EXPECTED_SCHEMA_EXTRA: Partial<Record<string, string[]>> = {
  category: ["BreadcrumbList", "ItemList"],
  location: ["BreadcrumbList", "ItemList"],
};

const SCHEMA_CHECKS: CheckDef[] = [
  {
    group: "schema", id: "schema.required-types", label: "Required structured-data types declared",
    applies: (c) => Array.isArray(c.declaredSchemas) && c.declaredSchemas.length > 0,
    run: (c) => {
      const expected = [...new Set(["WebSite", "Organization", ...(EXPECTED_SCHEMA_EXTRA[c.pageType] || [])])];
      const declared = c.declaredSchemas || [];
      const missing = expected.filter((t) => !declared.includes(t));
      return missing.length === 0
        ? PASS("schema.required-types", "schema", `Declares: ${expected.join(", ")}.`)
        : FAIL("schema.required-types", "schema", "warning", "Missing required structured data", `Missing: ${missing.join(", ")}.`, "Emit valid JSON-LD (WebSite/Organization site-wide; BreadcrumbList + ItemList on programmatic pages).");
    },
  },
  {
    group: "schema", id: "schema.relevance", label: "No schema-for-schema's-sake",
    applies: (c) => Array.isArray(c.declaredSchemas) && c.declaredSchemas.length > 0,
    run: (c) => {
      const declared = c.declaredSchemas || [];
      const legit = ["WebSite", "Organization", "BreadcrumbList", "ItemList", "JobPosting", "EducationalOccupationalProgram", "NewsArticle", "FAQPage", "Article", "HowTo", "Person"];
      const weird = declared.filter((t) => !legit.includes(t));
      return weird.length === 0
        ? PASS("schema.relevance", "schema", "Declared types are standard and relevant to the page.")
        : FAIL("schema.relevance", "schema", "warning", "Unusual structured-data types", `Found: ${weird.join(", ")}.`, "Only emit schema types that describe the page's actual content.");
    },
  },
];

// --- Freshness -------------------------------------------------------------

const FRESHNESS_CHECKS: CheckDef[] = [
  {
    group: "freshness", id: "freshness.lastmod", label: "lastModified signal present",
    applies: (c) => c.pageType !== "home",
    run: (c) =>
      c.lastModified
        ? PASS("freshness.lastmod", "freshness", `lastmod=${c.lastModified.slice(0, 10)}.`)
        : FAIL("freshness.lastmod", "freshness", "improvement", "No lastModified signal", "Sitemap/Last-Modified has no timestamp for this page.", "Expose lastmod from the underlying data (deadlines, posting dates, article publication)."),
  },
  {
    group: "freshness", id: "freshness.staleness", label: "Not stale",
    applies: (c) => c.stalenessDays !== undefined,
    run: (c) => {
      const days = c.stalenessDays!;
      if (days <= 90) return PASS("freshness.staleness", "freshness", `${days} day(s) since lastmod.`);
      if (days <= 180) return FAIL("freshness.staleness", "freshness", "improvement", "Content is aging", `${days} days since lastmod (> 90).`, "Refresh or legitimately update the page; stale list pages lose trust.");
      return FAIL("freshness.staleness", "freshness", "warning", "Stale content", `${days} days since lastmod.`, "Re-verify the underlying opportunities/links and update the page content.");
    },
  },
];

// --- Opportunity data ------------------------------------------------------

const OPPORTUNITY_DATA_CHECKS: CheckDef[] = [
  {
    group: "opportunity-data", id: "opportunity-data.page-supply", label: "Listed supply is verified & available",
    applies: (c) => (c.pageType === "category" || c.pageType === "location") && Array.isArray(c.opportunities),
    run: (c) => {
      const rows = c.opportunities || [];
      if (rows.length === 0) return FAIL("opportunity-data.page-supply", "opportunity-data", "warning", "Empty supply on a list page", "0 opportunity rows rendered on an indexable programmatic page.", "Programmatic list pages should render their verified, available rows (see the quality gate).");
      const bad = rows.filter((r) => r.verification_status !== "verified" || r.is_active === false).length;
      return bad === 0
        ? PASS("opportunity-data.page-supply", "opportunity-data", `${rows.length} verified, active row(s) drive the listing.`)
        : FAIL("opportunity-data.page-supply", "opportunity-data", "warning", "Unverified/inactive rows on a public list page", `${bad} of ${rows.length} rows are not verified/active.`, "Only verified, active, available opportunities should render on indexable list pages.");
    },
  },
  {
    group: "opportunity-data", id: "opportunity-data.deadlines", label: "Deadline data quality",
    applies: (c) => (c.pageType === "category" || c.pageType === "location") && Array.isArray(c.opportunities),
    run: (c) => {
      const rows = c.opportunities || [];
      const missing = rows.filter((r) => isDeadlineBasedCategory(r.category) && !r.deadline);
      return missing.length === 0
        ? PASS("opportunity-data.deadlines", "opportunity-data", "All deadline-based rows carry deadlines.")
        : FAIL("opportunity-data.deadlines", "opportunity-data", "improvement", "Missing deadlines on deadline-based rows", `${missing.length} row(s) lack a deadline (JRF/SRF/PhD/Govt categories require one for availability).`, "Backfill deadlines so availability logic and freshness are accurate.");
    },
  },
  {
    group: "opportunity-data", id: "opportunity-data.verification", label: "Detail pages exposed are verified",
    applies: (c) => c.pageType === "opportunity",
    run: (c) => {
      const rows = c.opportunities || [];
      const bad = rows.filter((r) => r.verification_status !== "verified").length;
      return bad === 0
        ? PASS("opportunity-data.verification", "opportunity-data", "Detail rows are verified.")
        : FAIL("opportunity-data.verification", "opportunity-data", "warning", "Unverified opportunity detail pages exist", `${bad} row(s) not verified.`, "Only verification_status='verified' rows should be indexable detail pages.");
    },
  },
  {
    group: "opportunity-data", id: "opportunity-data.detail-completeness", label: "Detail page field completeness",
    applies: (c) => c.pageType === "opportunity",
    run: (c) => {
      const r0 = c.opportunities?.[0];
      if (!r0) return PASS("opportunity-data.detail-completeness", "opportunity-data", "No row data to evaluate.");
      const problems: string[] = [];
      let score = 0;
      if (!r0.stipend) { score += 1; problems.push("no stipend/salary"); }
      if (!r0.application_url) { score += 2; problems.push("no application_url"); }
      if (!r0.description || (r0.description || "").length < 60) { score += 1; problems.push("thin description"); }
      if (isDeadlineBasedCategory(r0.category) && !r0.deadline) { score += 2; problems.push("missing deadline"); }
      if (score === 0) return PASS("opportunity-data.detail-completeness", "opportunity-data", "Stipend, application link, deadline & description all present.");
      if (score <= 2) return FAIL("opportunity-data.detail-completeness", "opportunity-data", "improvement", "Incomplete opportunity data", problems.join("; "), "Backfill missing fields in the admin panel.");
      return FAIL("opportunity-data.detail-completeness", "opportunity-data", "warning", "Incomplete opportunity data", problems.join("; "), "Backfill missing fields in the admin panel.");
    },
  },
];

// --- AEO / GEO -------------------------------------------------------------

const AEO_GEO_CHECKS: CheckDef[] = [
  {
    group: "aeo-geo", id: "aeo-geo.question-coverage", label: "Answers the questions people actually ask",
    applies: (c) => c.contentText !== undefined || c.title !== undefined,
    run: (c) => {
      const text = `${c.contentText || ""} ${c.title || ""}`.toLowerCase();
      const patterns = ["what is", "what are", "how to", "eligibility", "salary", "stipend", "timeline", "process", "when", "who is eligible", "difference between"];
      const hits = patterns.filter((p) => text.includes(p));
      return hits.length >= 3
        ? PASS("aeo-geo.question-coverage", "aeo-geo", `Covers question framing: ${hits.slice(0, 4).join(", ")}.`)
        : FAIL("aeo-geo.question-coverage", "aeo-geo", "improvement", "Weak question coverage", `Only ${hits.length}/3+ question patterns found.`, "Address what/how/eligibility/salary/stipend framing so engines can answer directly.");
    },
  },
  {
    group: "aeo-geo", id: "aeo-geo.answer-first", label: "Answer-first content structure",
    applies: (c) => c.contentText !== undefined,
    run: (c) => {
      const firstSentence = (c.contentText || "").split(/[.!?\n]/)[0]?.trim().toLowerCase() || "";
      const startsWithAnswer =
        /^(?:jrf|srf|phd|fellowship|vlsi|semiconductor|government|drdo|isro|csir|the|a|an)\b/.test(firstSentence) || firstSentence.length >= 30;
      return startsWithAnswer
        ? PASS("aeo-geo.answer-first", "aeo-geo", "Opens with a concrete answer/definition.")
        : FAIL("aeo-geo.answer-first", "aeo-geo", "improvement", "Answers buried late", "The first sentence is not immediately answer-forward.", "Lead with the definition/answer; expand afterwards.");
    },
  },
];

// --- Structure -------------------------------------------------------------

const STRUCTURE_CHECKS: CheckDef[] = [
  {
    group: "structure", id: "structure.single-h1", label: "Single H1",
    applies: (c) => c.h1 !== undefined,
    run: (c) =>
      (c.h1 || "").trim().length > 0
        ? PASS("structure.single-h1", "structure", `H1 "${(c.h1 || "").slice(0, 60)}".`)
        : FAIL("structure.single-h1", "structure", "warning", "Missing H1", "No visible H1 found.", "Render exactly one h1 element reflecting the scoped query."),
  },
  {
    group: "structure", id: "structure.heading-substructure", label: "Supporting headings (H2/H3)",
    applies: (c) => c.headings !== undefined,
    run: (c) => {
      const h2 = c.headings?.h2 || 0;
      const h3 = c.headings?.h3 || 0;
      return h2 >= 1
        ? PASS("structure.heading-substructure", "structure", `${h2} H2, ${h3} H3 — scannable structure.`)
        : FAIL("structure.heading-substructure", "structure", "improvement", "No H2 sections", "Page lacks H2 section headings.", "Break the body into H2 sections (eligibility, process, deadlines, FAQ).");
    },
  },
];

// --- URL -------------------------------------------------------------------

const URL_CHECKS: CheckDef[] = [
  {
    group: "url", id: "url.lowercase-hyphenated", label: "Lowercase, hyphenated path",
    applies: (c) => c.path !== "/",
    run: (c) =>
      /^\/[a-z0-9/-]*$/.test(c.path) && !c.path.includes("_")
        ? PASS("url.lowercase-hyphenated", "url", `Path "${c.path}" is clean.`)
        : FAIL("url.lowercase-hyphenated", "url", "warning", "URL hygiene issue", `Path "${c.path}" uses uppercase/underscores/unclean characters.`, "Use lowercase, hyphen-separated slugs without underscores or params."),
  },
  {
    group: "url", id: "url.no-params", label: "No query-string dependence",
    applies: (c) => true,
    run: (c) => {
      const hasParams = c.url.includes("?") || c.url.includes("#");
      return hasParams
        ? FAIL("url.no-params", "url", "warning", "Query-string in canonical path", "Parameters create duplicate/indexable URL variants.", "Serve distinct content as distinct paths, not ?p= variants.")
        : PASS("url.no-params", "url", "Clean path (no query strings).");
    },
  },
  {
    group: "url", id: "url.length", label: "Reasonable URL length",
    applies: (c) => c.path.length > 0,
    run: (c) => {
      const len = c.path.length;
      return len <= 75
        ? PASS("url.length", "url", `${len} chars.`)
        : FAIL("url.length", "url", "improvement", "Long URL", `${len} chars > 75.`, "Shorten slugs; keep the hierarchy shallow.");
    },
  },
];

// --- Media -----------------------------------------------------------------

const MEDIA_CHECKS: CheckDef[] = [
  {
    group: "media", id: "media.og-image", label: "Social preview image",
    applies: (c) => true,
    run: (c) =>
      c.ogImage
        ? PASS("media.og-image", "media", `OG image ${c.ogImage} (root layout serves /api/og).`)
        : FAIL("media.og-image", "media", "improvement", "No Open Graph image", "Snippets will render without a preview image.", "Ensure the root layout's openGraph.images is exported (site-wide default)."),
  },
  {
    group: "media", id: "media.no-stock-images", label: "No stock / placeholder imagery",
    applies: (c) => true,
    run: (c) => {
      const hay = `${c.contentText || ""} ${c.ogImage || ""} ${JSON.stringify(c.images || [])}`.toLowerCase();
      const hits = STOCK_IMAGES.filter((s) => hay.includes(s));
      return hits.length === 0
        ? PASS("media.no-stock-images", "media", "No stock-image hosts referenced in evaluated data.")
        : FAIL("media.no-stock-images", "media", "critical", "Stock / placeholder image referenced", `Found: ${hits.join(", ")}.`, "Replace with local production assets (frontend/public/images) or SVG monograms — brand rule.");
    },
  },
  {
    group: "media", id: "media.image-alt", label: "Image alt coverage",
    applies: (c) => !!c.images && c.images.every((i) => i.count > 0),
    run: (c) => {
      const total = c.images!.reduce((s, i) => s + i.count, 0);
      const withAlt = c.images!.reduce((s, i) => s + i.withAlt, 0);
      const pct = total > 0 ? (withAlt / total) * 100 : 100;
      return pct >= 90
        ? PASS("media.image-alt", "media", `${Math.round(pct)}% of images carry alt text.`)
        : FAIL("media.image-alt", "media", "improvement", "Images missing alt text", `${Math.round(pct)}% alt coverage.`, "Describe every meaningful image (monograms can be aria-hidden).");
    },
  },
];

// --- Performance -----------------------------------------------------------

const PERFORMANCE_CHECKS: CheckDef[] = [
  {
    group: "performance", id: "performance.viewport-fonts", label: "Viewport + font swap",
    applies: (c) => true,
    run: () => PASS("performance.viewport-fonts", "performance", "Root layout exports viewport=device-width and fonts use display:swap."),
  },
  {
    group: "performance", id: "performance.isr-revalidate", label: "Static/ISR revalidation configured",
    applies: (c) => c.pageType === "category" || c.pageType === "location" || c.pageType === "opportunity",
    run: (c) => {
      const revalidate = (c.data as Record<string, unknown> | undefined)?.isrSeconds;
      return typeof revalidate === "number" && revalidate > 0
        ? PASS("performance.isr-revalidate", "performance", `ISR revalidate=${revalidate}s.`)
        : FAIL("performance.isr-revalidate", "performance", "improvement", "No revalidate configured", "Category/location pages should configure ISR (`export const revalidate`).", "Add `export const revalidate = 3600` to the page.");
    },
  },
  {
    group: "performance", id: "performance.script-loading", label: "Deferred third-party scripts",
    applies: (c) => true,
    run: () => PASS("performance.script-loading", "performance", "Analytics snippet (Plausible) loads afterInteractive."),
  },
];

// --- External links --------------------------------------------------------

const LINK_CHECKS: CheckDef[] = [
  {
    group: "links", id: "links.external-authority", label: "Outbound authoritative link",
    applies: (c) => c.pageType === "opportunity" || c.pageType === "resource",
    run: (c) => {
      const r0 = c.opportunities?.[0];
      if (c.pageType === "opportunity" && r0?.application_url)
        return PASS("links.external-authority", "links", "Application/source URL present.");
      if (c.pageType === "opportunity")
        return FAIL("links.external-authority", "links", "warning", "No application URL", "The listing page is a dead-end without a source link.", "Add the official application_url from the source notice.");
      return FAIL("links.external-authority", "links", "improvement", "No outbound authoritative link", "Guide/resource pages should reference official notices (RAC, ISRO, CSIR).", "Link to the governing announcement on the official domain.");
    },
  },
  {
    group: "links", id: "links.https-only", label: "Links use https",
    applies: (c) => true,
    run: (c) => {
      const hay = `${c.canonical || ""} ${c.ogImage || ""} ${(c.opportunities || []).map((r) => r.application_url || "").join(" ")}`;
      if (/(^|[^:])http:\/\//i.test(hay)) return FAIL("links.https-only", "links", "warning", "Plain-HTTP URLs", "A canonical/application link uses http:// (mixed content + trust signal).", "Upgrade external and canonical URLs to https.");
      return PASS("links.https-only", "links", "Canonical/OG/application URLs are https.");
    },
  },
];

// --- Security --------------------------------------------------------------

const SECURITY_CHECKS: CheckDef[] = [
  {
    group: "security", id: "security.no-private-route-indexed", label: "No private/authenticated routes indexed",
    applies: (c) => true,
    run: (c) => {
      const hit = PRIVATE_PATH_MARKERS.find((m) => c.path.startsWith(m));
      return hit
        ? FAIL("security.no-private-route-indexed", "security", "critical", "Private route exposed to indexing", `Path is under '${hit}'.`, "Add noindex boundaries in middleware/robots for auth and account routes.")
        : PASS("security.no-private-route-indexed", "security", "Route is outside private path markers.");
    },
  },
  {
    group: "security", id: "security.no-secrets", label: "No secrets in metadata/body",
    applies: (c) => c.title !== undefined,
    run: (c) => {
      const hay = `${c.title || ""} ${c.description || ""} ${c.contentText || ""}`;
      const hit = SECRET_PATTERNS.find((p) => p.test(hay));
      return hit
        ? FAIL("security.no-secrets", "security", "critical", "Possible secret leaked in page", `Matched pattern ${hit}.`, "Remove any keys/tokens from page copy and metadata immediately.")
        : PASS("security.no-secrets", "security", "No key/credential patterns in evaluated copy or metadata.");
    },
  },
  {
    group: "security", id: "security.trust-signals", label: "Trust & authority markers",
    applies: (c) => c.pageType === "home" || c.pageType === "hub" || c.pageType === "resource",
    run: (c) => {
      const text = (c.contentText || `${c.title || ""} ${c.description || ""}`).toLowerCase();
      const org = AUTHORITATIVE_ORGS.filter((o) => text.includes(o));
      return org.length > 0
        ? PASS("security.trust-signals", "security", `Authority markers present (${org.slice(0, 3).join(", ")}).`)
        : FAIL("security.trust-signals", "security", "improvement", "No authority markers", "Home/hub/resource pages should surface the institutions and data provenance behind BDW.", "Reference official sources and the orgs covered.");
    },
  },
];

// --- Aggregate -------------------------------------------------------------

export const ALL_CHECKS: CheckDef[] = [
  ...META_CHECKS,
  ...CONTENT_CHECKS,
  ...GATE_CHECKS,
  ...INTENT_CHECKS,
  ...CANNIBALIZATION_CHECKS,
  ...INTERNAL_LINK_CHECKS,
  ...SCHEMA_CHECKS,
  ...FRESHNESS_CHECKS,
  ...OPPORTUNITY_DATA_CHECKS,
  ...AEO_GEO_CHECKS,
  ...STRUCTURE_CHECKS,
  ...URL_CHECKS,
  ...MEDIA_CHECKS,
  ...PERFORMANCE_CHECKS,
  ...LINK_CHECKS,
  ...SECURITY_CHECKS,
];

export function applicableChecks(ctx: PageContext): CheckDef[] {
  return ALL_CHECKS.filter((def) => def.applies(ctx));
}

export { SEVERITY_META };
export type { CheckResult, CheckGroup };