# API Specification — SiliconPath

> **Last Updated:** July 3, 2026
>
> 35 endpoint groups, 44 HTTP methods. Base path: `/api`.

---

## Auth Requirements Legend

| Badge | Meaning |
|-------|---------|
| — | Public (no auth required) |
| ✅ Auth | Valid Supabase session required |
| Admin | `NEXT_PUBLIC_ADMIN_PASSWORD` header match required |
| Cron | `CRON_SECRET` header match required |

## ⚠️ Security Notice
**Multiple critical security gaps exist in API route authentication** (identified in July 2026 audit):
- `POST /api/opportunities` — labeled "Admin" but has **no authentication** in code
- `PATCH /api/opportunities/[id]` — labeled "Admin" but has **no authentication** in code
- `DELETE /api/opportunities/[id]` — labeled "Admin" but has **no authentication** in code
- `POST /api/admin/recheck-link` — labeled "Admin" but has **no authentication** in code
- `POST/PUT/DELETE /api/scrape-sources` — labeled "Admin" but has **no authentication** in code
- `NEXT_PUBLIC_ADMIN_PASSWORD` is visible in client-side JS bundles (NEXT_PUBLIC_ prefix)
- In-memory rate limiter is ineffective in serverless environments

Refer to `docs/SECURITY_AND_COMPLIANCE.md` for full details.

---

## Table of Contents

1. [Opportunities](#1-opportunities)
2. [News](#2-news)
3. [Organizations](#3-organizations)
4. [User Actions](#4-user-actions)
5. [AI](#5-ai)
6. [Admin / Analytics](#6-admin--analytics)
7. [Cron / Automation](#7-cron--automation)
8. [Community](#8-community)
9. [Resume Builder](#9-resume-builder)
10. [Health](#10-health)
11. [Auth](#11-auth)

---

## 1. Opportunities

### `GET /api/opportunities`
- **Auth:** —
- **Purpose:** List opportunities with filters.
- **Query params:** `category`, `eligibility`, `location`, `search`, `tags`, `deadline_from`, `deadline_to`, `page`, `limit`, `sort`
- **Response:** `{ opportunities: Opportunity[], total: number, page: number }`
- **DB:** db1 — `opportunities` (public read, active only)

### `POST /api/opportunities`
- **Auth:** ⚠️ **None (should be Admin)** — see security notice above
- **Purpose:** Create a new opportunity.
- **Body:** `{ title, organization, category, location, stipend, deadline, eligibility, description, apply_link, tags, slug, org_slug, apply_link_type, official_page_url }`
- **Response:** `{ opportunity: Opportunity }`
- **DB:** db1 — `opportunities`

### `GET /api/opportunities/[id]`
- **Auth:** —
- **Purpose:** Single opportunity detail.
- **Response:** `{ opportunity: Opportunity }`
- **DB:** db1 — `opportunities`

### `PATCH /api/opportunities/[id]`
- **Auth:** ⚠️ **None (should be Admin)**
- **Purpose:** Update opportunity fields.
- **Body:** Partial `Opportunity` fields.
- **Response:** `{ opportunity: Opportunity }`
- **DB:** db1 — `opportunities`

### `DELETE /api/opportunities/[id]`
- **Auth:** ⚠️ **None (should be Admin)**
- **Purpose:** Delete an opportunity.
- **Response:** `{ success: true }`
- **DB:** db1 — `opportunities`

### `GET /api/opportunities-feed`
- **Auth:** —
- **Purpose:** Public JSON feed for external consumers.
- **Response:** `{ items: Opportunity[] }`
- **DB:** db1 — `opportunities`

### `GET /api/similar/[id]`
- **Auth:** —
- **Purpose:** Similar opportunities (same org or category).
- **Response:** `{ opportunities: Opportunity[] }`
- **DB:** db1 — `opportunities`

---

## 2. News

### `GET /api/news`
- **Auth:** —
- **Purpose:** List news articles with filters.
- **Query params:** `source`, `tag`, `search`, `page`, `limit`
- **Response:** `{ articles: NewsArticle[], total: number }`
- **DB:** db1 — `news_articles`

---

## 3. Organizations

### `GET /api/organizations`
- **Auth:** —
- **Purpose:** List all organizations with opportunity counts.
- **Response:** `{ organizations: { name, slug, count }[] }`
- **DB:** db1 — `opportunities` (aggregation query)

---

## 4. User Actions

### `GET /api/applications`
- **Auth:** ✅ Auth
- **Purpose:** List current user's saved opportunities and applications.
- **Response:** `{ applications: Application[] }`
- **DB:** db1 — `applications`, `saved_opportunities`

### `PATCH /api/applications`
- **Auth:** ✅ Auth
- **Purpose:** Update application status.
- **Body:** `{ application_id, status }` — status one of: `saved`, `applied`, `interview`, `offer`, `rejected`, `accepted`
- **Response:** `{ application: Application }`
- **DB:** db1 — `applications`

### `DELETE /api/applications`
- **Auth:** ✅ Auth
- **Purpose:** Delete an application or saved opportunity.
- **Body:** `{ application_id }`
- **Response:** `{ success: true }`
- **DB:** db1 — `applications`

### `POST /api/subscribe`
- **Auth:** —
- **Purpose:** Subscribe to newsletter (rate-limited: 3/hr per IP).
- **Body:** `{ email, keywords?, categories? }`
- **Response:** `{ success: true, message: string }`
- **DB:** db1 — `subscribers`

### `DELETE /api/subscribe`
- **Auth:** —
- **Purpose:** Unsubscribe from newsletter.
- **Body:** `{ email }`
- **Response:** `{ success: true }`
- **DB:** db1 — `subscribers`

### `POST /api/report-issue`
- **Auth:** —
- **Purpose:** Report an issue with an opportunity.
- **Body:** `{ opportunity_id, report_type, description }` — report_type: `broken_link`, `wrong_info`, `expired`, `other`
- **Response:** `{ success: true }`
- **DB:** db3 — `opportunity_reports`

### `POST /api/track-click`
- **Auth:** —
- **Purpose:** Track an apply link click for analytics.
- **Body:** `{ opportunity_id }`
- **Response:** `{ success: true }`
- **DB:** db1 — `opportunities` (increment `apply_clicks`), db3 — `platform_analytics`

### `GET /api/calendar-export/[id]`
- **Auth:** —
- **Purpose:** Download ICS calendar file with opportunity deadline.
- **Response:** `text/calendar` file download.
- **DB:** db1 — `opportunities` (read), `calendar_exports` (log)

### `POST /api/auth/signout`
- **Auth:** ✅ Auth
- **Purpose:** Sign out — clears Supabase SSR session cookie.
- **Response:** `{ success: true }`
- **DB:** None (session management only)

---

## 5. AI

### `POST /api/ai/chat`
- **Auth:** —
- **Purpose:** Electronics career chatbot. Accepts a question and returns AI-generated advice.
- **Body:** `{ message: string, history?: { role, content }[] }`
- **Response:** `{ reply: string }`
- **DB:** db3 — `ai_usage_log`

### `POST /api/ai/match`
- **Auth:** —
- **Purpose:** Profile-to-opportunity matcher. Accepts user skills/interests and returns top-10 matched opportunities with relevance scores.
- **Body:** `{ query: string }`
- **Response:** `{ matches: { opportunity: Opportunity, score: number }[] }`
- **DB:** db1 — `opportunities` (read), db3 — `ai_usage_log`

### `POST /api/ai/search`
- **Auth:** —
- **Purpose:** Natural language search. Parses a query like "find PhD positions in VLSI in Bangalore" into structured DB filters.
- **Body:** `{ query: string }`
- **Response:** `{ filters: { category?, location?, eligibility?, tags? }, explanation: string }`
- **DB:** db3 — `ai_usage_log`

### `POST /api/ai/summarize`
- **Auth:** —
- **Purpose:** Raw job description → structured summary (title, org, deadline, stipend, eligibility).
- **Body:** `{ text: string }`
- **Response:** `{ summary: { title, organization, deadline, stipend, eligibility } }`
- **DB:** db3 — `ai_usage_log`

### `GET /api/ai/expire`
- **Auth:** Cron
- **Purpose:** AI-based expiry detection — classifies opportunities as expired/active based on deadline and AI analysis.
- **Response:** `{ checked: number, expired: number, updated: number }`
- **DB:** db1 — `opportunities`, db3 — `ai_usage_log`

### `GET /api/ai/opportunity-summary/[slug]`
- **Auth:** —
- **Purpose:** AI-generated insight paragraph for an opportunity detail page.
- **Response:** `{ summary: string, slug: string }`
- **DB:** db3 — `ai_usage_log`

---

## 6. Admin / Analytics

### `POST /api/admin/recheck-link`
- **Auth:** ⚠️ **None (should be Admin)** — also a potential SSRF vector
- **Purpose:** Recheck a single opportunity's apply link for validity.
- **Body:** `{ opportunity_id }`
- **Response:** `{ status: number, reachable: boolean }`
- **DB:** db1 — `opportunities`, db3 — `link_check_logs`
- **Security Note:** This endpoint fetches arbitrary URLs from the database without authentication. An attacker who can insert a malicious `apply_link` (via the unauthenticated POST /api/opportunities) can trigger internal network requests (SSRF).

### `GET /api/analytics/ai-usage`
- **Auth:** Admin
- **Purpose:** AI provider usage statistics (requests, success rate, latency by provider).
- **Response:** `{ usage: { provider, total, success, avg_latency }[] }`
- **DB:** db3 — `ai_usage_log`

### `GET /api/analytics/platform`
- **Auth:** Admin
- **Purpose:** Platform analytics — page views, clicks, shares over time.
- **Response:** `{ page_views: number, apply_clicks: number, shares: number }`
- **DB:** db3 — `platform_analytics`

---

## 7. Cron / Automation

### `GET /api/scrape`
- **Auth:** Cron
- **Purpose:** Main scraper — fetches news from 16 RSS feeds and scrapes ISRO/DRDO/CSIR for new opportunities.
- **Query params:** `mode` — `all`, `news`, `opportunities`
- **Response:** `{ news: number, opportunities: number, errors: string[] }`
- **DB:** db1 — `opportunities`, `news_articles`, `scrape_sources`

### `GET /api/scrape-opportunities`
- **Auth:** Cron
- **Purpose:** Legacy opportunity-only scraper.
- **Response:** `{ count: number }`
- **DB:** db1 — `opportunities`

### `GET /api/scrape-jobs`
- **Auth:** Cron
- **Purpose:** Deprecated — returns deprecation notice.
- **Response:** `{ message: "Deprecated. Use /api/scrape instead." }`
- **DB:** None

### `GET /api/check-links`
- **Auth:** Cron
- **Purpose:** Verify opportunity apply links — updates link_check_status and logs to link_check_logs.
- **Response:** `{ checked: number, reachable: number, unreachable: number }`
- **DB:** db1 — `opportunities`, db3 — `link_check_logs`

### `POST /api/cleanup-news`
- **Auth:** Cron
- **Purpose:** Deduplicate news articles by source_url.
- **Response:** `{ removed: number }`
- **DB:** db1 — `news_articles`

### `GET /api/archive-news`
- **Auth:** Cron
- **Purpose:** Move news articles >30 days old from db1 to db2 (news_archive). Deletes from db1 after successful insert.
- **Schedule:** Weekly, Sunday 02:00 UTC
- **Response:** `{ archived: number }`
- **DB:** db1 + db2

### `GET /api/sync-replica`
- **Auth:** Cron
- **Purpose:** Sync active opportunities and recent news from db1 → db4 (Neon read replica).
- **Schedule:** Daily, 07:00 UTC
- **Response:** `{ opportunities: number, news: number }`
- **DB:** db1 → db4

### `GET /api/send-digest`
- **Auth:** Cron
- **Purpose:** Generate and send weekly email digest via Resend. AI-curated top opportunities and news.
- **Schedule:** Weekly, Sunday 03:00 UTC
- **Response:** `{ sent: number, subscribers: number }`
- **DB:** db1 — `subscribers`, `opportunities`, `news_articles`

---

## 8. Community

### `GET /api/community/posts`
- **Auth:** —
- **Purpose:** List forum posts with filters.
- **Query params:** `category`, `tag`, `search`, `page`, `limit`, `sort`
- **Response:** `{ posts: CommunityPost[], total: number }`
- **DB:** db1 — `community_posts`

### `POST /api/community/posts`
- **Auth:** ✅ Auth
- **Purpose:** Create a new forum post.
- **Body:** `{ title, content, category?, tags? }`
- **Response:** `{ post: CommunityPost }`
- **DB:** db1 — `community_posts`

### `GET /api/community/posts/[id]`
- **Auth:** —
- **Purpose:** Single post with its comments.
- **Response:** `{ post: CommunityPost, comments: Comment[] }`
- **DB:** db1 — `community_posts`, `community_comments`

### `DELETE /api/community/posts/[id]`
- **Auth:** ✅ Auth
- **Purpose:** Delete own forum post.
- **Response:** `{ success: true }`
- **DB:** db1 — `community_posts`

### `POST /api/community/comments`
- **Auth:** ✅ Auth
- **Purpose:** Add a comment to a post.
- **Body:** `{ post_id, content }`
- **Response:** `{ comment: Comment }`
- **DB:** db1 — `community_comments`

### `POST /api/community/vote`
- **Auth:** ✅ Auth
- **Purpose:** Toggle upvote on a post (called via `toggle_upvote` RPC).
- **Body:** `{ post_id }`
- **Response:** `{ upvotes: number, voted: boolean }`
- **DB:** db1 — `toggle_upvote()` stored procedure

---

## 9. Resume Builder

### `GET /api/resume`
- **Auth:** ✅ Auth
- **Purpose:** Get current user's resume data.
- **Response:** `{ resume: UserResume }`
- **DB:** db1 — `user_resumes`

### `POST /api/resume`
- **Auth:** ✅ Auth
- **Purpose:** Create or update resume with AI ATS scoring.
- **Body:** `{ full_name, education, skills, experience, projects, publications }`
- **Response:** `{ resume: UserResume, ats_score: number, ats_feedback: FeedbackItem[] }`
- **DB:** db1 — `user_resumes` (trigger fires `sync_ats_score`), db3 — `ai_usage_log`

---

## 10. Health

### `GET /api/health`
- **Auth:** —
- **Purpose:** Multi-database health check — pings all 4 databases and returns status.
- **Response:**
  ```json
  {
    "status": "ok" | "degraded",
    "timestamp": "2026-07-03T...",
    "databases": {
      "supabase_primary": "ok" | "error",
      "supabase_secondary": "ok" | "error",
      "neon_primary": "ok" | "error",
      "neon_secondary": "ok" | "error"
    },
    "opportunities_count": 1234,
    "news_count": 5678
  }
  ```
- **DB:** All 4 databases (connection test + row count)

---

## 11. Auth

Auth routes live at `/auth/` (pages with server actions) and `/api/auth/signout` (endpoint).

### `GET /auth/callback`
- **Auth:** —
- **Purpose:** OAuth code exchange handler. Called by Supabase after Google OAuth or email link sign-in.
- **Query params:** `code`, `error`, `error_description`
- **Behavior:**
  - Valid code → exchanges for session, redirects to `/dashboard`
  - Error in URL → redirects to `/login` with error toast
  - No code → redirects to `/login` with "no authorization code" error
  - Code exchange failure → redirects to `/login` with error message
- **DB:** None (Supabase Auth — managed externally)

### `POST /api/auth/signout`
- **Auth:** ✅ Auth
- **Purpose:** Clears Supabase SSR session cookie.
- **Response:** `{ success: true }`
- **DB:** None
