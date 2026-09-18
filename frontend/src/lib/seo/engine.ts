/**
 * BDW SEO audit engine — pure orchestration.
 *
 * Takes an AuditDataset (from data-loader, or built directly in tests / by the
 * CLI) and produces: per-page SeoPageReport[], cannibalization clusters, gate
 * violations, and a SiteSeoSummary. The engine never touches the network or
 * the database — everything data-driven comes in through the dataset and the
 * settings overrides.
 */

import { CHECK_GROUPS, SEVERITIES, type CannibalizationCluster, type CheckResult, type CheckGroup, type GateDecision, type PageContext, type SeoPageReport, type Severity, type SiteSeoSummary } from "./types";
import { REGISTRY_STATIC, buildProgrammaticPages, pathFromUrl, SITE_URL, categoryUrl, locationUrl, organizationUrl, newsUrl, opportunityUrl } from "./registry";
import { evaluateProgrammaticGate } from "./gate";
import { applicableChecks, ALL_CHECKS } from "./checks";
import type { AuditDataset } from "./data-loader";
import { programmaticCountKey } from "./data-loader";
import { computeScore, summarizeSeverities } from "./score";
import { classifyIntent } from "./keyword-intent";
import { findCannibalizationClusters, tokenizeForCluster, type PageTokens } from "./cannibalization";
import type { OpportunitySample } from "./types";

export interface EngineSettings {
  now?: Date;
  /** URL -> synthesized body copy (from page modules when available). */
  content?: Record<string, string>;
  /** URL -> accurate title override (from page metadata modules). */
  titles?: Record<string, string>;
  h1?: Record<string, string>;
  headings?: Record<string, Record<string, number>>;
  /** URL -> real lastmod override. */
  lastModified?: Record<string, string>;
}

function daysBetween(iso: string, now: Date): number {
  try {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return 0;
    return Math.max(0, Math.floor((now.getTime() - t) / 86400000));
  } catch {
    return 0;
  }
}

function humanizeProgrammaticTitle(dim: { category?: string; location?: string; role?: string }): string {
  const label = dim.category || dim.location || dim.role || "page";
  return label
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface BuildContextOptions {
  url: string;
  pageType: PageContext["pageType"];
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  contentText?: string | null;
  declaredSchemas?: string[];
  programmatic?: PageContext["programmatic"];
  opportunities?: OpportunitySample[];
  lastModified?: string | null;
  robots?: PageContext["robots"];
  h1?: string | null;
  headings?: Record<string, number>;
}

export function buildContext(opts: BuildContextOptions, settings: EngineSettings, now: Date): PageContext {
  const url = opts.url;
  const path = pathFromUrl(url);

  let contentText: string | undefined = opts.contentText ?? undefined;
  if (contentText === undefined && settings.content?.[url]) contentText = settings.content[url];

  let lastModified: string | undefined = opts.lastModified ?? undefined;
  if (settings.lastModified?.[url]) lastModified = settings.lastModified[url];

  const title = settings.titles?.[url] ?? opts.title ?? undefined;
  const h1 = settings.h1?.[url] ?? opts.h1 ?? undefined;

  return {
    url,
    path,
    pageType: opts.pageType,
    title,
    description: opts.description ?? undefined,
    canonical: opts.canonical ?? url,
    robots: opts.robots ?? { index: true, follow: true },
    ogImage: "/api/og",
    contentText,
    h1,
    headings: opts.headings ?? settings.headings?.[url],
    declaredSchemas: opts.declaredSchemas,
    programmatic: opts.programmatic,
    opportunities: opts.opportunities,
    lastModified,
    stalenessDays: lastModified ? daysBetween(lastModified, now) : undefined,
    data: {},
  };
}

export function auditPage(
  ctx: PageContext,
  hints: { gate?: GateDecision; cannibalization?: CannibalizationCluster[]; duplicateDescriptions?: string[]; sitemapUrls?: Set<string> } = {},
  now: Date = new Date()
): SeoPageReport {
  const applicable = applicableChecks(ctx);
  const results: CheckResult[] = [];

  const intent = classifyIntent(ctx.title, ctx.description);

  let gate = hints.gate;
  if (!gate && ctx.programmatic) {
    // No gate supplied — treat as absent (caller must supply counts in audits).
    gate = undefined;
  }

  const engineHints = {
    gate,
    intent,
    cannibalizationClusters: hints.cannibalization,
    duplicateDescriptions: hints.duplicateDescriptions,
    sitemapUrls: hints.sitemapUrls,
  };

  for (const def of applicable) {
    try {
      results.push(def.run(ctx, engineHints, now));
    } catch (err) {
      results.push({
        id: def.id,
        group: def.group,
        severity: "critical",
        title: `Check failed to run (${def.id})`,
        detail: String(err),
        recommendation: "Investigate the check implementation.",
      });
    }
  }

  return {
    url: ctx.url,
    pageType: ctx.pageType,
    indexable: gate ? gate.indexable : true,
    gate,
    score: computeScore(results),
    appliedChecks: results.length,
    skippedChecks: ALL_CHECKS.length - results.length,
    totalChecks: ALL_CHECKS.length,
    checks: results,
    summary: summarizeSeverities(results),
    generatedAt: now.toISOString(),
  };
}

export interface SiteAuditResult {
  reports: SeoPageReport[];
  summary: SiteSeoSummary;
  cannibalizationClusters: CannibalizationCluster[];
  gateViolations: SeoPageReport[];
}

export function runSiteAudit(dataset: AuditDataset, settings: EngineSettings = {}): SiteAuditResult {
  const now = settings.now ?? new Date();

  const descriptors: BuildContextOptions[] = [];

  // Static registry (home / hubs / resources).
  for (const page of REGISTRY_STATIC) {
    descriptors.push({
      url: page.url,
      pageType: page.pageType,
      title: page.title,
      canonical: page.url,
      declaredSchemas: page.declaredSchemas,
      robots: { index: true, follow: true },
    });
  }

  // Programmatic pages (categories + locations; roles when present).
  for (const page of buildProgrammaticPages()) {
    const dim = page.programmatic as { category?: string; location?: string; role?: string };
    const key = programmaticCountKey({ category: dim.category, location: dim.location, role: dim.role });
    const count = dataset.counts[key] ?? 0;
    const gate = evaluateProgrammaticGate(page.programmatic, count);
    const title = settings.titles?.[page.url] ?? humanizeProgrammaticTitle(dim);
    descriptors.push({
      url: page.url,
      pageType: page.pageType,
      title,
      canonical: page.url,
      declaredSchemas: page.declaredSchemas,
      programmatic: page.programmatic,
      robots: gate
        ? { index: gate.indexable, follow: true }
        : { index: true, follow: true },
      opportunities: [],
    });
  }

  // Dynamic opportunity detail pages (sampled).
  for (const opp of dataset.opportunities) {
    if (!opp.slug) continue;
    const url = opportunityUrl(opp.slug);
    descriptors.push({
      url,
      pageType: "opportunity",
      title: opp.title,
      description: opp.description,
      contentText: opp.description,
      canonical: url,
      opportunities: [opp],
      lastModified: opp.last_link_checked || opp.created_at || opp.posted_at || opp.posted_date || undefined,
    });
  }

  // Organization pages (sampled).
  for (const org of dataset.organizations) {
    if (!org.slug) continue;
    const url = organizationUrl(org.slug);
    descriptors.push({
      url,
      pageType: "organization",
      title: org.name || org.slug,
      description: org.description,
      contentText: org.description,
      canonical: url,
      lastModified: org.created_at || undefined,
    });
  }

  // News pages (sampled).
  for (const article of dataset.news) {
    if (!article.slug) continue;
    const url = newsUrl(article.slug);
    descriptors.push({
      url,
      pageType: "news",
      title: article.title,
      canonical: url,
      lastModified: article.published_at || undefined,
    });
  }

  // Cannibalization clusters over all pages that have a title.
  const pageTokens: PageTokens[] = descriptors
    .filter((d) => d.title)
    .map((d) => ({ url: d.url, title: d.title!, tokens: tokenizeForCluster(d.title!) }));
  const clusters = findCannibalizationClusters(pageTokens);

  // Duplicate description groups.
  const descGroups = new Map<string, string[]>();
  for (const d of descriptors) {
    if (d.description && d.description.trim().length > 0) {
      const key = d.description.trim().toLowerCase();
      const list = descGroups.get(key) || [];
      list.push(d.url);
      descGroups.set(key, list);
    }
  }

  // Sitemap-reachable set (as enforced by the gate).
  const sitemapUrls = new Set<string>();
  for (const d of descriptors) {
    if (d.programmatic) {
      const key = programmaticCountKey({ category: d.programmatic.category, location: d.programmatic.location, role: d.programmatic.role });
      if ((dataset.counts[key] ?? 0) >= 3) sitemapUrls.add(d.url);
    } else {
      sitemapUrls.add(d.url);
    }
  }

  const reports: SeoPageReport[] = [];
  const gateViolationReports: SeoPageReport[] = [];
  const duplicateUrls = [...descGroups.values()].filter((l) => l.length > 1).flat();

  for (const d of descriptors) {
    const ctx = buildContext(d, settings, now);
    let gate: GateDecision | undefined;
    if (ctx.programmatic) {
      const key = programmaticCountKey(ctx.programmatic);
      const count = dataset.counts[key] ?? 0;
      gate = evaluateProgrammaticGate(ctx.programmatic, count);
      ctx.robots = { index: gate ? gate.indexable : true, follow: true };
    }
    const report = auditPage(ctx, { gate, cannibalization: clusters, duplicateDescriptions: duplicateUrls, sitemapUrls }, now);
    reports.push(report);
    if (gate && !gate.indexable) gateViolationReports.push(report);
  }

  const summary: SiteSeoSummary = {
    generatedAt: now.toISOString(),
    siteUrl: SITE_URL,
    auditedPages: reports.length,
    indexablePages: reports.filter((r) => r.indexable).length,
    gatedPages: reports.filter((r) => !r.indexable).length,
    averageScore: reports.length ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 0,
    groupTotals: buildGroupTotals(reports),
    scoreBuckets: [
      { gte: 90, lt: null, count: 0 },
      { gte: 75, lt: 90, count: 0 },
      { gte: 50, lt: 75, count: 0 },
      { gte: 0, lt: 50, count: 0 },
    ].map((b) => ({ ...b, count: reports.filter((r) => r.score >= b.gte && (b.lt === null || r.score < b.lt)).length })),
    cannibalizationClusters: clusters,
    gateViolations: gateViolationReports.map((r) => ({
      url: r.url,
      kind: "sub-threshold-programmatic-page" as const,
      activeVerifiedCount: r.gate?.activeVerifiedCount ?? 0,
      threshold: r.gate?.threshold ?? 3,
      recommendation: "Add active verified opportunities until the combination passes the threshold; keep noindex,follow / omit from sitemap meanwhile.",
    })),
    worstPages: [...reports]
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
      .map((r) => ({ url: r.url, score: r.score, critical: r.summary.critical, warning: r.summary.warning, indexable: r.indexable })),
  };

  return { reports, summary, cannibalizationClusters: clusters, gateViolations: gateViolationReports };
}

export function countForDimension(dataset: AuditDataset, dim: { category?: string; location?: string; role?: string }): number {
  return dataset.counts[programmaticCountKey(dim)] ?? 0;
}

export function gateForDimension(dataset: AuditDataset, dim: { category?: string; location?: string; role?: string }): GateDecision | undefined {
  return evaluateProgrammaticGate(dim as PageContext["programmatic"], countForDimension(dataset, dim));
}

export function isDimensionIndexable(dataset: AuditDataset, dim: { category?: string; location?: string; role?: string }): boolean {
  return gateForDimension(dataset, dim)?.indexable ?? true;
}

function buildGroupTotals(reports: SeoPageReport[]): Record<CheckGroup, Record<Severity, number>> {
  const totals = {} as Record<CheckGroup, Record<Severity, number>>;
  for (const g of CHECK_GROUPS) {
    totals[g] = { critical: 0, warning: 0, improvement: 0, pass: 0 } as Record<Severity, number>;
  }
  for (const report of reports) {
    for (const c of report.checks) {
      totals[c.group][c.severity] += 1;
    }
  }
  return totals;
}

// Deterministic sample ordering + explicit severity export for UI reuse.
export { SEVERITIES };
export type { GateDecision, CheckGroup };