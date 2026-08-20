import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NEWS_FETCH_CONCURRENCY,
  NEWS_RETRY_MAX,
  FeedFetchError,
  fetchAllNewsFeedResults,
  fetchNewsFeed,
  buildNewsArticleRows,
  upsertNewsArticles,
  isElectronicsNews,
  type NewsSourceConfig,
  type ParsedArticle,
} from "@berojgardegreewala/api/src/content/news-sync";
import { runNewsSync } from "../src/run-news-sync.js";

const SRC: NewsSourceConfig = { name: "Test Feed", url: "https://example.com/feed.rss", tags: ["electronics"], relevance_tier: 1 };

function item(url: string, title = "New chip fab announced in India", summary = "A semiconductor foundry and wafer fab story."): ParsedArticle {
  return {
    title,
    summary,
    source_name: SRC.name,
    url,
    published_at: "2026-08-01T00:00:00Z",
    image_url: null,
    tags: ["electronics"],
  };
}

// Minimal Postgrest-chain fake: supports exactly the calls the worker and
// the shared upsert make. Records every operation for assertions.
class Chain {
  lastResult: { data: unknown; error: unknown } = { data: null, error: null };
  constructor(private db: FakeDb, private table: string) {}
  select(): Chain { return this; }
  eq(col: string, val: unknown): Chain {
    this.db.eqValue = val;
    return this;
  }
  maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve({ data: this.db.existingSources.find((s) => s.name === this.db.eqValue) ?? null, error: null });
  }
  single(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve(this.lastResult);
  }
  insert(rows: unknown[]): Chain {
    this.db.ops.push({ kind: "insert", table: this.table, rows });
    this.lastResult = { data: rows[0], error: null };
    return this;
  }
  update(payload: unknown): Chain {
    this.db.ops.push({ kind: "update", table: this.table, payload });
    this.lastResult = { data: payload, error: null };
    return this;
  }
  upsert(rows: unknown[], opts?: unknown): Chain {
    this.db.ops.push({ kind: "upsert", table: this.table, rows, opts });
    this.lastResult = this.db.upsertResult;
    return this;
  }
  then<T>(res: (v: { data: unknown; error: unknown }) => T): Promise<T> {
    return Promise.resolve(this.lastResult).then(res);
  }
}

class FakeDb {
  ops: Array<{ kind: string; table: string; rows?: unknown[]; payload?: unknown; opts?: unknown }> = [];
  upsertResult: { data: unknown[] | null; error: unknown } = { data: [{ id: "n1" }], error: null };
  existingSources: Array<{ id: string; name: string; consecutive_failures: number }> = [];
  eqValue: unknown = null;

  from(table: string): Chain {
    return new Chain(this, table);
  }
}

// ---------- shared module scenarios ----------

test("valid feed: fetched/parsed counted and rows built", async () => {
  const result = await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1"), item("https://x.com/2")] });
  assert.equal(result.failed, 0);
  assert.equal(result.fetched, 2);
  assert.equal(result.parsed, 2);
  const { rows } = buildNewsArticleRows([result]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].url, "https://x.com/1");
  assert.equal(rows[0].is_active, true);
});

test("malformed feed: marked failed with error recorded (no retries needed)", async () => {
  const result = await fetchNewsFeed(SRC, {
    retries: 0,
    fetchFeed: async () => {
      throw new FeedFetchError("Invalid XML: junk at line 1", null);
    },
  });
  assert.equal(result.failed, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Invalid XML/);
});

test("timeout: marked failed with timeout message", async () => {
  const result = await fetchNewsFeed(SRC, {
    retries: 0,
    fetchFeed: async () => {
      throw new FeedFetchError("timeout of 6000ms exceeded", null);
    },
  });
  assert.equal(result.failed, 1);
  assert.match(result.errors[0], /timeout/);
});

test("HTTP 500: retried, then failed; retry succeeded after transient 500", async () => {
  let calls = 0;
  const flaky = async () => {
    calls++;
    if (calls < 3) throw new FeedFetchError("Status code 500", 500);
    return [item("https://x.com/1")];
  };
  const ok = await fetchNewsFeed(SRC, { fetchFeed: flaky, backoffMs: 1 });
  assert.equal(ok.failed, 0);
  assert.equal(calls, 3, "1 initial + 2 retries");
  assert.equal(ok.fetched, 1);

  let alwaysFail = 0;
  const exhausted = await fetchNewsFeed(SRC, {
    retries: 0,
    fetchFeed: async () => {
      alwaysFail++;
      throw new FeedFetchError("Status code 500", 500);
    },
  });
  assert.equal(exhausted.failed, 1);
  assert.equal(alwaysFail, 1);
});

test("non-retryable 404: fails immediately without retries", async () => {
  let calls = 0;
  const result = await fetchNewsFeed(SRC, {
    fetchFeed: async () => {
      calls++;
      throw new FeedFetchError("Status code 404", 404);
    },
  });
  assert.equal(result.failed, 1);
  assert.equal(calls, 1);
});

test("duplicate url within a run: one row, duplicates counted (case-insensitive)", async () => {
  const r1 = await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1"), item("HTTPS://X.COM/1")] });
  const { rows, results } = buildNewsArticleRows([r1]);
  assert.equal(rows.length, 1);
  assert.equal(results[0].duplicates, 1);
  assert.equal(results[0].accepted, 1);
});

test("invalid url (empty/null): skipped, never written", async () => {
  const r1 = await fetchNewsFeed(SRC, { fetchFeed: async () => [item("  "), item("https://ok.com/1"), item("https://ok.com/2")] });
  const { rows, results } = buildNewsArticleRows([r1]);
  assert.equal(rows.length, 2);
  assert.equal(results[0].skipped, 1);
  assert.ok(rows.every((r) => r.url.startsWith("https://")));
});

test("irrelevant article: rejected by the relevance filter", () => {
  assert.equal(isElectronicsNews("Gardening tips for beginners", "How to grow tomatoes in pots", 1), false);
  assert.equal(isElectronicsNews("India launches new semiconductor fab", "A chip foundry in Gujarat", 1), true);
  // tier 2 requires two keyword hits
  assert.equal(isElectronicsNews("Silicon valley", "chip gossip", 2), true);
  assert.equal(isElectronicsNews("Silicon valley", "gossip", 2), false);
});

test("slug collision: both rows kept (url is the identity, slug is not unique)", async () => {
  const r1 = await fetchNewsFeed(SRC, {
    fetchFeed: async () => [item("https://x.com/1", "Chip News 2026"), item("https://x.com/2", "Chip News 2026")],
  });
  const { rows } = buildNewsArticleRows([r1]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].slug, rows[1].slug);
});

test("db failure: upsert returns the error, nothing claimed inserted", async () => {
  const db = new FakeDb();
  db.upsertResult = { data: null, error: new Error("relation news_articles does not exist") };
  const r1 = await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1")] });
  const { rows } = buildNewsArticleRows([r1]);
  const { inserted, error } = await upsertNewsArticles(db as any, rows);
  assert.equal(inserted, 0);
  assert.ok(error instanceof Error);
  const call = db.ops.find((o) => o.kind === "upsert");
  assert.equal(call?.table, "news_articles");
  assert.deepEqual(call?.opts, { onConflict: "url", ignoreDuplicates: true });
});

test("one feed fails: others still processed, concurrency stays bounded", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const sources: NewsSourceConfig[] = [
    { ...SRC, name: "Broken Feed" },
    { ...SRC, name: "Good Feed A" },
    { ...SRC, name: "Good Feed B" },
  ];
  const results = await fetchAllNewsFeedResults(sources, {
    retries: 0,
    concurrency: 2,
    fetchFeed: async (s) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      if (s.name === "Broken Feed") throw new FeedFetchError("Status code 500", 500);
      return [item(`https://x.com/${s.name}`)];
    },
  });
  assert.equal(maxInFlight, 2, "bounded by the concurrency option");
  assert.equal(results.filter((r) => r.failed).length, 1);
  assert.equal(results.filter((r) => !r.failed).length, 2);
  const { rows } = buildNewsArticleRows(results);
  assert.equal(rows.length, 2);
});

test("idempotency contract: same run twice upserts the same urls (DB dedups)", async () => {
  const db1 = new FakeDb();
  const db2 = new FakeDb();
  const r1 = await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1"), item("https://x.com/2")] });
  const { rows } = buildNewsArticleRows([r1]);
  await upsertNewsArticles(db1 as any, rows);
  await upsertNewsArticles(db2 as any, rows);
  const urls = (ops: Array<{ rows?: unknown[] }>) => (ops[0]?.rows as Array<{ url: string }>).map((r) => r.url);
  assert.deepEqual(urls(db1.ops), urls(db2.ops));
  assert.equal(urls(db1.ops).length, 2);
});

// ---------- orchestrator scenarios ----------

test("orchestrator: all feeds fail -> zero rows, zero upserts, health logged as error", async () => {
  const db = new FakeDb();
  const summary = await runNewsSync({
    client: db as any,
    sources: [SRC],
    fetchAll: async () => [
      await fetchNewsFeed(SRC, { retries: 0, fetchFeed: async () => { throw new FeedFetchError("boom", null); } }),
    ],
  });
  assert.equal(summary.total_failed, 1);
  assert.equal(summary.total_accepted, 0);
  assert.equal(summary.total_inserted, 0);
  assert.ok(!db.ops.some((o) => o.kind === "upsert"), "no news_articles upsert when nothing accepted");
  assert.equal(db.ops.filter((o) => o.kind === "insert" && o.table === "scrape_runs").length, 1, "one scrape_runs row for the failed feed");
  assert.equal((db.ops.find((o) => o.kind === "insert" && o.table === "scrape_runs")?.rows as Array<{ status: string }>)[0].status, "error");
});

test("orchestrator: happy path persists scrape_runs + scrape_sources and returns structured summary", async () => {
  const db = new FakeDb();
  const summary = await runNewsSync({
    client: db as any,
    sources: [SRC],
    fetchAll: async () => [
      await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1")] }),
    ],
  });
  assert.equal(summary.total_inserted, 1);
  assert.equal(summary.total_accepted, 1);
  assert.equal(summary.sources[0].source, SRC.name);
  assert.ok(!("articles" in summary.sources[0]), "articles stripped from the output contract");
  assert.equal(db.ops.find((o) => o.kind === "upsert")?.table, "news_articles");
  assert.ok(db.ops.some((o) => o.kind === "insert" && o.table === "scrape_runs"));
  assert.ok(db.ops.some((o) => o.kind === "insert" && o.table === "scrape_sources"));
});

test("orchestrator: db write failure propagates (exit non-zero path)", async () => {
  const db = new FakeDb();
  db.upsertResult = { data: null, error: new Error("connection reset") };
  await assert.rejects(
    runNewsSync({
      client: db as any,
      fetchAll: async () => [
        await fetchNewsFeed(SRC, { fetchFeed: async () => [item("https://x.com/1")] }),
      ],
    }),
    /connection reset/
  );
});

test("orchestrator: existing source keeps its id and failure bumps consecutive_failures", async () => {
  const db = new FakeDb();
  db.existingSources = [{ id: "src-1", name: SRC.name, consecutive_failures: 2 }];
  await runNewsSync({
    client: db as any,
    sources: [SRC],
    fetchAll: async () => [
      await fetchNewsFeed(SRC, { retries: 0, fetchFeed: async () => { throw new FeedFetchError("down", null); } }),
    ],
  });
  const update = db.ops.find((o) => o.kind === "update" && o.table === "scrape_sources") as { payload: any };
  assert.equal(update.payload.consecutive_failures, 3);
  assert.equal(update.payload.last_error, "down");
  const run = db.ops.find((o) => o.kind === "insert" && o.table === "scrape_runs") as { rows: any[] };
  assert.equal(run.rows[0].source_id, "src-1");
});

test("module defaults: concurrency 4 and 2 retries are exported for ops visibility", () => {
  assert.equal(NEWS_FETCH_CONCURRENCY, 4);
  assert.equal(NEWS_RETRY_MAX, 2);
});