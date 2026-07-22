# BerojgarDegreeWala — Phase 1: Database & Backend Foundation (Fresh Build)

Paste into Claude Code / Antigravity / OpenCode. Attach `00-ai-operating-manual.md`, `01-product.md`, and `berojgardegreewala-master-specification.md` alongside this prompt — they remain the authoritative product/architecture reference even though this is a fresh technical build. This prompt scopes ONLY database + backend/API work. **Do not write any frontend/UI code in this phase.**

---

## Why a Fresh Build

The previous repository (`BerojgarDegreeWala`) accumulated real architectural drift across many sessions: duplicate/conflicting database schema generations (e.g., both `academy_tracks`/`academy_days` AND `learning_tracks`/`learning_days` coexisting), swapped roles between the two Neon databases, a table (`ai_usage_log`) defined in three different places, and multiple parallel/abandoned codebase directories. Rather than continuing to patch this, we're starting clean: **`BerojgarDegreeWala`**, a new repository, with database and backend built first and verified solid before any frontend work begins.

## Assumption to Confirm

This prompt assumes "backend" means **Next.js App Router API routes within the same application** (co-located backend, no separate Express/Fastify service) — this avoids reintroducing the old `backend/` Render-proxy pattern that the project's own prior documentation flagged as "not fully reliable, should not be depended on." If a genuinely separate backend service is actually wanted, stop and confirm before proceeding, since it changes the repo structure significantly.

---

## PHASE 1A — Repository & Project Setup

1. Create the new repository `BerojgarDegreeWala` (confirm the exact intended visibility — public or private — before creating; given this project's history of credential exposure incidents, **private is strongly recommended** at least until launch).
2. Initialize a Next.js 14+ App Router project with TypeScript, Tailwind CSS, at the repository root (no nested `berojgardegreewala/`-style subfolder this time — keep it flat and simple unless there's a specific reason for a monorepo structure, which should be a deliberate, explicit decision, not an accretion).
3. Set up `.gitignore` immediately, before any other commit, covering: `node_modules`, `.next`, `.env*`, any filename historically used for credentials in this project's past (`SECRETS.md`, `api.txt`, `credentials.txt`).
4. Create `.env.local.example` with placeholder values for every environment variable this phase will need (populated in 1B/1C below) — never with real values.
5. Set up the repo's own copy of `00-ai-operating-manual.md` at the root (or `docs/`) so it travels with the codebase itself, not just as an external attachment.

## PHASE 1B — Provision Fresh Databases (do not reuse the old tangled ones)

Given how tangled the previous databases' schemas became, provision **four brand-new database projects** rather than reusing or attempting to clean the old ones in place:

1. **Supabase Primary (db1)** — new Supabase project. Role: core live transactional data (opportunities, news, user profiles, Tier 2 social features, Academy content, community). This is the database requiring RLS and real-time reads/writes.
2. **Supabase Secondary (db2)** — new Supabase project. Role: archive/overflow only (news older than 30 days, subscriber overflow). Nothing else lives here — this is the exact rule that got violated last time (db2 ended up with near-duplicates of live tables).
3. **Neon Primary (db3)** — new Neon project. Role: analytics & logs only (`ai_usage_log`, `link_check_logs`, `opportunity_reports`, `platform_analytics`). Write-heavy, append-only, isolated from live transactional load.
4. **Neon Secondary (db4)** — new Neon project. Role: public read replica only (`opportunities_mirror`, `news_mirror`), synced daily from db1, intended as a failover safety valve for public browsing.

For each: record the connection details into `.env.local` (never committed) and document the project reference/ID in a new `docs/DATABASE.md` (the ID itself is not a secret, but treat it as sensitive-adjacent per this project's history — don't paste it into chat, tickets, or anywhere outside the repo's own gitignored files and private documentation).

**Do not give any database more than one clearly-defined role.** If a future session is tempted to add a "just this one extra table" to db2 or db4 outside their defined role, that's the exact drift pattern to avoid — flag it instead of doing it.

## PHASE 1C — Clean Schema (single generation, no duplication)

Write ONE clean, consolidated migration set per database — not iterative patches accumulated over time. Base the schema on `berojgardegreewala-master-specification.md` §4's table listing, with these explicit corrections versus what the old repo drifted into:

- **Academy tables:** pick ONE naming convention (`learning_tracks`/`learning_days`/`resource_bank`/`user_learning_progress`/`track_checkpoints` — matching the earlier-established design) and do not create a second parallel set under different names later.
- **`ai_usage_log`:** lives in db1 (for immediate app-level logging) with an async mirror to db3 (for isolated analytics) — exactly two locations, both documented, never a third.
- **Neon role assignment:** db3 = analytics tables only, db4 = mirror tables only. Verify this with an actual live query after migration, not just by reading the migration file — confirm the tables that actually exist in each match its assigned role.
- Apply RLS: public read on aggregator content (opportunities, news, community posts — active only), owner-only on personal data, admin-all via service role. No plain-text admin password pattern this time — see Phase 1D.

Write the migration files, run them against the four new databases, then **run a live verification query against each database** confirming the actual table list matches what was intended — report this explicitly, don't assume the migration succeeded just because it ran without error.

## PHASE 1D — Backend / API Foundation

1. Set up the database client layer (`src/lib/db/index.ts` or equivalent) with a `getDB(purpose)` router pattern, exactly one canonical file, no parallel/duplicate router implementations.
2. Implement authentication (Supabase Auth) with **proper admin role-based access control from the start** — no plain-text password comparison pattern. Use a `role` column with server-side checks, not a client-side password field.
3. Build the core API routes needed to support data operations (no UI yet, but these should be genuinely testable via direct API calls): opportunities CRUD, news CRUD, basic auth flows, health check endpoint that verifies all 4 databases are reachable.
4. Set up the AI provider gateway (single centralized module, all AI calls route through it — no component/route calling a provider directly) with the 7-provider fallback chain design from the master spec, but only implement and test the 2-3 providers actually needed for this phase's scope — don't wire all 7 speculatively before there's a real use case exercising them.
5. Apply security fundamentals from day one: field allowlisting on any user-editable PATCH/PUT endpoint (never a raw `{...body}` spread into a database update), auth checks on every admin-scoped route, input sanitization on anything reaching a database query filter.

## PHASE 1E — Verification (before calling this phase done)

- [ ] All 4 databases provisioned, connection-tested live, each confirmed to contain only its assigned role's tables (not a superset, not a mismatch).
- [ ] Migrations are a single clean set, no duplicate/legacy schema generations.
- [ ] `npm run build`, `npm run lint`, `npm test` all pass.
- [ ] Health check endpoint confirms live connectivity to all 4 databases.
- [ ] No credential files tracked in git; `.gitignore` confirmed effective via `git status`.
- [ ] Admin auth uses role-based checks, not a plain-text password.
- [ ] A brief `docs/DATABASE.md` and `docs/BACKEND.md` exist describing what was actually built (not aspirational).

**Do not begin frontend work until this checklist is genuinely complete and reported with evidence.**

## Reporting

Report progress after each sub-phase (1A through 1E), not all at once at the end. For each claim of completion, include the actual evidence (command output, live query result) — per the AI Operating Manual's rule: no claim without evidence.
