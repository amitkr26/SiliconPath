# SiliconPath — Master Product & Engineering Specification

**Purpose of this document:** This is the single, complete source of truth for SiliconPath. It is written so that an AI coding agent (Antigravity or otherwise) can read this document alone — with no further clarification, prompts, or back-and-forth — and understand exactly what to build, how it should look and behave, how it fits together technically, and how to approach the existing codebase safely. If anything in the existing repo conflicts with this document, this document wins; update the code to match it.

---

## PART 1 — VISION & PRODUCT

### 1.1 What SiliconPath is

SiliconPath is a free, no-login-required aggregation platform for every electronics, embedded systems, semiconductor, and VLSI job, internship, PhD position, fellowship, and scholarship in the world — sourced by directly scraping the career pages of companies, universities, research institutions, and government bodies — plus curated industry news specific to this sector. The core promise: a visitor never has to check DRDO's site, then ISRO's, then Intel's, then IIT Bombay's, one by one. They come to SiliconPath and see all of it, with a direct apply link to the original source for each listing.

### 1.2 Non-negotiable constraints

- **$0/month to build and run, forever.** Every architectural choice must have a free-tier path. Time-limited cloud credits (Google Cloud ~$340 expiring Oct 3, 2026; AWS ~$120 expiring Nov 24, 2026) may be used for acceleration, but every feature built using them must degrade gracefully to $0 free-tier behavior once credits expire — never a hard dependency.
- **100% free for end users, forever.** No paywalls, no premium tiers, no ads. This is not a monetization-deferred product; it is currently a no-monetization product by design.
- **No login required for the core value.** Browsing opportunities, reading news, viewing organizations, using the resource guides — none of this ever requires an account.
- **100% verified data, zero broken links.** Nothing is shown publicly unless it has passed an automated link-verification check.
- **Legal, respectful scraping only.** Prefer official ATS (Applicant Tracking System) public job-board APIs — Greenhouse, Lever, Workday, SmartRecruiters, Ashby — over raw HTML scraping. Never scrape LinkedIn Jobs, Indeed, or Glassdoor directly (their ToS forbids it). Government/university/institutional career pages may be scraped respectfully (robots.txt-compliant, rate-limited) when no ATS API exists.
- **No fake/placeholder features.** Every feature that exists is either fully working end-to-end, or genuinely not built yet — never a dummy button that does nothing.

### 1.3 Two-tier feature strategy

**Tier 1 — Live, public, primary experience:**
Opportunity aggregation, industry news, organization directory, AI-powered career tools (chatbot, matcher, natural-language search), resource/career guides, VLSI learning-path content. This is what an anonymous visitor sees and uses. This is what the homepage, primary navigation, and SEO content are built around.

**Tier 2 — Fully built and functional, available to any registered user, de-emphasized for anonymous visitors:**
Full networking layer (profiles, connections, feed, messaging, endorsements, recommendations), organization self-registration and direct job posting, and the resume builder. 

**Access rule (important — this is the corrected, final rule):** Any user who creates an account gets full access to every Tier 2 feature. There is no owner-only restriction. The only distinction is: an anonymous, logged-out visitor should not see Tier 2 features prominently — no Tier 2 links in the primary navbar or homepage for logged-out users, and Tier 2 links may exist in the footer for the curious. The moment someone logs in, Tier 2 becomes naturally visible and usable to them via their dashboard and a logged-in navbar — it is not hidden from people who have already signed up, and it is never gated by "are you the platform owner." This is a matter of what's emphasized to whom, not an access-control wall.

### 1.4 Two-sided design for job posting

- **Applicant side (works today):** Anyone browses aggregated opportunities and applies via the original source's direct link. Once an account exists, they can additionally save opportunities, track applications, get AI-matched, and (once they explore Tier 2) apply to employer-posted jobs the same way.
- **Poster side (Tier 2):** An organization can claim their auto-generated company page (seeded from scrape data) or register fresh, then post jobs directly through a form. These employer-posted jobs appear in the exact same unified opportunity listing as scraped ones, distinguished internally by a `source_type` field (`scraped` | `employer_posted`) — the candidate-facing browsing/search/matching experience never needs to treat them differently.

---

## PART 2 — FEATURES, PAGES, AND UI/UX

Design language throughout: dark theme only (no light mode), Tailwind CSS, glass-morphism surfaces, the existing token system (background `#0A0E1A`/`#0B0F1C`, accent cyan `#22D3EE`, success/warning/danger `#10B981`/`#F59E0B`/`#EF4444`, Space Grotesk for display type, Inter for body, Geist Mono for code/technical values). Every card-style component (opportunity, news, organization, feed post) is fully clickable as a single unit — clicking anywhere on the card except an explicitly interactive sub-element (save button, apply button, like button) navigates to the detail page. Every URL is a clean, human-readable slug — never a raw numeric ID or UUID.

### 2.1 Homepage (`/`) — logged out and logged in both land here

**Sections, top to bottom:**
1. **Hero** — headline framing the core promise ("Every electronics & semiconductor opportunity, in one place"), a prominent working search bar (routes to `/opportunities?search=...`), and 3-4 live stat counters (verified opportunities count, organizations covered, sources tracked) pulled from real database counts, never hardcoded.
2. **Urgent/trending strip** — a horizontally scrollable row of opportunities with the nearest deadlines, each using the color-coded `DeadlineCountdown` component (green → yellow → red as deadline approaches).
3. **Latest verified news** — 3-4 news cards, electronics/semiconductor-specific only.
4. **Browse by category** — a grid of category tiles (JRF, SRF, PhD, Postdoc, Government, Private Sector, Internship, Trainee), each showing a live count, clicking navigates to `/category/[category]`.
5. **Featured organizations** — a horizontally scrollable strip of organization logos/cards (ISRO, DRDO, Intel, TSMC, etc.), clicking navigates to that org's page.
6. **Why SiliconPath** — a short trust section explaining the verification promise and the "no need to check 20 different sites" value proposition. This is also where GEO trust-signal language lives (dated, sourced claims about verification methodology).
7. **Newsletter subscribe** — compact email capture form.
8. **Footer** — includes de-emphasized links to Tier 2 features (Network, Feed, Companies, Resume Builder) for logged-out visitors who want to explore, plus standard links (About, Contact, Resources, Legal).

**Logged-in difference:** the navbar (see 2.9) gains Feed/Network/Messages links and a notification bell; the homepage content itself stays largely the same since it's still primarily an aggregation entry point.

### 2.2 Opportunities listing (`/opportunities`)

- Left sidebar filter panel: category, location, eligibility, deadline range, organization, source type (scraped/employer-posted) — checkboxes, applied via URL query params so filtered views are shareable/bookmarkable and each combination has a sane canonical URL for SEO.
- Main content: responsive card grid, each card showing title, organization (with logo), category badge, stipend/salary if known, deadline countdown, verification badge, and a save/bookmark icon (auth required, prompts login only when clicked, not on page load).
- Whole-card click → detail page.
- Empty state: friendly messaging suggesting filter adjustments, not a bare "no results."
- Infinite scroll or pagination (pick one, be consistent) with a loading skeleton matching final content dimensions to avoid layout shift.

### 2.3 Opportunity detail (`/opportunities/[slug]`)

- Above the fold: title, organization (linked to org page), key facts row (deadline countdown, stipend, location, eligibility, employment type), a large primary "Apply" button (opens the real source URL, tracked via click-tracking, in a new tab), and a "Save to calendar" (ICS export) action.
- Verification badge with "last verified on [date]" — visible, not buried.
- Full description body.
- AI-generated insight panel (`AIOpportunitySummary`) — a short AI-written summary of what makes this role notable/what to know before applying.
- "Similar opportunities" section (same org or category).
- Link to the organization's page.
- Share buttons (WhatsApp, Twitter/X, copy link) and a "Report an issue" link (broken link, wrong info) feeding into the admin verification queue.
- Full `JobPosting` JSON-LD structured data, breadcrumbs (`Home > Opportunities > [Category] > [Title]`) with `BreadcrumbList` JSON-LD.

### 2.4 News listing (`/news`) and detail (`/news/[slug]`)

- Listing: source-tab filter (only genuinely electronics/semiconductor-relevant sources appear as tabs — never a generic tech source), card grid identical visual language to opportunities.
- Detail: headline, publish date, summary, full content, prominent outbound attribution link to the original source, related opportunities from the same organization if applicable. `NewsArticle` JSON-LD.

### 2.5 Organizations (`/organizations` directory, `/organizations/[slug]` detail)

- Directory: searchable grid, logo, name, live open-opportunity count, verified badge.
- Detail: about section, all open opportunities from that org (reusing the opportunity card component), recent related news, and — once Tier 2 is explored by that org — a "claim this page" flow and follower count/follow button for logged-in users. `Organization` JSON-LD.

### 2.6 Resources / guides (`/resources` hub and sub-pages)

- Each guide (JRF guide, PhD guide, international fellowships, VLSI careers, NET vs GATE) opens with a 2-3 sentence direct-answer block (AEO pattern) before any narrative, followed by detailed sections, followed by a genuine FAQ block (5-8 real questions) marked up with `FAQPage` JSON-LD.

### 2.7 AI tools (`/chat`, `/match`)

- `/chat`: simple conversational UI, career-question-focused, with a "New chat" action and a recent-chats sidebar (persisted per-browser via localStorage for anonymous users, or per-account if logged in).
- `/match`: a form/textarea where a user describes their skills/interests, returns a ranked list of matched opportunities with a short "why this matches" rationale per result.

### 2.8 Dashboard (`/dashboard`, auth required)

This is the natural discovery point for Tier 2 — not the homepage. Sections:
1. Quick stats: saved opportunities count, applications in progress, profile completeness percentage.
2. "Complete your setup" cards (shown until dismissed/completed): "Build your resume," "Complete your profile," "Explore your network," "Set up job alerts" — each linking directly into the relevant Tier 2 feature. This is the primary mechanism by which a logged-in user discovers Tier 2 without it ever being forced on anonymous visitors.
3. Saved opportunities list with quick-remove.
4. Applications tracker (status workflow: saved → applied → interview → offer → accepted/rejected), editable inline.
5. Resume score card (if a resume exists) linking to the resume builder.

### 2.9 Navbar (glass-morphism, existing pattern — extend, don't redesign)

- **Logged out:** Logo, Opportunities, News, Organizations, Resources, Search icon (opens overlay), Sign Up / Log In. No Feed/Network/Messages/Companies here.
- **Logged in:** Logo, Opportunities, News, Organizations, Resources, Search, **Feed**, **Network**, notification bell (live unread count), user avatar dropdown (Dashboard, Profile, Resume, Messages, Settings, Sign Out).
- Mobile: same distinction, right-slide drawer.

### 2.10 Profile (`/profile` — own editable view, `/people/[username]` — public view)

- Banner + avatar header, headline, about text, current position/org, location, skills (tag list, each with endorsement count and an "Endorse" button visible to connections), education, experience (structured entries, not free text), open-to-work toggle, links (personal site, publications).
- **Critical data-model rule (see Part 4.4):** every field here that also appears in the resume builder is the exact same underlying field — not a synced copy. Editing skills here and editing skills in the resume builder both read/write the same `skills` column.
- Public view (`/people/[username]`) shows the same data minus private-only fields, plus connection/follow buttons, mutual connections (if viewer is logged in), and recommendations received.

### 2.11 Resume Builder (`/resume`)

- Multi-step wizard UI (Personal → Education → Skills → Experience → Projects → Publications) — but every step edits the shared canonical fields from the profile (see Part 4.4), not a separate resume-only dataset.
- AI ATS scoring: on save, an AI pass scores the resume (0-100) against general ATS best practices and returns specific feedback items.
- "Upload existing resume" option: parses an uploaded PDF (via Document AI while cloud credits last, falling back to an AI-provider-based text-extraction+structuring pass at $0 once credits expire — see Part 4.6) and writes the extracted data into the same canonical fields, with a review-before-save step so the user can correct any misparsed data.
- Export as PDF: a generated document (template + canonical fields → rendered PDF), generated fresh on export — never a separately stored, independently editable file.

### 2.12 Feed (`/feed`, Tier 2)

- Three-column layout: left = mini-profile + quick links, center = post composer + reverse-chronological feed (posts, reactions, comments, reposts) from connections/follows, right = "people you may know" and "companies to follow" suggestions.
- Post types: text, opportunity-share (auto-generated card when a user shares a saved opportunity), news-share, achievement.

### 2.13 Network (`/network`, Tier 2)

- Tabbed: Connections, Following, Followers, Sent requests, Received requests, Suggestions (simple heuristic: shared skills/category overlap — no ML needed).
- Inline accept/decline/withdraw actions.

### 2.14 Companies (`/companies` list, `/companies/[slug]` detail, Tier 2)

- List: searchable grid with follow buttons.
- Detail: banner, about, open opportunities (both scraped and employer-posted, unified), follower count, and — for a claimed/registered organization account — a "Post a job" button leading to a job-posting form (title, description, category, location, deadline, stipend/salary, eligibility). Posted jobs go through the same verification/display pipeline as scraped ones (marked `employer_posted`, still shown with a verification badge once confirmed legitimate by admin review).

### 2.15 Messages (`/messages`, Tier 2)

- Conversation list sidebar + chat panel, read receipts, start-conversation-from-profile entry point.

### 2.16 Notifications (`/notifications`, Tier 2)

- Full list with type icons (connection request, follow, like, comment, repost, endorsement, recommendation, message), actor links, mark-read/mark-all-read, unread badge synced with the navbar bell.

### 2.17 Admin (`/admin`, admin-password protected)

- Opportunity/news CRUD with verification workflow, link-health dashboard with manual recheck, scrape source management (`/admin/sources` — add/toggle sources without a code deploy), AI provider usage analytics, platform analytics, employer job-posting moderation queue (approve before a posted job goes live, to prevent spam/fake postings).

---

## PART 3 — TECHNICAL ARCHITECTURE

### 3.1 Stack (as it exists — extend, don't replace)

Next.js 14 (App Router), TypeScript, Tailwind CSS, React 18, deployed on Vercel. Testing via Jest + ts-jest + Testing Library. Error tracking via Sentry (ensure DSN is actually set in Vercel — this has historically been missing).

### 3.2 Four-database architecture (confirmed final state, post-reset)

- **Supabase Primary (db1):** the live app — auth, user profiles, all Tier 2 tables (connections, feed, messages, notifications, company pages), applications, saved opportunities, alerts, resumes (as canonical fields per Part 4.4), community, `scrape_sources` config, and currently-active opportunities/news only. Keep lean, target well under the 500MB free-tier cap.
- **Supabase Secondary (db2):** cold archive only — opportunities/news that have gone inactive, moved here rather than deleted. Never queried on a normal user request.
- **Neon Primary (db3):** write-heavy logs — AI usage logs, link-check logs, opportunity reports, platform analytics, scrape run history.
- **Neon Secondary (db4):** read-only mirror of public-read data (opportunities, news, organizations) to absorb anonymous browsing load, synced on a schedule.

### 3.3 Scraping engine

- **Tier priority:** (1) ATS public job-board APIs (Greenhouse, Lever, Workday, SmartRecruiters, Ashby) — one generic adapter per ATS type, config-driven via a `scrape_sources` table (`{name, source_type, identifier, category, is_active}`), so adding a new company is an admin-panel entry, not a code change. (2) Official public aggregator APIs (Adzuna, USAJobs, RemoteOK, Arbeitnow, TheMuse, Academic Positions, Jobs.ac.uk). (3) Respectful direct RSS/HTML scraping of government/institutional/university career pages where no ATS/API exists, robots.txt-compliant, rate-limited.
- **Never scrape** LinkedIn Jobs, Indeed, or Glassdoor directly — ToS violation and enforcement risk.
- **Verification pipeline:** every new item starts `verification_status = 'pending'`, is link-checked before ever appearing publicly, re-checked periodically, and auto-hidden (`is_active = false`) after repeated failures.
- **Relevance filtering:** a two-stage gate (blocklist of generic/irrelevant terms, then required allowlist of electronics/semiconductor/VLSI-specific signal terms) applied to both news articles and job postings pulled from general-purpose company career pages (which post non-technical roles too) — an AI classifier handles the ambiguous gray-zone cases only, to conserve free-tier AI quota.
- **Deduplication:** fuzzy-match new items against existing active opportunities by normalized title + org + location before inserting; prefer the most authoritative source (direct company ATS > aggregator API > third-party RSS) when a duplicate is found.
- **Where scraping runs:** if the current source count comfortably completes within Vercel's serverless function timeout, run scraping directly in Vercel cron routes. If source count grows large enough to risk timeouts (expected as the source list expands into the hundreds), repurpose the Render service as a dedicated background scrape-worker: Vercel cron makes one HTTP call to trigger it, Render does the actual heavy scraping with no timeout constraint, and writes results to Supabase Primary. Document whichever is actually in use in `docs/ARCHITECTURE.md` and don't let both exist in an ambiguous half-implemented state.

### 3.4 AI provider fallback chain

Order: AWS Bedrock (primary) → Groq → NVIDIA NIM → Google Gemini → OpenRouter → Cloudflare Workers AI → HuggingFace (last resort). On a quota/rate-limit/auth-error response (detected per-provider, since each has a distinct error shape), mark that provider "cooling down" for a short window (15-30 minutes) rather than retrying it on every subsequent request. Log every fallback event (provider, reason, timestamp) for the admin analytics panel.

### 3.5 Cloud credits usage (time-limited — every use needs a $0 fallback)

- **Google Cloud (~$340, expires Oct 3, 2026):** Document AI for resume-upload parsing. Fallback after expiry: extract text from the uploaded PDF directly (a basic PDF-text-extraction library, no cloud service needed) and pass it to the existing AI-provider fallback chain with a "structure this resume into JSON" prompt — lower fidelity than Document AI, but $0 and always available.
- **AWS (~$120, expires Nov 24, 2026):** Bedrock model evaluation/experimentation, Cloud monitoring for cron health. Since Bedrock is already the primary AI provider on its own free-tier-eligible usage pattern, credits here are for extra headroom, not a hard dependency — confirm the free-tier Bedrock usage alone remains sufficient after credits expire, and scale back model choice/frequency if needed to stay within free limits.
- Set budget alerts on both cloud accounts now, well before the expiry dates, so nothing silently starts charging money after the credit balance hits zero.

### 3.6 Security & access

- Auth via Supabase Auth (email/password + Google OAuth). RLS policies enforce public-read-only-when-verified-and-active on opportunities/news, and owner-only-manage on all personal data (profiles, saved items, applications, resumes, messages).
- Admin panel: password-protected via server-side `ADMIN_PASSWORD` env var — login is validated server-side via `/api/admin/auth`, password no longer in client bundle.
- Tier 2 access: standard `auth.uid()` checks (any logged-in user), no owner-only restriction anywhere in the codebase — remove any such gating if it was added in error during a prior session.
- No secrets ever committed to git. Verify via `git log --all --full-history` for any historically-committed credential files before trusting `.gitignore` alone.

---

## PART 4 — DATA MODEL

### 4.1 Core aggregation tables (Supabase Primary)

`opportunities` (id, title, org, category, description, deadline, stipend, location, eligibility, tags, slug, source_type [`scraped`|`employer_posted`], verification_status, is_active, apply_link, official_page_url), `news_articles` (id, title, summary, content, source, tags, slug, published_at, is_active, verification_status), `organizations`/`company_pages` (slug, name, logo_url, banner_url, about, website, is_verified, claimed_by, follower_count), `scrape_sources` (id, name, source_type, identifier, category, is_active, last_scraped_at, last_scrape_status).

### 4.2 User & Tier 2 tables (Supabase Primary)

`user_profiles` (extended with the canonical resume/profile shared fields per 4.4), `connections`, `follows`, `feed_posts`, `feed_post_likes`, `feed_post_comments`, `feed_post_reposts`, `skill_endorsements`, `recommendations`, `conversations`, `messages`, `notifications`, `saved_opportunities`, `applications`, `user_alerts`.

### 4.3 Logs & analytics (Neon Primary)

`ai_usage_log`, `link_check_logs`, `opportunity_reports`, `platform_analytics`, `news_filter_log`, scrape run history.

### 4.4 Resume ↔ Profile canonical field design (critical — read carefully)

There is exactly ONE copy of shared structured data — no separate resume table duplicating profile fields. On `user_profiles`: `full_name`, `headline`, `about`, `education` (jsonb array), `experience` (jsonb array), `skills` (text array, each with endorsement relationships), `projects` (jsonb array), `publications` (jsonb array), `resume_objective` (resume-specific-only field, not shared with public profile headline), `ats_score`, `ats_feedback` (jsonb). The resume builder UI reads and writes these exact columns — it is a different UI surface over the same data, not a parallel dataset. The exported PDF resume is generated on-demand from these fields via a template — never separately stored as the "real" copy. Document-AI or fallback-parsing of an uploaded resume writes into these same fields, with a review/confirm step before committing changes, so a bad parse never silently corrupts existing profile data.

---

## PART 5 — API PLAN

Group by area; each route needs auth-requirement, purpose, and which database it touches documented in `docs/API_SPEC.md` (already exists — keep it current as routes are added/changed).

- **Opportunities:** list (filtered, public), single detail (public), similar-opportunities (public), admin CRUD, employer job-posting submission (Tier 2, goes to moderation queue before going live).
- **News:** list (filtered, public), single detail (public), admin CRUD.
- **Organizations:** list (public), detail (public), claim-page flow (Tier 2), follow/unfollow (Tier 2).
- **AI:** chat, match, natural-language search, summarize, expiry-check (cron), opportunity-insight-summary, resume-ATS-scoring, resume-parsing (upload).
- **User actions:** save/unsave, applications CRUD, alerts CRUD, subscribe/unsubscribe (rate-limited), report-issue, track-click, calendar-export.
- **Profile/Resume (shared canonical fields per 4.4):** get/update profile, get/update resume — both operating on the same underlying columns.
- **Tier 2 social:** connections (request/accept/decline/withdraw/list), follows, feed (posts/likes/comments/reposts), messages/conversations, notifications, skill-endorsements, recommendations.
- **Admin:** opportunity/news CRUD, link recheck, source management, AI/platform analytics, employer-job moderation queue.
- **Cron/automation:** scrape (main + per-tier), link-check, news-cleanup, archive-news (db1→db2), sync-replica (db1→db4), send-digest.
- **Health:** multi-DB health check — must accurately reflect each database's actual intended contents (don't assume db2 has the same schema as db1).

---

## PART 6 — SEO / AEO / GEO REQUIREMENTS

Every page: clean slug URLs (no numeric/UUID), `generateMetadata()` with real dynamic title/description, canonical tags, correct JSON-LD per page type (`JobPosting`, `NewsArticle`, `Organization`, `FAQPage`, `BreadcrumbList`, `WebSite`+`SearchAction`). Auto-regenerated `sitemap.xml` (split by content type once large) including only verified+active items. `robots.txt` allows AI crawlers (GPTBot, PerplexityBot, Google-Extended) unless there's a specific reason to block them. Guide pages follow the direct-answer + FAQ pattern (Part 2.6). GEO trust signals: dated, sourced factual claims, and a public "how we verify data" explanation (ties into the homepage "Why SiliconPath" section).

---

## PART 7 — HOW TO APPROACH THE EXISTING CODEBASE

1. **Read before writing.** Before any code change, read the current `PROJECT_AUDIT.md` (or `AUDIT_REPORT.md` if more recent — check dates, use whichever is actually current) and the `docs/` folder in full (`PRD.md`, `FEATURE_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `API_SPEC.md`). Reconcile any conflict between what's documented and what this master document specifies in favor of this master document, and update the docs accordingly as you go.
2. **Never break working functionality.** Run `pnpm build && pnpm test` after every meaningful change, not just at the end of a session. If a test fails, fix it before moving forward.
3. **No owner-only gating.** If any code exists that checks a specific user ID/email to restrict Tier 2 access, remove it — replace with standard `auth.uid() IS NOT NULL` style checks, since Tier 2 is open to any registered user per Part 1.3.
4. **Verify data flows, don't assume code correctness.** After building or fixing the scraper pipeline, manually trigger it and confirm real rows land in the database with working links — a green build does not mean the feature works end-to-end.
5. **Keep secrets out of git, permanently.** Before every session touching credentials, `.env` handling, or deployment config, re-verify `git log --all --full-history` for any credential file that might have been committed, regardless of current `.gitignore` state.
6. **Consistent branding.** Grep for any remaining "ElectroBridge" strings periodically and correct them — the product is "SiliconPath."
7. **Document as you build, not after.** Update the relevant `docs/*.md` file in the same session as any architectural or feature change — don't let documentation drift from reality, since that drift has already caused confusion once in this project's history (a stale `PROJECT_AUDIT.md` did not reflect real progress for several sessions).
8. **When something in this master document is ambiguous or missing a detail**, make the most sensible decision consistent with the non-negotiables in Part 1.2 and Part 1.3, document the assumption clearly in the relevant `docs/*.md` file, and proceed — don't stop to ask, since the whole point of this document is to make further clarification unnecessary.

---

## PART 8 — DEFINITION OF DONE (overall)

- Anonymous visitor can browse, search, and reach a real, verified, working apply link for any opportunity — zero login prompts anywhere in that flow.
- Any user who signs up gets full Tier 2 access (profile, resume builder synced with profile via shared canonical fields, feed, network, messaging, and — if they represent an organization — job posting) with no artificial restriction.
- Scraping pipeline runs on schedule, pulls from ATS APIs plus respectful direct scraping, verifies links, deduplicates, filters for relevance, and the live homepage stats reflect real non-zero counts.
- All 4 databases hold their intended, non-overlapping content per Part 3.2, with no dead/legacy tables lingering.
- AI provider fallback chain works with cooldown behavior; any provider needing a new key from the owner is clearly flagged, not silently broken.
- Every page carries correct SEO/AEO/GEO structured data and clean URLs.
- `docs/` folder accurately reflects the real, current state of the platform at all times.
- `pnpm build && pnpm test` pass cleanly, with zero TypeScript errors and zero unresolved lint warnings of the kind already flagged (exhaustive-deps, `<img>` vs `<Image>`).
