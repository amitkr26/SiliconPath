// Content quality library (CONTENT_UPGRADE_PLAN.md).
// Pure, framework-free modules shared by the Next.js ingest/API routes and the
// standalone Express backend. No DB access, no side effects — unit-testable.
// news-sync is the exception: feed fetch + news_articles upsert shared by the
// backend cron route and the Phase 6 worker (its DB access is injectable).

export * from "./taxonomy.js";
export * from "./dates.js";
export * from "./status.js";
export * from "./sources.js";
export * from "./dedup.js";
export * from "./seo.js";
export * from "./linking.js";
export * from "./quality.js";
export * from "./provenance.js";
export * from "./news-sync.js";