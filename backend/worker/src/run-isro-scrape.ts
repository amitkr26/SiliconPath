/**
 * ISRO opportunity scrape pipeline (Phase 8) — backend replica of the
 * production frontend flow in
 * `frontend/src/lib/scrapers/run-opportunity-scrape.ts` (mandate §36,
 * §37/§38 lifecycle).
 *
 * Kept identical to production: evidence-gated org resolution (P0.3, never
 * blind org creation), dedup on source_url (original + normalized) AND on
 * title (case-insensitive), slug-collision suffixing, legacy category mapping
 * to the live CHECK values, deadline → YYYY-MM-DD, `source_type=scraped`,
 * `verification_status` starts UNVERIFIED — never fabricated.
 *
 * One intentional divergence (documented in KNOWN_ISSUES #16): the live
 * `opportunities.verification_status` CHECK constraint accepts
 * `pending/verified/rejected/expired/link_unavailable` — NOT `unverified`.
 * The production Vercel cron has been silently inserting ZERO rows since the
 * constraint landed (max(created_at) across the whole table = 2026-08-02).
 * The replica writes the valid `pending` value, which is the only status that
 * passes the constraint, so it is the only currently-working ingestion path.
 *
 * Health persistence mirrors the news worker (`run-news-sync.ts`) with the
 * REAL scrape_sources id (the frontend passes the source NAME as
 * scrape_runs.source_id, a uuid column — that insert also fails silently).
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  cleanTitle,
  slugify,
  normalizeUrl,
  GARBAGE_TITLE_PATTERNS,
  normalizeCategory,
  toDeadlineDate,
  type ScrapedOpportunity,
} from "./scrapers/opportunity-utils.js";
import { resolveOrganization, type OrgRow } from "./scrapers/org-resolve.js";
import { ISRO_URL, scrapeISRO } from "./scrapers/isro.js";

export const ISRO_SOURCE_NAME = "ISRO";

export interface RunIsroSummary {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  source: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  skipped: number;
}

export interface RunIsroDeps {
  client?: SupabaseClient;
  fetchHtml?: () => Promise<string>;
  now?: () => Date;
}

/** P0.3 evidence-gated org resolution + creation — same rules as the frontend. */
async function resolveOrganizationId(
  client: SupabaseClient,
  opp: Pick<ScrapedOpportunity, "apply_link" | "source_url" | "title" | "organization" | "tags">,
  orgList: OrgRow[]
): Promise<string | null> {
  const resolved = resolveOrganization({
    sourceUrl: opp.apply_link || opp.source_url,
    title: opp.title,
    name: opp.organization,
    organizations: orgList,
  });
  if (resolved.organizationId) return resolved.organizationId;
  if (!resolved.name || resolved.confidence === "none") return null;
  const orgSlug = slugify(resolved.name) || resolved.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80);
  const orgType =
    opp.tags?.includes("government") || ["ISRO", "DRDO", "CSIR"].includes(resolved.name)
      ? "government"
      : opp.tags?.includes("academic") || resolved.name.includes("IIT") || resolved.name.includes("NIT")
        ? "academic"
        : "private";
  const { data: newOrg } = await client
    .from("organizations")
    .insert([{ name: resolved.name, slug: orgSlug, type: orgType }])
    .select("id")
    .single();
  return newOrg?.id ?? null;
}

export async function runIsroScrape(deps: RunIsroDeps = {}): Promise<RunIsroSummary> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const now = deps.now ?? (() => new Date());

  const client =
    deps.client ??
    (() => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
      return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    })();

  // Fetch + parse (throws on transport failure → worker exits non-zero).
  const rows = await scrapeISRO({ fetchHtml: deps.fetchHtml });

  // P0.3: org table loaded once per run; resolution is evidence-gated.
  const { data: orgRows } = await client
    .from("organizations")
    .select("id, name, slug, website");
  const orgList: OrgRow[] = orgRows ?? [];

  let inserted = 0;
  let duplicates = 0;
  let skipped = 0;

  for (const opp of rows) {
    if (!opp.source_url) {
      skipped++;
      continue;
    }
    const cleanedTitle = cleanTitle(opp.title, opp.organization);
    const normalizedUrl = normalizeUrl(opp.source_url);

    // Filter out obvious navigation or non-job garbage titles
    if (
      cleanedTitle.length < 10 ||
      GARBAGE_TITLE_PATTERNS.test(cleanedTitle) ||
      GARBAGE_TITLE_PATTERNS.test(opp.title)
    ) {
      skipped++;
      continue;
    }

    const { data: existingUrlRows } = await client
      .from("opportunities")
      .select("id")
      .in("source_url", [opp.source_url, normalizedUrl].filter(Boolean))
      .limit(1);
    const existingUrl = existingUrlRows?.[0];

    const { data: existingTitle } = await client
      .from("opportunities")
      .select("id")
      .ilike("title", cleanedTitle)
      .maybeSingle();

    if (existingUrl || existingTitle) {
      duplicates++;
      continue;
    }

    const orgId = await resolveOrganizationId(client, opp, orgList);

    const normalizedCategory = normalizeCategory(opp.category);

    // Generate slug from title (required NOT NULL UNIQUE in live schema)
    let oppSlug = slugify(cleanedTitle);
    if (!oppSlug) oppSlug = `opportunity-${Date.now()}`;
    const { data: existingSlug } = await client
      .from("opportunities")
      .select("id")
      .eq("slug", oppSlug)
      .maybeSingle();
    if (existingSlug) oppSlug = `${oppSlug}-${Date.now()}`;

    const deadlineDate = toDeadlineDate(opp.deadline);

    // Live schema: apply_url (NOT NULL), salary_range, organization_id —
    // no apply_link, no stipend, no organization (text). verification_status
    // = "pending": the only value the live CHECK accepts for a fresh scrape
    // (frontend writes "unverified" → constraint violation → silent no-op).
    const { data: oppData, error: oppError } = await client
      .from("opportunities")
      .insert([
        {
          title: cleanedTitle,
          slug: oppSlug,
          organization_id: orgId,
          category: normalizedCategory,
          location: opp.location,
          salary_range: opp.stipend,
          deadline: deadlineDate,
          eligibility: opp.eligibility,
          description: opp.description,
          apply_url: opp.apply_link || normalizedUrl,
          source_url: normalizedUrl,
          tags: opp.tags,
          verification_status: "pending",
          is_active: true,
          source_type: "scraped",
        },
      ])
      .select("id, source_url, title")
      .single();

    if (!oppError && oppData) {
      inserted++;
    } else {
      if (oppError) console.error("opportunities insert error:", oppError.message);
      skipped++;
    }
  }

  // Best-effort run-health persistence (same tables/pattern as the news
  // worker; failures logged silently — the insert already succeeded).
  try {
    const nowIso = now().toISOString();
    const { data: existing } = await client
      .from("scrape_sources")
      .select("id, consecutive_failures, total_runs, total_results")
      .eq("name", ISRO_SOURCE_NAME)
      .maybeSingle();
    let sourceId = existing?.id ?? null;
    if (existing?.id) {
      await client
        .from("scrape_sources")
        .update({
          last_scrape_at: nowIso,
          last_success_at: nowIso,
          consecutive_failures: 0,
          last_error: null,
          total_runs: (existing?.total_runs ?? 0) + 1,
          total_results: (existing?.total_results ?? 0) + rows.length,
        })
        .eq("name", ISRO_SOURCE_NAME);
    } else {
      const { data: created } = await client
        .from("scrape_sources")
        .insert([
          {
            name: ISRO_SOURCE_NAME,
            url: ISRO_URL,
            adapter: "html",
            category: "opportunity",
            is_active: true,
            last_scrape_at: nowIso,
            last_success_at: nowIso,
            consecutive_failures: 0,
            last_error: null,
            total_runs: 1,
            total_results: rows.length,
          },
        ])
        .select("id")
        .single();
      sourceId = created?.id ?? null;
    }
    await client.from("scrape_runs").insert([
      {
        source_id: sourceId,
        status: "success",
        results_count: rows.length,
        error: null,
        duration_ms: Date.now() - started,
        started_at: startedAt,
        completed_at: nowIso,
      },
    ]);
  } catch {
    // log silently, same as the frontend + news worker
  }

  return {
    run_id: randomUUID(),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    source: ISRO_SOURCE_NAME,
    fetched: rows.length,
    inserted,
    duplicates,
    skipped,
  };
}