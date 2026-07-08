# Decisions Log

Reasonable decisions made where the spec left room, with rationale. Append-only.

## 2026-07-08 — Phase 0 / early Phase 1

- **Framework: Next.js 14 App Router.** Matches the spec's recommendation and the
  Vercel Hobby deployment target; single codebase for public pages + API routes.
- **Fresh `siliconpath/` folder; `electrobridge/` untouched.** Per master prompt
  Rule #1. No code ported from legacy; schema and validation written fresh.
- **DB router uses lazy, memoized getters that throw on missing env.** Chosen over
  eager module-load init so that importing the module in a context missing one
  DB's env (e.g. a script that only needs `core`) doesn't crash unrelated code —
  while still failing loudly the moment an unconfigured DB is actually requested.
- **Organization validation enforced in BOTH app code and a DB CHECK constraint.**
  Defense in depth: even if a future code path forgets to validate, the DB rejects
  a bare person-name-shaped organization. Structural, not a name blocklist.
- **Dedupe via generated `dedupe_key` column** (`apply_link` else sha256 of
  `source_url|title`) instead of `onConflict: apply_link`, because scraped HTML
  rows legitimately have null apply links and would collide on the old key.
- **AI starter set = Groq + Gemini + OpenRouter** in `.env.example` (2–3 verified
  free-tier providers), not the legacy 7-at-once. Model slugs will be verified
  current at wiring time in Phase 2 (note: legacy used the now-dead
  `gemini-1.5-flash`; use a current slug such as `gemini-2.5-flash`).
- **`ADMIN_PASSWORD` is server-only** (dropped the legacy `NEXT_PUBLIC_` prefix,
  which shipped it to the browser).

### Not yet verified
Nothing in this PR has been run live — no `npm install`, build, or DB apply has
been executed. Treat as review-only until the build + `db:health` + a real scrape
pass on a configured environment.
