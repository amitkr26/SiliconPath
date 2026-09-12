# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

- **2026-09-12 — Production Image & Media Architecture, Repository-Wide Replacement & Security Hardening:**
  - **Remote Image Host Hardening**:
    - `frontend/next.config.mjs`: Removed `{ protocol: "https", hostname: "**" }` wildcard. Restricted to verified origins (Supabase, GitHub avatars, Google user content, LinkedIn media, `api.dicebear.com`, `*.gov.in`, `*.res.in`, `*.ac.in`, and certified semiconductor news sources).
  - **Deterministic Monogram & Fallback System**:
    - `frontend/src/components/ui/ImageWithFallback.tsx`: Created universal fallback component supporting deterministic monograms (`getDeterministicInitials`, `getDeterministicPalette`), error boundary recovery, unoptimized proxy safety, `fill` prop support, alias support for `fallbackType`/`fallbackName`, and high-contrast editorial fallbacks.
  - **Complete Elimination of Raw `<img>` and Unprotected `<Image />` Tags**:
    - Converted all 14 remaining raw `<img>` instances across `search/page.tsx`, `EditProfileModal.tsx`, `ProfileEditor.tsx`, `PublicProfile.tsx`, `feed/page.tsx`, `employer/messages/page.tsx`, `employer/talent/page.tsx`, `employer/talent/[username]/page.tsx`, `employer/dashboard/page.tsx`, `employer/jobs/[id]/applicants/page.tsx`, `employer/applicants/page.tsx`, `employer/applicants/[id]/page.tsx`, and `admin/users/page.tsx` to `ImageWithFallback`.
    - Replaced raw unhandled `next/image` tags in `messages/page.tsx` and `MessageThread.tsx` with `ImageWithFallback`.
    - Automated test `IMAGE-18` enforces zero raw `<img>` elements anywhere in `frontend/src` outside of test mocks.
  - **Elimination of Fabricated Imagery & Stock Photos**:
    - `frontend/src/components/NewsCard.tsx`: Replaced hardcoded Unsplash stock photo with designed editorial fallback.
    - `frontend/src/app/network/page.tsx`: Eradicated `FALLBACK_AVATAR` (Unsplash woman photo); integrated deterministic monogram avatars.
    - `frontend/src/components/OpportunityCard.tsx` & `frontend/src/app/opportunities/[slug]/page.tsx`: Integrated organization logo with monogram fallback. Opportunity cards remain data-driven without large decorative images.
  - **Organization Directory Branding**:
    - `frontend/src/app/organizations/page.tsx` & `OrganizationsClient.tsx`: Added verified organization logo and monogram support.
    - `frontend/src/app/organizations/[slug]/page.tsx`: Redesigned organization detail header with logo, website, location, and active opportunity counts.
  - **Profile & Employer Storage Hardening**:
    - `frontend/src/app/api/profile/avatar/route.ts`: Hardened avatar upload with size check (<= 2MB), URL scheme validation (http/https only, rejecting `javascript:`/`data:`/SVG), and magic byte validation for JPEG, PNG, and WebP.
    - `frontend/src/app/api/employer/company/route.ts`: Supported validated `logo_url` updates while preserving `is_verified` as strictly an administrative decision.
    - `frontend/src/app/api/employer/company/logo/route.ts`: Added authenticated multipart logo upload with magic byte inspection and ownership checks.
    - `frontend/src/app/employer/company/page.tsx`: Upgraded employer company profile with logo upload, live preview, and clear verification separation disclaimer.
  - **OpenGraph Identity**:
    - `frontend/src/app/api/og/route.tsx` & `frontend/src/app/api/og/opportunity/[slug]/route.tsx`: Replaced lingering SiliconPath branding with BerojgarDegreeWala.
  - **Content Security Policy**:
    - `frontend/src/middleware.ts`: Aligned `img-src` with trusted `remotePatterns`, including `https://api.dicebear.com`.
  - **Automated Media Testing & Verification**:
    - `frontend/src/__tests__/media/image-system.test.tsx`: Added 18 comprehensive automated tests (IMAGE-01 through IMAGE-18).
    - Verification: 236/236 frontend tests passing across 25 suites; 0 errors on monorepo `npm run typecheck`; clean compilation on `next build` across all 273 routes.

- **2026-09-12 — Full-Stack Product Hardening, Fail-Closed Security & Discovery Remediation:**
  - **Fail-Closed IDOR & Authorization Remediation**:
    - `frontend/src/app/api/employer/jobs/route.ts`: Fixed vulnerability in `PATCH` and `DELETE` where `if (existingOpp.created_by && existingOpp.created_by !== user.id)` allowed unauthorized editing or deletion of scraped/unattributed opportunities. Replaced with fail-closed gate `if (!existingOpp.created_by || existingOpp.created_by !== user.id) return 403;`.
    - `frontend/src/app/api/employer/applicants/route.ts`: Fixed unbounded fallback query in `GET` where employers with 0 posted jobs would execute an unconstrained query across all applicants in the database. In `PATCH`, fixed `if (!oppOwner || oppOwner !== user.id) return 403;`.
    - `frontend/src/app/api/employer/applicants/[id]/route.ts`: Fixed fail-open check in `GET` and `PATCH` that permitted access when the related opportunity was null. Replaced with strict fail-closed gate returning 403.
    - `frontend/src/app/api/applications/[id]/route.ts`: Fixed candidate application status update gate to strictly fail closed.
  - **Company Hijacking & Auto-Verification Protection**:
    - `frontend/src/app/api/employer/company/route.ts`: Prevented employers from claiming existing institutional organizations unless they are the verified claimant (`claimed_by === user.id`) or original creator. Prohibited self-serve auto-verification by regular users (`is_verified` is only set true for platform admins or pre-verified claims).
  - **Company Claim Lifecycle Completion**:
    - `frontend/src/app/api/employer/claim/route.ts`: Completed the full end-to-end claim approval workflow. When a platform admin approves a claim, the route updates `company_claims`, writes `claimed_by` and `is_verified: true` into `company_pages`, and creates real-time system notifications for the claimant.
  - **Messaging Participant Gate**:
    - `frontend/src/app/api/messages/route.ts`: Sealed message injection vulnerability where a caller could supply an arbitrary `conversationId` without verifying participation. Now strictly verifies `participant_a === user.id || participant_b === user.id` and returns 403 Forbidden on foreign conversation IDs.
  - **Social Feed Schema Alignment**:
    - `frontend/src/app/api/feed/route.ts`: Updated query to select and return `post_type`, `tags`, and `reposts_count`.
  - **Ask AI Guest Access Alignment**:
    - `frontend/src/app/ask-ai/page.tsx`: Removed client-side router push redirecting unauthenticated users to `/login`, restoring Guest access with IP rate-limiting per `PRODUCT.md`.
  - **Test Suite Expansion**:
    - `frontend/src/__tests__/api/claim-and-message-security.test.ts`: Added 4 tests validating message participant checks and company claim lifecycle approval.
    - `frontend/src/__tests__/api/employer-idor.test.ts`: Added 3 tests (Tests 9-11) validating fail-closed gates on null `created_by` and missing relations.
  - **Verification**:
    - Monorepo Typecheck: `npm run typecheck` -> 0 errors across 5 workspaces.
    - Monorepo Tests: `npm test` -> 309 tests passing (218 frontend across 24 suites, 46 server, 30 worker, 15 ai-gateway).
    - Production Build: `npm run build` -> Clean compilation of 273 static and dynamic routes.

- **2026-09-12 — Master Product Audit, Professional UI/UX Redesign & Full-Stack Remediation:**
  - **Baseline & Repository Separation**:
    - Identified and isolated `bdw-main` tracking `bdw/main` (`https://github.com/amitkr26/BerojgarDegreeWala.git` @ `becf137`) from `origin` (SiliconPath).
    - Preserved zero-regression contract across full-stack systems: Dual-auth, ATS applicant pipeline, scraper ingest, and real-time social networking.
  - **Design System & Visual Language Overhaul**:
    - Eliminated neo-brutalist styling (2px black borders, 4px hard drop-shadows, pill buttons/badges, and repetitive card patterns).
    - Established modern engineering visual tokens: Slate 50 neutral canvas (`#F8FAFC`), Slate 900 text (`#0F172A`), precision Royal Blue primary (`#2563EB`), crisp 1px borders (`#E2E8F0` / `#CBD5E1`), geometric radii (4px, 6px, 8px, 12px), and subtle elevation (`shadow-xs`, `shadow-sm`, `shadow-md`).
  - **Component & Surface Remediation**:
    - `frontend/src/styles/design-tokens.ts`: Defined semantic color tokens, subtle elevations, geometric radii, and typography scales.
    - `frontend/tailwind.config.ts`: Mapped `boxShadow` tokens to subtle modern elevations.
    - `frontend/src/app/globals.css`: Replaced `--shadow-brutal` and heavy offset borders with modern CSS variables.
    - `frontend/src/components/ui/Card.tsx`: Replaced 2px black border and hard offset shadows with subtle 1px border (`border-slate-200`) and smooth hover elevation.
    - `frontend/src/components/ui/Button.tsx`: Replaced `rounded-pill` with geometric `rounded-lg`, refined sizes and hover transitions.
    - `frontend/src/components/ui/Badge.tsx`: Replaced 2px black borders and pills with clean 1px `rounded-md` semantic tags.
    - `frontend/src/components/ui/SectionHeader.tsx`: Refined uppercase label typography and header spacing.
    - `frontend/src/components/ui/Input.tsx`: Updated `Input` and `Select` with subtle borders, `rounded-lg`, and smooth focus rings.
    - `frontend/src/components/Navbar.tsx`: Added `Organizations` and `Ask AI` to navigation links, cleaned styling.
    - `frontend/src/components/Footer.tsx`: Disciplined 4-column layout, subtle dark slate borders (`border-slate-800`), verified source trust strip.
    - `frontend/src/components/ReviewsSection.tsx`: Redesigned "Transparency Over Testimonials" with subtle 1px cards.
    - `frontend/src/components/FaqSection.tsx`: Clean border accordion with smooth focus states.
    - `frontend/src/components/SubscribeSection.tsx`: Deep blue subtle gradient with clean inputs and badges.
    - `frontend/src/components/OpportunityCard.tsx`: High-density scannable card layout, clean organization initials, 1px border, direct apply CTA.
    - `frontend/src/components/NewsCard.tsx`: Editorial news layout, clean modal with full article summary link.
    - `frontend/src/components/OpportunityRow.tsx`: Refined list/table view.
    - `frontend/src/components/SubscribeModal.tsx` & `ReportIssueModal.tsx`: Subtle modern modal styling.
    - `frontend/src/components/AskAIModal.tsx`: Refined header icon and send button.
    - `frontend/src/components/OpportunityDisclaimer.tsx`: Subtle card design.
    - `frontend/src/components/home/PublicHome.tsx`: Overhauled hero, domain pathways, research guide, and portal cards.
    - `frontend/src/app/opportunities/[slug]/page.tsx`: Modernized detail tags and sidebar official website link.
  - **Verification**:
    - TypeScript: `npx tsc --noEmit` -> 0 errors.
    - Tests: `npm test` -> 23 test suites, 211 tests passed.
    - Production Build: `npm run build` -> 0 errors, 273 static and dynamic routes compiled.

- **2026-09-12 — P1 Feature Gaps Closed (Visibility, Comments, Posts, Feed Scroll, Notifications):**
  - **P1-4: Profile visibility toggle**:
    - Added `is_profile_public` checkbox to `EditProfileModal.tsx` general tab.
    - Wired to existing `PATCH /api/profile/[userId]` (field was already in `UPDATABLE_FIELDS`).
    - Defaults to `true` (public). Unchecking hides profile from search, recommendations, and suggestions.
  - **P1-3: Comment deletion**:
    - Added `DELETE` handler to `api/feed/posts/[id]/comment/route.ts` — ownership check, deletes comment, trigger auto-decrements `comment_count`.
    - Added delete button (trash icon, hover-visible) to comment list in `feed/page.tsx` — only shown to comment author.
  - **P1-2: Post type and tags passthrough**:
    - `POST /api/feed` now passes `post_type` and `tags` from validated request body to the DB insert (was silently discarding them).
    - Return payload now includes `post_type` and `tags` fields.
  - **P1-1: Feed infinite scroll**:
    - Added `IntersectionObserver` sentinel to `feed/page.tsx` — triggers `fetchNextPage` when sentinel is within 200px of viewport.
    - Added loading spinner at bottom of feed during next-page fetch.
  - **P1-8: Missing notification types**:
    - Added `connection_accepted` notification in `api/network/connect/[id]/route.ts` — sent to requester when addressee accepts.
    - Added `message` notification in `api/messages/route.ts` — sent to recipient when a new message is sent.
  - **Verification**: 23 test suites / 211 tests passing. TypeScript 0 errors. Build clean (274 pages).

- **2026-09-12 — Audit-Driven Bugfixes (P0/P1):**
  - **P0-1: Network Received/Sent tabs broken**:
    - `network/page.tsx` called `GET /api/network/requests` — route did not exist. Received/Sent tabs returned 404 at runtime.
    - Fixed URL to `GET /api/network/connect` (which returns pending requests with correct shape).
  - **P0-2: Repost count always 0**:
    - No DB trigger existed on `feed_post_reposts` to maintain `reposts_count` on `feed_posts`.
    - Created migration `20260912000002_fix_reposts_count_trigger.sql` — adds `update_post_reposts_count()` function (SECURITY DEFINER, matches likes/comments pattern) + trigger + backfill.
  - **P0-2b: Repost notification broken**:
    - `api/feed/posts/[id]/repost/route.ts` selected `user_id` from `feed_posts` but the column is `author_id`. Notification silently failed.
    - Fixed to select `author_id` (matching the comment route pattern).
  - **P0-3: Admin user management guard dead code**:
    - `api/admin/users/route.ts` and `api/admin/users/[id]/route.ts` used `const adminErr = await verifyAdmin(request); if (adminErr) return adminErr;` — but `verifyAdmin` returns `boolean`, not `Response`. Guard never fired.
    - Fixed to `if (!await verifyAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });` (matching `scrape/route.ts` pattern). Middleware admin gate provides backup protection.
  - **P1-7: Stale TypeScript types**:
    - `Conversation` type used `participant_1`/`participant_2` (v1 schema) — DB has `participant_a`/`participant_b`.
    - `Message` type used `content` — DB has `body`.
    - Updated both types to match actual DB schema and API response shape.
  - **Verification**: 23 test suites / 211 tests passing. TypeScript 0 errors. Build clean (274 pages). 39 security tests passing.

- **2026-09-12 — P1 Gap Fixes (Repost Button, Follow Button, Test Coverage):**
  - **Feed Repost Button (`FEED-01`)**:
    - Added `useRepostFeedPost()` hook to `hooks/useFeed.ts` — POSTs to `/api/feed/posts/[id]/repost`.
    - Wired repost button in `feed/page.tsx` — was displaying count only, now clickable to toggle repost.
  - **Network Follow Button (`NET-01`)**:
    - Added `handleFollow(targetUserId)` to `network/page.tsx` — calls `POST /api/network/follow/[userId]`.
    - Wired "Follow" button in Recommendations tab — was rendered with no `onClick`.
  - **useRealtimeChannel Performance Fix (`RT-01`)**:
    - Replaced array literal in `useEffect` deps with `useRef` pattern in `hooks/useRealtimeChannel.ts` — prevents unnecessary channel recreation every render.
  - **update-password Session Check (`AUTH-04`)**:
    - Added `useEffect` in `update-password/page.tsx` to verify recovery session exists before allowing password update; redirects to `/login` if no session.
  - **Test Coverage (`TEST-01`)**:
    - Added `__tests__/api/feed-network.test.ts` — 7 tests covering like toggle, follow self-guard, follow 409, 401, and success paths.
  - **Verification**: 23 test suites, 211 tests all passing. TypeScript 0 errors.

- **2026-09-12 — P3 Cleanups (Scraper Controls, DB2 Dead Code):**
  - **Scraper Admin Controls (`SCRAPER-01`)**:
    - Fixed `POST /api/admin/scrape` — was a no-op that only queried sources. Now actually triggers `runOpportunityScrape()` in background.
    - Added `PATCH /api/admin/scrape` — toggles `is_active` on individual scrape sources.
    - Updated `admin/scrape-health/page.tsx` — added "Run All Active" button, per-source "Run Now" refresh button, and per-source start/stop toggle (Pause/Play icons).
  - **DB2 Dead Code Cleanup (`DB-01`)**:
    - Removed `getDb1Anon()`, `getDb2Anon()`, `getDB()` purpose router, and `syncProfile()` from `lib/db/index.ts` — all were never imported or called.
    - Updated DB2 comment to reflect actual usage: archive sink for old news articles only.
    - Retained `db2` export (used by `archive-news` and `health` routes).

- **2026-09-12 — P2 Feature Additions (OAuth, Admin Users, Read Receipts):**
  - **GitHub & LinkedIn OAuth (`AUTH-03`)**:
    - Refactored login page OAuth handler to support multiple providers via shared `handleOAuthLogin(provider)` function.
    - Added GitHub and LinkedIn OAuth buttons with SVG icons to `frontend/src/app/login/page.tsx`.
    - Auth callback already handles generic OAuth code exchange — no callback changes needed.
    - **Supabase dashboard config required:** Enable GitHub and LinkedIn providers in Authentication → Providers.
  - **Admin User Management (`ADMIN-02`)**:
    - Created migration `frontend/supabase/migrations/20260912000001_add_account_status.sql` — adds `account_status` (active/suspended/banned), `banned_at`, `banned_reason` to `user_profiles`.
    - Created `frontend/src/app/api/admin/users/route.ts` — GET with status filter, search, pagination.
    - Created `frontend/src/app/api/admin/users/[id]/route.ts` — PATCH for ban/suspend/reactivate with reason.
    - Created `frontend/src/app/admin/users/page.tsx` — full admin UI with user table, status badges, action modal.
    - Added "User Management" link to admin dashboard sidebar.
    - Added account status check in `frontend/src/middleware.ts` — banned/suspended users blocked from gated paths with redirect to login.
  - **Per-Message Read Receipts (`MSG-01`)**:
    - Added PATCH handler to `frontend/src/app/api/messages/[conversationId]/route.ts` — accepts `messageIds` array, marks specific messages as read (only incoming, not own).
    - Added `useMarkMessagesRead(conversationId)` hook to `frontend/src/hooks/useMessages.ts`.
  - **Verification Findings**: Onboarding flow (511 lines, fully functional) and Opportunity Intelligence modes (all 4: Ask AI, Discover, Saved, Alerts) were falsely reported as missing — both were complete.

- **2026-09-12 — P1 Feature Additions (Password Reset + Real-time):**
  - **Password Reset Flow (`AUTH-02`)**:
    - Created `frontend/src/app/forgot-password/page.tsx` — email input form calling `supabase.auth.resetPasswordForEmail` with redirect through `/auth/callback?next=/update-password`.
    - Created `frontend/src/app/update-password/page.tsx` — new password form calling `supabase.auth.updateUser({ password })` with 8-char minimum, confirmation match, and auto-redirect to dashboard on success.
    - Added "Forgot your password?" link to login page (`frontend/src/app/login/page.tsx`).
    - Auth callback (`frontend/src/app/auth/callback/route.ts`) already handles recovery code exchange — no changes needed.
  - **Real-time Messaging & Notifications (`RT-01`)**:
    - Created `frontend/src/hooks/useRealtimeChannel.ts` — generic Supabase Realtime `postgres_changes` subscription hook with React Query cache invalidation and graceful fallback when Realtime is unavailable.
    - Updated `frontend/src/hooks/useMessages.ts` — added Realtime subscription to `messages` table for active conversation and `conversations` query invalidation on any message change. Reduced polling fallback from 3s/5s to 10s.
    - Updated `frontend/src/hooks/useNotifications.ts` — added Realtime subscription to `notifications` table for both list and count queries. Reduced polling fallback to 30s/60s.
    - All existing `refetchInterval` values retained as polling safety net.
  - **Audit Findings**: Phase A codebase audit verified zero P0 ship blockers. OAuth callback, feed post likes, feed comments, and feed repost were all falsely reported as missing by automated audit — all were complete implementations.

- **2026-09-08 — Admin Portal Functionality & Edge Runtime Compatibility Fix:**
  - **Edge Runtime Crypto Neutralization**:
    - Removed Node.js built-in `crypto` (`createHmac`, `timingSafeEqual`) and `Buffer` imports from `frontend/src/lib/admin-auth.ts` and `backend/api/src/auth/index.ts`.
    - Replaced `safeEqual` with a zero-dependency constant-time bitwise character code XOR loop that executes identically in Next.js Edge Runtime, Node.js, and browser contexts without timing attack vulnerability.
    - Implemented HMAC SHA-256 token verification using universal W3C standard Web Crypto API (`crypto.subtle.importKey` and `crypto.subtle.sign`).
  - **Async Admin Verification Propagated**:
    - Updated `verifyAdmin` callers to `await verifyAdmin(request)` across `frontend/src/middleware.ts`, `frontend/src/app/api/admin/auth/session/route.ts`, `frontend/src/app/api/scrape-sources/route.ts`, `frontend/src/app/api/employer/claim/route.ts`, `frontend/src/app/api/analytics/platform/route.ts`, `frontend/src/app/api/analytics/ai-usage/route.ts`, `frontend/src/app/api/admin/scrape/route.ts`, and `frontend/src/app/api/admin/scrape/status/route.ts`.
    - Updated unit test suite `frontend/src/__tests__/api/admin-auth.test.ts` to `await verifyAdmin(...)` (10/10 tests passing).
  - **Token Storage & API Client Alignment**:
    - Normalized admin token key across `frontend/src/app/admin/companies/page.tsx`, `frontend/src/app/admin/analytics/page.tsx`, and `frontend/src/app/admin/add-news/page.tsx` from `sp_admin_token` to canonical `admin_token`.
    - Enhanced `frontend/src/lib/api-client.ts` to attach admin authentication headers (`Authorization: Bearer <token>` and `x-admin-password`) for `/api/analytics` and `/api/scrape-sources`.
    - Updated `AIAnalyticsPanel.tsx`, `admin/analytics/page.tsx`, and `admin/performance/page.tsx` to use `api.get` instead of unauthenticated raw `fetch`.
  - **Admin Performance & News Endpoints**:
    - Updated `frontend/src/app/api/admin/performance/route.ts` to authenticate admin requests via `requireAdmin(request)`.
    - Created missing `frontend/src/app/api/admin/news/route.ts` with `GET` and `POST` handlers supporting article creation and administrative listing.

- **2026-09-07 — Final Repository Cleanup & Documentation Pruning:**
  - **Project Bible Consolidation**:
    - Consolidated sprawling 31-folder `project-bible` into 5 authoritative root documents: `ARCHITECTURE.md`, `PRODUCT.md`, `SECURITY.md`, `DEVELOPMENT.md`, and `CHANGELOG.md`. Removed obsolete directories: `00-repository-intelligence`, `00-ai-operating-manual`, `01-product`, `02-design`, `03-ui`, `04-frontend`, `05-backend`, `06-database`, `07-api`, `08-ai`, `09-scrapers`, `10-academy`, `11-employers`, `12-users`, `13-security`, `14-devops`, `15-testing`, `16-operations`, `17-project`, `18-knowledge`, `19-prompts`, `20-machine-specs`, `21-governance`, `22-adrs`, `23-reference`, `architecture`, `audits`, `backlog`, `product-roadmap`, `qa`, and `security`.
    - Updated `AGENTS.md` to reference `project-bible/SECURITY.md`.
  - **Audit Archive & Screenshot Pruning**:
    - Removed 116 obsolete historical reports in `docs/historical/` and 5 superseded reports in `backend/docs/`.
    - Pruned obsolete audits, generated Playwright artifacts, and audit screenshots in `docs/audit-reports/`, retaining exclusively the authoritative current release gate report `docs/audit-reports/2026-09-07-FINAL-WHOLE-SYSTEM-AUDIT.md`.
  - **Temporary & One-Off Scripts Cleanup**:
    - Removed 8 obsolete audit scripts and `scripts/archive/` from `scripts/`, preserving production scraper triggers and database maintenance utilities (`auto-daily-scraper.js`, `omnirouter-gateway.js`, `execute-opportunity-cleanup.mjs`, `realign-corporate-job-categories.mjs`, `recalculate-opportunity-quality.mjs`).
    - Removed 17 one-off forensic/inspection scripts from `frontend/scripts/`, preserving essential operational scripts (`delete-fake-jobs.js` used in package.json, `category-normalize.js`, `org-backfill.js`, `backfill-organization-ids.ts`).
  - **Secret Hygiene in Root Directory**:
    - Removed uncommitted credential dump artifacts `SECRETS.md` and `siliconpath-credentials.txt` from the working root; confirmed `.gitignore` patterns prevent credential leaks.
  - **Monorepo Integrity**:
    - Zero modifications to application source, database migrations, authentication, UI, or API logic.

- **2026-09-07 — Final Whole-System Stabilization & Production Readiness Pass:**
  - **Authoritative Server-Managed Admin & Employer RBAC (`SEC-01`, `AUTH-01`)**:
    - Eliminated client-writable `user_metadata.role` privilege escalation across all employer ATS routes (`frontend/src/app/api/employer/applicants/route.ts`, `applicants/[id]`, `jobs/route.ts`, `jobs/[id]`, `claim/route.ts`, `analytics/route.ts`, `stats/route.ts`, `company/route.ts`, `invite/route.ts`, `recommendations/route.ts`, `frontend/src/app/api/applications/[id]/route.ts`).
    - Added authoritative `isUserAdmin(user)` checking server-controlled `app_metadata.role` and `isUserEmployer(user)` in `frontend/src/lib/employer-auth.ts`.
    - Sanitized `role` in `backend/api/src/auth/index.ts` to prevent client-injected `user_metadata.role = 'admin'` from escalating privileges in backend APIs.
    - Created formal RLS migration `frontend/supabase/migrations/20260907000001_remove_user_metadata_admin_bypass.sql` dropping client `user_metadata` checks on `app_config`, `scrape_sources`, `scrape_runs`, and `ai_usage_log`.
    - Updated `frontend/src/middleware.ts` with `verifyAdmin(request)` (supporting constant-time password and HMAC Bearer tokens) and explicitly exempted `/api/admin/auth` from pre-login lockout.
  - **5-Workspace Monorepo Typecheck (`TOOL-01`)**:
    - Added `"typecheck": "tsc --noEmit"` to `frontend/package.json` so root `npm run typecheck` validates all 5 workspaces (`api`, `server`, `worker`, `ai-gateway`, `frontend`). Verified 0 errors across the entire codebase.
  - **Rate Limiter Memory Store Eviction & IP Sanitization (`SEC-02`)**:
    - Upgraded `backend/api/src/rate-limit/index.ts` memory store with maximum capacity bounds (10,000 entries), periodic expired TTL cleanup, LRU eviction for oldest keys, and IP format validation/hashing to protect against memory leaks and spoofed header attacks.
  - **SQL Pagination Integrity & Range Filtering (`DATA-01`)**:
    - Added `.neq("verification_status", "link_unavailable")` to the base query builder in `frontend/src/lib/opportunities-query.ts` to ensure un-surfaced opportunities are excluded at the SQL level before range pagination, eliminating underfilled result pages.
  - **Digest API Parity & Route Alignment (`API-01`)**:
    - Added `POST` handler with `requireCronOrAdmin` authentication in `frontend/src/app/api/cron/digest/route.ts`. Updated admin console at `frontend/src/app/admin/page.tsx` from non-existent `/api/cron/email-digest` to canonical `/api/cron/digest`.
  - **Docker Standalone Output & Container Setup (`DEVOPS-01`)**:
    - Configured `output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined` in `frontend/next.config.mjs`, added `ENV DOCKER_BUILD 1` to `frontend/Dockerfile`, and aligned dev database passwords in `docker-compose.yml`.
  - **SEO Sitemap & Robots.txt Alignment (`SEO-01`)**:
    - Updated `frontend/src/app/sitemap.ts` to replace `/chat` redirect with canonical `/ask-ai`. Updated `frontend/src/app/robots.ts` to disallow private portal paths (`/dashboard`, `/saved`, `/applications`, `/messages`, `/network`, `/feed`, `/employer`).
  - **Architecture Documentation Reality Alignment (`DOC-01`)**:
    - Reconciled `project-bible/ARCHITECTURE.md` with live production database topology: documented DB1 (`aqauempuwmbizqoaolop`) as the consolidated production database housing core platform, users, social, and academy data, with DB2 documented as legacy fallback.
  - **Full Monorepo Verification**:
    - 5-workspace TypeScript typecheck: 0 errors.
    - Test suites: 25/25 suites passed, 205/205 frontend tests, 46 server tests, 30 worker tests, 97 API tests, 15 gateway tests.
    - Production build: `npm run build` compiled successfully (338+ routes and static paths generated).

- **2026-09-06 — Homepage Final Polish & UX/Correctness Remediation:**
  - **Mobile Hero Density & Search Filters (`frontend/src/components/home/PublicHome.tsx`)**:
    - Replaced 7 sprawling direct filter pills on mobile with 5 high-priority pills (`ISRO Careers`, `DRDO JRF`, `CSIR CEERI`, `IIT Bombay PhD`, `Qualcomm RTL`) plus an accessible `+2 More` / `Fewer` toggle button.
    - Preserved full display of all 7 direct filter pills on tablet/desktop viewports (`sm:` and above).
    - Tuned H1 hero typography with responsive clamp `text-[1.65rem] sm:text-4xl lg:text-5xl xl:text-6xl` and `max-w-xs sm:max-w-2xl lg:max-w-4xl`, eliminating awkward 4-line wrapping and orphan words on 390px mobile.
  - **Desktop Spacing & Whitespace Optimization**:
    - Reduced hero vertical padding by ~25% (`py-8 sm:py-12 lg:py-14`) and tightened strip offsets (`-mt-6 sm:-mt-8`), bringing the real-time statistics counter strip cleanly above the fold on 1440×900 desktop.
  - **Statistics Semantics Disambiguation**:
    - Disambiguated `stats.total` ("Active Opportunities" - "Open for Applications") and `stats.verified` ("Verified Circulars" - "Source-Validated URLs") to provide distinct semantic value for identical/adjacent database metrics.
  - **Trust Copy & Fallback Quality**:
    - Replaced mobile hero subtitle claim `"updated daily"` with accurate copy: `"new opportunities added regularly"`.
    - Added empty-state fallback guard for Section 5 (Verified Opportunities) to gracefully handle cases with fewer or zero matching opportunities without re-introducing arbitrary unverified filler cards.
  - **Floating Ask AI Button Refinement (`frontend/src/components/AppLayout.tsx`)**:
    - Tuned mobile footprint to 84.8px × 33.6px with dynamic safe-area insets (`calc(0.75rem + env(safe-area-inset-bottom, 0px))`), preventing content collisions on mobile while keeping full touch target accessibility and visible focus ring.
  - **Test Suite & Build Alignment**:
    - Updated 3 stale test fixtures in `frontend/src/__tests__/lib/availability.test.ts` to expect `verification_status: "verified"` per Phase 2.6 security contract.
    - Fixed React Rules of Hooks early return in `frontend/src/app/ask-ai/page.tsx` so `npm run build` succeeds cleanly (`exit code 0`).
  - **Audits & Verification**:
    - Automated Playwright visual tests across 7 viewports (`390x844`, `412x915`, `768x1024`, `1024x768`, `1280x800`, `1440x900`, `1920x1080`) verified zero horizontal overflow, exactly 1 H1, visible and responsive Ask AI, and functional filter expansion.
    - Audit report published at `docs/audit-reports/2026-09-06-homepage-final-polish.md`.

- **2026-09-06 — Master Comprehensive Codebase Reality Audit:**
  - **Audit Scope & Analysis Execution**:
    - Conducted complete forensic codebase audit across frontend, backend workspaces (`api`, `server`, `worker`, `ai-gateway`), database schemas, RLS policies, scrapers, pipelines, DevOps, and documentation.
    - Verified Next.js 14 production build (`exit code 0`, 338+ routes and static paths compiled).
    - Verified backend workspaces test suites (API: 97/97, Gateway: 15/15, Server: 46/46, Worker: 30/30).
  - **Critical Findings Identified**:
    - `SEC-01 (P0)`: Client-modifiable `user_metadata.role = "admin"` allows privilege escalation, IDOR bypass in employer ATS routes (`/api/employer/applicants`, `/api/employer/jobs`), and administrative RLS policy bypass on `app_config` and `ai_usage_log`.
    - `AUTH-01 (P0)`: Admin web console at `/admin` locked out because `middleware.ts` intercepts `/api/admin/auth` and rejects it with 403 before credentials can be processed, and lacks HMAC token verification.
    - `PIPE-01 (P0)`: Opportunity ingestion pipeline broken because new rows are inserted as `pending`, `isCurrentlyAvailable()` excludes `pending` from public feeds/search, link checker does not auto-promote, and admin promotion is locked out.
    - `TEST-01 (P1)`: 3 test failures in `frontend/src/__tests__/lib/availability.test.ts` due to pending exclusion mismatch.
    - `TOOL-01 (P1)`: `frontend/package.json` missing `"typecheck": "tsc --noEmit"`, causing monorepo `npm run typecheck` to silently skip the frontend.
    - `SEC-02 (P1)`: Unbounded in-memory rate-limiter store (`memoryStore`) vulnerable to IP-spoofing DoS and memory leak on standalone server.
    - `DATA-01 (P1)`: Post-DB availability filtering causes pagination drifting and underfilled result pages.
    - `DEVOPS-01 (P2)`: Frontend `Dockerfile` and `docker-compose.yml` build context fails due to local `file:../backend/api` dependency and missing `output: "standalone"` in `next.config.mjs`.
    - `DOC-01 (P2)`: `project-bible/ARCHITECTURE.md` contradicts code by asserting live user/social data resides in DB2 instead of consolidated DB1.
  - **Audit Report**:
    - Comprehensive 4-section report produced and published at `docs/audit-reports/2026-09-06-comprehensive-codebase-audit.md`.

- **2026-09-04 — Master Reality Alignment & Production Hardening (Items 6–10):**
  - **Academy Curriculum Connected & PracticeQuiz Answer Resiliency**:
    - `frontend/src/components/academy/PracticeQuiz.tsx`: Enhanced answer evaluation to cross-match between object options (`{label, value}`), string arrays, option indices, and literal strings, eliminating false negatives on seeded quiz submissions.
    - `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts`: Wired seeded `learning_questions` from Supabase DB1 into lesson responses with fallback to sample questions.
    - `frontend/src/app/api/academy/tracks/[id]/route.ts`: Added `UUID_REGEX` discrimination to prevent Postgres 22P02 syntax errors when resolving track slugs (e.g., `digital-logic`), querying `learning_tracks` directly.
  - **Resume Studio Multi-Version Cloud Persistence & Guest Auth Guard**:
    - `frontend/src/app/api/resume/route.ts`: Added `resume_versions` querying in `GET`, upserting with `{version_id, version_name, style, target_domain, target_role}` in `PATCH`/`POST`, and version-specific deletion `?versionId=...` in `DELETE`.
    - `frontend/src/app/resume/page.tsx`: Updated `handleSaveToBackend` to send version metadata and style configuration, added cloud version hydration on mount for authenticated users, and added user sign-in prompt before calling AI bullet generation or syncing resumes across devices.
  - **Dead Mock Scrapers Removed & Genuine Scraper Fleet Rewired**:
    - Deleted `frontend/src/lib/scrapers/national-scrapers.ts` and `frontend/src/lib/scrapers/global-master-scraper.ts` (410+ lines of mock data gated by dead flags).
    - Rewired scraper routes in `frontend/src/app/api/scrapers/` (`space-defence`, `scientific-research`, `electronics-semiconductor`, `psu-electronics`, `railways`, `iits-iisc`, `run-all`, `[slug]`, `global-master`) to live genuine scrapers (`scrapeDRDO`, `scrapeISRO`, `scrapeCSIR`, `scrapeIndiaAcademic`, `scrapeIndiaPSU`, `scrapeGlobalSemiconductor`, `scrapeSarkariTechnicalOpportunities`, `scrapeAllOpportunities`).
  - **Social Feed Route Consolidation (`/community` -> `/feed`)**:
    - `frontend/next.config.mjs`: Added permanent 308 redirects for `/community` and `/community/:path*` to `/feed`, plus permanent redirects for `/chat` -> `/ask-ai`, `/post-job` -> `/employer/post-job`, and `/employers` -> `/employer`. Removed obsolete UUID redirect that previously intercepted direct opportunity UUID views.
    - `frontend/src/app/community/page.tsx` & `[id]/page.tsx`: Replaced monolithic legacy code with instant server-side redirect stubs to `/feed`, eliminating ~25KB of dead client bundle code.
  - **Repository Root Cleanliness Mandate (`AGENTS.md`)**:
    - Relocated `FINAL_PRODUCTION_READINESS_REPORT.md` from repository root into `docs/audit-reports/FINAL_PRODUCTION_READINESS_REPORT.md`.
  - **Bookmark 22P02 Postgres Syntax Guard**:
    - `frontend/src/app/api/bookmarks/[id]/route.ts`: Added UUID regex validation guard before executing delete queries against `saved_opportunities`.
  - **Verification & Test Suite Growth**:
    - Expanded `frontend/src/__tests__/lib/phase0-fixes.test.ts` with tests for PracticeQuiz answer evaluation and resume version mapping.
    - Full monorepo validation: **393/393 tests passing** (API: 97, Server: 46, Worker: 30, Gateway: 15, Frontend: 205). TypeScript clean (`0 errors`).

- **2026-09-04 — Phase 0: P0 Production Blockers & Critical Reality Fixes:**
  - **Academy Data Blocked by Slug/UUID Mismatch (Postgres 22P02 Error) Fixed**:
    - `frontend/src/app/api/academy/tracks/[id]/days/[day]/route.ts`: Added `UUID_REGEX` validation to prevent executing `id.eq.<slug>` against UUID columns which previously failed with PostgreSQL 22P02 `invalid input syntax for type uuid`. Safely resolves track slug against seeded `learning_tracks` (and `academy_tracks`), queries `learning_days`, and extracts genuine seeded `learning_resources` and `learning_questions` from the database.
    - `frontend/src/app/api/academy/tracks/[id]/days/route.ts`: Replaced unsafe `or(id.eq.${id},slug.eq.${id})` and `eq("track_id", id)` with UUID-checked queries resolving `learning_tracks` and `learning_days`.
    - `frontend/src/app/api/academy/tracks/[id]/assessment/route.ts`: Replaced unsafe `.or()` with slug vs UUID discrimination before querying `track_assessments`.
  - **Admin Browser Navigation Lockout Resolved**:
    - `frontend/src/middleware.ts`: Restricted `ADMIN_PATHS` to `['/api/admin']` returning 403 JSON for unauthorized API mutations, while allowing browser document GET requests to load `/admin`. The built-in client Admin Console Login Form at `frontend/src/app/admin/page.tsx` is now accessible to operators.
  - **Conflicting Vercel Cron Configuration Synchronized**:
    - `frontend/vercel.json`: Replaced obsolete `/api/scrapers/run-all` cron with production pipeline crons matching root `vercel.json` (`/api/cron/scrape-opportunities` at `0 0 * * *`, `/api/cron/check-links` at `0 8 * * *`, and `/api/news/sync` at `0 6 * * *`).
  - **Opportunity Pagination Truncated Count Restored**:
    - `frontend/src/lib/opportunities-query.ts`: Fixed line 239 where `count` was returned as `filtered.length` (<=30) when `includeExpired=false`. Now preserves exact Supabase database count (`count !== null && count !== undefined ? count : filtered.length`), restoring pagination across the platform.
  - **Opportunity Detail 404 on Direct UUID Links Resolved**:
    - `frontend/src/app/opportunities/[slug]/page.tsx`: Updated `lookupOpportunity(slug)` to detect UUID format via regex and query `.or(\`id.eq.${slug},slug.eq.${slug}\`)`, resolving opportunities requested via UUID (such as weekly email digest links) while preserving slug queries without 22P02 errors.
  - **Verification & Testing**:
    - Added `frontend/src/__tests__/lib/phase0-fixes.test.ts` with runnable unit tests covering UUID discrimination, pagination count fidelity, and admin path routing scope.
    - Full monorepo validation: Frontend Jest test suite (25/25 suites, 201/201 tests passed), API test suite (97/97 passed), Worker test suite (30/30 passed), Server test suite (46/46 passed), Gateway test suite (15/15 passed) — 389 tests passed with 0 failures. Typecheck clean (`npx tsc --noEmit` 0 errors).

- **2026-09-02 — Master Codebase Security Audit & Hardening (commit c98967a):**
  - **CRITICAL FIX: Error Message Leakage Eliminated** — Replaced `error.message` direct-to-response pattern with safe `apiError()` helper across 40+ API routes. Production now returns generic "An unexpected error occurred" instead of exposing Supabase/Neon internals (table names, column names, RLS policies). Fixed cron-health and cleanup-news `serverError()` calls to use static messages.
  - **HIGH FIX: Admin Auth Bypass Patched** — 3 admin pages (`add-opportunity`, `edit-opportunity`, `scrape-health`) had `.catch(() => setAuthenticated(true))` that silently granted admin access when auth API failed. Now denies access on failure.
  - **HIGH FIX: Dead Code Removed** — Deleted 8 files with zero imports (~1,623 lines): `RecommendationsSection.tsx`, `FilterBar.tsx`, `ConnectionCard.tsx`, `Tooltip.tsx`, `Dropdown.tsx`, `useNetwork.ts`, `opportunity-quality.ts`, `ResumeBuilder.tsx` (superseded by new resume page). Removed dead exports from `utils.ts` (`ELIGIBILITY_OPTIONS`, `LOCATIONS`, `DEADLINE_FILTERS`).
  - **MEDIUM FIX: Operator Precedence Bug** — `ats-adapters.ts` `inferCategoryFromTitle` had `||` without parentheses causing "SCIENTIST SOFTWARE" to match as "Govt Job". Added correct grouping.
  - **MEDIUM FIX: Hardcoded Year** — `sarkari-scraper.ts` had "Recruitment 2026" hardcoded. Now uses `new Date().getFullYear()`.
  - **Audit Report:** Full 11-section report produced at `docs/audit-reports/2026-09-02-master-codebase-audit.md`
  - **Verification:** `tsc --noEmit` clean, 195/195 frontend tests pass, 15/15 gateway tests pass.

- **2026-09-02 — Master Product Rebuild & Reality Audit: Independent Resume Studio + Live Research Opportunities Intelligence System.**
  - **Phase 0 Reality Audit & Validation:**
    - Audited Resume Upload pipeline across 5 file formats (`empty`, `plain txt`, `corrupted pdf`, `legacy .doc`, `real docx`): verified deterministic and AI extraction, ZIP header parsing, and OLE byte rejection.
    - Audited Live Database Opportunities (3,609 records total, 342 active, 3,267 expired/inactive) and established institutional coverage requirements (IIT Delhi, IIT Bombay, IIT Madras, IISc, DRDO, ISRO, CSIR).
  - **Resume Studio Rebuild (`/resume`):**
    - `frontend/src/app/resume/primitives/index.tsx`: Built reusable shared rendering primitives (`ResumeHeader`, `ContactBlock`, `SectionHeading`, `ExperienceItem`, `EducationItem`, `ProjectItem`, `SkillList`, `PublicationItem`) ensuring consistent styling, margin spacing, and print fidelity.
    - `frontend/src/app/resume/page.tsx`: Implemented 3 top-level workspace modes (`Content`, `Customize`, `AI Tools`) with live A4 preview zoom (60% to 125%), multi-resume version storage with dedicated per-version datasets in `localStorage`, and AI bullet polish for Experience and Projects.
    - `frontend/src/app/api/resume/ai-suggest/route.ts`: Added project polishing prompts and structured context handling for semiconductor/VLSI domains.
  - **Opportunity Intelligence System (`/ask-ai`):**
    - `frontend/src/lib/opportunity-freshness.ts`: Created strict date-aware freshness engine computing status (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `UNVERIFIED`) and deadline countdowns.
    - `frontend/src/lib/sources/source-registry.ts`: Added premier institutional registry for DRDO, ISRO, CSIR, and top IITs/IISc.
    - `frontend/src/lib/ai/grounding.ts` & `frontend/src/app/api/ai/chat/route.ts`: Updated grounding pipeline to filter expired opportunities from current queries and return structured response contract `{ answer, opportunities, sources, freshness, grounded }`.
    - `frontend/src/app/ask-ai/components/AlertsManager.tsx`: Upgraded alerts manager with live on-demand database matching query runner and connected to `/api/subscribe` for weekly email digest delivery via Resend.
    - `frontend/src/app/ask-ai/components/`: Built `OpportunityCard.tsx`, `DiscoverView.tsx`, `SavedView.tsx`, and updated `ChatMessage.tsx` to render interactive opportunity grids and citation chips.
    - `frontend/src/app/ask-ai/page.tsx`: Rebuilt `/ask-ai` with 4 intelligence modes (`Ask AI`, `Discover`, `Saved`, `Alerts`).
  - **Quality Assurance & Verification:**
    - `frontend/src/__tests__/opportunity/freshness-engine.test.ts`: Added unit tests for freshness engine (4/4 tests passed).
    - Full Jest Test Suite: 24/24 suites passed, 195/195 tests passed with 0 failures.
    - Full Typecheck: Monorepo `npm run typecheck` and frontend `tsc --noEmit` passed with 0 errors.
    - Responsive & E2E Verification: Tested across Desktop (1440x900) and Mobile (430x900) viewports with browser subagent and automated Node scripts.

- **2026-09-01 — Master Implementation: Production-Grade /ask-ai Studio & FlowCV-Grade /resume Builder.**
  - **`/ask-ai` AI Career Assistant Redesign & Architecture:**
    - `frontend/src/lib/ai/reasoning-sanitizer.ts`: Implemented defense-in-depth sanitization stripping `<think>`, `<thought>`, `<reflection>`, ````thought` blocks, and multi-line reasoning artifacts across streaming and batch responses.
    - `frontend/src/app/ask-ai/hooks/useChatSessions.ts`: Created multi-session persistence manager with `localStorage` fallback, LRU session pruning (max 50 sessions), and automatic synchronization with Supabase `/api/ai/sessions` for authenticated users.
    - `frontend/src/app/ask-ai/hooks/useSpeechRecognition.ts`: Implemented native Web Speech API hook with continuous speech handling, permission management, unsupported browser fallback messaging, and zero-fake UI state.
    - `frontend/src/app/ask-ai/hooks/useSpeechSynthesis.ts`: Implemented Web Speech Synthesis hook with markdown-to-plaintext conversion, utterance queue control, and active speaking state toggle.
    - `frontend/src/app/ask-ai/hooks/useSmartScroll.ts`: Implemented user-intent scroll listener that auto-scrolls when user is near bottom (<120px) while avoiding reading interruption when user scrolls up.
    - `frontend/src/app/ask-ai/components/MarkdownContent.tsx`: Safe markdown renderer with syntax highlighting, custom code blocks, and 1-click code copying.
    - `frontend/src/app/ask-ai/components/ChatMessage.tsx`, `ChatComposer.tsx`, `ChatSidebar.tsx`, `ChatHeader.tsx`, `EmptyState.tsx`, `SuggestionGrid.tsx`: Built modular chat UI supporting message regeneration, response rating, auto-growing textarea (Shift+Enter support), mobile slide-out drawer, and suggested prompts.
    - `frontend/src/app/api/ai/chat/route.ts`: Upgraded chat route supporting guest rate-limiting (15 msgs/hr) and authenticated user cloud sessions.
  - **`/resume` FlowCV-Grade Semiconductor Resume Studio:**
    - `frontend/src/app/api/profile/parse-resume/route.ts`: Added DOCX extraction via `mammoth.extractRawText()`, OLE magic byte check (`0xD0CF11E0A1B11AE1`) rejecting legacy `.doc` with conversion instructions, scanned PDF detection (<20 characters), and AI + deterministic fallback structuring.
    - `frontend/src/lib/resume-text-parser.ts`: Upgraded deterministic semiconductor parser with word boundaries (`\b[:\s-]*`) to eliminate section misidentification, comprehensive EDA/VLSI taxonomy, and robust phone/location parsers.
    - `frontend/src/app/resume/templates/`: Created 10 distinct professional templates (`ModernProfessional.tsx`, `Minimalist.tsx`, `ClassicCorporate.tsx`, `CompactTechnical.tsx`, `AcademicResearch.tsx`, `ModernSidebar.tsx`, `TwoColumnGrid.tsx`, `Executive.tsx`, `FresherCampus.tsx`, `SiliconTech.tsx`).
    - `frontend/src/app/resume/components/ImportReviewModal.tsx`: Extracted resume data review dialog with Apply All, Merge, and Discard actions.
    - `frontend/src/app/resume/components/StyleCustomizer.tsx`: Visual styling control for 8 curated color presets, custom hex picker, typography, page margins, and section visibility toggles.
    - `frontend/src/app/resume/components/TemplateSelector.tsx`: Visual modal gallery for template selection with category filters.
    - `frontend/src/app/resume/components/AIResumeAdvisor.tsx` & `AIImproveDiffModal.tsx`: Role-targeted ATS scoring (RTL Design, Verification, Physical Design, Embedded, JRF Fellow) with rubric breakdown, keyword suggestions, and side-by-side accept/reject AI enhancements.
    - `frontend/src/app/resume/components/MyResumesDrawer.tsx`: Multi-resume version manager (create, clone, rename, delete) persisted via `localStorage` and `resume_versions`.
    - `frontend/src/app/resume/components/ResumePreview.tsx`: Master printable preview component with zoom scaling (60%-130%) and exact print parity.
    - `frontend/src/app/resume/page.tsx`: Rebuilt main 2-panel Studio page with tabbed editor, live preview, mobile toggle, auto-save, and PDF export.
  - **Verification & Testing:**
    - 23/23 Jest test suites passed (191 tests total, 0 failures).
    - Monorepo typecheck (`npm run typecheck`) and frontend typecheck (`npx tsc --noEmit`) passed with 0 errors.
    - Production build (`next build`) passed successfully across all 331 static and dynamic pages.

- **2026-08-30 — Documentation Consolidation, Deduplication & Reality Sync.**
  - **Consolidation:**
    - Deleted 6 files: deprecated `deploy-stack.txt`, superseded `24-CHANGE-LOG.md`, duplicate `25-AGENT-STATE.md`/`26-AGENT-HANDOFF.md`, duplicate `phase-27-production-hardening-audit.md`, stale `27-CURRENT-SESSION.md`.
    - Marked 5 Aug 22 audit files as superseded with warning headers (FINAL_PLATFORM_AUDIT, FINAL-SCORECARD, FULL-CODEBASE-AUDIT, MASTER-REMEDIATION-PLAN, FULL-SYSTEM-MAP).
  - **Archival (73 items total):**
    - Moved 38 items to `docs/historical/`: 18 early audit reports (Aug 16-18), `phase-15-launch/` directory, `opportunity-cleanup/` and `post-scraper-audit/` QA directories, 16 session reports.
    - Moved 3 additional audit reports: `15-full-codebase-security-and-release-audit.md`, `phase9-candidate-identity-network-audit.md`, `FINAL_PLATFORM_AUDIT_20260822.md`.
    - Moved 20 QA phase reports from `project-bible/qa/latest/` to `docs/historical/qa-latest/`.
    - Moved 12 Aug 22 audit files from `project-bible/audits/` to `docs/historical/audits-aug22/`.
    - `docs/historical/` now contains 100+ archived files across 5 subdirectories.
  - **Reality Sync:**
    - Rewrote `ARCHITECTURE.md`: Corrected DB topology (dual Supabase: DB1 core, DB2 user/social), updated all table listings, added cross-DB reference pattern, added RBAC middleware documentation.
    - Rewrote `06-database/README.md`: Corrected topology to reflect DB1 (core) and DB2 (user/social), not "DB2 = Legacy Mirror". Added cross-DB reference section.
    - Rewrote `05-backend/README.md`: Removed reference to deleted `deploy-stack.txt`, updated deployment status to "Deployed on Render".
  - **Standardization:**
    - Added standardized headers (Last Verified / Status / Scope) to 7 section READMEs (04-frontend, 07-api, 08-ai, 09-scrapers, 11-employers, 12-users, 16-operations).
    - Rewrote `docs/audit-reports/README.md` to reflect current active reports only.
    - Rewrote `docs/historical/README.md` with categorized inventory of all archived files.

- **2026-08-30 — Resume Builder Parser Hardening, Phase 30D Opportunity Intelligence & Security Remediation (VERIFIED PRODUCTION READY).**
  - **Resume Builder Upload & Deterministic Auto-Fill Hardening:**
    - `frontend/src/app/api/profile/parse-resume/route.ts`:
      - Root Cause: `pdf-parse` v2 required binary input as `Uint8Array` in `{ data: Uint8Array, verbosity: 0 }`. Passing a Node `Buffer` directly to `new PDFParse(buffer)` caused an unhandled constructor exception, which erroneously fell back to `buffer.toString("utf-8")` raw text parsing, extracting bytecode headers (`%PDF-1.4 1 0 obj<</Type/Catalog...`) as candidate name and headline.
      - Remediation: Instantiated `new PDFParse({ data: new Uint8Array(arrayBuffer), verbosity: 0 })`, completely removed raw binary string fallback, and implemented strict HTTP response contracts:
        - `HTTP 400`: Missing file or empty 0-byte upload.
        - `HTTP 401`: Unauthorized / unauthenticated request.
        - `HTTP 413`: File size exceeds 10MB limit.
        - `HTTP 415`: Unsupported file format (rejected `.docx`, `.png`, `.exe`).
        - `HTTP 422`: Corrupted PDF or image-only scanned PDF (< 20 extractable text characters).
        - `HTTP 200`: Valid text-based PDF, TXT, or MD with structured candidate fields.
    - `frontend/src/lib/resume-text-parser.ts`: Added regex pagination header filtering (`-- 1 of 1 --`, `Page 1 of 1`) to eliminate noise from PDF text streams.
    - `frontend/src/__tests__/api/parse-resume.test.ts`: Added unit and regression test suite covering all parser contracts and phone number formatting.
  - **Phase 30D Opportunity Quality Intelligence, Resume Versioning & RLS Hardening:**
    - `frontend/src/lib/opportunity-quality.ts`: Implemented 4-pillar quality scoring (source, freshness, completeness, engagement) with lifecycle state transitions.
    - `frontend/src/app/api/admin/opportunities/[id]/route.ts` & `frontend/src/app/api/admin/stats/route.ts`: Added admin opportunity management endpoints and analytics metrics.
    - `frontend/src/app/admin/page.tsx`: Enhanced admin dashboard with quality scores, filter controls, and lifecycle actions.
    - `frontend/supabase/migrations/`: Added RLS security hardening (`20260829000003_rls_security_hardening.sql`), resume versioning (`20260829000002_phase31_resume_versioning.sql`), and opportunity lifecycle audit v1-v3 with full rollbacks.
    - `scripts/recalculate-opportunity-quality.mjs`: Added batch opportunity quality recalculation script.
  - **Verification Matrix:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 20/20 test suites passed, 181/181 tests passed (100% GREEN).
    - `npm run build`: Next.js 14 production build compiled successfully with 338+ routes and static paths.
    - Adversarial Matrix: 11/11 test cases verified with exact status codes and zero candidate PII leaking to logs.


  - **Security & IDOR Boundary Remediation:**
    - `frontend/src/app/api/employer/jobs/route.ts`: Enforced strict job ownership checks on `PATCH` and `DELETE` (403 on cross-employer tampering).
    - `frontend/src/app/api/employer/applicants/route.ts`: Enforced application ownership verification on `PATCH` (employers can only update applicants for jobs they created).
    - `frontend/src/app/api/applications/[id]/route.ts`: Added job ownership verification before updating application status.
    - `frontend/src/app/api/applications/route.ts`: Restricted candidate `status` updates to `"withdrawn"` only (eliminating self-approval bypass).
    - `frontend/src/app/api/feed/route.ts`: Fixed feed scoping to strictly filter posts by user's accepted connections network.
    - `docker-compose.yml` & `k8s/configmap.yaml`: Sanitized static passwords and secret placeholders.
  - **RLS Policy Security Hardening Migration:**
    - `frontend/supabase/migrations/20260829000003_rls_security_hardening.sql`: Replaced wide-open `FOR ALL USING (true)` policies across 15+ sensitive tables (`app_config`, `scrape_sources`, `scrape_runs`, `user_roles`, `user_permissions`, `company_claims`, `recruiter_saved_candidates`, `candidate_*`, `ai_usage_log`, and `company_jobs`).
  - **VerificationBadge Runtime Trust & Unit Testing:**
    - `frontend/src/components/VerificationBadge.tsx`: Hardened to strictly require `status === "verified"`.
    - `frontend/src/__tests__/components/VerificationBadge.test.tsx`: Authored 11 automated Jest test cases verifying runtime boundary conditions (100% pass).
  - **Phase 30D Migration A v3 & Restoration Artifacts:**
    - `frontend/supabase/migrations/20260829000001_phase30d_opportunity_quality_lifecycle_audit_v3.sql`: Additive quality fields, semantically accurate backfill (`pending` $\to$ `draft`), and lockstep `is_active` synchronization.
    - `frontend/supabase/migrations/rollback/20260829000001_phase30d_restore_is_active_data.sql`: Deterministic data rollback script for 27 deactivated broken link rows.
    - `project-bible/backups/opportunities_backup_2026-08-29T15-33-52-271Z.json`: Full 3,609-row live database backup snapshot.
  - **Verification Matrix:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 17/17 test suites, 166/166 tests passed (100%).

- **2026-08-28 — Phase 30C: Unified Onboarding, Persona Activation & Opportunity Intelligence (COMPLETE).**
  - **Comprehensive Phase 30C Architecture & Audit Reports:**
    - `project-bible/audits/phase-30c-onboarding-audit.md`: Detailed audit of the 3-intent progressive onboarding system and domain taxonomy.
    - `project-bible/audits/phase-30c-opportunity-intelligence-audit.md`: Inventory of 3,609 live opportunities and deterministic 0–100 quality scoring model.
    - `project-bible/audits/phase-30c-database-migration-report.md`: Verification of Supabase vs Neon table ownership and foreign key integrity.
    - `project-bible/audits/phase-30c-resume-studio-audit.md`: Structured resume data model, multi-version resumes, and ATS analysis engine.
    - `project-bible/architecture/ai-career-copilot-architecture.md`: Grounded database truth architecture for conversational career guidance.
    - `project-bible/architecture/opportunity-lifecycle-architecture.md`: Formal state machine decoupling `verification_status` from `lifecycle_status`.
    - `project-bible/architecture/recommendation-engine.md`: Multi-factor explainable ranking formula for personalized opportunities.
  - **Core Implementation:**
    - `frontend/src/app/onboarding/page.tsx`: Built modern 3-intent progressive onboarding flow (Looking for Opportunities / Hiring Talent / Both) with semiconductor domain tags.
    - `frontend/src/lib/opportunity-quality.ts`: Implemented deterministic 0–100 quality score calculation (`computeOpportunityQualityScore`).
    - `frontend/src/app/api/resume/route.ts` & `frontend/src/app/api/profile/[userId]/route.ts`: Hardened Bearer authentication and enforced strict 403 Forbidden on cross-user mutation attempts.
  - **Automated Intelligence Audit Suite:**
    - `scripts/phase30c-platform-intelligence-audit.mjs`: Automated 12 tests covering guest preservation, persona activation, quality scoring, and cross-user isolation (100% pass).
  - **Full Automated Verification Matrix:**
    - `npx tsc --noEmit` (frontend): 0 errors.
    - `npm test` across all workspaces: 16/16 test suites passed, 155/155 tests passed (100%).
    - `git diff --check`: Clean formatting.

- **2026-08-28 — Phase 30B: Progressive RBAC Architecture, Multi-Persona Model & Security Hardening (COMPLETE).**
  - **Comprehensive Phase 30B Architecture & Audit Reports:**
    - `project-bible/audits/phase-30b-rbac-implementation-audit.md`: Detailed audit of progressive multi-persona capabilities, guest preservation, and server-side authorization enforcement.
    - `project-bible/audits/phase-30b-database-migration-report.md`: Verified all 21 Supabase entity tables, foreign keys, and RLS policies.
    - `project-bible/architecture/unified-capability-model.md`: Single authenticated identity model supporting non-mutually-exclusive Candidate + Employer + Manager permissions.
    - `project-bible/architecture/authorization-flow.md`: Request authorization lifecycle and fail-closed defense-in-depth specifications.
    - `project-bible/security/rbac-security-model.md`: 12-scenario threat mitigation matrix and sovereign owner protection standard.
  - **Core Authorization Helpers & Open Redirect Protection:**
    - `@berojgardegreewala/api` & `frontend/src/lib/permissions.ts`: Implemented `hasRole()`, `hasPermission()`, `hasAnyPermission()`, `hasOrganizationPermission()`, and `getSafeRedirectUrl()`.
    - `backend/api/src/auth/index.ts`: Hardened admin password and secret token comparison using `timingSafeEqual()` to eliminate side-channel timing attacks.
    - `frontend/src/middleware.ts`: Enhanced destination preservation on guest gated redirects with safe parameter preservation (`redirectTo = pathname + search`).
    - `frontend/src/app/login/page.tsx`: Sanitized post-login redirection with `getSafeRedirectUrl()` to prevent open redirect vulnerabilities.
  - **Automated Security & Multi-Role Attack Suite:**
    - `scripts/phase30b-security-attack-suite.mjs`: Automated 14 tests covering all 12 explicit attack scenarios (100% pass).
  - **Full Automated Verification Matrix:**
    - `npx tsc --noEmit` (frontend & backend): 0 errors.
    - `npm test` across all workspaces: 16/16 test suites passed, 155/155 tests passed (100%).
    - `git diff --check`: Clean formatting.

- **2026-08-28 — Phase 30: Identity, Role Architecture, RBAC & Portal Unification (COMPLETE).**
  - **Discovery Audit Reports & Architecture Specifications:**
    - `project-bible/audits/phase-30-platform-architecture-audit.md`: Mapped 82 frontend routes, 171 backend API endpoints, 21 active Supabase tables, and 7 Neon tables.
    - `project-bible/audits/phase-30-identity-role-architecture-audit.md`: Diagnosed role siloing and established unified identity capability layering.
    - `project-bible/architecture/role-permission-model.md`: Formulated granular permission-based RBAC model across Global Roles (`owner`, `platform_admin`, `manager`, `moderator`, `support`, `user`) and Org Roles (`org_owner`, `org_admin`, `hiring_manager`, `recruiter`, `viewer`).
    - `project-bible/architecture/route-access-matrix.md`: Complete route and API protection matrix.
    - `project-bible/audits/phase-30-database-reality-audit.md`: Cataloged live schema entity relationships, foreign keys, and indexes.
    - `project-bible/audits/phase-30-opportunity-data-audit.md`: Audited all 3,609 live opportunities and defined 0–100 quality scoring lifecycle.
    - `project-bible/architecture/platform-access-architecture.md`: Documented single-app portal philosophy and Preserve-Destination authentication pattern.
    - `project-bible/architecture/database-architecture.md`: Consolidated PostgreSQL relational data models and zero-data-loss migration rules.
    - `project-bible/architecture/ai-intelligence-roadmap.md`: Established grounded truth AI matching engine, AI Career Copilot, and AI Resume Studio blueprint.
  - **Database Migration:**
    - `frontend/supabase/migrations/20260828000001_unified_rbac_and_lifecycle.sql`: Created `user_roles`, `user_permissions`, and `audit_logs` tables; added quality score and verification metadata columns to `opportunities`.
  - **Portal & Navigation Unification:**
    - `frontend/src/lib/permissions.ts`: Created reusable `hasPermission()`, `canAccessRoute()`, and `requirePermission()` authorization helpers.
    - `frontend/src/hooks/useUser.ts`: Enhanced hook to support additive multi-capabilities (`hasEmployerCapability`, `hasManagerCapability`, `globalRole`, `permissions`).
    - `frontend/src/components/Navbar.tsx`: Refactored navigation so employers retain full access to public and candidate features (Opportunities, Feed, Network, Academy) with seamless Employer Portal access in dropdown.
    - `frontend/src/app/page.tsx`: Fixed server-side role resolution to accurately prioritize verified role metadata.
  - **Automated Role Access Test Suite:**
    - `scripts/phase30-role-access-audit.mjs`: Automated 22 tests validating public visitor flows, guest gated actions, candidate journeys, employer multi-capabilities, and privilege escalation prevention (100% pass).
  - **Full Automated Verification Matrix:**
    - `npx tsc --noEmit` (frontend): 0 errors.
    - `npm test` across all workspaces: 16/16 test suites passed, 155/155 tests passed (100%).
    - Browser subagent verification: Tested at 1440px, 768px, and 390px viewports.
    - `git diff --check`: Clean formatting.

- **2026-08-28 — Phase 29: Live Production Reality Audit, End-to-End Validation & Critical Gap Closure (COMPLETE).**
  - **Reality & Validation Reports (`project-bible/audits/phase-29-production-reality-audit.md`, `project-bible/audits/phase-29-feature-reality-matrix.md`):**
    - Executed live production reality verification against production URL `https://berojgardegreewala.vercel.app` and local Next.js server with active Supabase PostgreSQL (`aqauempuwmbizqoaolop`).
    - Verified all 20 active Supabase database entity tables with live query checks (zero PGRST205 table-missing errors).
    - Validated all 23 platform features across Candidate, Employer, and Admin workflows (95.7% Verified Working, 4.3% Partially Working, 0% Mocked, 0% Broken).
  - **API Taxonomy & Proxy Route Closures:**
    - `frontend/src/app/api/categories/route.ts`: Created canonical 8-domain category taxonomy endpoint (`vlsi`, `embedded`, `pcb`, `firmware`, `hardware-qa`, `fpga`, `analog`, `robotics`) eliminating the production 404.
    - `frontend/src/app/api/chat/route.ts`: Created transparent proxy forwarder to `/api/ai/chat` ensuring complete backwards compatibility with chat/AI clients.
    - `frontend/src/app/api/news/route.ts`: Tuned synchronous RSS timeout promise from 2500ms down to 1000ms, safeguarding API response times and preventing downstream request stalls.
    - `frontend/next.config.mjs`: Added `Permissions-Policy` and `X-DNS-Prefetch-Control` security headers alongside existing `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.
  - **Security & Multi-Role Attack Matrix (51/51 Checks Passed):**
    - `scripts/phase29-production-reality-audit.mjs`: Automated 51 tests covering brand purity, API contracts, Supabase entity integrity, candidate/employer journeys, and security attack vectors SEC-01 through SEC-13 (100% pass rate).
  - **Full Automated Verification Matrix:**
    - `npx tsc --noEmit` (frontend): 0 errors.
    - `npm test` across all workspaces: 100% pass.
    - `git diff --check`: Clean whitespace and line endings.

- **2026-08-27 — Phase 28: Real UI/UX Audit, Responsive Polish & Production Reality Check (COMPLETE).**
  - **Reality Audit Report (`project-bible/audits/phase-28-ui-ux-reality-audit.md`):**
    - Executed live browser audit on running application; discovered and cataloged brand name leaks, empty opportunity badge glitches, glued ATS title suffixes, chat container viewport scrolling jerks, and notification query invalidation gaps.
  - **P0 Brand Identity Unification (BerojgarDegreeWala Strict Enforcement):**
    - `frontend/src/components/Navbar.tsx`: Updated logo brand text to `Berojgar<span className="text-blue-600">DegreeWala</span>` with responsive scaling.
    - `frontend/src/components/Footer.tsx`: Removed `(SiliconPath)` suffix from copyright block.
    - `frontend/src/app/layout.tsx`: Removed `alternateName: "SiliconPath India"` from schema.org JSON-LD structured data.
    - `frontend/src/components/profile/PublicProfile.tsx`: Changed badge to `BerojgarDegreeWala Verified Engineer` and fixed profile URL fallback domain to `berojgardegreewala.vercel.app`.
    - `frontend/src/app/employer/talent/page.tsx` & `frontend/src/app/api/employer/invite/route.ts`: Updated reachout placeholder and default message template to reference `BerojgarDegreeWala`.
    - `frontend/src/app/search/page.tsx` & `frontend/src/app/community/page.tsx`: Updated fallback news source to `BerojgarDegreeWala News` and academy link to `BerojgarDegreeWala Learning Academy`.
  - **P0 Opportunity Card Empty Badge & Glued Title Normalization:**
    - `frontend/src/components/OpportunityCard.tsx`: Added `.filter((e) => e.length > 0)` to `eligibility.split(",")` to eliminate empty square border boxes rendered from trailing commas or whitespace items.
    - `frontend/src/lib/scrapers/utils.ts`: Enhanced `cleanTitle` regex to split glued `Intern` / `Internship` suffixes and deduplicate leading/trailing role markers (`Intern - ...Intern`).
    - `frontend/src/__tests__/lib/scrapers-utils.test.ts`: Added unit tests covering intern glue splitting and deduplication (100% pass).
  - **P1 UX, Messaging & Notification Refinements:**
    - `frontend/src/app/messages/page.tsx`: Replaced window-level `scrollIntoView` with `chatContainerRef.current.scrollTop` to prevent whole-page viewport jumping towards the footer when typing or sending messages.
    - `frontend/src/hooks/useNotifications.ts`: Exported `useMarkSingleNotificationRead()` with automatic `queryClient.invalidateQueries({ queryKey: ["notifications"] })`.
    - `frontend/src/app/notifications/page.tsx`: Connected `useMarkSingleNotificationRead()` to item click handlers so unread indicators update instantly.
  - **P2 Scrollbars, Feed Actions & Styling Polish:**
    - `frontend/src/app/globals.css`: Replaced harsh 12px global dark scrollbars with sleek slate scrollbars and created `.no-scrollbar` cross-browser utility.
    - `frontend/src/app/feed/page.tsx`: Applied `.no-scrollbar` to topic tags, added 1-click `Share2` button with clipboard write and toast feedback to post cards, and fixed organization name fallback.
    - `frontend/src/app/network/page.tsx` & `frontend/src/app/search/page.tsx`: Applied `.no-scrollbar` to horizontal tab bars.
  - **Full Automated Verification Matrix (100% PASS):**
    - `scripts/phase28-ui-reality-audit.mjs`: 17/17 passed (100%).
    - `npx tsc --noEmit` (frontend): 0 errors.
    - `npm test` across all workspaces: 16/16 suites, 155/155 passed (100%).
    - Scraper Worker Tests: 30/30 passed (100%).
    - Scraper API Tests: 46/46 passed (100%).
    - `git diff --check`: Clean whitespace and line endings.

- **2026-08-26 — Phase 27: Production Hardening, Security Matrix & Reality Audit (COMPLETE).**
  - **Reality & Security Audit Report (`project-bible/product-roadmap/phase-27-production-hardening.md`, `docs/audit-reports/2026-08-26-phase27-production-hardening-audit.md`):**
    - Independently verified all 10 core production readiness objectives against live Next.js 14 server and Supabase PostgreSQL (`aqauempuwmbizqoaolop`).
  - **Live Multi-User Security & Authorization Attack Matrix (`scripts/phase27-security-two-user.mjs`):**
    - Executed live penetration tests across Candidate (`amittest1`) and Employer (`employertest1`):
      - **SEC-01 (Cross-User Post Edit)**: User B `PATCH /api/feed/posts/[id]` on User A's post -> **BLOCKED (HTTP 403 Forbidden)**.
      - **SEC-02 (Cross-User Post Delete)**: User B `DELETE /api/feed/posts/[id]` on User A's post -> **BLOCKED (HTTP 403 Forbidden)**.
      - **SEC-03 (Anti-Self-Endorsement)**: User A `POST /api/profile/amittest1/endorsements` -> **BLOCKED (HTTP 400 Bad Request)**.
      - **SEC-04 (Unauthenticated Post)**: Anonymous `POST /api/feed` -> **BLOCKED (HTTP 401 Unauthorized)**.
      - **SEC-05 (Unauthenticated Connection)**: Anonymous `POST /api/network/connect` -> **BLOCKED (HTTP 401 Unauthorized)**.
      - **SEC-06 (ATS Privilege Escalation)**: Candidate `PATCH /api/employer/applicants` -> **BLOCKED (HTTP 403/404 Forbidden)**.
      - **SEC-07 (Unauthenticated Messaging)**: Anonymous `POST /api/messages` -> **BLOCKED (HTTP 401 Unauthorized)**.
      - **Result**: 7/7 attack vectors completely mitigated (100% defense rate).
  - **API & Server Hardening:**
    - `frontend/src/lib/supabase/server.ts`: Fixed Next.js async `cookies()` / `headers()` Promise resolution so Bearer tokens from `Authorization` header are reliably extracted and authenticated in all route handlers.
    - `frontend/src/app/api/feed/posts/[id]/route.ts`: Added explicit `maybeSingle()` existence checks and `post.author_id !== user.id` ownership guards returning HTTP 403 / 404.
    - `frontend/src/app/api/profile/[userId]/endorse/route.ts` & `recommendations/route.ts`: Added username resolution (`resolveTargetUserId`) and strict anti-self action guards.
    - `frontend/src/app/api/profile/[userId]/endorsements/route.ts`: Added transparent proxy alias to prevent 404s when plural `/endorsements` is invoked.
    - `frontend/public/robots.txt`: Removed duplicate static file that was conflicting with Next.js dynamic `src/app/robots.ts` and causing HTTP 500 on `/robots.txt`.
  - **LinkedIn-Caliber Visual Alignment:**
    - `frontend/src/components/profile/PublicProfile.tsx`: Upgraded to 2-column layout with dark microchip schematic banner, overlapping circular avatar with emerald `#OpenToWork` ring, top-right company/education badges, "Open to work · Recruiters only" card, and right sidebar with 1-click URL copy and verified badges.
    - `frontend/src/app/feed/page.tsx`: Upgraded to 3-column layout featuring Left Mini-Profile widget, Center discussion feed with domain pills & tag shortcuts, and Right sidebar with SiliconPath Semiconductor News and Verified Openings.
    - `frontend/src/app/network/page.tsx`: Upgraded to 2-column layout featuring Left "Manage My Network" sidebar and rich member discovery cards with banner and avatar presentation.
  - **Full Automated Verification Matrix (100% PASS):**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 passed (100%).
    - Scraper Worker Tests: 30/30 passed (100%).
    - Scraper API Tests: 46/46 passed (100%).
    - `scripts/deep-feature-test.mjs`: 30/30 passed (100%).
    - `scripts/phase27-product-e2e.mjs`: 19/19 passed (100%).
    - `scripts/phase27-security-two-user.mjs`: 7/7 passed (100%).
    - Final Verdict: **PRODUCTION STABLE & RELEASE READY**.

- **2026-08-26 — Phase 27: Product Expansion — LinkedIn-Level Career & Recruitment Experience (COMPLETE).**
  - **Capability Matrix & Priority Roadmap (`project-bible/product-roadmap/phase-27-priority-map.md`):**
    - Mapped all product capabilities across 9 functional waves (Identity, Feed, Networking, Timeline, Discovery, Applications, Talent Sourcing, Search, Notifications).
  - **Wave 1: Professional Identity & Interactive Endorsements (`PublicProfile.tsx`, `app/messages/page.tsx`):**
    - Built interactive skill endorsement toggling (POST/DELETE `/api/profile/[username]/endorsements`) with active visual state and anti-self-endorsement protection.
    - Added universal query param interoperability (`?user=` and `?userId=`) for deep-linking from profiles/network into direct messaging.
  - **Wave 2: Professional Semiconductor Feed & Discussions (`app/feed/page.tsx`, `api/feed/posts/[id]/comment`):**
    - Added domain topic filter pills (`#All`, `#RTL_Design`, `#Verification_UVM`, `#Physical_Design`, `#STA_Timing`, `#Embedded_Systems`, `#Research_JRF`, `#Career_Milestone`).
    - Added composer quick-tag shortcuts and inline expandable discussion threads with real-time optimistic comment submission.
    - Added post author edit and delete controls with confirmation.
  - **Wave 3: Professional Networking Directory (`app/network/page.tsx`):**
    - Built 6-tab networking hub: Recommendations, Received Requests, Sent Requests, My Connections, Followers, Following.
    - Integrated direct 1-click messaging and connection withdrawal/removal capabilities.
  - **Wave 4: Candidate Experience Timeline & Completeness (`app/profile/page.tsx`):**
    - Built candidate experience timeline, education history, projects, certifications, and awards with live score calculator.
  - **Wave 5: Curated Opportunity Discovery & Quick Collections (`OpportunitiesClient.tsx`):**
    - Added 11 quick-filter domain pills: `All`, `🎓 Fresher First`, `⏳ Closing Soon`, `⚡ VLSI RTL`, `🧪 Verification (UVM)`, `📐 Physical Design`, `🔌 Embedded Systems`, `🔬 Research & JRF`, `🏛️ Govt & PSU Labs`, `🎓 PhD Fellowships`, `💼 Internships`.
  - **Wave 6: Candidate Pipeline Tracker & Employer ATS (`app/applications/page.tsx`, `app/employer/jobs/[id]/applicants/page.tsx`):**
    - Built visual 5-stage candidate progression pipeline (`Applied` -> `Screening` -> `Shortlisted` -> `Interview` -> `Accepted`) with recruiter evaluation notes.
    - Enabled direct applicant stage transitions for hiring managers and recruiters.
  - **Wave 7: Recruiter Talent Sourcing (`app/employer/talent/page.tsx`):**
    - Built multi-domain candidate discovery across RTL, UVM, Physical Design, Analog, FPGA, and RISC-V with direct messaging invitations.
  - **Wave 8: Multi-Entity Global Search & Notifications (`app/search/page.tsx`, `api/search/route.ts`, `app/notifications/page.tsx`, `lib/feature-flags.ts`):**
    - Built 6-tab global search across Opportunities, People, Organizations, News, Academy Courses, and Research Guides.
    - Activated LinkedIn-style notification center by default with real-time unread counts.
  - **Phase 27 Verification Suite (100% PASS):**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 tests passed (100%).
    - `scripts/deep-feature-test.mjs`: 30/30 passed (100%).
    - `scripts/phase27-product-e2e.mjs`: 19/19 passed (100%).
    - Final Verdict: **GO**.

- **2026-08-26 — Phase 26: Final Schema/API Contract Audit & Production Release Candidate (COMPLETE).**
  - **Full Schema Inventory & Contract Scan (`scripts/scan-all-db-references.mjs`, `scripts/live-schema-map.json`):**
    - Mapped 58 physical PostgreSQL tables from live Supabase OpenAPI spec.
    - Scanned 100% of source files for `.from()`, `.select()`, `.insert()`, `.update()`, `.eq()`, and filter methods against physical schema columns.
  - **Remediated Schema & Code Mismatches:**
    - `frontend/src/app/page.tsx`: Fixed employer applications query to filter by `opportunity_id IN (employerJobIds)` instead of non-existent `applications.employer_id`.
    - `frontend/src/app/api/employer/saved-candidates/route.ts`: Resolved PostgREST ambiguous relation error on `recruiter_saved_candidates` with clean two-stage candidate profile enrichment.
    - `frontend/src/app/api/employer/talent/route.ts`: Removed non-existent `open_to_work_types` column from `user_profiles` select query; standardized on `getAuthenticatedEmployerUser`.
    - `frontend/src/app/api/resume/route.ts`: Rewrote resume CRUD to use live `user_resumes` physical table with complete ATS scoring synchronization.
    - `frontend/src/lib/email-digest.ts`: Replaced non-existent `subscribers.is_active` with physical column `subscribers.is_verified`.
    - `frontend/src/app/api/sitemap/route.ts`: Replaced non-existent `news_articles.updated_at` with physical column `created_at`.
    - `frontend/src/lib/scrapers/opportunity-scraper-impl.ts`: Replaced non-existent `scrape_sources.source_type` with physical column `adapter`.
    - `frontend/src/lib/academy/queries.ts`: Realigned learning progress and assessment queries with live tables `learning_days`, `user_learning_progress`, and `user_track_assessment_results`.
    - `frontend/src/app/api/profile/avatar/route.ts`: Added strict file extension (`jpg`, `jpeg`, `png`, `webp`) and MIME type whitelists to avatar upload security.
  - **Comprehensive Verification Suite (100% PASS):**
    - Strict TypeScript Typecheck: 0 errors.
    - Jest Unit Tests: 16 suites, 153/153 tests passed (100%).
    - Next.js Production Build: 350+ routes compiled with 0 errors.
    - Runtime Discovery (`scripts/runtime-query-discovery.mjs`): 25/25 endpoints passed.
    - Manual Feature Verification (`scripts/manual-feature-verification.mjs`): 25/25 passed.
    - Deep Feature Suite (`scripts/deep-feature-test.mjs`): 30/30 passed.
    - All Portals Suite (`scripts/test-all-portals-and-features.mjs`): 24/24 passed.
    - Production Smoke (`scripts/production-smoke-test.mjs`): 14/14 HTTP 200 passed.
    - Database Integrity (`scripts/database-integrity-check.mjs`): 3,608 opportunities preserved, 0 duplicates.
  - **Governance Artifacts Generated:**
    - `project-bible/qa/latest/phase-26-schema-contract-audit.md`
    - `project-bible/qa/latest/phase-26-api-contract-audit.md`
    - `project-bible/qa/latest/phase-26-test-integrity.md`
    - `project-bible/qa/latest/phase-26-final-verdict.md`
  - Final Verdict: **GO**.

- **2026-08-26 — Phase 25: SEO Overhaul, Schema.org Structured Data, Avatar Profile Customization, Footer Guides & Error Boundary Fix (COMPLETE).**
  - **Runtime Error Boundary Fix (`frontend/src/lib/opportunities-query.ts`):**
    - Resolved PostgreSQL error 42703 by correcting experience level query filters to reference existing `eligibility` and `title` columns instead of the non-existent `experience_required` column, preventing runtime crashes across guest and authenticated feeds.
  - **Avatar & Profile Photo System (`frontend/src/components/profile/EditProfileModal.tsx`, `api/profile/avatar`):**
    - Created public storage bucket `avatars` on Supabase.
    - Implemented `/api/profile/avatar` route supporting multi-part file uploads (PNG/JPG/WebP up to 3MB) and JSON avatar URL updates.
    - Added interactive avatar picker modal featuring 8 curated high-resolution free semiconductor/scholar avatars (DiceBear Bottts/Personas SVGs) + custom image upload and removal.
    - Updated profile PATCH handler to reliably persist `avatar_url` into `user_profiles`.
  - **Footer & Guide Hub Expansion (`frontend/src/components/Footer.tsx`, `frontend/src/app/resources/page.tsx`):**
    - Linked all 9 expert research guides (JRF guide, JRF vs SRF vs RA, DRDO recruitment, IIT/IISc PhD, fully-funded PhD abroad, global fellowships, NET vs GATE, VLSI roadmap, VLSI career guide).
    - Integrated high-intent semiconductor SEO keyword pills (`ISRO Careers`, `DRDO JRF 2026`, `CSIR Labs Fellowships`, `IIT Microelectronics PhD`, `RTL & UVM Verification`, `Physical Design & STA`).
  - **Schema.org Structured Data & Search Action (`frontend/src/app/layout.tsx`):**
    - Added JSON-LD `@graph` schema markup for `WebSite` (with `SearchAction`) and `Organization` to boost organic search engine indexing.
  - **Quality Gates & Comprehensive Verification:**
    - `scripts/manual-feature-verification.mjs`: 25/25 assertions passed (100%).
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 tests passing (100%).
    - `npm run build`: 350 routes compiled cleanly into production bundle.
    - Final Verdict: **GO**.

- **2026-08-26 — Phase 24: Production Data Contamination Cleanup, Homepage Section Width Alignment & True E2E Acceptance (COMPLETE).**
  - **Homepage Section Container Width Standardization (`frontend/src/components/home/PublicHome.tsx`):**
    - Standardized Portals, FAQ, and Subscribe CTA section widths from restricted `max-w-4xl`/`max-w-5xl` to universal `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`, achieving uniform visual grid alignment across all homepage cards.
  - **Database Contamination Audit & Safe Teardown:**
    - Audited all live Supabase tables (`opportunities`, `applications`, `saved_opportunities`, `user_profiles`, `connections`, `messages`, `notifications`, `company_claims`, `workspace_members`, `recruiter_saved_candidates`).
    - Cleaned 8 historical test accounts (`candidate_b_phase9_*`, `candidate_c_phase9_*`) in dependency-safe order without foreign-key disruption.
    - Preserved 100% of baseline opportunities (3,608 total, 342 verified active, zero past-deadline leaks) and 100% of candidate applications (11/11).
  - **Public Production Smoke Test:**
    - Verified 12/12 live endpoints against `https://berojgardegreewala.vercel.app` (HTTP 200).
  - **Quality Gates:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 tests passing (100%).
    - `npm run build`: 350 routes compiled cleanly into production bundle.
    - Final Verdict: **GO**.

- **2026-08-26 — Phase 22: Product Completeness & Real-World E2E Verification (COMPLETE).**
  - **Comprehensive Multi-Portal E2E Suite:**
    - Executed `scripts/test-all-portals-and-features.mjs`: 24/24 passed.
    - Executed `frontend/scripts/forensic-full-suite.mjs`: 15/15 gates passed (Employer multi-tenant IDOR, ATS stage progression, recruiter settings & team persistence, company claims).
    - Executed `frontend/scripts/candidate-network-e2e.mjs`: 12/12 gates passed (Candidate sub-entities, follow/unfollow, mutual connections graph, direct messaging).
  - **Product Inventory & Gap Assessment:**
    - Created authoritative Product Inventory Matrix (`project-bible/qa/latest/phase-22-product-inventory.md`) across all 15 platform functional areas.
    - Created Feature Gap Report (`project-bible/qa/latest/phase-22-feature-gap-report.md`) confirming complete end-to-end functionality.
    - Generated Phase 22 Final Verdict (`project-bible/qa/latest/phase-22-final-verdict.md`).
  - **Quality Gates:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 tests passing (100%).
    - `npm run build`: 350 routes compiled cleanly.
    - Final Verdict: **GO**.

- **2026-08-26 — Phase 21: Production Hardening, Scraper Constraint Safety & Documentation Reconciliation (COMPLETE).**
  - **Scraper Ingestion CHECK Constraint Safety (`api/cron/scrape-global`, `api/cron/scrape-india`):**
    - Enforced explicit `verification_status: "pending"` insertion across all scraper entrypoints, matching the live Supabase CHECK constraint (`pending`, `verified`, `rejected`, `expired`, `link_unavailable`).
  - **Rate Limiting Hardening (`middleware.ts`):**
    - Mapped `/api/admin` directly to the dedicated 20 req/min rate limiter bucket to mitigate brute-force vector on admin surfaces.
  - **Structured Observability (`lib/logger.ts`):**
    - Added structured `logAuditEvent` helper for recording mutations (job creates, status transitions, admin actions) with zero secret or PII exposure.
  - **Documentation & Architecture Reconciliation:**
    - Reconciled schema references in `ARCHITECTURE.md` confirming `opportunities.created_by` ownership, `workspace_members` table name, and `employer_settings` physical schema.
  - **Quality Gates:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 suites, 153/153 tests passing (100%).
    - `npm run build`: 350 routes compiled cleanly.
    - Multi-Portal Verification Suite: 24/24 tests passed (100%).
    - Final Verdict: **GO**.

- **2026-08-26 — Phase 20: Post-Scraper Forensic Audit & Data Hygiene Remediation (COMPLETE).**
  - **Forensic Audit & Invariant Enforcement:**
    - Performed a 100% census audit of all 3,608 opportunities in Supabase.
    - Quarantined 1 expired opportunity (`Rajasthan RVUNL` - deadline `2026-08-25`) and 1 CSIR CMERI expired listing.
    - Quarantined 10 non-technical/irrelevant listings (clerical, peon, stenographer, agriculture, paleobotany, civil water JRFs, event forums).
    - De-duplicated 84 redundant active listings, retaining the single strongest canonical record per cluster.
    - Realigned 4 industry IC design roles previously tagged as `fellowship` to `industry`.
    - Populated canonical organization names across all 34 public Government & JRF listings.
  - **100% Data Preservation:**
    - Zero rows deleted (Total preserved: 3,608).
    - 100% candidate applications (11/11) and bookmarks (2/2) preserved intact.
  - **Quality & Security Gates:**
    - TypeScript: 0 errors.
    - Jest: 16/16 suites, 153/153 tests passing.
    - Next.js build: 349 routes compiled cleanly.
    - Post-scraper forensic documentation created in `project-bible/qa/latest/post-scraper-audit/` (01 through 11).

- **2026-08-26 — Phase 19: Security Hardening & Timing-Attack Mitigation (COMPLETE).**
  - **Fail-Closed Admin Authentication (`api/admin/auth/route.ts`):**
    - Eliminated hardcoded fallback credentials from bundle source code; the admin route now fails closed (503) if `ADMIN_PASSWORD` or `ADMIN_HMAC_SECRET` is unset.
  - **Constant-Time Secret Verification (`lib/admin-auth.ts`, `middleware.ts`):**
    - Refactored `verifyAdminToken`, `verifyAdmin`, and `verifyCron` to use constant-time `timingSafeEqual` comparison for all direct passwords, tokens, and HMAC signatures.
    - Implemented Edge-compatible constant-time XOR comparison in `middleware.ts` to prevent timing-based credential discovery.
  - **Automated Quality Gate:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 test suites, 153/153 tests passed (100%).
    - `npm run build`: 349 static and dynamic routes compiled cleanly.
    - Full portal test suite: 24/24 passed.

- **2026-08-26 — Phase 18: Canonical Availability Logic & byCategory Bug Fix (COMPLETE).**
  - **Root Cause — byCategory Empty:**
    - The `byCategory` query in `stats/route.ts` selected a non-existent column `posted_at` (actual column: `posted_date`). Supabase silently returned `data: null`, producing `byCategory: {}`.
    - Applied same incorrect `posted_at` column name in 3 other surfaces: `sitemap.ts`, `[slug]/page.tsx`, `stats/route.ts`.
  - **Fix — Column Name Correction:**
    - Renamed all `posted_at` DB selects to `posted_date` across `stats/route.ts`, `sitemap.ts`, `[slug]/page.tsx`.
    - Updated `availability.ts` `hasRecentEvidence()` and `isCurrentlyAvailable()` to accept both `posted_at` (client model) and `posted_date` (DB column) for graceful interop.
    - Updated `utils.ts` `mapDbOpportunityToClient()` to prefer `posted_date` over `posted_at`.
    - Added DB-level `buildAvailabilityDbFilter()` + `.limit(500)` to `byCategory` query for performance.
  - **Live Production Verification:**
    - Stats: `total: 3,608 | active: 399 | verified: 399 | byCategory: {industry:377, government:13, jrf:2, fellowship:7}`
    - All 7 surfaces verified: homepage, opportunities feed, featured, search, stats, sitemap, detail page.
    - Zero runtime errors in Vercel logs.
  - **Automated Quality Gate:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 test suites, 153/153 tests passed (100%).

- **2026-08-24 — Phase 17: Admin Portal Credentials & Comprehensive Multi-Portal Verification (COMPLETE).**
  - **Admin Authentication Hardening (`api/admin/auth/route.ts`):**
    - Configured admin credentials with username `amitkr26` and password `amitkr2622002` using constant-time `timingSafeEqual` verification and HMAC session token generation.
    - Updated session verification and environment variables.
  - **Opportunity Ingestion & Refresh:**
    - Executed live Sarkari & PSU technical scraper ingestion, adding 14 newly verified PSU & Engineering opportunities (NTPC, ISRO, DRDO, Railway Technical, IOCL).
    - Database totals: 3,608 total records, 444 active opportunities, 441 verified active (377 industry, 34 JRF, 21 government, 7 fellowship, 2 internship).
  - **End-to-End Multi-Portal Verification Suite (`scripts/test-all-portals-and-features.mjs`):**
    - Built and executed 24 automated tests across Public, Candidate, Employer, and Admin portals covering SSR feed, category stats, search API, news, academy, network, messages, auth gates, employer ATS pipeline, admin auth/session verification, sitemap, robots, and feedback ingestion: 24/24 tests passed (100%).
  - **Automated Quality Gate:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 test suites, 153/153 tests passed (100%).
    - `npm run build`: 349 static and dynamic routes compiled cleanly.

- **2026-08-24 — Phase 16: Opportunity Dynamic Route Hardening & Category Realignment (COMPLETE).**
  - **HTTP 500 Root Cause Resolution (`/opportunities/[slug]`):**
    - Root Cause: `OpportunityDetailPage` and `generateMetadata` utilized Supabase PostgREST `.single()`, which throws uncaught exceptions when records fall back to dynamic rendering or when joins return missing records.
    - Fix: Refactored to safe `lookupOpportunity(slug)` using `.maybeSingle()`, wrapped in try/catch blocks, gracefully invoking Next.js `notFound()` (HTTP 404) for non-existent records instead of unhandled 500 crashes.
    - Wrapped deadline date parsing in try/catch to protect OpenGraph and metadata generators against non-standard string formats.
  - **Subcomponent Mapping Hardening (`components/SimilarOpportunities.tsx`):**
    - Transformed raw database rows returned by PostgREST to client-typed models via `mapDbOpportunityToClient` before passing to `OpportunityCard`.
  - **Corporate Semiconductor Category Alignment (`scripts/realign-corporate-job-categories.mjs`):**
    - Realigned 377 corporate semiconductor opportunities from legacy `jrf` classification to canonical `industry` category conforming with Postgres check constraints (`opportunities_category_check`).
    - Restored active availability filtering and populated category breakdown statistics (`/api/opportunities/stats`).
  - **Automated Verification:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 test suites, 153/153 tests passed (100%).
    - `npm run build`: 349 static and dynamic routes compiled cleanly.

- **2026-08-23 — Phase 13: Supabase Security Hardening & Penetration Verification (COMPLETE).**
  - **SECURITY DEFINER Audit & Revocation:**
    - All 8 database trigger/counter functions (`auto_username`, `handle_connection_accepted`, `handle_connection_count`, `handle_follow`, `handle_new_user`, `rls_auto_enable`, `update_post_comments_count`, `update_post_likes_count`) have direct execution privileges revoked from `anon`, `authenticated`, and `public`.
    - Function `search_path` hardened to `SET search_path = public, pg_temp;` (and `public, auth` for user provisioning) to eliminate mutable search path risks.
  - **RLS Policy Coverage:**
    - `calendar_exports`: Restricted to `auth.uid() = user_id`.
    - `link_check_logs`: Scoped to `role = 'admin'`.
    - `scrape_sources`: Scoped to `role = 'admin'`.
    - `subscribers`: Public insert protected with email regex validation; select restricted to admin.
  - **Public Schema Extensions:**
    - `pg_net` and `http` in `public` schema: Documented and accepted due to dependencies with webhook triggers and edge events. Compensating controls verified (RLS on underlying tables + endpoint authorization).
  - **Security Advisor Penetration Test:**
    - Anonymous RPC calls to all internal functions returned HTTP 404 / 400 (Blocked).
    - Anonymous queries on RLS tables returned 0 records.
    - Zero regressions across candidate auth, employer lifecycle, ATS stages, and scrapers.
  - **Dedicated Technical & Engineering Scraper (`lib/scrapers/sarkari-scraper.ts`):**
    - Built strict semantic filtering engine targeting only technical, engineering, research, and PSU notifications (Engineers, Junior Engineers, Apprentices, Scientists, B.Tech, M.Tech, Diploma, GATE, ISRO, DRDO, NTPC, BHEL, BEL, Indian Railways, IOCL, ONGC, SAIL, GAIL, HAL, ECIL, C-DAC).
    - Automatically filters out non-technical posts (police, clerical, nursing, teachers, general administrative).
    - Extracts clean titles, organizations, categories, ISO deadlines (`YYYY-MM-DD`), eligibility requirements, stipend/pay scales, official application URLs, and official organization websites.
  - **API Scraper Endpoints (`api/scrapers/sarkari/route.ts` & `api/scrapers/run-all/route.ts`):**
    - Added dedicated `/api/scrapers/sarkari` endpoint with cron/admin authentication protection.
    - Integrated with master `/api/scrapers/run-all` orchestrator.
  - **Verification & Zero Regression:**
    - Live probe test extracted 14 active, unexpired PSU & engineering opportunities (NTPC Engineers, RRB Junior Engineers, MPESB Sub-Engineers, RSSB Junior Engineers, IOCL Apprentices, RVUNL Engineers).
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16/16 test suites, 153/153 tests passed (100%).
  - **Production Environment Probing (`https://berojgardegreewala.vercel.app`):**
    - Probed 14 core routes and discovery APIs on live Vercel deployment:
      - Public routes (`/`, `/opportunities`, `/news`, `/academy`, `/network`, `/messages`, `/profile`, `/admin`, `/sitemap.xml`) returned HTTP 200.
      - Protected routes (`/applications`, `/employer/profile`, `/employer/company`) returned HTTP 307 redirecting to `/login?redirectTo=...`.
      - Core APIs (`/api/opportunities`, `/api/search`) returned HTTP 200 with clean JSON schemas.
  - **Active Opportunity & Slug Integrity Audit:**
    - Audited 25 randomly sampled public-active opportunities: 100% have valid titles, organizations, categories, unexpired deadlines/ongoing status, and reachable apply URLs.
    - Verified 10 random slugs on canonical URLs: verified correct record resolution without UUID collisions.
  - **Deadline Integrity Invariant Check:**
    - Scanned all 431 public-active rows against `today` (2026-08-23): 11 future deadlines, 0 same-day deadlines, 420 ongoing/rolling with source evidence, 0 expired deadlines (0 violations).
  - **Candidate & Employer E2E Workflow & Security Matrix:**
    - Candidate bookmarks: save/unsave mutation & persistence verified.
    - Candidate profile sub-resources: education, experience, projects CRUD verified.
    - Employer job lifecycle: draft, publish, pause, and delete lifecycle verified.
    - Security & IDOR: unauthenticated API access (401), candidate-to-employer API calls (401/403), privilege escalation to admin (401/403/404), cross-user application privacy strictly enforced.
  - **Full Automated Regression:**
    - `npx tsc --noEmit`: 0 errors.
    - `npm test`: 16 test suites, 153 unit tests passing (100%).
    - `npm run build`: 241 static and dynamic routes compiled cleanly.
  - **Final Verdict:** READY FOR PRODUCTION.

  - **Live Database Forensic Audit & Classification (`scripts/deep-opportunity-inspector.mjs`):**
    - Scanned all 3,595 opportunities directly on live Supabase PostgreSQL (`aqauempuwmbizqoaolop`).
    - Identified 2,989 duplicate rows (repeated scraper runs of identical titles/URLs), 57 non-tech irrelevant positions (sales/hospitality), 13 placeholder/synthetic records, 11 expired deadlines, 99 broken/unavailable links, and 85 pending moderation rows.
    - Verified foreign-key dependencies: confirmed 11 candidate applications (across 9 distinct opportunities) and 2 saved bookmarks.
  - **Audit Snapshots in `project-bible/qa/latest/opportunity-cleanup/`:**
    - Published 10 comprehensive markdown audit artifacts: `01-BEFORE-SNAPSHOT.md` through `10-CLEANUP-RESULT.md`.
  - **Non-Destructive Quarantine Execution (`scripts/execute-opportunity-cleanup.mjs`):**
    - Performed safe batch updates without deleting any rows or breaking foreign-key references:
      - 431 Active & Verified genuine semiconductor/VLSI/research openings (`is_active = true`, `verification_status = 'verified'`).
      - 6 Expired openings (`is_active = false`, `verification_status = 'expired'`).
      - 110 Broken link openings (`is_active = false`, `verification_status = 'link_unavailable'`).
      - 2,963 Rejected duplicates / non-tech (`is_active = false`, `verification_status = 'rejected'`).
      - 85 Pending moderation (`is_active = false`, `verification_status = 'pending'`).
  - **Codebase Hardening:**
    - `frontend/src/lib/availability.ts`: Updated `isCurrentlyAvailable` to correctly handle `is_active === null` and `is_active === false`.
    - `frontend/src/app/page.tsx`: Updated fallback and dynamic stats queries to reflect 431 active verified opportunities.
    - `frontend/src/app/opportunities/page.tsx`: Replaced custom server query with canonical `searchOpportunities` service.
    - `frontend/next.config.mjs`: Added `serverComponentsExternalPackages: ["@supabase/supabase-js", "@sentry/nextjs", "@opentelemetry/api"]` for stable module resolution on Windows.
  - **Verification & Zero Regression:**
    - `node scripts/verify-all-routes-live.mjs`: All 8 public, feed, API, XML, and employer routes return HTTP 200.
    - `npx tsc --noEmit`: 0 TypeScript errors.
    - `npm test`: 16/16 test suites, 153/153 unit tests passing.
    - Final Verdict: READY.

- **2026-08-23 — Phase 9: Candidate Professional Identity & Networking (COMPLETE).**
  - **Relational Candidate Sub-Resources Schema & RLS Policies (`20260823000001_candidate_profile_entities.sql`):**
    - Created relational tables: `candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements` with foreign keys referencing `user_profiles(id)` (`ON DELETE CASCADE`), timestamps, check constraints, and RLS policies enforcing public read (when `is_profile_public = true`) and owner-only mutations (`candidate_id = auth.uid()`).
  - **Dynamic Profile Completeness Calculator (`lib/profile-completeness.ts`):**
    - Implemented deterministic, non-simulated 0–100% profile completeness calculation based on real persisted data: Identity (15%) + Avatar (10%) + Bio (10%) + Location (5%) + Skills (15%) + Experience (15%) + Education (15%) + Projects (10%) + Career Preferences (5%).
    - Added unit test suite `src/__tests__/lib/profile-completeness.test.ts` (100% pass).
  - **Sub-Resource APIs & Store (`lib/candidate-profile-store.ts`):**
    - Implemented CRUD API endpoints with IDOR guards:
      - Experience: `GET /api/profile/[userId]/experience`, `GET/POST /api/profile/me/experience`, `PATCH/DELETE /api/profile/me/experience/[id]`
      - Education: `GET /api/profile/[userId]/education`, `GET/POST /api/profile/me/education`, `PATCH/DELETE /api/profile/me/education/[id]`
      - Projects: `GET /api/profile/[userId]/projects`, `GET/POST /api/profile/me/projects`, `PATCH/DELETE /api/profile/me/projects/[id]`
      - Certifications: `GET /api/profile/[userId]/certifications`, `GET/POST /api/profile/me/certifications`, `DELETE /api/profile/me/certifications/[id]`
      - Achievements: `GET /api/profile/[userId]/achievements`, `GET/POST /api/profile/me/achievements`, `DELETE /api/profile/me/achievements/[id]`
  - **Professional Networking, Mutual Connections & Follow System:**
    - Implemented `GET /api/network/mutual` calculating the real intersection of accepted 1st-degree connections between any two users.
    - Added `DELETE /api/network/connections` for disconnecting/removing connections.
    - Enhanced `GET /api/network/suggestions` with explainable scoring (same company +15, same location +8, shared skills +4 per skill, mutual connections +20 per mutual contact).
    - Added Follow/Unfollow endpoints with self-follow prevention.
  - **Enhanced UI Surfaces:**
    - Upgraded `PublicProfile.tsx`: Added Experience timeline, Education history, Projects showcase, Certifications & Honors badges, Dynamic Profile Completeness meter for profile owners, Mutual Connections counter, and direct Message button.
    - Upgraded `EditProfileModal.tsx`: Tabbed modal interface supporting live creation and deletion of Experience, Education, Projects, Certifications, Achievements, and Skills.
    - Upgraded `NetworkPage.tsx`: Added tabs for Suggestions (with mutual connection badges), Received Requests, Sent Requests, My Connections (with filter and Disconnect button), Followers, and Following.
    - Upgraded `/api/employer/talent/[username]`: Enables recruiters to inspect full structured experiences, educations, projects, skills, and completeness scores of candidates.
  - **Forensic Verification & Zero Regression:**
    - `candidate-network-e2e.mjs`: 12/12 Phase 9 forensic validation gates pass.
    - `forensic-full-suite.mjs`: 15/15 release gates pass (dual-employer isolation, settings persistence, ATS pipeline, company claims, security headers).
    - `npx tsc --noEmit`: 0 errors.
    - `npx jest`: 120/120 tests passing (15 test suites).
    - `npm run build`: 241/241 static and dynamic routes compiled. Verdict: READY.

- **2026-08-22 — Phase 8.1: Final Platform Forensic Evidence Gate & IDOR Hardening (COMPLETE).**
  - **Live Database Source of Truth Inspection:**
    - Verified all 5 additive PostgreSQL tables (`opportunities.created_by`, `opportunities.employer_id`, `opportunities.job_status`, `opportunities.screening_questions`, `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members`) and unique indexes (`user_profiles_username_lower_key`, `recruiter_saved_candidates_pkey`, `workspace_members_pkey`, `employer_settings_pkey`) directly against live Supabase PostgreSQL.
  - **Multi-Employer IDOR Attack Matrix:**
    - Executed 7 active cross-employer attack attempts using Employer A (`amit@excompany.in`), Employer B (`employer_b_audit@siliconpath.test`), and Candidate (`amittest1@berojgardegreewala.com`).
    - Verified strict HTTP 403 Forbidden on unowned job reads, job updates, job deletes, applicant list queries, applicant status mutations, and unauthorized job invites.
    - Verified strict HTTP 401 on unauthenticated access and HTTP 403 on candidate access to recruiter routes.
  - **Forensic E2E Gate Suite (`frontend/scripts/forensic-full-suite.mjs`):**
    - 15/15 gates passed including settings persistence lifecycle, team seat mutations and cross-employer isolation, dual-employer analytics scoping against direct SQL queries, full ATS stage progression, candidate saved list lifecycle, company claims submission and admin approval, case-insensitive username uniqueness (`audit_user_2026`, `Audit_User_2026`, `AUDIT_USER_2026`), and live HTTP security response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Strict-Transport-Security`).
  - **Verification:** `npx tsc --noEmit` (0 errors), `npx jest` (117/117 passing), `npm run build` (241/241 routes compiled). Verdict: READY.

- **2026-08-22 — Phase 8.0: Employer Portal Hardening & True End-to-End Database Verification (COMPLETE).**
  - **Root-Cause Fixes & Zero Mock Elimination:**
    - Replaced all local `setTimeout` simulated states in `/employer/company`, `/employer/team`, `/employer/settings`, and `/employer/talent/[username]` with real database-backed API endpoints.
    - Created real persistence routes: `/api/employer/company` (GET/PATCH), `/api/employer/invite` (POST reachout with real `conversations`, `messages`, and `notifications`), `/api/employer/team` (GET/POST/DELETE workspace seats), `/api/employer/settings` (GET/PATCH preferences), and `/api/employer/analytics` (pipeline SQL computations).
    - Built universal `getAuthenticatedEmployerUser(request)` helper in `frontend/src/lib/employer-auth.ts` supporting both cookie sessions and `Authorization: Bearer <token>` headers for seamless browser and automated API authentication.
    - Aligned all opportunity insert schemas with live Supabase PostgreSQL schema (resolved `organization_id`, omitted non-existent `created_by` column, mapped `salary_range`, and enforced lowercase category check constraint).
    - Added status normalization in `/api/employer/applicants` and `/api/employer/applicants/[id]` mapping recruiter stages (`screening`, `shortlisted`, `interview`, `accepted`, `rejected`, `applied`) safely to live PostgreSQL `applications_status_check` constraint.
  - **Stateful E2E Verification (`frontend/scripts/e2e-stateful-audit.mjs`):**
    - 16/16 end-to-end verification steps passed: Unauthenticated 401 gate rejection, Candidate 403 route blocking, Employer position creation (201 Created), Public opportunities stream visibility, Job pause/resume toggling, Candidate application submission (201 Created), Employer ATS applicant discovery, ATS state machine stage advancement (`applied` -> `screening` -> `shortlisted` -> `interview` -> `accepted`), Talent sourcing candidate queries, Direct candidate reachout invitation dispatch, Real bidirectional messaging, Company workspace update persistence, Team seats and settings updates, Real SQL recruitment analytics calculations, and clean test data removal.
  - **Verification Results:**
    - Stateful E2E Audit: 16/16 steps PASS
    - Jest Unit Tests: 14/14 suites, 117/117 tests PASS
    - TypeScript: `npx tsc --noEmit` 0 errors PASS
    - Production Build: `npm run build` (243/243 static and dynamic routes compiled) PASS
  - **Surfaces Separation:** Fully established the platform's 4 authoritative surfaces: Public, Candidate, Employer/Recruiter, and Admin. Employer experience operates within a dedicated Employer Suite shell (`BerojgarDegreeWala | Employer Suite`) with distinct branding, navigation, and zero exposure of candidate-only routes.
  - **Full Routing Matrix:**
    - `/employer` & `/employer/dashboard`: Recruiter cockpit with live DB metric cards, hiring stream, and active postings.
    - `/employer/jobs`: Comprehensive job postings manager with status toggles (All, Active, Paused), 1-click pause/resume, share URL, and direct applicant views.
    - `/employer/jobs/[id]`: Single job performance and scope inspector with direct applicant counts.
    - `/employer/jobs/[id]/edit`: Dedicated position editor.
    - `/employer/jobs/[id]/applicants`: Single position applicant review list.
    - `/employer/post-job` & `/employer/jobs/new`: Multi-step Post Position Studio with standard DST JRF/SRF/VLSI quick presets.
    - `/employer/applicants`: Multi-stage Applicant Tracking System (ATS) pipeline (Applied, Screening, Shortlisted, Interview, Accepted, Rejected) with candidate skill badges and resume preview.
    - `/employer/applicants/[id]`: Full candidate application dossier with verified skills, stage advancement dropdown, and private recruiter notes.
    - `/employer/talent`: Candidate Talent Sourcing search engine with domain and experience filters across verified `user_profiles`.
    - `/employer/talent/[username]`: Talent profile view with Direct Reachout / Invitation modal.
    - `/employer/messages`: Real-time candidate messaging interface backed by shared `conversations` and `messages` tables.
    - `/employer/analytics`: Database-calculated recruitment funnel, conversion velocities, and per-job performance breakdown.
    - `/employer/company` & `/employer/company/edit`: Company & Research Lab workspace profile backed by `company_pages` and `organizations`.
    - `/employer/team`: Team & Recruiter seat management (Owner, Admin, Recruiter, Hiring Manager).
    - `/employer/settings`: Recruiter alert preferences and security controls.
  - **Backend API Suite (`/api/employer/*`):**
    - `/api/employer/jobs` & `/api/employer/jobs/[id]`: Full CRUD with strict IDOR ownership authorization.
    - `/api/employer/applicants` & `/api/employer/applicants/[id]`: Stage mutations and notes with applicant authorization.
    - `/api/employer/talent` & `/api/employer/talent/[username]`: Talent sourcing search endpoints.
    - `/api/employer/analytics`: Dynamic SQL/PostgREST pipeline stage aggregation.
    - `/api/employer/stats`: Cockpit summary metrics.
  - **Global Username Uniqueness:** Guaranteed unique `@username` handles for all accounts (candidates and employers alike) across registration, navigation badge, and public routing.
  - **Candidate Experience Preservation:** Added 1-click "Preview Candidate Board" switcher to navigate public listings without terminating the recruiter session.
  - **Verification:** Unit tests 117/117 passed, `npx tsc --noEmit` exit code 0.

- **2026-08-21 — Phase 7.8: Product UI Refinement & Mature Design System Application across all surfaces (COMPLETE).**
  - **Homepage (`frontend/src/app/page.tsx`):** Implemented editorial, restrained hero with solid surface (`#FAF9F6`), single dominant primary CTA, subordinate secondary actions, compact 3-step "How It Works" workflow, unified monochrome organization spotlight styling with live count indicators, and disciplined 2-card candidate vs employer portal.
  - **Profile (`frontend/src/components/profile/PublicProfile.tsx`):** Replaced legacy dark tokens and decorative gradient banner with solid dark slate cover (`bg-slate-900` + subtle grid texture), clean scannable identity hierarchy (name, `@username` handle, role, location, open-to-work badge), and responsive mobile layout.
  - **Opportunities (`frontend/src/app/opportunities/OpportunitiesClient.tsx` & `OpportunityRow.tsx`):** Switched default view mode to row/list view for rapid professional scanning. Responsive `OpportunityRow` with organization initials avatar, title, organization filter link, category badge, location, stipend, and deadline countdown.
  - **News (`frontend/src/app/news/page.tsx` & `NewsCard.tsx`):** Replaced horizontal scroll overflow on mobile with accessible native `<select>` dropdown (`sm:hidden`) paired with desktop segmented pill tabs (`hidden sm:flex`). Clean NewsCard typography with official source links.
  - **Academy (`frontend/src/app/academy/page.tsx`):** Added explicit prerequisite explanation on locked tracks (e.g. "Pass Track 1 checkpoint to unlock"), with distinct visual states for Completed, In Progress, and Locked tracks.
  - **Dashboard (`frontend/src/app/dashboard/page.tsx`):** Refactored 4-card vertical stack into compact 2x2 grid on mobile (`grid-cols-2 lg:grid-cols-4`) and made application status select dropdown touch-friendly (`min-h-[38px] px-3 py-1.5`).
  - **Search (`frontend/src/components/SearchBar.tsx`):** Added `w-full`, responsive placeholder text, and explicit `aria-label` for mobile viewports.
  - **Verification:** Unit tests 117/117 passed, `npx tsc --noEmit` exit 0, production build 237/237 pages generated successfully.

- **2026-08-20 — Admin Portal Full Control & Moderation Suite + Footer Redesign Refinement.**
  - **Admin Portal Full Control (`frontend/src/app/admin/page.tsx`):** Upgraded main Admin cockpit to a full-featured management console. Added complete Opportunity CRUD & Moderation (Search, Filter by Verification Status & Category, 1-click Approve/Verify, 1-click Reject, Delete with confirmation, direct link to Edit), Scraper Stream Logs with per-source manual sync buttons, Subscriber Management with CSV export and weekly email digest trigger, embedded AI Token Telemetry, and comprehensive sidebar navigation to all specialized admin hubs.
  - **Admin Sub-pages Session Persistence & API Client Integration (`add-opportunity`, `edit-opportunity/[id]`, `companies`, `announcements`, `applications`, `talent-pool`, `scrape-health`):** Integrated automatic session verification on mount across all sub-pages using `localStorage.getItem("admin_token")` and `sessionStorage.getItem("admin_password")`, eliminated raw unauthenticated `fetch` calls in favor of `@/lib/api-client`, and added unified back navigation.
  - **Footer Refinement (`frontend/src/components/Footer.tsx`):** Cleaned up unnatural parenthetical text (`@username`) and awkward color mismatches from footer navigation. Streamlined categorized links for Opportunities, Guides & Academy, Portals & Tools, and added live scraper sync indicator.
  - **Verification:** `npx tsc --noEmit` exit code 0 across entire frontend.


- **2026-08-20 — UI/UX Overhaul & Premier Research Spotlight (ISRO, DRDO, CSIR, IITs) + Content Depth Expansion.**
  - **Homepage & Premier Spotlight (`frontend/src/app/page.tsx`):** Added dedicated interactive spotlight for top government & research institutions (ISRO, DRDO, CSIR CEERI, IIT Bombay/Madras, C-DAC/BEL, Intel, Qualcomm, AMD, Arm) featuring live badges, direct search filter links, and research domain scope.
  - **Click-to-Filter Organization Integration (`OpportunityCard.tsx`, `OpportunityRow.tsx`, `OrganizationsClient.tsx`):** Made organization names everywhere clickable, navigating directly to `/opportunities?search=${encodeURIComponent(orgName)}` with event propagation guards. Fixed category filter tabs in `OrganizationsClient.tsx`.
  - **Substantial Content Depth Expansion:** Added authoritative government research fellowship reference section with DST/CSIR stipend scales (JRF ₹37,000/mo, SRF ₹42,000/mo, RA ₹58,000–₹67,000/mo, Scientist 'B' Level 10), GATE/NET eligibility matrix, application document checklist, and 6 semiconductor specialization pathways (Digital RTL, UVM Verification, Physical Design STA, Analog RFIC, FPGA Embedded, Cleanroom Fab & MEMS).
  - **Opportunities Page Enhancement (`OpportunitiesClient.tsx`):** Added premier organization quick-filter pill bar (ISRO, DRDO, CSIR, IIT Bombay, Qualcomm, Intel, ARM, AMD) under the search bar for instant 1-click filtering.
  - **Verification:** 305/305 tests passing monorepo-wide (117 frontend + 188 backend), `npx tsc --noEmit` exit 0, dev server active on localhost:3000.

### Changed
- **2026-08-20 — Frontend redesign Content/static group (AGENT 9): about, search, categories, companies, organizations detail, resources hub, all 8 static resource guides verified on the restrained light brutalist system; 7 shared opportunity components migrated off dark-era/raw-shadow styling.** Visual-only refactor; zero logic/API/SEO changes (metadata, JSON-LD FAQ schemas, h1 structure, scrape count queries, follow buttons, live stats all preserved verbatim). Components: `frontend/src/components/ReviewsSection.tsx` (5× `border-3`+raw `shadow-[6px_6px…]` → `border-2` + `shadow-brutal`/`-sm`/`-lg` tokens, tag `border` → `border-2`), `FaqSection.tsx` (same token migration; open-state blue header + category pill `border` → `border-2`), `SubscribeSection.tsx` (banner `border-3`+raw shadow → `border-2`+`shadow-brutal-lg`, badge `rounded-lg` → `rounded-full`, benefit chips `border border-blue-400/40 rounded-md` → `border-2 border-white/20 rounded-full`, form input `shadow-[3px_3px]`/`focus:shadow-[5px_5px]` → `shadow-brutal-sm`/`focus:shadow-brutal`, submit button → `shadow-brutal`/`hover:shadow-brutal-lg`, `text-cyan-300` icon → `text-blue-100`), `SubscribeModal.tsx` (`border-3`+raw `shadow-[8px_8px…]` → `shadow-brutal-lg`, `backdrop-blur-xs` → `backdrop-blur-sm`, close button `border` → `border-2`, 2 inputs + category chips + submit → `shadow-brutal-sm`/`focus:shadow-brutal` tokens, success box conflicting `py-6…p-4` padding deduped), `ReportIssueModal.tsx` (full dark-era → light: `bg-navy-light border-gray-700` → `bg-white border-2 border-slate-900 rounded-2xl shadow-brutal-lg`, `text-text-*` → slate scale, `accent-cyan` → `accent-blue-600`, textarea `bg-gray-800` → white brutal input, `bg-cyan text-navy` submit → `bg-blue-600 text-white font-black` primary), `OpportunityDisclaimer.tsx` (`bg-gray-800/40 border-gray-700/50 text-cyan` dark panel → `bg-slate-50 border-2 border-slate-900 rounded-2xl shadow-brutal-sm`, `text-text-primary`/`text-text-muted` → slate-900/slate-600, official link → `text-blue-600 font-bold`), `ApplyButton.tsx` (`bg-gradient-to-r from-cyan to-cyan/80 text-navy` → `bg-blue-600 hover:bg-blue-700 text-white font-black border-2 border-slate-900 shadow-brutal hover:shadow-brutal-lg`, unavailable variant `bg-amber-500/20 text-amber-400 border-amber-500/30` → solid `bg-amber-400 text-slate-900 shadow-brutal-sm` with `text-amber-700` hint). Pages verified already on-system at commit `21db074` (AGENT 8-10 coverage): `frontend/src/app/{about,search,categories,companies,companies/[slug],organizations/[slug],resources}/page.tsx` + `resources/{vlsi-careers,phd-guide,net-vs-gate,jrf-guide,international-fellowships,jrf-vs-srf-difference,fully-funded-phd-vlsi-abroad,drdo-recruitment-electronics}/page.tsx` — working tree matches HEAD, no further diff needed. `vlsi-career-guide` pure redirect + `contact`/`organizations` pages (AGENT 6/8-10 territory) untouched. Verified: `npx tsc --noEmit` exit 0.
- **2026-08-20 — Frontend redesign Admin dark-shell + employer group (AGENT 8): all 11 admin routes + `admin/error.tsx` + `admin/_components/AIAnalyticsPanel.tsx` migrated off the lying legacy tokens to a coherent dark-shell system; employer light pages refined to the restrained brutalist system.** Visual-only refactor; zero logic/API/handler/password-gate/feature-flag changes. Admin files: `frontend/src/app/admin/page.tsx` (cockpit — `font-black`→`font-bold`, colored glow shadows→`shadow-sm`, decorative purple accents→single blue `#2563EB`, login focus rings unified), `admin/error.tsx`, `admin/analytics/page.tsx`, `admin/add-opportunity/page.tsx` (gate wrapped in dark card), `admin/add-news/page.tsx`, `admin/announcements/page.tsx`, `admin/applications/page.tsx` (semantic status colors preserved), `admin/companies/page.tsx`, `admin/edit-opportunity/[id]/page.tsx`, `admin/performance/page.tsx`, `admin/scrape-health/page.tsx` (own `bg-bg-primary`→`bg-slate-950`, `x-admin-password` flow untouched), `admin/talent-pool/page.tsx`, `admin/_components/AIAnalyticsPanel.tsx` (white brutalist islands inside the dark cockpit → dark slate-900 panels). Dark recipe: slate-950 shell (AppLayout untouched), slate-900 cards with `border-slate-800` subtle borders, slate-800 inputs with a single blue focus ring (`focus:border-blue-500 focus:ring-1 focus:ring-blue-500`), semantic emerald/amber/red status colors, `rounded-3xl`/`shadow-2xl`/raw brutal shadows removed. Lying tokens eliminated: `bg-cyan text-navy` buttons → `bg-blue-600 text-white`, `bg-navy`/`bg-surface`/`bg-bg-primary`/`text-text-*` → slate scale. Employer files: `frontend/src/app/employer/dashboard/page.tsx` (Button/Card/Badge primitives, `border-2` job selector with blue selected state, `shadow-glow-btn` removed), `employer/post-job/page.tsx` + `employer/company-claim/page.tsx` (Input/Select/Button primitives, brutal textareas matching the Input recipe). `applications/page.tsx` skipped — AGENT 7's file. Verified: `npx tsc --noEmit` exit 0. Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-8.md`.
- **2026-08-20 — Frontend redesign Auth/Profile/Tools group (AGENT 7): login, signup, onboarding, profile editor, resume builder, applications, dashboard migrated to the light brutalist system.** Visual-only refactor; zero logic/API/handler/state changes (login email-or-username resolution + password + Google OAuth, signup 2-step seeker/provider flow + debounced username check + suggestions + auto-login/confirmation fallback, onboarding profile/org creation, ProfileEditor skill PATCH + share/edit modal, resume builder fetch/save/ATS/print + accent/font customizer, applications withdraw, dashboard bookmarks/alerts/deadlines + status mutation all preserved verbatim). Files: `frontend/src/app/login/page.tsx` (card `border-4`+raw shadow → `Card` primitive + `shadow-brutal` token, Google + submit → `Button` primitives, email/password → `Input` primitive with label prop, password eye toggle kept via positioned sibling, emerald "Join as Employer" link → single blue accent), `frontend/src/app/signup/page.tsx` (role switcher `border-3`+raw shadow → `Card` + `Button` primary/ghost tabs, `border-t-8` role accent → 6px blue top strip on `Card`, form inputs → `Input`/`Select` primitives, `@` prefix + live availability icons preserved, submit → `Button` with loading/arrow states, confirm-sent screen → `Card` + `Button`, provider role no longer emerald — one blue accent per view), `frontend/src/app/onboarding/page.tsx` (dark-era `bg-bg-secondary`/`border-border`/`text-text-*` inputs → `Input`/`Select` primitives + `Card` container, `bg-accent` submit → `Button`), `frontend/src/app/profile/page.tsx` + `frontend/src/app/profile/[username]/page.tsx` (server wrappers — no visual surface; verified unchanged, `PublicProfile.tsx` not in this agent's file list), `frontend/src/components/profile/ProfileEditor.tsx` (bg `#F3F2EF` → `bg-bg-primary`, 5× `border-3` + raw `shadow-[6px_6px…]` cards → `Card` primitive, avatar ring → `ring-4 ring-white`, skill chips → `border-2` brutal chips + `Input` + `Button`, link rows unify to blue accent, edit/share → `Button` primitives), `frontend/src/app/resume/page.tsx` (dark-era `bg-surface`/`border-border`/`text-text-*`/`btn-glow`/`shadow-glow-btn` → `Card`/`Button`/`Input`/`Select` primitives + `SectionHeader`, tab bar → `Button` primary/ghost, accent-color default `#00E5FF` → brand blue `#2563EB`, ATS panel → `Card`, print flow preserved), `frontend/src/app/applications/page.tsx` (cards → `Card` primitive, status pills → `Badge` with semantic tones: accent=applied/reviewed, neutral=submitted, purple=shortlisted, amber=interview, emerald=accepted, red=rejected; empty state → `Card flat` + `Button`), `frontend/src/app/dashboard/page.tsx` (stat cards/panels → `Card`, header → `SectionHeader` + `Button`, status `<select>` → `border-2` + `shadow-brutal-sm` with semantic colors, resume gauge stroke `#1E2A3F`/`#22D3EE` → muted/`#2563EB`, deadlines `Clock` keeps semantic amber). `tsc --noEmit` exit 0. Session report: `docs/session-reports/session-2026-08-20-frontend-redesign-agent-7.md`.

- **2026-08-20 � Frontend redesign News/Social group (AGENT 6): news index+detail, feed, network, messages, notifications, community post detail + ConnectionCard/MessageThread migrated to the light brutalist system.** Visual-only refactor; zero logic/API/query-param/handler changes (news tabs/search/daily-monthly toggle/sync handler, feed create/like/delete + redirect gating, network 4-tab logic + connect/respond/loadRequests + query invalidation, messages `?conv=`/`?user=` routing + polling subscriptions via hooks, notification mark-read mutations + FEATURES flag, community vote/comment handlers all preserved verbatim). Files: `frontend/src/app/news/page.tsx` (hero `border-3`+raw shadow ? `border-2`+`shadow-brutal-lg`, sync/refresh ? `Button` primitives, view toggle + category tabs ? `rounded-full` pills, containers ? `Card`/`Badge`/`cn`, body copy `font-black` ? `font-bold`/`font-medium`), `frontend/src/app/news/[slug]/page.tsx` (migrated off `glass-premium`/`rounded-3xl` ? `Card` primitive + `border-2` brutal tokens; source pill/tags ? brutal chips; server component + `revalidate`/metadata untouched), `frontend/src/app/feed/page.tsx` (composer/post/sidebar/empty surfaces `bg-bg-secondary` ? `Card` primitives, avatar squares + like/comment/repost pills brutalized, sidebar header ? uppercase micro-label), `frontend/src/app/network/page.tsx` (header/tabs/empty states ? `Card`/`Badge`/`Button`, tab buttons ? pills, suggestion/received/sent cards ? `Card hover` with preserved onClick navigation, loading skeleton `border-3` ? `border-2`, `FALLBACK_AVATAR` constant deduped), `frontend/src/app/messages/page.tsx` (panels/avatars/headers ? brutal cards + tokens, search input + thread via `MessageThread`, `?user=`/`?conv=` deep-link + hook polling preserved), `frontend/src/app/notifications/page.tsx` (migrated off `text-text-inverted`/`bg-accent/5`/`bg-surface` ? `Card`/`Badge`/`Button`/blue accent, unread/read hierarchy via border tone + `shadow-brutal-sm`), `frontend/src/app/community/[id]/page.tsx` (post + comments cards ? `Card`/`Input`/`Button`, upvote box ? bordered brutal control, category/tags ? brutal pills), `frontend/src/components/ConnectionCard.tsx` (`border-3`/raw shadows ? `shadow-brutal` tokens + `Button` primitives), `frontend/src/components/MessageThread.tsx` (raw `[var(--...)]` CSS vars ? Tailwind tokens: blue bubbles + brutal border/shadow, input bar ? white surface + brutal textarea), `frontend/src/components/shared/EmptyState.tsx` (raw CSS vars ? Tailwind tokens; used only by messages page), `frontend/src/components/ui/Card.tsx` (added optional `onClick` prop so card-level navigation handlers survive primitive migration). `tsc --noEmit` exit 0.

- **2026-08-20 - Frontend redesign Opportunities/category group (AGENT 4): opportunities index, detail, location, category pages + FilterBar/SearchBar migrated to the light brutalist system.** Visual-only refactor; zero logic/API/query-param/link/handler changes (fetch pipelines, pagination, AI chips, mobile filter drawer, apply/save/share, deadline countdowns, similar opps all preserved verbatim). Files: `frontend/src/app/opportunities/page.tsx` (spinner border-4 -> border-2, bg-[#FAF9F6] -> bg-bg-primary, loading copy font-black -> font-bold), `frontend/src/app/opportunities/OpportunitiesClient.tsx` (glass-premium sidebar wrapper removed so FilterBar is the single card - flat hierarchy; btn-glow Apply Filters/Reset All/Load More -> Button primitives; AI chips -> Badge primitive; loading/empty states -> Card tone="flat"; raw shadow-[2px_2px...]/shadow-2xs -> shadow-brutal-sm tokens; dead ShieldCheck/EyeOff imports removed; bg-slate-50 -> bg-bg-primary; body copy font-bold -> font-medium), `frontend/src/app/opportunities/[slug]/page.tsx` (header card -> Card tone="default"; desktop/mobile Quick Facts -> Card tone="flat"/brutal container; skills chips -> Badge tone="neutral"; tags -> border-2 brutal pills; sidebar official-website link -> secondary-button styling; section headings font-bold -> font-black), `frontend/src/app/opportunities/location/[city]/page.tsx` (migrated off the dark-cyber spec: text-white/#00E5FF/#94A3B8/#1A2438/#1F2937 -> semantic light tokens + single blue accent; empty state -> Card + Button; unused notFound import dropped), `frontend/src/app/category/[category]/page.tsx` (description + empty state -> Card primitives; opp link rows -> Card hover; CTAs -> Button; h1 font-bold -> font-black), `frontend/src/app/category/[category]/loading.tsx` (dark-era bg-navy-light/border-gray-800 -> bg-white border-2 border-slate-900 rounded-2xl), `frontend/src/components/FilterBar.tsx` (container border-3 + raw shadow -> Card primitive; font-black ALL-CAPS header labels -> font-bold sentence case; per-section emerald/purple active accents unified to single blue accent; raw shadows -> shadow-brutal-sm), `frontend/src/components/SearchBar.tsx` (hand-rolled input -> Input primitive with pl-10 icon slot). Verified: all 8 files compile; project-wide `npx tsc --noEmit` reports exactly 1 pre-existing error in `frontend/src/app/academy/[track]/day/[day]/page.tsx` (CheckCircle2 missing import - another agent's in-flight file, untouched here).
- **2026-08-20 — Frontend redesign Academy group (AGENT 5): all 4 academy routes + 2 academy components migrated to the light brutalist system.** Visual-only refactor; zero logic/API/handler changes (completion persistence, quiz scoring, gating, unlock logic, toasts all preserved verbatim). Files: `frontend/src/app/academy/page.tsx` (track hub — hero CTA via `Card tone="accent"` + `shadow-brutal-lg`, track cards via `Card`/`Badge`/`Button` primitives with locked/passed/active states, trusted-resource + EDA-tool grids flattened to card-on-flat hierarchy with `SectionHeader`), `frontend/src/app/academy/[track]/page.tsx` (removed dark-era glow div, `bg-bg-secondary` chips → slate-100 pills, day list migrated to primitives with emerald completed / blue active / slate locked states, amber "warning" gating-assessment CTA → semantic emerald success), `frontend/src/app/academy/[track]/day/[day]/page.tsx` (markdown renderer + completion panel: `border-3` → `border-2`, raw `shadow-[x_x_0_0_#0F172A]` → `shadow-brutal`/`-sm`/`-lg` tokens), `frontend/src/app/academy/[track]/assessment/page.tsx` (pass/fail result card emerald/red semantic, text answers via `Input` primitive, retry/review via `Button` danger/secondary), `frontend/src/components/academy/PracticeQuiz.tsx` (question cards via `Card`, difficulty via `Badge` tones, correct/wrong option states emerald/red, `Input` primitive), `frontend/src/components/academy/YoutubeEmbed.tsx` (video card via `Card hover`, token shadows). `tsc --noEmit` clean for all 6 files; project-wide run reports 8 pre-existing errors in `frontend/src/app/network/page.tsx` only (other agent's in-flight work, untouched here).
- **2026-08-20 — Frontend redesign Phase 0-1: visual audit + design system foundation (AGENT 1).** New `project-bible/02-design/FRONTEND-REDESIGN-AUDIT.md` (full 67-route inventory, token forensics, design principles). Foundation: `tailwind.config.ts` reconciled to one source of truth (added `borderWidth.3` — `border-3` was used in 90+ components but never existed in the default scale, silently rendering 0px borders; fixed lying legacy aliases `navy`/`cyan` documented as legacy-only; `accent-yellow`/`warning`/`border-subtle` CSS vars corrected to match config), `globals.css` cleaned (single scrollbar rule replacing two competing blocks, `--accent-yellow`/`--warning`/`--border-subtle` fixed, brutal aliases mapped not hidden), `cn()` now uses `tailwind-merge`, new `frontend/src/components/ui/` primitives (`Button`, `Card`, `Badge`, `SectionHeader`, `Input`/`Select`). Verified: `tsc --noEmit` clean, scrapers-utils 17/17.
- **2026-08-20 — Fix #18 consistency: all scraper skipPatterns aligned with `utils.ts` (`\bsearch\b`).** 4 scrapers (`india-academic`, `india-psu`, `global-semiconductor`, `international-academic`) had hardcoded copies of GARBAGE_TITLE_PATTERNS with unanchored `search` that false-positive matched "Research" titles. Changed to `\bsearch\b` in all 4, matching the fix already shipped in the shared `utils.ts`. Files: `frontend/src/lib/scrapers/{india-academic,india-psu,global-semiconductor,international-academic}-scraper.ts`. Commit `7b05209`.
- **2026-08-20 — Phase 8: First government scraper replica — ISRO into `backend/worker` (COMPLETE).**
  - **Selection (evidence-based):** ISRO over DRDO/CSIR — all three live 200; ISRO richest parse (21 `<tr>` rows, ~13 kept); title anchors are the full titles; real July–Aug 2026 notices on the live page. Matrix order: ISRO first in the government block.
  - **New `backend/worker` ISRO replica:** `src/scrapers/isro.ts` (pure `parseISROCareersHtml` + deps-injected `scrapeISRO`), `opportunity-utils.ts` (ScrapedOpportunity, GARBAGE_TITLE_PATTERNS, cleanTitle, slugify, normalizeUrl, normalizeCategory, toDeadlineDate — ported verbatim), `org-resolve.ts` (evidence-gated resolveOrganization + extractBoardToken + looksLikePersonName; P0.3 guard: never create orgs from bare person names), `run-isro-scrape.ts` (dedup source_url orig+normalized OR title ilike; slug collision `-${Date.now()}`; insert `{…, verification_status:"pending", is_active:true, source_type:"scraped"}`; health persistence with the REAL `scrape_sources` uuid; structured summary). `src/index.ts` gains the `isro` subcommand (`node dist/index.js news|isro`); `package.json` adds cheerio ^1.2.0 (already in the root lockfile — no new third-party dep) + `start:isro`.
  - **Production bugs surfaced (evidence-backed, documented — frontend untouched per mandate):** #16 — Vercel cron writes `verification_status:"unverified"`, which violates the live CHECK (`pending/verified/rejected/expired/link_unavailable`) → **silently ZERO opportunity inserts since 2026-08-02** (`max(created_at)` across all opportunities = 2026-08-02; 3240 verified / 29 link_unavailable / 3 expired / 0 pending / 0 unverified; live probe: `unverified` → 23514 rejected, `pending` → accepted, both rolled back with zero residue). #17 — the live ISRO page anchors now end in " Read More" → the garbage filter rejects all 18 live rows (production ISRO scraper outputs 0 today). #18 — `GARBAGE_TITLE_PATTERNS` token `search` matches inside "Research" → Research roles always dropped.
  - **Replica divergences (deliberate, documented in BACKEND-PARITY-MATRIX):** TLS verification ON (frontend's `NODE_TLS_REJECT_UNAUTHORIZED=0` dropped — site serves valid certs), fail-loud on HTTP non-ok (worker exit-1 contract), insert `pending` (CHECK-valid), real source_id for health rows (frontend passes the source NAME string into a uuid column — also silently broken there).
  - **Verification:** worker 30/30 (17 news + 13 ISRO incl. frontend-vs-replica parity on frozen HTML), server 46/46, api 97/97, ai-gateway 15/15; tsc × 4; server build; frontend build exit 0; production E2E 9/9 (zero residue pre-run). Live smoke × 2: fetched 18 / inserted 0 / duplicates 0 / skipped 18, exit 0, idempotent — zero inserts is **honest parity** with the frontend's 0-row live output (#17/#18); insert path proven by deterministic tests + the live `pending` CHECK probe. Health persisted: `scrape_sources` ISRO row (`bcd8749d-…`, consecutive_failures 0) + 2 success `scrape_runs` (results_count 18) with the real source_id; opportunities unchanged (28 rows, 0 pending) — no fabricated data anywhere.
  - Docs updated: REPLICA-MIGRATION-MATRIX (ISRO → REPLICATED), KNOWN_ISSUES (#16/#17/#18), ARCHITECTURE (Phase 8 CURRENT + worker row + transition), IMPLEMENTATION_STATUS, AGENT_STATE, AGENT_HANDOFF (v1.7.0), 09-scrapers/14-devops/16-operations READMEs, BACKEND-PARITY-MATRIX (worker evidence T:worker 17 → 30 + `isro` row). Session report: `docs/session-reports/session-2026-08-20-phase-8-first-government-scraper.md`.
- **2026-08-20 — Phase 7: Backend replica validation — Vercel stays production, Render is an independent FREE-tier replica (PASS).**
  - **Architecture decision (owner mandate):** Render is NOT a production dependency. No Vercel→Render calls anywhere; production Next.js APIs + Vercel cron unchanged; the two systems only share the same Supabase database. `render.yaml`: `plan: starter` → `plan: free`, `crons:` section **removed** (Render cron is NOT part of the architecture — KNOWN_ISSUES #14 CLOSED as NOT REQUIRED / OUT OF SCOPE, replacing the "add a billing card" owner action). The worker stays in the image, independently runnable on demand.
  - **New `backend/docs/BACKEND-PARITY-MATRIX.md`** (authoritative; supersedes `FRONTEND-BACKEND-MAP.md` which is marked SUPERSEDED): full route inventory — 136 production Next.js API route files → 48 REPLICATED, 5 PARTIALLY REPLICATED, 28 CRON/WORKER (production scheduler surface, stays on Vercel), ~55 FRONTEND-INTERNAL/NOT REPLICATED. Verified-differences section (news list live-RSS merge, applications PATCH status whitelist, profiles/:username scope, admin stats-only, rate-limit parity).
  - **New `project-bible/09-scrapers/REPLICA-MIGRATION-MATRIX.md`**: 21 scraper modules + 14 API surfaces inventoried by type (RSS/custom HTTP/ATS/government/institutional/search/other) — news RSS is REPLICATED; the opportunity/ATS/govt fleet is explicitly NOT copied yet (owner mandate §16; port deferred to a later phase).
  - **Backend independence re-verified:** zero runtime `frontend/*` imports in `backend/**` (comments + build-time Docker COPY `frontend/package.json` for root-workspace `npm ci` only — documented exception in `backend/server/Dockerfile`).
  - **Regression + live verification:** server 46/46, api 97/97, ai-gateway 15/15, worker 17/17; typecheck × 4; server+worker builds; frontend build exit 0. Live replica smokes: `/health` 200 (**cold start 22.1 s** — Render free idle boot, warm `/health/ready` 1.7 s), 10 protected endpoints → 401, `GET /api/v1/cron/news-sync` → 403 (missing + wrong secret), public reads 200 (news list + `:slug`, opportunities, organizations, search people/global, profiles/:username). Production E2E **9/9** — root-caused 2 flaky connection specs to a stale **accepted** connection left by the social-workflow spec (terminal state of the test); deleted via the Management API pre-run, cleaned post-run; `reset-test-social.mjs` path-hardcode fixed (and its stale-local-key blocker documented in KNOWN_ISSUES #6/#1).
  - Docs updated: ARCHITECTURE (Phase 7 CURRENT statement + AI/stale-deployment sections), IMPLEMENTATION_STATUS, KNOWN_ISSUES (#0 caveat, #6 root cause, #14 CLOSED), AGENT_STATE, AGENT_HANDOFF (v1.6.0). Session report: `docs/session-reports/session-2026-08-20-phase-7-backend-replica-validation.md`.
- **2026-08-20 — Phase 6.6: Groq model fix + worker exit fix + embed mapping fix + final verification (PARTIAL — Render cron still blocked on billing).**
  - `fix(ai)` commit b32f3d7: `backend/ai-gateway/src/gateway/index.ts` `PROVIDER_CONFIG.groq.model` `llama-3.1-8b-instant` (retired by Groq) → `qwen/qwen3.6-27b` (verified in the live Groq `/v1/models` list; same OpenAI-style chat-completions contract). Gateway test expectations updated (`__tests__/gateway.test.ts`). Model id only — prompts, fallback order, response contract, telemetry, safety untouched. KNOWN_ISSUES #15 FIXED. Verified live: backend `POST /api/v1/ai/summarize` → 200 `{provider: "groq", model: "qwen/qwen3.6-27b"}` (3s); db1 `ai_usage_log` row `api-ai-summarize` success=true (prompt_len 304 / resp_len 2698, no credentials in row); frontend production `/api/ai/summarize` → 200 with real summary.
  - `fix(worker)` commit c7928ed: `backend/worker/src/index.ts` — the CLI stayed alive forever after completing its work (6 active TLSSocket handles from aborted feed bodies kept the event loop open; summary printed but process never exited, which would turn a successful Render cron run into a timeout). Fix: write the summary to stdout, then `process.exit(code)` from the write callback (exit-code contract 0/1/2 preserved). Verified in production mode: Run A inserted 5 rows (news_articles 280 → 285, `created_at` 05:55 UTC, `is_active` true), Run B exit code **0**, fetched 92 / inserted 0 / duplicates 0 — idempotent, count stable at 285 across 3+ re-runs; `scrape_runs` + `scrape_sources` persisted. KNOWN_ISSUES #12 CLOSED (caveat: executed locally in production mode — the Render cron itself is pending #14).
  - `fix(server)` commit 3edceff: `backend/server/src/repositories/opportunities.ts` — the 6.5 embed select fix (`organizations(name, slug, website)`) stopped the 500s but `mapRow` returned only `name`, silently dropping slug/website. Mapper + `Opportunity` type now expose `{name, slug, website}`. Verified live (Western Digital row has website in db1 and in the API embed). 46/46 green.
  - Render cron re-verification: `POST /v1/services` (`type: cron_job`, runtime docker, schedule `0 6 * * *`, plan `starter`, command `node --import tsx backend/worker/dist/index.js news`, dockerfile `./backend/server/Dockerfile`, env SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) → **402 Payment Required**; `GET /v1/owners/tea-d91n0jeq1p3s73c8k1vg` → `billingCheckState`/`paymentType`/`availablePlans` all empty (only one workspace under the API key). KNOWN_ISSUES #14 stays OPEN — the billing card has not landed on the Amitkr26 workspace yet.
  - Full regression: server 46/46, api 97/97, ai-gateway 15/15, worker 17/17; typecheck × 4; backend builds; frontend build compiled; production E2E **9/9** (residue cleaned before + after via db1-sql.mjs); CORS allow/block + auth 401s re-verified; no secrets in commits/logs. Session report: `docs/session-reports/session-2026-08-20-phase-6-6-render-cron-ai-fix.md`.
- **2026-08-19 — Backend deployability + scraper worker (Phase 6 of backend replication).** All backend-only code + CI/ops, zero frontend changes, zero schema changes, no deploy, no production traffic switched.
  - *(a) Deployment decision*: Render — Docker web service for `backend/server` + Render cron job running the same image for the worker. `render.yaml` committed (secrets `sync: false` — set in the Render dashboard). NOT deployed (owner action; KNOWN_ISSUES #0 updated).
  - *(b) Scraper worker architecture*: new `backend/worker` workspace (`@berojgardegreewala/worker`) — a scheduled process (`node --import tsx dist/index.js news`) that shares ALL ingestion logic with the server via `backend/api/src/content/news-sync.ts` (single implementation, no duplication; worker never imports frontend code). Structured JSON summary on stdout; exit 0 when ≥1 feed succeeded, 1 when all failed or the DB write failed, 2 for bad commands; run health persisted to `scrape_runs` + `scrape_sources` (name-keyed read-then-write, same contract as the frontend pipeline; no schema changes).
  - *(c) Shared news module*: `news-sync.ts` — 12 news feeds, electronics relevance filter, bounded fetch concurrency 4, retry 1+2 with exponential backoff on network/5xx/429 (404 non-retryable), run-level URL dedup, per-source execution contract, and the production write contract: `news_articles` upsert onConflict `url` ignoreDuplicates with `is_active: true`, null-url rows never written. **This fixes a P1 parity bug (KNOWN_ISSUES #13):** the server cron route previously upserted `news_archive` onConflict `slug` (db2 archive table, slug not unique — broken against the live schema). Server `routes/cron.ts` now uses the shared module (response shape unchanged; adds per-source `sources` array); old `backend/server/src/services/news-sync.ts` deleted.
  - *(d) Docker fixes (pre-existing gaps, verified in-container)*: `.dockerignore` added — the build was copying the host's node_modules (Windows junctions + win32 binaries broke the linux image); base image `node:20-alpine` → `node:22-alpine` (supabase-js ≥2.110 requires native WebSocket; node:20 crashed at boot); `npm ci` must list `--workspace @berojgardegreewala/worker` explicitly (only dependee workspaces get linked); worker dist + package.json copied into the runtime stage; runtime imports switched to extensionless package subpaths (`@berojgardegreewala/api/src/content/news-sync`) because tsx's CJS hook doesn't map `.js`→`.ts` for package subpaths.
  - *(e) Type correctness fix (container caught a false green)*: ai-gateway `res.json()` results typed via a small `json()` helper — the local build was passing only because frontend `@types` (aria-query → `lib.dom`) leaked into the server program; `types: ["node"]` added to server + worker tsconfigs so local == canonical. 15 ai-gateway tests unchanged/green.
  - *(f) Server hardening*: graceful shutdown (SIGTERM/SIGINT → `server.close()` drain, 10s force-exit) in `server.ts`; verified in-container (`SIGTERM received — draining connections` → `connections drained — exiting`).
  - *(g) Infra fixes*: `.github/workflows/ci.yml` rewritten — ai-gateway job points at `@berojgardegreewala/ai-gateway`, new `backend` job (api+server+worker typecheck/test/build), frontend job drops the bogus `working-directory` (KNOWN_ISSUES #9 fixed, close after first green run); `backend/api/scripts/generate-openapi.ts` created — `npm run openapi` regenerates `openapi.json` (KNOWN_ISSUES #10 closed).
  - *(h) OpenAPI re-scoped to the backend surface (adopted from remote `500955d`)*: `backend/api/src/openapi/index.ts` path keys moved from the frontend `/api/...` to the Express `/api/v1/...` surface and the servers list now points at the Render backend + Vercel frontend + local backend; `openapi.json` regenerated to match. openapi.test.ts (base-spec assertions) unaffected.
  - *(i) Verification*: api 97/97, ai-gateway 15/15, server 46/46, worker 17/17 (retry/timeout/5xx/404/dedup/invalid-url/filter/slug-collision/DB-failure/partial-failure/idempotency/fabricated-guard/concurrency-bounds), tsc clean (all workspaces), server+worker builds clean, frontend build exit 0, production E2E 9/9 (residue cleaned before+after), Docker build + runtime verified (image builds; `/health` ok; `/health/ready` 500 with unreachable DB — correct error path; graceful shutdown; worker fail-closed without env: exit 1; bad command: exit 2).
- **2026-08-19 — Backend production-readiness hardening (Phase 5 of backend replication).** All backend-only code, zero frontend changes, zero schema changes, no deploy.
  - *(a) AI gateway tests + fix*: new `backend/ai-gateway/__tests__/gateway.test.ts` (15 jest tests). Suite caught a real bug: a throwing usage-logger (`logFn`) was caught by the provider try/catch and turned a successful provider into a failure — telemetry now runs via `safeLog` (best-effort, never breaks the response; KNOWN_ISSUES #11 closed). Documented pre-existing behavior: omnirouter is env-guard-exempt (localhost:20128 default) and always attempted — unchanged, shared with the frontend.
  - *(b) Server hardening suite*: new `backend/server/tests/hardening.test.ts` (16 node:test tests) — AI routes against a stubbed provider (grounded chat: rows + URL-host allowlist reach the system prompt; no-match fallback; all-providers-fail → 502 `AI_UNAVAILABLE`; match: invalid-id filtering, top-10 cap, malformed provider output → controlled 500 with no stack leak; search: LLM filters extracted + applied with unknown keys dropped; summarize; telemetry row recorded with safe fields, no secrets), CORS (allowed origin, disallowed origin blocked, preflight + credentials), X-Forwarded-For shim (per-IP rate-limit buckets: 1.2.3.4 exhausts at 429 while 5.6.7.8 stays 200), admin endpoint rate limit (21st wrong password → 429 `RATE_LIMITED`), `/health/ready` (200 ready / 503 `DB_UNAVAILABLE`), malformed JSON → 400 `VALIDATION_ERROR` without parser internals.
  - *(c) Route hardening*: `routes/ai.ts` chat/match/search now map gateway exhaustion to 502 `AI_UNAVAILABLE` via `aiFailure` (consistent with insights/summarize); `routes/cron.ts` news-sync gate now timing-safe (`safeEqual` sha256+`timingSafeEqual`) and rejects empty `CRON_SECRET`; `routes/admin.ts` mounted behind the new `admin` rate-limit preset (60s/20, api-lib `rateLimiters`); `middleware/error.ts` maps body-parser `entity.parse.failed` → 400 `VALIDATION_ERROR` "Invalid JSON body"; `server.ts` warns at boot when `CRON_SECRET` is missing.
  - *(d) Ops*: `routes/health.ts` rewritten as `healthRouter(deps)` with liveness `/` + readiness `/ready` (head-count probe against `opportunities`; 503 when no admin client); `Dockerfile` gains `USER node` + `HEALTHCHECK` (wget `http://127.0.0.1:8080/health`); `.env.example` reorganized into REQUIRED/OPTIONAL/DEPLOYMENT and now documents AGENTROUTER_* + OMNIROUTER_* keys.
  - *(e) Verification*: api 97/97 jest, ai-gateway 15/15 jest, server 46/46 node:test (30 parity + 16 hardening), `tsc` build clean, frontend build + full production E2E **9/9** against live deploy (residue cleaned before AND after per the cleanup contract). Backend still NOT deployed — deployment decision recorded as KNOWN_ISSUES #0 (owner action).
- **2026-08-19 — Project-bible reconciliation (full docs sync with code).** Rewrote root control files: `ARCHITECTURE.md` (CURRENT/TRANSITION/TARGET + corrected drift register: 4 databases, 9-provider AI chain, `user_metadata.role`, scrape cron reality, employer RBAC fixed), `MASTER_INDEX.md` (v2 — all 79+ files indexed, no dead links), `IMPLEMENTATION_STATUS.md` (full-platform feature matrix), `KNOWN_ISSUES.md` (added #8 employer-ATS doc overclaim, #9 ci.yml broken paths, #10 openapi script broken, #11 ai-gateway no tests, #12 scraper-run evidence gap), `AGENT_STATE.md` + `AGENT_HANDOFF.md` (v1.2.0 — backend replication + reconciliation state), `E2E_TEST_STATUS.md` (6 spec files / 10 tests, row #10 ATS claim corrected, latest run vs `683404c`). Section READMEs 04–23, machine-specs JSONs, ADR status headers, backlog annotations, and 23-reference status headers rewritten/reconciled by subagents with measured counts (138 API route files, 3 scheduled crons, 9 providers, 18 scraper modules, 4 DBs, 7 tracks). Historical docs marked with status headers, not rewritten. Session report: `docs/session-reports/session-2026-08-19-backend-replication-docs-reconciliation.md`.

### Added
- **2026-08-19 — Backend replication parity docs.** `backend/docs/FRONTEND-BACKEND-MAP.md` (frontend capability → backend equivalent → status; ~50 MISSING items identified, priority: social layer → AI breadth → cron/scrapers → search/signup) and `backend/docs/API-PARITY.md` (full endpoint inventory with COMPLETE/PARTIAL/MISSING/N/A statuses, cross-cutting contracts, status summary).
- **2026-08-19 - Backend server: full read/CRUD + social + AI + auth + news-cron milestone (Phase 4 of backend replication).** All backend-only code, no frontend changes, no schema changes.
  - *(a) Express rate limiting*: `backend/server/src/middleware/rate-limit.ts` adapts the shared api-lib `rateLimiters` presets (api 120/min, auth 10/min, search 30/min, ai 20/min) to Express via a Web-Request header shim; 429 envelope `{success:false, error:{code:"RATE_LIMITED", retryAfter}}`.
  - *(b) AI usage telemetry*: `services/ai-usage.ts` wires `gateway.setLogger` -> `ai_usage_log` inserts (fire-and-forget); `backend/ai-gateway/src/index.ts` now exports `AILogEntry`.
  - *(c) AI endpoints* (`routes/ai.ts` rewritten): `/chat` (grounding over live opportunities, URL-host allowlist, no-match fallback), `/match` (top-10 from pool, tolerant JSON extraction, id validation), `/search` (LLM -> filters), `/summarize` (validation moved outside the 502 catch). All behind `requireAuth` + ai rate limit.
  - *(d) Auth* (`routes/auth.ts`): POST `/signup` (email/password validation, reserved usernames, `auth.admin.createUser` email-confirm, `user_profiles` upsert, 409 on username/email conflict) + GET `/check-username`.
  - *(e) Search* (`routes/search.ts`): `/api/v1/search` + `/people` reusing the opportunities repository and public-profile filters.
  - *(f) Social* (`routes/social.ts`): feed CRUD + like/comment/repost (counts stay trigger-maintained), network connect/accept/withdraw (role-enforced) + connections list/status-check + suggestions + follow/unfollow + followers/following, notifications (list/count/mark-all/mark-one) with service-role cross-user inserts.
  - *(g) Messaging* (`routes/messages.ts`): conversation list (with other participant + last message + unread count), with/:userId discovery, thread GET (marks incoming read) + POST (bumps `last_message_at`, notifies other participant).
  - *(h) News*: `routes/content.ts` +GET `/:slug`; `services/news-sync.ts` ports the 12-feed RSS fetch (relevance filter, parallel) and slugify; `routes/cron.ts` GET `/api/v1/cron/news-sync` guarded by Bearer `CRON_SECRET`, idempotent upsert on slug.
  - *(i) Wiring*: `app.ts` mounts all routers + usage logger; `config/env.ts` +`cronSecret`; `.env.example` +`CRON_SECRET`; `backend/server/package.json` +`rss-parser@^3.13.0` (already hoisted at root); `tests/fake.ts` +`auth.admin.createUser` stub.
  - *(j) Tests*: new `tests/parity.test.ts` (14 tests: 401 coverage on all new protected routes, AI no-match/empty/validation paths, signup validation/conflict/success, username availability, search, news slug 404/200, cron secret gate, slugify, rate-limit 429). Result: server 30/30, api 97/97, `tsc` build clean. `backend/docs/BACKEND-EXTRACTION-REPORT.md` written (honest gaps: scraper fleet not ported, PATCH /me deferred, ai-gateway untested, DB2 client unused, per-process limiter).
- **2026-08-19 - Network verification wrap.** Deploy `a79773a` READY; production E2E **9/9 PASSED**; temporary `frontend/tests/e2e/probe-network.spec.ts` verified connection card href `/profile/amittest2` and both name-link/card-body click navigations, then deleted. DB residue left per the documented clean-before-next-run contract.
- **2026-08-19 — Network page: 4 tabs + clickable user cards; LinkedIn-style public profile (`683404c`, `a79773a`).**
  - *(a)* `frontend/src/app/network/page.tsx` now shows four sections — Suggested Connections, Received Requests, Sent Requests (outgoing with Cancel Request), My Connections. Received filters to `direction === "incoming"`; every user card (suggestion/received/sent/connection) is fully clickable and routes to `/profile/{username|id}`; action buttons use `stopPropagation`.
  - *(b)* `frontend/src/components/ConnectionCard.tsx` accepts `onOpen`; the root div handles click → `router.push` (cursor-pointer), buttons stop propagation.
  - *(c)* `frontend/src/components/profile/PublicProfile.tsx` renders previously-missing live columns: About reads `bio` (was `profile.about` — column doesn't exist), company line reads `job_title`/`current_company` (was `current_position`/`current_org`), location reads `location || country`, plus `experience_years`, Interests section, and Links section (`linkedin_url`/`github_url`/`website_url`). `frontend/src/types/index.ts` `UserProfile` extended with the optional live columns.
  - *(d)* `frontend/src/app/api/network/connections/route.ts` select now includes `username` so ConnectionCard links resolve to real `/profile/:username` URLs (previously fell back to `#`).
  - Verified: frontend build passes, 104/104 jest, production E2E 9/9 against deploy of `683404c`.

### Added
- **2026-08-18 — Full Platform Audit & E2E Verification (27/27 Passed, 104/104 Unit Tests, Build Exit 0).**
  - *(a) Full Platform Audit Report*: Authored `docs/audit-reports/2026-08-18-full-platform-audit-report.md` documenting 100% verification across all 3 portals (Public Aggregator, Candidate Social Hub, Employer Recruitment Pipeline).
  - *(b) Added GET /api/profile/me*: Implemented `GET` handler in `frontend/src/app/api/profile/me/route.ts` returning authenticated user profile and metadata.
  - *(c) Parameter Aliases in Connect Route*: Supported `receiverId`, `recipientId`, `targetUserId`, `addressee_id` in `frontend/src/app/api/network/connect/route.ts`.
  - *(d) Verified Bookmarks & Resume ATS*: Verified `/api/bookmarks` and `/api/resume` persistence and scoring (40-100).
- **2026-08-18 — Full Social Core E2E Verification (17/17 Passed) & Messaging/Profile Fixes.**
  - *(a) Direct Messaging 500 Fix*: Fixed `ReferenceError: content is not defined` in `frontend/src/app/api/messages/route.ts` by extracting `const content = body.content || body.body || body.message;` from the validated body.
  - *(b) Flexible Validation Schema*: Updated `messageSchema` in `frontend/src/lib/validation.ts` to accept `participantId`, `recipientId`, `recipient_id`, or `participant_id`.
  - *(c) Token Auth Support in server.ts*: Configured `createClient` in `frontend/src/lib/supabase/server.ts` to automatically bind Bearer authorization tokens to `client.auth.getUser()`, enabling clean API token testing and mobile client compatibility.
  - *(d) Enhanced Connections Response*: Enriched `frontend/src/app/api/network/connections/route.ts` to return both full user profiles (`display_name`, `headline`, `current_company`, `avatar_url`) AND relationship metadata (`user_id`, `requester_id`, `addressee_id`, `status`).
  - *(e) LinkedIn-Style Profile Lookup*: Updated `frontend/src/app/profile/[username]/page.tsx` to resolve users dynamically by either `username` (e.g. `amittest1`) or UUID (e.g. `56b47f8e-...`), enabling profile clicks from suggestions, direct messages, and feed cards.
  - *(f) 17/17 Multi-User E2E Test Suite*: Authored and executed `frontend/scripts/test-social-e2e.mjs` verifying the entire candidate-to-candidate social lifecycle (login, suggestions, connect, accept, connection list, send message, reply message, conversation list, message history, profile navigation) with 100% pass rate.
- **2026-08-18 — Production Social Networking Bug Fix (follow/connect/messages/feed).** All four reported production failures fixed at root cause and verified against live DB1 (`aqauempuwmbizqoaolop`):
  - *(a) Follow POST 500*: trigger `handle_follow()` wrote `follower_count`/`following_count` to `user_profiles` which lacked those columns → every follow insert failed with `column "follower_count" does not exist` (user reported it as `follow_error_count` — misread; that identifier exists nowhere in repo, history, or live schema). Fixed via new migration `frontend/supabase/migrations/20260818000001_user_profiles_social_counts.sql` (adds `follower_count`, `following_count`, `connection_count` INT NOT NULL DEFAULT 0 + backfill) — **applied live**. Insert/unfollow now succeeds and counts update.
  - *(b) Follow state GET 405*: `api/network/follow/[userId]` had no GET handler — added, returns `{ following }`.
  - *(c) Connect 409*: production 409 was genuine duplicate semantics (UNIQUE(requester_id, addressee_id)); route now returns 409 with the existing row and the UI reflects real state (Pending/Connected). Receiver pre-check added (clean 404). PATCH on `connect/[id]` is now role-enforced (addressee accept/decline→rejected; requester withdraw→row delete; 403 on wrong role). GET on `connect` filters pending + adds `direction`.
  - *(d) GoTrueClient warning*: anon client from `lib/supabase.ts` leaked into `/messages` (static import) and `/academy` (client-side `require`/dynamic import of `lib/academy/queries`). Fixed: messages uses `createClient()` from `lib/supabase/client`; academy fallback tracks moved to supabase-free `lib/academy/fallback.ts` (queries.ts re-exports), page imports it statically.
  - *(e) `/people/[username]` crash*: `use(params)` on a plain object threw React 18.3 "unsupported type passed to use()" — page never worked; destructures params directly now.
  - *(f) Local dev env fixes*: `frontend/.env.local` repointed from Project 2 (`jbqjipwanfsxyqkfrrpx`) to Project 1 (production DB) and gained the missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` (middleware threw on every request without it — dev was broken). **Known limitation:** the Project 1 `SUPABASE_SERVICE_ROLE_KEY` in `siliconpath-credentials.txt` is stale (401s — rotated after the file was updated; owner has no access right now) — admin-backed routes fail locally only; production keys are valid.
  - *(g) New E2E* `tests/e2e/social-workflow.spec.ts` (follow/unfollow persistence, connect/accept, messaging, feed post/like/comment) + hydration-safe login helper (retries against the React hydration race that native-submitted the login form in local runs).
  - Verified: `npm run build` passes, 104 jest tests pass. Deploy via Vercel git integration (push-triggered; CLI `vercel deploy --prod` races the git deployment and must not be used). **Final verification: production E2E 9/9 green** — see `project-bible/E2E_TEST_STATUS.md`.

### Fixed (follow-up, deploy `cdc80a7`)
- **2026-08-18 — Feed like/comment counts trigger-maintained; broken like trigger fixed.** Root cause found via live schema inspection + direct PostgREST probes:
  - *(a)* `update_post_likes_count()` trigger wrote a nonexistent `feed_posts.likes_count` column → every like INSERT failed at the DB level (`42703`) while the like route returned `{ liked: true }` without checking the insert error — **likes never persisted** (count came from the route's manual `like_count` update, so the UI looked fine). Trigger now writes `like_count` (migration `frontend/supabase/migrations/20260818000002_fix_post_count_triggers.sql`, applied live via Management API).
  - *(b)* Both count triggers were SECURITY INVOKER, and `feed_posts` has no cross-user UPDATE policy → the trigger's `UPDATE feed_posts` was RLS-filtered to 0 rows for authenticated-role inserts (counts silently drifted). Both functions are now SECURITY DEFINER, so counts always match like/comment row counts for every insert path. Verified 8/8: comment/like inserts, unlikes, comment deletes, plain-user path.
  - *(c)* Like and comment routes no longer read-modify-write the counts manually (was double-incrementing on top of the trigger — observed `comment_count=2` with 1 row).
  - *(d)* E2E spec fixes (`86acb2f`): whitespace-tolerant count assertion (`/^\s*1\s*$/` — JSX whitespace), connected-state assertion is the "Message" link (no "Connected" text exists), connect flow waits for `GET /api/network/connections`, messaging spec seeds deterministically via `?user=` and targets the list container's real class (`overflow-y-auto`; `divide-y-2` ≠ `divide-y`). **Production full suite: 9/9 passed.**

### Fixed (follow-up, deploy `b07ebd1`)
- **2026-08-18 — Social counts on public profiles + connection_count maintained.** (a)
  `PUBLIC_PROFILE_FIELDS` in `frontend/src/lib/utils.ts` did not include
  `follower_count`/`following_count`/`connection_count`, so PublicProfile never rendered
  the count spans (the profile page fetched the counts, but the field allowlist stripped
  them server-side). All three columns added. (b) The `connections` table had no trigger,
  so `connection_count` stayed 0 forever. New migration
  `frontend/supabase/migrations/20260818000003_connection_count_trigger.sql` (applied
  live): `handle_connection_count()` SECURITY DEFINER + `on_connection_change` trigger
  (AFTER INSERT/UPDATE/DELETE, only `accepted` rows count) + backfill. Verified live:
  pending insert is a no-op, accept bumps +1 on both sides, reject/un-accept decrements.
  `handle_follow` was already SECURITY DEFINER. 104 jest pass; **production full suite:
  9/9 passed**.

### Fixed (follow-up, deploy `6d9684d`)
- **2026-08-18 — Messaging conversation list read-after-write lag (the last E2E flake).**
  Reproduced deterministically with a browser debug spec: on a clean DB, immediately
  after a fresh conversation is created the list GET `/api/messages` returns
  `200 {"conversations":[]}` for several seconds while the per-conversation GET
  `[id]` (same session, same route family) already sees the row — a read-after-write
  lag through the Supabase pooler (the list later self-heals within ~5-10s; every
  subsequent read is correct). The messages query already polled via
  `refetchInterval`; the conversations query had none. Fix: `useConversations()`
  now polls every 5s (one line, same pattern as the messages query), so a just-created
  conversation appears without a manual reload. Verified: fresh-conversation solo run
  green, then **production full suite 9/9 passed (1.7m)** on a clean DB (an earlier
  suite run had failed on leftover connection state — cleanup contract enforced).

### Added (2026-08-18 night — owner round + account migration)
- **Owner's round merged (`667fe62` → `c4c60f6`):** resilient messages POST field
  names (`participantId`/`recipientId`/`recipient_id`/`participant_id` +
  `content`/`body`/`message`), Bearer-token auth in `lib/supabase/server.ts`,
  UUID/username profile routing, richer connections/route response, network page
  profile links, reply-route parsing — all deployed READY by git integration.
- **Test-account migration:** `frontend/scripts/reset-users.mjs` deleted ALL auth
  users (incl. legacy A/B/C) and created canonical `amittest1`/`amittest2`
  (`TestPassword123!`). Playwright helpers/specs updated (`helpers.ts` credentials,
  `?user=amittest2`, `B_USERNAME='amittest2'`); `loginAsEmployer` kept as a legacy
  name (no flow needs the employer role — commented).
- **`network-connect.spec.ts` self-withdraws its request** (PATCH
  `/api/network/connect/[id]` `{status:"withdrawn"}`): with only two accounts in the
  DB the spec's target is the other test user, and leftover requests poisoned
  `social-workflow`'s connect test (observed twice). Spec-only change.
- Docs: `E2E_TEST_STATUS.md` (canonical accounts, cleanup SQL, 9/9 result),
  `AGENT_HANDOFF.md` (OpenCode continuation §3: deploy mechanics, `[vercel skip]`
  does not work, trigger-maintained counts, pooler lag, cleanup contract),
  `KNOWN_ISSUES.md` #6 (new accounts + reset-users warning).
- **Production full suite (deploy `c4c60f6`): 9/9 passed (1.6m).** Test data cleaned.

- **2026-08-17 — Core 3-Portal Ecosystem Hardening & Bug Fixes (Phases 1-3).**
  - *(a) Opportunities Search & Filter Blacklist*: Removed destructive keyword blocklist in `frontend/src/app/api/opportunities/route.ts` that erroneously filtered valid semiconductor positions ("Qualcomm", "Lead RISC-V", "Senior ASIC Verification Engineer", etc.).
  - *(b) Network & Connection Suggestions*: Replaced over-aggressive `isTestAccount()` in `frontend/src/app/api/network/suggestions/route.ts` with minimal bot filter `isSystemBot()`, allowing all genuine registered candidate profiles to be discoverable and connectable with zero `sug-*` mock ID failures.
  - *(c) 1-to-1 Realtime & Polling Direct Messaging*: Fixed target user resolution in `frontend/src/app/messages/page.tsx` by fetching profile data via `/api/profile/[userId]` and updated `useMessages` hook polling intervals to 3s for fast message delivery.
  - *(d) ATS Resume Builder Persistence*: Updated `frontend/src/app/api/resume/route.ts` to persist resume payload directly into `user_profiles.resume_data` (DB1 source of truth), calculate real-time ATS match score (40-100), and provide feedback.
  - *(e) Saved Opportunities Organization Mapping*: Enhanced `frontend/src/app/api/bookmarks/route.ts` to join `organizations(*)` and format authentic company names so bookmarks render accurately in `/saved`.
  - *(f) Interactive Organizations Directory*: Built `frontend/src/app/organizations/OrganizationsClient.tsx` with instant search and multi-category filtering (Defence/Space, Academic, Fabless/IDM, Research Labs).
  - *(g) VLSI Academy Sequential Numbering*: Cleaned up track number formatting in `frontend/src/app/academy/page.tsx` so all 7 tracks are numbered sequentially without skipped indices.
- **2026-08-17 — FK RESTRICT + E2E verification + Vercel build fix + security incident.** (a) `saved_opportunities.opportunity_id` FK changed from `ON DELETE CASCADE` to `ON DELETE RESTRICT` via Supabase Management API (verified live: deleting an opportunity with bookmarks now fails with constraint violation, bookmarks preserved). (b) Five Playwright E2E tests pass (network suggestions, connect, messages, header navigation, accept connection — no FK errors). (c) Health route `dynamic = "force-dynamic"` added (prevents stale static cache). (d) **🚨 SECURITY INCIDENT:** `change-fk.js` (root) and `.opencode/mcp-servers/change-fk.js` committed with live Supabase Management API token (`sbp_...`) and service role key (`sb_secret_...`) for project `jbqjipwanfsxyqkfrrpx` in plaintext. Both files deleted immediately. **Owner must rotate both tokens now** (Supabase Dashboard → DB2 project → Settings → API → regenerate service role + Management API tokens). `change-fk.js` and MCP variant added to `.gitignore` to prevent re-adding. (e) `vercel.json` build command reverted to `cd frontend && npm run build` (the `--workspaces` variant times out on Vercel due to `file:` protocol resolution for workspace packages — environment limitation, not code bug). Phase 1 status in implementation-map updated accordingly.- **2026-08-16 — Phase 1.7 security sweep (P0.6).** (a) Every `/api/scrapers/*` route now runs behind `requireCronOrAdmin` — the guard moved into the shared `runScraperRoute` (`scrapers/utils.ts`) so all 13 individual routes + `run-all` + `[slug]` are covered by one change; `run-all`'s now-redundant pre-guard removed. Previously any anonymous GET could trigger service-role scrapes (rate-limit-exempt too); verified live: unauthenticated `GET /api/scrapers/isro` → 403, nothing scraped. (b) Deleted dead no-op `/api/revalidate` route — its GET self-fetched POST with `REVALIDATE_SECRET` in the query string (secret leakage into server logs), the POST did nothing ("actual revalidation happens at edge"), and nothing in the app called it. `REVALIDATE_SECRET` removed from `.env.example`; `project-bible/07-api/README.md` + `route-manifest.json` updated. (c) Feed comment post-author lookup fixed `feed_posts.user_id` → `author_id` — `user_id` does not exist on live `feed_posts` (verified), so the comment-notification lookup silently returned null and post authors were never notified. (d) `report-issue` confirmed already covered: zod validation + middleware Upstash rate-limit (`api` bucket) + CSRF exemption (public form). Build passes; 104 jest tests pass.

- **2026-08-16 — Phase 1.6 RBAC server-side (P0.5): middleware role gate, escalation closed, IDOR closed, raw-body routes validated.** (a) `middleware.ts` now enforces a server-side employer gate on `EMPLOYER_ONLY_PATHS` (`/post-job`, `/employers`, `/employer*` + their APIs): previously login-only, any logged-in user could reach employer pages/APIs. Role read from `user_metadata.role` with `account_type:"provider"` fallback (same source the app's own checks use); non-employer → 403 (API) / redirect to `/` (page). Admin APIs deliberately NOT gated here — the admin console authenticates via `x-admin-password`/HMAC tokens (no Supabase session), enforced fail-closed by `requireAdmin` at every route. (b) `profile/me` PATCH no longer accepts `role:"admin"` (was a self-serve privilege escalation; `employer`/`candidate` remain self-service). (c) `applications/[id]` DELETE was an unscoped IDOR (any user, any application id) — now `.eq("user_id", user.id)` owner-scoped, non-owned ids return 404; PATCH body now whitelisted by new `applicationStatusUpdateSchema` (`status` enum = live lifecycle `applied|submitted|reviewed|shortlisted|accepted|rejected` + `notes` ≤ 2000, unknown keys stripped). (d) `auth/signup` whitelists `accountType` (`candidate`/`provider`); role was already server-derived so admin was unreachable — input now validated too. (e) Mass-assignment closed: `opportunities/[id]` PATCH now zod-validates via `adminOpportunityUpdateSchema` + `mapAdminOpportunityColumns` + `resolveOrganizationId` (mirrors the Phase 1.5 `/api/admin/opportunities` path — raw body was written straight to PostgREST); `admin/organizations` POST now validates via new strict `organizationCreateSchema` matched to LIVE `organizations` columns (the old `adminOrganizationSchema` carried dead columns `headquarters`/`founded_year`/`scrape_frequency` etc. that 400'd on PostgREST; it was unused dead code and was replaced). (f) New jest suite `validation-rbac.test.ts` (14 tests: strict org schema rejects dead/unknown columns, status lifecycle whitelist, legacy-field mapping, verification_status CHECK values). Build passes; 104 jest tests pass (was 90).

- **2026-08-16 — Phase 1.5 schema reconciliation (P0.4/P0.5), live-schema drift closed.** (a) `track-click` repointed from the dead `apply_clicks` counter to Neon `click_events` (`event_type='apply_click'` — the table analytics already read). (b) `cron/scrape-india` + `cron/scrape-global`: dropped legacy `organization` text insert + fabricated `verification_status:'verified'`; org now resolved evidence-gated via new shared `resolveOrganizationId()` helper (`run-opportunity-scrape.ts`, used by all three insert paths incl. `employer/jobs` POST + `admin/opportunities` POST/PATCH); new inserts default `unverified`. (c) `search/opportunities` + `ai/search`: removed legacy `organization.ilike` filter (PostgREST `or()` can't parse embedded columns); search now matches org names against the organizations table and filters `organization_id.in(...)`; ordering `posted_at`→`created_at`. (d) `applications` GET, `admin/applications`, `recommendations`, `admin/scrape-health`: embed `organizations(name)` and preserve the legacy `organization` string wire contract via post-fetch mapping. (e) `admin/scrape` + `admin/scrape/status`: `scraper_sources`→`scrape_sources` and `last_scraped_at`→`last_scrape_at` (live column; the impl's `updateSourceHealth` was writing a dead column — health updates now also set `last_success_at`). (f) Admin add/edit opportunity unbroken: `adminOpportunityUpdateSchema` enum trimmed to live CHECK values (`verified|unverified|link_unavailable|expired` — `pending`/`rejected` were 400s), new `mapAdminOpportunityColumns()` maps `stipend`→`salary_range`, `apply_link`→`apply_url` (create defaults `apply_url:""` NOT NULL; empty edit fields never clobber), `organization` text→`organization_id`; add form no longer sends `posted_at`/`pending`. (g) Docs truth: `db/index.ts` comments corrected to live topology (db1 = core+social+logs incl. `ai_usage_log`; db2 = legacy mirror; Neon1 = analytics+cache; Neon2 = cache subset), `neon/schema.sql` gained `trending_cache` + `keyword_stats` (live shapes verified) + corrected header. (h) `email-digest` "Most Popular" ordered by live `view_count` instead of deprecated `apply_clicks`; newsletter prompt reads `salary_range` (was `undefined`). Live-verified: embeds, `scrape_sources` order, FK org search; build passes; 90 jest tests pass. Phase 1 exit test: zero legacy-column queries in `frontend/src/app/api`.

- **2026-08-16 — Phase 1.4 org resolution (P0.3), evidence-gated.** (a) New pure resolver `frontend/src/lib/organizations/resolve.ts` — single source of truth for org inference: domain/website host match, ATS board-token match (greenhouse/lever/ashbyhq/recruitee/smartrecruiters), host-label vs slug/name match (e.g. `isro.gov.in` → ISRO), title substring match, exact-name table match, and a person-name guard that rejects `"Sadia Munir"`-style bylines; legacy URL map removed from `utils.ts` (`inferAuthenticOrganization` now delegates to the resolver). (b) Scrape insert path (`run-opportunity-scrape.ts`) now resolves via the resolver with the org table loaded once per run — org rows created only when the resolved name passes the person-name guard with domain/title backing (never blind creation). (c) Idempotent backfill `frontend/scripts/backfill-organization-ids.ts` (dry-run default, `--apply` to write; per-org batched updates). **Applied live: `organization_id IS NULL` 3,115 → 196 (95.2% → 6.0%)**, all assignments reference existing org rows; residual 196 = org-table gaps (IIT Hyderabad, BEL, Cirrus, …) + no-URL evidence, left unresolved by design. (d) Deleted orphan `frontend/src/lib/scrapers/ats-adapter.ts` (singular; buggy `extractOrgName` producing person-name orgs, zero importers — live adapters use `ats-adapters.ts`). (e) Jest suite `organizations-resolve.test.ts` (11 tests: person-name guard, board tokens, domain/title matching, no-blind-assignment). Build passes; 90 jest tests pass.

- **2026-08-16 — Phase 1 foundation (P0.1–P0.4 partial): real scrape cron, fail-closed guards, verification v1, analytics repoint.** (a) Cron → real engine: `frontend/src/lib/scrapers/run-opportunity-scrape.ts` extracted from `/api/scrape` (real `scrapeAllOpportunities()` + RSS path, writes `scrape_runs`), new `/api/cron/scrape-opportunities` (`requireCronOrAdmin`, fail-closed); `vercel.json` cron 00:00 repointed and 08:00 `/api/cron/check-links` added; `admin/page.tsx` "run all" button repointed. (b) Fail-closed guards: `api/ai/expire` + `api/send-digest` now `requireCron` (removed inverted secret checks). (c) Verification v1 (P0.2): new inserts default `verification_status='unverified'`; `opportunity_verifications` evidence-ledger migration authored (`20260816000001_opportunity_verifications.sql`) — **DDL pending owner application on Supabase db1** (no postgres URL available to agent); `cron/check-links` + `admin/recheck-link` write evidence rows and never auto-promote reachable→`verified`; legacy duplicate `api/check-links` deleted. (d) Analytics repointed to live tables (P0.6/16): `ai_usage_log` → Supabase db1 (`lib/ai/providers.ts` + `analytics/ai-usage` + `analytics/platform`), `platform_analytics` → Neon `click_events` (`analytics/platform`, `admin/analytics`, `admin/performance`), `scrape_logs` → `scrape_runs`. (e) Legacy-column readers fixed via shared `mapDbOpportunityToClient` (`opportunities-feed`, `calendar-export`, `sync-replica`) or column repoint (`admin/recheck-link`); dead duplicates `api/scrape-jobs` + `api/scrape-opportunities` deleted. Build passes; 79 jest tests pass.

- **2026-08-16 — Implementation map (master audit deliverable).** Full code-level audit executed: 4 parallel agent audits (frontend routes/components/auth, API routes/auth guards/legacy fields, database schema/migrations/RLS, 21-feature-system status matrix) + live MCP verification. Delivered as `docs/audit-reports/2026-08-16-implementation-map.md`: verdict (not a rebuild — ~60-70% reusable), P0 defect register (cron → fabricated path, fake verification, org resolution, schema drift, RBAC, fail-open guards, IDOR, mass-assignment), schema drift register (migration files vs live, incl. live-verified: `post_reactions` + `scrape_sources` exist live / `scraper_sources` + `platform_analytics` + Neon `ai_usage_log` do not), live topology discovery (social tables consolidated in Supabase db1; Neon1 holds cache tables), 12-phase file-level plan, route-group migration, decision points for owner, verification protocol. No code modified during audit (per mandate).

- **2026-08-16 — State of the Union audit + documentation overhaul.** Full audit (strategy, codebase reality check with **live database verification**, completion score, 7-day remediation plan) delivered as `docs/audit-reports/2026-08-16-state-of-the-union.md`. Root `README.md` rewritten to the SiliconPath vision ("Career Intelligence Infrastructure for India's Electronics Ecosystem", modular monolith, Discover → Match → Verify → Apply loop, honest current-state section). `ARCHITECTURE.md` rewritten with the 3-portal `(candidate)`/`(employer)`/`(admin)` target folder structure, data-flow diagram, and Known Drift register.
- **2026-08-16 — Documentation restructure.** All documentation centralized: `ARCHITECTURE.md`, `CHANGELOG.md`, `SECURITY.md` (→ `13-security/`), `TESTING.md` (→ `15-testing/`), `CONTENT_UPGRADE_PLAN.md` (→ `23-reference/`), `deploy-stack.txt` (→ `14-devops/`) moved into `project-bible/`. All audit reports moved `project-bible/reports/` → `docs/audit-reports/`. Root duplicates deleted (`trusted_sources_v2/v3.json`, `siliconpath-expanded-global-source-list-v4.md` — copies already tracked in `project-bible/23-reference/`). `PROJECT_BIBLE.md` and `PROJECT_KNOWLEDGE_PACK.md` removed (superseded by the `project-bible/` folder + `MASTER_INDEX.md`). `github-recovery-codes.txt` now gitignored.
- **2026-08-16 — MCP servers wired and verified.** Neon, Supabase, Vercel local MCP servers in `.opencode/mcp-servers/` + `gitmcp` remote server — all live-tested (handshake + real tool calls). Stale credentials in `siliconpath-credentials.txt`/`frontend/.env.local` corrected against live APIs (Neon connection strings rotated, Supabase project-1 key restored to its real legacy service-role JWT, Vercel token replaced).

- **2026-08-14 — Applications unique constraint + saved_opportunities FK (Part 2 fixes).** Added `UNIQUE(user_id, opportunity_id)` constraint to `applications` table (eliminates race condition in check-then-insert). Added foreign key `saved_opportunities.opportunity_id REFERENCES opportunities(id)` enabling PostgREST join — removes need for API fallback path. Migration: `20260814000001_applications_unique_fk.sql`.
- **2026-08-14 — Network suggestions test-account filter.** `isTestAccount()` in `/api/network/suggestions` now checks both `username` and `display_name` for username-like patterns (`test`, `qa`, `probe`, `api-test`, `hiring lead`, etc.) and boilerplate bios ("Microelectronics & semiconductor specialist."). Filters 4 known QA seed accounts from production suggestions. Verified live: only genuine profiles appear.
- **2026-08-14 — Documentation overhaul.** README rewritten with current 4-DB architecture, complete env var tables (frontend + standalone API), feature set (network, messages, bookmarks, applications, AI RAG, admin), setup steps. CHANGELOG updated with dated entries. SECURITY.md created with credential rotation history and secret management policy. `frontend/.env.example` created matching all 30+ env vars actually read by code.
- **2026-08-12 — News slug migration + regression test.** `news_articles` had no `slug` column, so `/api/news/[slug]` 404'd for every article, the detail page could not load real articles, news sync upserts silently failed, and news disappeared from `/sitemap.xml`. Migration `20260812000001_news_slug_column.sql` adds the column, backfills deterministic slugs from `title`, and indexes them (applied to the live project). Added `news-slug.test.ts` (3 tests) pinning the API contract. Verified live: API returns the stored record, detail page renders the stored title, sitemap now emits all 33 news URLs.
- **2026-08-12 — Live data QA cleanup.** Removed test subscriber `qa-audit-test@example.com` from `subscribers` (1 remaining genuine subscription). DB ground truth: 3,269 active opportunities, 33 news articles, 4 categories (jrf 942 / government 29 / fellowship 27 / internship 2).
- **2026-08-10 — Standalone Express REST API (`backend/server` workspace).** New `@berojgardegreewala/server` package mirroring the Next.js internal API: `GET /health`, `/api/v1/opportunities` (pagination + filters, slug/UUID lookup), `/api/v1/profiles/:username` (new indexed username lookup) + `/me`, `/api/v1/organizations`, `/api/v1/news`, `/api/v1/applications` + `/api/v1/saved-opportunities` (user-scoped via Bearer tokens), `POST /api/v1/ai/insights` (wraps `@berojgardegreewala/ai-gateway`), `GET /api/v1/admin/stats` (constant-time `X-Admin-Password`). Reuses `@berojgardegreewala/api` zod validation + error hierarchy. Added to root npm workspaces; `npm ci && npm run build --workspace @berojgardegreewala/server` builds it.
- **2026-08-10 — Server test suite (16 tests).** node:test + select-aware fake Supabase client in `backend/server/tests` — run with `npm test --workspace @berojgardegreewala/server`; no credentials required.
- **2026-08-10 — Deployment artifacts.** Root-context multi-stage Dockerfile (`backend/server/Dockerfile`) + `deploy-stack.txt` (Render/Docker steps, env var table, verification curls) + `backend/server/.env.example`.
- **2026-08-10 — README migration map.** Mirrored routes marked DONE with route→file mapping; remaining ~120 Next.js routes queued IN PROGRESS in priority order (social layer, academy, full AI surface, admin, employer/companies, resume/search, scrapers & cron, misc).

### Fixed
- **2026-08-14 — AI grounding context selection bug.** `lib/ai/grounding.ts` was selecting wrong context chunks (off-by-one in similarity threshold). Fixed threshold and added `grounding.test.ts` (7 tests) pinning retrieval behavior.
- **2026-08-14 — Profile fabricated-content fix.** Profile editor was allowing fabricated bios/headlines to persist. Added server-side validation in `api/profile/[userId]/route.ts` + client-side guards in `ProfileEditor.tsx`.
- **2026-08-14 — Security header additions.** `middleware.ts` now sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on all responses. Verified via `security-scan.yml` workflow.
- **2026-08-14 — Neon/Supabase credential rotations.** All 4 database credentials rotated post-git-history-rewrite. Vercel env vars updated. MCP server configs (`.opencode/mcp-servers/*`) now read from `siliconpath-credentials.txt` + `frontend/.env.local` only.
- **2026-08-14 — Search/OG image/contact form fixes.** `/api/search` now returns consistent shape with `results` array. OG image generation (`/api/og/opportunity/[slug]`) handles missing images gracefully. Contact form (`/api/contact`) validates honeypot + rate limits via Upstash.
- **2026-08-14 — Table-name mismatches resolved.** Codebase standardized on `saved_opportunities` (not `saved_jobs`/`bookmarks`), `connection_requests` → `connections` (v2 schema with `requester_id/addressee_id/status`), `conversations`/`messages` (v2 schema with `participant_a/participant_b`). All API routes updated.

### Security
- **2026-08-07 — Git history force-rewritten to purge secrets.** Hardcoded Supabase service keys, a Vercel token, and Neon DB passwords that were committed in `frontend/scripts/*`, `frontend/src/lib/db/multi-db.ts`, and `test-db.js` were removed from the repository AND rewritten out of all git history (`git filter-branch` + force-push; remote `main` rewritten, old HEAD was `078c59a`). **Collaborators must `git fetch origin && git reset --hard origin/main` (or re-clone) — do NOT `git pull`** — the shared history has been rewritten. Keys were rotated on Supabase/Neon; Vercel env vars updated.
- Deleted all QA scripts with hardcoded credentials (19 files + `multi-db.ts` + `test_neon.js`). Secrets must only come from environment variables.

### Removed
- `docs/10-api-specification.md` (duplicate of `10-api-spec.md`)
- `docs/13-environment.md` (duplicate of `13-environment-variables.md`)
- `docs/ARCHITECTURE.md` (duplicate of `07-architecture.md`)
- `docs/DATABASE.md` (duplicate of `09-database.md` + `DATA_MODEL.md`)
- `docs/PRD.md` (duplicate of `03-prd.md`)
- `docs/ROADMAP.md` (duplicate of `22-roadmap.md`)
- `docs/SECURITY.md` (duplicate of `12-security.md` + `SECURITY_AND_COMPLIANCE.md`) — **recreated as new SECURITY.md**
- `docs/API_REFERENCE.md` (duplicate of `API_SPEC.md`)
- `docs/00-README.md` (redundant with `docs/README.md`)
- `berojgardegreewala/api_test_results.txt` (test artifact)
- `berojgardegreewala/audit_report.json` (test artifact)
- `berojgardegreewala/batch1_results.json` (test artifact)
- `berojgardegreewala/live_test_results.txt` (test artifact)
- `berojgardegreewala/LEGACY_READONLY.md` (obsolete legacy notice)

### Changed
- `docs/README.md` - Consolidated as single documentation index with complete navigation
- `README.md` - Rewritten with clear platform vision, 4-DB architecture, and setup guide
- `.gitignore` - Added patterns to prevent test artifacts from being committed

---

## [0.9.0] - 2026-07-10

### Added
- Academy learning paths with career progression
- Resume builder with AI analysis
- DB reset migrations for clean Supabase schema
- Batch 1 scrape sources configuration

---

## [0.8.0] - 2026-07-05

### Added
- LinkedIn-style social features (profiles, connections, messages)
- AI opportunity matching and analytics
- Community feed and posts
- Company pages
- Neon analytics database integration

---

## [0.7.0] - 2026-07-03

### Added
- Multi-database architecture (2x Supabase + 2x Neon)
- Scrape sources and verification system
- User profiles and onboarding
- Notification system

---

## [0.6.0] - 2026-06-30

### Added
- Supabase Auth integration (Google, GitHub, Email)
- User profiles table
- Protected routes and middleware

---

## [0.5.0] - 2026-05-01

### Added
- Core scraping infrastructure
- News feed with AI curation
- Opportunity verification badges
- SEO/AEO/GEO optimization
- Admin dashboard
- Email digest system

---

## [0.1.0] - 2026-03-15

### Added
- Initial project setup
- Next.js 14 frontend (berojgardegreewala)
- Express.js backend scraping service
- Basic opportunity listing
- Category filtering
### Changed
- **2026-08-20 -- Render deployment + deployed-schema fixes (Phase 6.5, part 1).** Backend deployed to Render as a web service (https://berojgardegreewala-backend.onrender.com, commit 45ed89f). Blueprint API does not support create (405); services created via POST /v1/services. starter plan rejected (402 -- workspace has no billing card): web service created on `free` (documented deviation from render.yaml); Render cron job `news-sync` (06:00 UTC) BLOCKED on billing -- owner action: add card at https://dashboard.render.com/billing, then create the cron from render.yaml (or re-run the blueprint). Vercel cron remains the production owner (unchanged). Production smoke tests exposed real schema mismatches between the committed queries and db1 (all 500s, root cause column-name drift): `backend/server/src/repositories/opportunities.ts` embedded organizations(name, slug, website_url) -- db1 column is website; `backend/server/src/repositories/content.ts` selected website_url (same fix) and source, source_url from `news_articles` -- db1 has source_name, url (rows now mapped to the client shape source/source_url like the frontend); `backend/server/src/routes/content.ts` GET /api/v1/news/:slug queried `news_archive` (db2-only table) -- now `news_articles` (parity with frontend /api/news/[slug]). Test updated: `backend/server/tests/parity.test.ts` news-slug mock moved to `news_articles`. Server 46/46 green; re-deployed (auto-deploy) and re-verified. **Final Phase 6.5 verification (same day):** /health + /health/ready 200 on the live service; smoke suite green (opportunities 3269 rows, news 222 -> 280, organizations, search, 404 envelope, CORS allow/block, admin 403/200 with DB counts, user JWT 200/401, AI 401 unauthenticated); /api/v1/cron/news-sync production runs: 12 feeds attempted / 8 OK (Chip Design Magazine, The Electronics Media, The Register - Hardware, Science Daily - Electronics fail at feed level) -> 58 news_articles inserted; re-runs scraped 92 and inserted 0 (idempotent upsert, count stable at 280 - duplicate safety proven in production); Vercel cron /api/news/sync untouched (production owner; DB fingerprints 08-14/15/16 at 06:00 UTC; no rows 17-19 - all-duplicate or missed, unverified); production E2E 9/9 (residue cleaned before and after); credential scan clean. **Blocked items recorded as KNOWN_ISSUES:** #14 Render cron news-sync cannot be created - workspace has no billing card (402; paid plan required) - owner action: card at dashboard.render.com/billing then create cron from render.yaml; web service runs on free (documented deviation, render.yaml keeps starter). #15 AI smoke = BLOCKED BY CONFIGURATION: 502 AI_UNAVAILABLE with clean envelope - GROQ key valid (models list 200) but PROVIDER_CONFIG.groq.model = llama-3.1-8b-instant was retired by Groq in 2026 (now qwen/qwen3.6-27b, openai/gpt-oss-120b, groq/compound); affects the frontend too (shared gateway) - one-line fix pending owner approval (out of deployment scope). KNOWN_ISSUES #0 closed (deploy + health evidence).
