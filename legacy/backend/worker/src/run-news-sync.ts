import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  NEWS_SOURCES,
  fetchAllNewsFeedResults,
  buildNewsArticleRows,
  upsertNewsArticles,
  type NewsSourceConfig,
  type NewsFeedResult,
} from "@berojgardegreewala/api/src/content/news-sync";

// Orchestrator for the news RSS workload (Phase 6.1). Runs as its own
// process (Render cron job) and performs the exact production write
// contract the frontend /api/news/sync uses: news_articles onConflict url.
// Persistence of run health (scrape_runs + scrape_sources) mirrors the
// frontend opportunity scraper's logging (6T).

export interface RunSummary {
  run_id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  total_fetched: number;
  total_parsed: number;
  total_accepted: number;
  total_inserted: number;
  total_duplicates: number;
  total_skipped: number;
  total_failed: number;
  sources: Array<Omit<NewsFeedResult, "articles">>;
}

export interface RunNewsSyncDeps {
  client?: SupabaseClient;
  sources?: NewsSourceConfig[];
  fetchAll?: (sources: NewsSourceConfig[]) => Promise<NewsFeedResult[]>;
}

// Best-effort health persistence (frontend mirrors this; failures there are
// logged silently, so the worker swallows them too — the news write already
// succeeded by this point and must not be rolled back by a logging hiccup).
async function persistRunHealth(
  client: SupabaseClient,
  sources: NewsSourceConfig[],
  results: NewsFeedResult[]
): Promise<void> {
  const srcByName = new Map(sources.map((s) => [s.name, s]));
  for (const r of results) {
    const src = srcByName.get(r.source);
    if (!src) continue;
    try {
      const now = new Date().toISOString();
      const { data: existing } = await client
        .from("scrape_sources")
        .select("id, consecutive_failures")
        .eq("name", r.source)
        .maybeSingle();
      const health: { last_success_at?: string; consecutive_failures: number; last_error: string | null } =
        r.failed === 0
          ? { last_success_at: now, consecutive_failures: 0, last_error: null }
          : { consecutive_failures: (existing?.consecutive_failures ?? 0) + 1, last_error: r.errors[0] ?? "feed fetch failed" };
      const payload: {
        name: string;
        url: string;
        adapter: string;
        category: string;
        is_active: boolean;
        last_scrape_at: string;
        last_success_at?: string;
        consecutive_failures: number;
        last_error: string | null;
      } = {
        name: r.source,
        url: src.url,
        adapter: "rss",
        category: "news",
        is_active: true,
        last_scrape_at: now,
        ...health,
      };
      // ponytail: scrape_sources.name has no unique key, so this is a
      // read-then-write instead of an onConflict upsert (same as frontend).
      let sourceId = existing?.id ?? null;
      if (existing?.id) {
        await client.from("scrape_sources").update(payload).eq("name", r.source);
      } else {
        const { data } = await client.from("scrape_sources").insert(payload).select("id").single();
        // insert returns the full row (fake/real both include id)
        sourceId ||= (data as { id?: string } | null)?.id ?? null;
      }
      const durationMs = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
      await client.from("scrape_runs").insert([
        {
          source_id: sourceId,
          status: r.failed === 0 ? "success" : "error",
          results_count: r.accepted,
          error: r.errors[0] ?? null,
          duration_ms: durationMs,
          started_at: r.started_at,
          completed_at: r.finished_at,
        },
      ]);
    } catch {
      // log silently, same as the frontend
    }
  }
}

export async function runNewsSync(deps: RunNewsSyncDeps = {}): Promise<RunSummary> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const sources = deps.sources ?? NEWS_SOURCES;

  const client =
    deps.client ??
    (() => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
      return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    })();

  const rawResults = await (deps.fetchAll ?? fetchAllNewsFeedResults)(sources);
  const { rows, results } = buildNewsArticleRows(rawResults);

  let totalInserted = 0;
  if (rows.length > 0) {
    const { inserted, error } = await upsertNewsArticles(client, rows);
    if (error) throw error; // abnormal: DB write failed — surface and exit non-zero
    totalInserted = inserted;
  }

  await persistRunHealth(client, sources, results);

  const totals = (key: "fetched" | "parsed" | "accepted" | "duplicates" | "skipped" | "failed") =>
    results.reduce((sum, r) => sum + r[key], 0);

  return {
    run_id: randomUUID(),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    total_fetched: totals("fetched"),
    total_parsed: totals("parsed"),
    total_accepted: totals("accepted"),
    total_inserted: totalInserted,
    total_duplicates: totals("duplicates"),
    total_skipped: totals("skipped"),
    total_failed: totals("failed"),
    sources: results.map(({ articles: _articles, ...rest }) => rest),
  };
}