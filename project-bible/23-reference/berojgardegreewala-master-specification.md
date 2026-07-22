# BerojgarDegreeWala — Master Specification Document

**Purpose of this document:** Single source of truth for the product vision, architecture, database design, and operating rules. Any agent (Claude Code, Antigravity, OpenCode) or collaborator should read this before making changes. Supersedes fragmented prior planning docs.

---

## 1. Executive Summary

**BerojgarDegreeWala** (formerly BerojgarDegreeWala) is a niche aggregator platform for the global semiconductor, VLSI, electronics, embedded systems, and materials science community. It brings together — in one place, without requiring login — job opportunities, internships, PhD positions, fellowships, and scholarships scraped directly from company/university/institution career pages, plus curated industry news, direct apply links, and a free structured learning path (VLSI Academy).

**Origin:** Built first as a personal tool to solve the founder's own problem (opportunities scattered across dozens of individual websites), then generalized because the underlying pain is shared across the niche.

**Positioning:** Not "LinkedIn for semiconductors." The differentiator is technical depth — understanding what a 28nm tapeout, a JJAP publication, or a DRDO security clearance means — which a generic job board's matching algorithm never will. Breadth-of-features (a full social network) is not the moat; niche-specific matching and aggregation is.

**Cost commitment (non-negotiable):** $0/month to build and run, forever free for users. No monetization plan currently exists. Every infrastructure decision must fit within free tiers, with cloud credits (Google Cloud, AWS) used only for things that gracefully degrade to free-tier behavior once credits expire.

---

## 2. Feature Tiers & Access Model

### Tier 1 — Live, Public, No-Login
- Opportunity browsing, search, filtering (category, location, eligibility, deadline)
- News aggregation and browsing
- Organizations directory
- AI opportunity matcher, AI career chatbot
- Resources/guides (JRF/SRF/RA guide, PhD abroad guide, VLSI career guide, NET vs GATE, etc.)
- VLSI Academy (learning path) — browsable without login; progress-tracking requires an account
- Zero forced signup anywhere in the core browse → click → apply flow

### Tier 2 — Built, Fully Functional, Progressive Disclosure (not owner-gated)
**Final confirmed model (as of Session 17 correction):**
- Anonymous/logged-out visitors: see only the Tier 1 aggregator experience. No networking features in primary nav or homepage CTAs. Footer links are acceptable de-emphasis, not a hard block.
- Any user who creates an account: gets **full, immediate, proactive** access to every built feature — profile, feed, network, messaging, resume builder, employer job-posting flow. No waiting period, no additional gate, no single-owner restriction.
- Post-signup, the dashboard actively prompts discovery ("Complete your profile," "Build your resume," "Explore your network") rather than leaving it purely passive.
- This is a **discovery-emphasis decision for people who haven't signed up**, not an access-control mechanism for people who have. No code should check a specific user ID/email to gate these routes — any authenticated user reaches them normally.

**Tier 2 feature list:** Enhanced profiles, connections/network, home feed (posts/reactions/comments/reposts), direct messaging, notifications, company/organization pages with follow, skill endorsements, recommendations, resume builder, employer self-registration + job posting.

---

## 3. Two-Sided Marketplace Design

- **Applicant side:** browse/apply to scraped opportunities (live now, Tier 1) → once signed up, same unified apply flow extends to employer-posted jobs (Tier 2) — one consistent experience regardless of source.
- **Employer/institution side:** organizations don't need to sign up first. The scraper **auto-generates a company/university page** the first time it encounters that organization in any scraped source (name, whatever public info is available, linked opportunities/news). A representative can later **claim** their auto-generated page (verification via email-domain match or manual admin approval) and gain the ability to post jobs directly, update info, etc. This removes the cold-start "why would a company sign up on an empty platform" problem.
- Both flows write into the same `opportunities` table shape, distinguished by a `source_type` field (`scraped` | `employer_posted`) — the browsing/matching/search UI treats them identically.

---

## 4. Database Architecture — 4 Databases

### db1 — Supabase Primary (`aqauempuwmbizqoaolop`, ap-southeast-1)
**Role: core live transactional data.** Anything requiring RLS, real-time reads/writes, or auth-linked data.

| Table group | Tables |
|---|---|
| Core opportunity data | `opportunities`, `news_articles`, `scrape_sources`/`scraper_sources` |
| User data | `user_profiles`, `saved_opportunities`, `applications`, `user_alerts`, `user_resumes` |
| Community | `community_posts`, `community_comments`, `community_votes` |
| Tier 2 / LinkedIn-style features | `user_follows`, `connection_requests`, `connections`, `feed_posts`, `feed_post_likes`, `feed_post_comments`, `feed_post_reposts`, `company_pages`, `company_followers`, `skill_endorsements`, `recommendations`, `conversations`, `messages`, `notifications` |
| VLSI Academy | `learning_tracks`, `learning_days`, `resource_bank`, `user_learning_progress`, `track_checkpoints` |
| Operational | `subscribers`, `telegram_subscribers`, `calendar_exports`, `suggestions`, `opportunity_reports`, `link_check_logs` |

### db2 — Supabase Secondary (`jbqjipwanfsxyqkfrrpx`, ap-southeast-1)
**Role: archive/overflow.** Keeps db1 lean and under free-tier storage limits by offloading rarely-queried historical data.

| Table | Purpose |
|---|---|
| `news_archive` | News older than 30 days (moved by weekly cron) |
| `subscribers_overflow` | Extra newsletter subscriber capacity if db1 nears its limit |

### db3 — Neon Primary (`raspy-mouse-45454356`, aws-us-east-1)
**Role: analytics & logs.** Write-heavy, append-only — isolated so heavy logging never competes with db1's live transactional performance.

| Table | Purpose |
|---|---|
| `ai_usage_log` | Every AI provider call (mirrors db1 copy) |
| `link_check_logs` | Link verification audit trail (analytics copy) |
| `opportunity_reports` | User issue reports (analytics copy) |
| `platform_analytics` | Page views, apply-clicks, share counts |

### db4 — Neon Secondary (`plain-glade-52224468`, aws-us-east-1)
**Role: public read replica / failover safety valve.** Synced daily from db1.

| Table | Purpose |
|---|---|
| `opportunities_mirror` | Read-only copy of active opportunities |
| `news_mirror` | Read-only copy of recent news |

**Intended failover behavior (design goal, verify implementation status):** if db1 experiences a traffic spike or connection-limit issue, public opportunity/news browsing can fall back to querying db4 instead of the whole site going down. This should be active failover logic, not just a sync target — verify this was actually built, not just planned.

### Sync flows
- Daily 06:00 UTC: scrape → db1 (`opportunities`, `news_articles`)
- Daily 07:00 UTC: db1 → db4 (`sync-replica`)
- Weekly Sun 02:00 UTC: db1 → db2 (`archive-news`)
- Every AI call: log to db1 AND db3 (async/fire-and-forget, must not slow the live AI response)

**Status flag:** `archive-news` and `sync-replica` crons were previously confirmed to have never fired in earlier audits — verify current firing status before relying on this architecture as described.

---

## 5. AI Provider Architecture

7-provider fallback chain (`src/lib/ai/providers.ts`, verify exact current path before editing):

| Rank | Provider | Role |
|---|---|---|
| 1 | AWS Bedrock (Mantle) | Primary, ~60% of traffic — complex reasoning, ATS scoring, matching |
| 2 | Groq | Fast fallback — chat, summarization |
| 3 | NVIDIA NIM | Quality fallback — news relevance classification |
| 4 | Google Gemini | Structured extraction, NL search, weekly digest |
| 5 | OpenRouter | General fallback |
| 6 | Cloudflare Workers AI | Edge/fast classification |
| 7 | HuggingFace | Last resort |

**Operating rules:**
- Task-based provider preference where it matters, full fallback chain for general use.
- Failure cooldown: if a provider fails, deprioritize it for ~10 minutes rather than hitting it on every request that day.
- JSON-response parsing must be robust to non-strict-JSON output (strip leading/trailing text, extract JSON blocks via regex, wrap `JSON.parse` in try/catch, retry or fall through rather than surfacing a raw parse error) — this was a confirmed live bug (`/match` page) previously.
- OpenRouter/free-tier model slugs should be verified against the live `/models` endpoint periodically, not hardcoded indefinitely — free slugs deprecate.

---

## 6. Scraping Engine Architecture

**Adapter pattern:** ATS APIs (Greenhouse, Lever, Workday, SmartRecruiters — Workday specifically has WAF/TLS-fingerprint blocking on some tenants like TI/AMD/Qualcomm that is being deliberately NOT bypassed, since defeating active anti-bot protection carries the same risk category as scraping LinkedIn/Indeed directly), RSS feeds, HTML scraping via `cheerio`, and schema.org `JobPosting` structured-data extraction (preferred first-pass for company career pages, since it's public-by-design data).

**Explicitly out of scope:** direct scraping of linkedin.com or indeed.com search results/job pages — ToS-prohibited and actively enforced. Legitimate alternatives: Indeed Publisher/XML Feed program (official), schema.org JobPosting extraction from companies' own career pages (same underlying jobs, compliant source).

**Source list:** ~320 companies/universities/research institutes compiled (semiconductor manufacturers, fabless/chip design, equipment/materials, OSAT/packaging, power/automotive, EDA, national labs, universities across India/North America/Europe/Asia-Pacific/Middle East/Latin America/Africa). **Roll out in batches of 20-30 at a time**, verifying each adapter works, never all at once.

**Data quality guardrails (critical, given repeated real bugs):**
- Strip header/footer/nav/sidebar/menu DOM elements before link-matching (prevents "Payment Gateway," "Practice School" etc. layout-filler text from being ingested as opportunity titles — this was a confirmed, recurring bug).
- Organization field must not accept person-name patterns from byline/author fields (confirmed bug: a scholarship-aggregator source's author byline was mapped into the `organization` column, affecting up to 71% of live opportunities at its worst point — "Sadia Munir," "Muhammad Faizan" as fake "organizations"). Fix must be structural (field-mapping correction, generic name-vs-institution heuristic), not a hardcoded blocklist of specific names already seen.
- News relevance filtering must exclude off-niche consumer content (confirmed bug: Tom's Hardware gaming/consumer-hardware content, and unedited scraped placeholder text like "tktk" reaching production).
- Deduplication across sources (title similarity, URL exact match, content hash).
- Verification pipeline per opportunity: link check → deep scrape (full eligibility/deadline/stipend/description) → AI summarize → AI expiry check.

**TLS/certificate handling:** for `.gov.in`/`.ac.in` sites with certificate errors, diagnose first (usually a missing intermediate certificate, fixable via `NODE_EXTRA_CA_CERTS` or an explicit `ca` array — this preserves security) before resorting to `rejectUnauthorized: false`, which should only be a scoped, last-resort, explicitly-flagged exception per domain, never a global setting.

---

## 7. VLSI Academy (Learning Path)

**Structure:** 3 sequential, gated tracks — Digital Design (RTL), Verification (SystemVerilog + UVM), Physical Design (Backend) + Interview Prep folded into the end of Track 3. Day-wise content: theory summary, embedded YouTube video (exact timestamp range, official iframe embed only, mandatory visible channel attribution), practice questions with answers, coding/lab task, interview questions, day-end checkpoint quiz. Day N+1 locked until Day N's checkpoint passed; track unlock requires all days complete + track assessment + capstone project.

**Resource curation:** trusted-source framework — Neso Academy and NPTEL/IIT Roorkee auto-trusted (verified, established, academic); VSD explicitly excluded from auto-trust (much of current VSD content is paid/gated — individual free videos may be manually added, never the whole channel); other channels scored via metadata + human-reviewed samples (transcript-based AI scoring only if a ToS-compliant transcript method is confirmed working — the YouTube Data API does not reliably expose transcripts for arbitrary third-party videos).

**Build sequence:** pilot Track 1 fully (Days 1-30) before touching Track 2/3. A confirmed data-quality bug (embedded videos mismatched to wrong day topics) required a root-cause fix (playlist indexing / mapping logic) plus a topic-overlap validation safeguard for future ingestion — verify this is resolved and re-verified live before continuing content population.

---

## 8. Resume Builder ↔ Profile Data Model

**Design principle: single source of truth, not two-way sync.** The resume builder and profile page edit the *same* underlying structured fields (`user_resumes`/`user_profiles` — education jsonb, experience jsonb, skills array, etc.), not separate copies. The "resume" as a PDF/document is a generated output (template + these fields → rendered PDF), not a separately-stored editable document. This eliminates sync-conflict risk by construction rather than requiring a background sync job. PDF-uploaded resume parsing (via Document AI, see §9) writes into these same canonical fields — profile edits, resume-builder edits, and PDF-upload extraction are three input paths into one shared model.

---

## 9. Infrastructure & Cloud Credits

**Core hosting:** Vercel (Next.js, cron jobs), Render (background scrape worker, avoids Vercel serverless timeout for heavy scraping).

**Google Cloud credits** (~$340, expires Oct 3, 2026): Document AI for resume PDF parsing (must have a fallback to the existing Gemini-based extraction if Document AI fails/credits exhaust — never a hard dependency), Cloud Storage + CDN for static assets (known gap: no CDN previously), Cloud Monitoring + Scheduler as a backup layer watching for silent cron failures (known gap: no cron failure alerting previously). Budget alerts must be configured at 25/50/75/90% before heavy use begins.

**AWS credits** ($120, expires Nov 24, 2026): Bedrock model evaluation only (comparing models for highest-stakes tasks like ATS scoring) — do not build duplicate/parallel infrastructure to what Render/Vercel already provide. Leaving most of this credit unused is acceptable; an unnecessary new dependency costs more in maintenance than an expired credit costs in waste.

**Rule for all cloud-credit usage:** every integration must degrade gracefully to $0 free-tier behavior once credits expire — test the fallback path explicitly, don't just assume it works.

---

## 10. Security Posture

- Admin panel currently uses plain-text password comparison with no RBAC — known weakness, needs proper auth before any sensitive admin capability is expanded.
- RLS policies: public read on aggregator content (opportunities, news, community posts — active only), owner-only on personal data (saved items, applications, alerts, resumes, progress), admin-all via service role.
- **Recurring failure pattern (must not repeat):** credential files (`api.txt`, `SECRETS.md`, raw project reference IDs in docs) have been created and/or committed multiple times across this project's history. **Mandatory rule going forward:** before any `git add`/`commit`/`push`, scan for credential files, confirm `.gitignore` coverage, and check git history (`git log --all --full-history -- <file>`) for anything already committed. If found, rotate the actual credential — do not consider a `.gitignore` entry alone sufficient, since history retains old commits.
- Any credential that has appeared in a chat message, shared document, or any non-secure-storage location should be treated as compromised and rotated, regardless of whether the platform/repo is public or private.
- Personal account secrets (2FA backup codes, personal OAuth secrets) must never live in a project file — password manager only.

---

## 11. Operating Rules (lessons learned, apply going forward)

1. **No claim without live re-verification.** "Fixed," "0 errors," "done" must be backed by an actual re-test against the live site/build output, not just a code-level change. This project has had multiple confirmed instances of claimed fixes not matching live reality.
2. **No fabricated confidence.** If an agent doesn't have verified, sourced information (e.g., about a YouTube channel's quality, a library's current API), it should say so and verify rather than presenting a guess as established fact.
3. **Verify the actual current environment before editing** — file paths, repo location, branch — don't assume prior session notes still hold. This project has suffered from environment fragmentation (Windows local scratch, GitHub Codespaces, an undocumented "V3" naming) that caused confusion.
4. **Security gate before every git push**, without exception.
5. **Foundation fixes take priority over new feature expansion.** Adding more scraper sources or new features to a database with a known, unresolved data-integrity bug compounds the problem rather than improving the platform.
6. **Batch rollout, never big-bang**, for scraper source expansion, track/content population, and any large migration.
7. **Every fix needs a real changelog entry** — exact files, exact root cause, exact change — not just a status header update.
8. **Destructive operations (data purges, history rewrites) require a dry-run shown for approval first**, never executed silently.
9. No dummy/placeholder features ship as if they work — either genuinely functional or clearly marked/hidden as not-yet-available.

---

## 12. Known Open Items (status as of last verification — re-check before trusting)

- Organizations name-misattribution bug: claimed fixed in one session, but live re-verification immediately after showed the same bug still present (28 opportunities, Featured section still 100% misattributed). **Root cause and live status unconfirmed — do not assume fixed without a fresh live check.**
- News contamination (off-niche consumer content, "tktk" placeholder text): same status — claimed addressed, not confirmed live as of last check.
- Various interactive features (filters, feed/community posting, AI insight panel, Academy loading state) — a comprehensive fix sprint was issued; re-verification of each item is pending.
- `archive-news`/`sync-replica` cron actual firing status — verify, historically confirmed to have never run.
- Admin panel RBAC — not yet addressed.

This section should be updated (not left stale) every time a genuine, live-verified fix lands — replace claims with confirmed status, don't just append optimistic notes.
