/**
 * BDW SEO Intelligence Engine — shared types.
 *
 * Design contract (see project-bible): scores are PENALTY-derived. A page
 * starts at 100 and every failed check subtracts a fixed amount by severity
 * (critical 8, warning 5, improvement 2). There is NO mechanism to gain
 * points by adding content, keywords, or markup — the only way to score
 * higher is to stop failing real checks. This makes the score
 * non-gameable by construction.
 */

export type Severity = "critical" | "warning" | "improvement" | "pass";

export const SEVERITY_META: Record<
  Severity,
  { emoji: string; label: string; penalty: number }
> = {
  critical: { emoji: "🔴", label: "Critical", penalty: 8 },
  warning: { emoji: "🟠", label: "Warning", penalty: 5 },
  improvement: { emoji: "🟡", label: "Improvement", penalty: 2 },
  pass: { emoji: "🟢", label: "Passed", penalty: 0 },
};

export const SEVERITIES: Severity[] = ["critical", "warning", "improvement", "pass"];

/**
 * Audit groups. These map 1:1 to the BDW audit blueprint sections
 * (some requested sections are intentionally merged; scores are computed
 * only over checks that are applicable to a given page type).
 */
export const CHECK_GROUPS = [
  "meta",
  "content",
  "programmatic-gate",
  "keyword-intent",
  "cannibalization",
  "internal-links",
  "schema",
  "freshness",
  "opportunity-data",
  "aeo-geo",
  "structure",
  "url",
  "media",
  "performance",
  "links",
  "security",
] as const;

export type CheckGroup = (typeof CHECK_GROUPS)[number];

export const GROUP_LABELS: Record<CheckGroup, { label: string; section: string }> = {
  meta: { label: "Meta tags & canonicals", section: "2. Meta checks" },
  content: { label: "Content quality & depth", section: "3. Content quality" },
  "programmatic-gate": { label: "Programmatic SEO quality gate", section: "4. Programmatic SEO quality gate" },
  "keyword-intent": { label: "Keyword intent", section: "5. Keyword intent" },
  cannibalization: { label: "Keyword cannibalization", section: "6. Keyword cannibalization" },
  "internal-links": { label: "Internal link audit", section: "7. Internal link audit" },
  schema: { label: "Structured data", section: "8. Structured data audit" },
  freshness: { label: "Freshness audit", section: "9. Freshness audit" },
  "opportunity-data": { label: "Opportunity data quality", section: "10. Opportunity data quality" },
  "aeo-geo": { label: "AEO / GEO readiness", section: "11. AEO/GEO check" },
  structure: { label: "Page structure", section: "12. Page structure audit" },
  url: { label: "URL hygiene", section: "13. URL audit" },
  media: { label: "Image & media", section: "14. Image/media audit" },
  performance: { label: "Mobile & performance", section: "15. Mobile/performance audit" },
  links: { label: "External link health", section: "16. Link audit" },
  security: { label: "Security & trust", section: "17. Security/trust check" },
};

export interface CheckResult {
  /** Stable identifier, e.g. "meta.title.length". */
  id: string;
  group: CheckGroup;
  severity: Severity;
  title: string;
  /** Human-readable evidence for this result (what was measured). */
  detail?: string;
  /** Concrete remediation when not a pass. */
  recommendation?: string;
}

export type PageType =
  | "home"
  | "hub"
  | "category"
  | "location"
  | "opportunity"
  | "organization"
  | "news"
  | "resource";

export type ProgrammaticDimension = Partial<{
  category: string;
  location: string;
  role: string;
}>;

export interface OpportunitySample {
  slug: string;
  title: string;
  category?: string | null;
  location?: string | null;
  deadline?: string | null;
  verification_status?: string | null;
  is_active?: boolean | null;
  stipend?: string | null;
  application_url?: string | null;
  description?: string | null;
  posted_at?: string | null;
  posted_date?: string | null;
  created_at?: string | null;
  last_link_checked?: string | null;
}

/**
 * Everything the engine knows about a single page. `provided` is false when
 * the loader had no data for a field — checks that need it are skipped and
 * reported as "not applicable" rather than fake-passed.
 */
export interface PageContext {
  url: string;
  path: string;
  pageType: PageType;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: Partial<{ index: boolean; follow: boolean; override: boolean }>;
  ogImage?: string;
  /** Full rendered-ish body text, when available. */
  contentText?: string;
  h1?: string;
  headings?: Record<string, number>;
  internalLinks?: number;
  externalLinks?: number;
  images?: { count: number; withAlt: number; local: boolean }[];
  declaredSchemas?: string[];
  lastModified?: string;
  /** Staleness in days when lastModified is set. */
  stalenessDays?: number;
  programmatic?: ProgrammaticDimension;
  /** Opportunity rows that render on this page (category/location/detail). */
  opportunities?: OpportunitySample[];
  data?: Record<string, unknown>;
}

export interface GateDecision {
  indexable: boolean;
  directive: "index,follow" | "noindex,follow" | "omit";
  activeVerifiedCount: number;
  threshold: number;
  reason: string;
}

export interface SeoPageReport {
  url: string;
  pageType: PageType;
  indexable: boolean;
  gate?: GateDecision;
  score: number;
  appliedChecks: number;
  skippedChecks: number;
  totalChecks: number;
  checks: CheckResult[];
  summary: Record<Severity, number>;
  generatedAt: string;
}

export interface CannibalizationCluster {
  key: string;
  count: number;
  urls: string[];
  sampleTokens: string[];
}

export interface GateViolation {
  url: string;
  kind: "sub-threshold-programmatic-page" | "indexable-metadata-for-gated-page";
  activeVerifiedCount: number;
  threshold: number;
  recommendation: string;
}

export interface SiteSeoSummary {
  generatedAt: string;
  siteUrl: string;
  auditedPages: number;
  indexablePages: number;
  gatedPages: number;
  averageScore: number;
  groupTotals: Record<CheckGroup, Record<Severity, number>>;
  scoreBuckets: { gte: number; lt: number | null; count: number }[];
  cannibalizationClusters: CannibalizationCluster[];
  gateViolations: GateViolation[];
  worstPages: { url: string; score: number; critical: number; warning: number; indexable: boolean }[];
}