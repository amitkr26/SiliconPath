# SiliconPath — Codebase Audit

_Scope: full-repo scan of `main` (`backend/`, `docs/`, legacy `electrobridge/`). Graded against the project's own product spec and guardrails. Findings are grouped by severity; each notes whether it is **fixed in this PR** or **needs follow-up**._

> Honesty note (per guardrail #1): the code changes in this PR are **unverified live** — they were written and pushed for review + CI. They have not been run against a live database or deployment. "Should compile / should work" is not proof; run the build and a real scrape before marking any of this Fixed.

---

## 🔴 Security

### S1. Security incident report declares "all clear" while a real project ref sits in a tracked file — _needs follow-up_
`docs/SECURITY_INCIDENT_REPORT.md` concludes "No exposure found. No key rotation is necessary," but `electrobridge/.env.local.example` (tracked, public) contains a real Supabase project ref (`aqauempuwmbizqoaolop.supabase.co`), and the report itself quotes it. A raw project ID in docs is explicitly counted as a prior leak in the guardrails. **Action:** treat the project ref as disclosed, scrub it from tracked files, and re-verify git history (`git log --all --full-history`) before re-declaring clean. Not auto-fixed here because it lives in the read-only `electrobridge/` legacy folder.

### S2. `NEXT_PUBLIC_ADMIN_PASSWORD` is browser-exposed — _needs follow-up_
In `electrobridge/.env.local.example`. The `NEXT_PUBLIC_` prefix bundles the value into the client build, so an admin password behind it is shipped to every visitor's browser. **Action:** rename to `ADMIN_PASSWORD` (server-only) and read it only in server code. Left untouched here because it is in legacy `electrobridge/`.

---

## 🟠 Correctness

### C1. DB router failed silently — _FIXED in this PR_
`db.ts` returned `null` on missing env and `getDB()` handed back `{ client: null }`; the orchestrator's `if (db1 && …)` then wrote nothing but still reported `success`. Now `getDB()` **throws** a clear error, and the orchestrator **aborts loudly** if the primary DB is unconfigured.

### C2. No organization validation — _FIXED in this PR_
`electrobridge/api_test_results.txt` already showed _"20 opportunities with person names as orgs."_ There was no validation anywhere. Added `scrapers/lib/org-validation.ts` — **structural** (institutional-keyword / known-org / source-name accept; person-name-shape reject), run at write time in the orchestrator. Not a name blocklist.

### C3. Generic HTML adapter never stripped layout DOM — _FIXED in this PR_
It matched every `<tr>`/`<li>`/`<p>`, so nav/footer text became fake job titles. Now strips `header/footer/nav/aside/sidebar/menu/…` before extraction.

### C4. No robots.txt / rate limiting on scraped sources — _FIXED in this PR (HTML adapter)_
Added a robots.txt check and a courtesy per-host rate limit to the generic HTML adapter. **Follow-up:** apply the same courtesy to the ATS adapters (Workday/Greenhouse/etc.) where relevant.

### C5. `checkDbHealth` queried `opportunities` on all four DBs — _FIXED in this PR_
The social/analytics DBs don't have that table, so they always reported degraded. Health now queries a table/statement that actually exists per DB (`opportunities` on db1, `users` on db2, `SELECT 1` on both Neon instances).

### C6. AI: dead Gemini model slug — _needs follow-up (one-line change)_
`ai-providers.ts` uses `gemini-1.5-flash`, which is deprecated and returns 404 on `v1beta` (verified against Google's deprecation notes, 2026). That provider silently fails and falls through the chain. **Action:** change the slug in both `PROVIDER_MODELS.gemini` and the `callGemini` URL to a current model (e.g. `gemini-2.5-flash`). Left as a documented change to avoid a blind full-file rewrite of the provider module.

### C7. AI: no JSON-mode / robust parse, all 7 providers wired at once, no live key check — _needs follow-up_
Spec calls for native JSON mode with a regex-extraction fallback, a 2–3 provider starter set, and a startup/CI key check. Current code has none. (The Bedrock endpoint `bedrock-mantle.…api.aws` is **correct** — it's AWS's recommended OpenAI-compatible endpoint; earlier doubt retracted.)

---

## 🟡 Consistency & structure

### D1. Four contradictory definitions of the 4-DB layout — _needs follow-up_
`README`, `docs/DATABASE.md`, the product spec, the `.env` comments, and `getDB()` disagree on what lives where (esp. auth/user data in db1 vs db2). Pick one source of truth (`docs/DATABASE.md`) and make code + docs match it.

### D2. Rebuild didn't follow the plan — _needs follow-up_
There is no `siliconpath/` folder. New code is an Express-only scraper API in `backend/` (no frontend, auth, resume builder, or Academy), and `README` still instructs `cd SiliconPath/electrobridge` (the old app). Phases 2–4 do not exist in new code yet.

### D3. Cron monitoring is illusory — _needs follow-up_
`recordRun` pushes to an in-memory array that resets on every serverless cold start; there's no `cron_health` table and no alerting. Persist last-successful-run per job to Neon (db3) and alert on staleness. Suggested schema:
```sql
create table if not exists cron_health (
  job_name    text primary key,
  last_run_at timestamptz not null,
  status      text not null,
  detail      text
);
```

### D4. Source config: batch size + miscategorization — _needs follow-up_
`source-config.ts` ships **30 active** sources in batch 1 (spec said start with 5–10 and verify). Also: `intel` and `intel-india` are duplicates pointing at the same URL; `intel`/`graphcore`/`sifive`/`cerebras` are typed `greenhouse` but their URLs are plain career pages, not Greenhouse boards, so those adapters will return nothing. **Action:** trim batch 1, de-dupe, and fix the adapter types (or switch them to `html`/`schema`).

### D5. `apply_link` upsert conflict key can collide on NULL — _needs follow-up_
The orchestrator upserts with `onConflict: "apply_link"`, but the HTML adapter sets `apply_link: null`. Multiple null-link rows can collide/misbehave on the conflict target. Use a stable composite key (e.g. hash of `source_url + title`) or a generated dedupe column.

### D6. Committed scratch/test artifacts in legacy — _needs follow-up_
`electrobridge/` holds `test_*.mjs`, `audit_report.json`, `batch1_results.json`, `*_test_results.txt`, `scratch/` — the environment-scatter pattern the guardrails flag. Clean up (in legacy, so out of scope for this PR).

---

## Not verified
Live site behavior; git history for previously-committed secrets; the `electrobridge/` app internals; ATS adapter correctness against live tenants.
