# Database — Single Source of Truth

This file is authoritative. Every time a table is added, record here exactly which
of the four databases it lives in and why. “Which DB is this table in?” must never
require a code search.

All access goes through `src/lib/db/index.ts` → `getDB(purpose)`. No component
opens its own connection. Default new tables to **db1 (core)** unless there is a
documented reason below to place them elsewhere.

| Purpose arg | DB | Role | Tables |
|---|---|---|---|
| `core` | db1 — Supabase Primary | Core transactional; every live request touches this | `opportunities`, `news_articles`, `companies`, `scraper_sources`, `user_profiles`*, community/social* |
| `archive` | db2 — Supabase Secondary | Cold storage / archive | `news_archive` (>30d), overflow logs |
| `analytics` | db3 — Neon Primary | Write-heavy append-only logs | `ai_usage_log`, `scrape_logs`, `platform_analytics`, `cron_health` |
| `replica` | db4 — Neon Secondary | Public read replica / fast anonymous read path | `opportunities_mirror`, `news_mirror` |

\* added in later phases; listed so placement is decided up front.

## Safeguards (each addresses a specific prior failure)
1. **One router** (`getDB`) — no direct connections anywhere else.
2. **Fail loudly** — missing env / failed connection throws; never a silent null.
3. **/api/health tests all four with a real query** (Phase 2), plus `npm run db:health` now.
4. **Sync jobs (db1→db2, db1→db4) get `cron_health` monitoring from day one** (Phase 1/2).
5. **Default to db1** unless justified above.
6. **This file is updated on every table addition.**

## Current status
db1 schema defined in `db/schema.sql`. db2/db3/db4 schemas are added as the phases
that need them land — not created speculatively.
