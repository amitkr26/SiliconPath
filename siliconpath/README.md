# SiliconPath

No-login aggregator for electronics / embedded / semiconductor / VLSI / materials-science jobs, PhD positions, fellowships, and scholarships — sourced from official company / university / institution career pages — plus curated industry news. **Free to run, free to use.**

> This is the fresh rebuild. It lives entirely in `siliconpath/`. The legacy `electrobridge/` folder is read-only and is **not** part of this codebase.

## Status

Foundation-first build, in progress.

- [x] **Phase 0** — scaffold, DB router, env template, docs
- [~] **Phase 1** — data foundation: schema + write-time org validation (adapters next)
- [ ] Phase 2 — core public experience (listing, filters, detail, news, search, AI)
- [ ] Phase 3 — accounts & progressive disclosure
- [ ] Phase 4 — VLSI Academy
- [ ] Phase 5 — scale scraper coverage

No phase is “done” until it's verified live (real query output / real test run), per `../GUARDRAILS_AND_LESSONS_LEARNED.md` rule #1.

## Local dev

```bash
cd siliconpath
cp .env.example .env.local   # fill in real values; never commit this
npm install
npm run dev
```

Apply the schema to db1 (Supabase Primary):

```bash
psql "$SUPABASE_DB_URL" -f db/schema.sql
# or paste db/schema.sql into the Supabase SQL editor
```

Check all four DB connections with real queries:

```bash
npm run db:health
```

## Architecture

Four databases, each with a distinct load-bearing purpose. Every connection goes through the single router in `src/lib/db/index.ts` — no component opens its own connection. See [`docs/DATABASE.md`](docs/DATABASE.md) for the authoritative table→DB mapping and [`docs/DECISIONS.md`](docs/DECISIONS.md) for the reasoning log.
