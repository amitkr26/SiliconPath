/**
 * Data loader — the ONLY module in lib/seo that touches Supabase.
 * The engine itself stays pure: callers (API route, sitemap, CLI) hand it an
 * AuditDataset. When the database is unconfigured the loader returns an empty
 * dataset and the engine audits the static registry only.
 */

import { supabaseAdmin, isAdminConfigured } from "../supabase-admin";
import {
  computeIstToday,
  isCurrentlyAvailable,
  buildAvailabilityDbFilter,
} from "../availability";
import type { OpportunitySample, ProgrammaticDimension } from "./types";
import { CATEGORY_SLUGS, LOCATION_SLUGS } from "./registry";

export interface AuditDataset {
  /** Active + verified rows that pass the strict availability rule, sampled. */
  opportunities: OpportunitySample[];
  organizations: { slug: string; name?: string | null; description?: string | null; created_at?: string | null }[];
  news: { slug: string; title?: string | null; published_at?: string | null }[];
  /** Exact counts per programmatic combination (0 when DB unconfigured). */
  counts: Record<string, number>;
  quality: {
    totalActive: number;
    missingDeadline: number;
    missingStipend: number;
    missingLink: number;
    missingDescription: number;
    pending: number;
  };
}

export const EMPTY_DATASET: AuditDataset = {
  opportunities: [],
  organizations: [],
  news: [],
  counts: {},
  quality: { totalActive: 0, missingDeadline: 0, missingStipend: 0, missingLink: 0, missingDescription: 0, pending: 0 },
};

interface AuditSettings {
  maxOpportunities?: number;
  maxOrganizations?: number;
  maxNews?: number;
}

/** db category value -> canonical category slug (mirror of category page CAT_DB_MAP). */
function categoryToSlug(dbCategory?: string | null): string | null {
  if (!dbCategory) return null;
  const c = dbCategory.trim().toLowerCase();
  if (c.includes("jrf")) return "jrf";
  if (c.includes("srf")) return "srf";
  if (c.includes("phd")) return "phd";
  if (c.includes("fellowship") || c.includes("research fellow")) return "fellowship";
  if (c.includes("government") || c.includes("govt") || c.includes("scientist")) return "govt-job";
  if (c.includes("job") || c.includes("industry") || c.includes("private")) return "private";
  if (c.includes("international")) return "international";
  return c;
}

function displayCity(slug: string): string[] {
  const map: Record<string, string[]> = {
    bengaluru: ["bengaluru", "bangalore"],
    hyderabad: ["hyderabad"],
    noida: ["noida", "greater noida"],
    pune: ["pune"],
    chennai: ["chennai", "madras"],
    ahmedabad: ["ahmedabad", "gandhinagar"],
  };
  return map[slug.toLowerCase()] || [slug];
}

export function countsFromAvailable(available: OpportunitySample[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slug of CATEGORY_SLUGS) {
    counts[programmaticCountKey({ category: slug })] = available.filter((r) => categoryToSlug(r.category) === slug).length;
  }
  for (const slug of LOCATION_SLUGS) {
    const aliases = displayCity(slug);
    counts[programmaticCountKey({ location: slug })] = available.filter((r) =>
      aliases.some((a) => (r.location || "").toLowerCase().includes(a))
    ).length;
  }
  return counts;
}

export function programmaticCountKey(dim: ProgrammaticDimension): string {
  const parts = [dim.role && `role:${dim.role}`, dim.category && `cat:${dim.category}`, dim.location && `loc:${dim.location}`];
  return parts.filter(Boolean).join("|");
}

export async function loadAuditDataset(settings: AuditSettings = {}): Promise<AuditDataset> {
  if (!isAdminConfigured || !supabaseAdmin?.from) return { ...EMPTY_DATASET };

  const {
    maxOpportunities = 60,
    maxOrganizations = 50,
    maxNews = 50,
  } = settings;

  try {
    const today = computeIstToday();

    // Verified + active rows drive availability counts AND programmatic gates.
    const { data: activeVerified } = await supabaseAdmin
      .from("opportunities")
      .select(
        "slug,title,category,location,description,stipend,application_url,deadline,verification_status,is_active,posted_at,posted_date,created_at,last_link_checked"
      )
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .limit(3000);

    const rows: OpportunitySample[] = (activeVerified || []) as OpportunitySample[];

    const available = rows.filter((r) => isCurrentlyAvailable(r, today));
    const byCreated = [...available].sort((a, b) =>
      ((b.created_at || "") > (a.created_at || "") ? 1 : -1)
    );

    // Per-combination counts (exact availability semantics).
    const counts = countsFromAvailable(available);

    // Data-quality tally over ALL active rows (not only verified), bounded.
    const { data: activeRows } = await supabaseAdmin
      .from("opportunities")
      .select("id,category,deadline,stipend,application_url,description,verification_status")
      .eq("is_active", true)
      .limit(500);

    const quality = { totalActive: activeRows?.length || 0, missingDeadline: 0, missingStipend: 0, missingLink: 0, missingDescription: 0, pending: 0 };
    for (const r of activeRows || []) {
      const cat = (r as { category?: string | null }).category || null;
      const deadlineBased = cat ? !["industry", "private", "job", "international"].includes(cat.toLowerCase().trim()) : true;
      if (deadlineBased && !(r as { deadline?: string | null }).deadline) quality.missingDeadline += 1;
      if (!(r as { stipend?: string | null }).stipend) quality.missingStipend += 1;
      if (!(r as { application_url?: string | null }).application_url) quality.missingLink += 1;
      const desc = (r as { description?: string | null }).description;
      if (!desc || desc.length < 60) quality.missingDescription += 1;
      if ((r as { verification_status?: string | null }).verification_status === "pending") quality.pending += 1;
    }

    const [organizations, news] = await Promise.all([
      supabaseAdmin
        .from("organizations")
        .select("slug,name,description,created_at")
        .limit(maxOrganizations)
        .then((res: { data: unknown }) => (res.data || []) as AuditDataset["organizations"]),
      supabaseAdmin
        .from("news_articles")
        .select("slug,title,published_at")
        .not("slug", "is", null)
        .limit(maxNews)
        .then((res: { data: unknown }) => (res.data || []) as AuditDataset["news"]),
    ]);

    return {
      opportunities: byCreated.slice(0, maxOpportunities),
      organizations,
      news,
      counts,
      quality,
    };
  } catch (err) {
    console.error("[SEO data-loader error]", err);
    return { ...EMPTY_DATASET };
  }
}

// Re-exported for parity with the sitemap's existing availability filter use.
export { computeIstToday, buildAvailabilityDbFilter };

/**
 * Counts only — used by sitemap.xml and generateMetadata so the programmatic
 * quality gate can be enforced there (fail closed when the DB is down).
 */
export async function loadProgrammaticCounts(): Promise<Record<string, number>> {
  if (!isAdminConfigured || !supabaseAdmin?.from) return {};
  try {
    const { data: activeVerified } = await supabaseAdmin
      .from("opportunities")
      .select(
        "category,location,deadline,verification_status,is_active,posted_at,posted_date,created_at,last_link_checked"
      )
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .limit(3000);
    const rows = ((activeVerified || []) as OpportunitySample[]).filter((r) =>
      isCurrentlyAvailable(r, computeIstToday())
    );
    return countsFromAvailable(rows);
  } catch (err) {
    console.error("[SEO loadProgrammaticCounts error]", err);
    return {};
  }
}

/** Count for a single programmatic dimension (0 when unknown). */
export async function countProgrammatic(dim: ProgrammaticDimension): Promise<number> {
  const counts = await loadProgrammaticCounts();
  return counts[programmaticCountKey(dim)] ?? 0;
}