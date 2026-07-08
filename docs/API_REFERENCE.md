# API Reference

All backend logic in SiliconPath is handled via Next.js App Router API Routes (`src/app/api`). There are **36 endpoint groups** with **44 HTTP methods**.

## Security Notice
**Multiple critical security issues were found in API routes** (see `docs/SECURITY_AND_COMPLIANCE.md`):
- Several admin write endpoints have **no authentication** — `POST /api/opportunities`, `PATCH /api/opportunities/[id]`, `DELETE /api/opportunities/[id]`, `POST /api/admin/recheck-link`, `POST/PUT/DELETE /api/scrape-sources`
- `NEXT_PUBLIC_ADMIN_PASSWORD` is prefixed with `NEXT_PUBLIC_`, exposing it in client-side JS bundles
- In-memory rate limiter is ineffective in serverless (Vercel) environments

## Admin / Cron Routes
*These routes should require the `Authorization: Bearer <CRON_SECRET>` header, but some lack enforcement.*

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET/POST` | `/api/scrape` | Main scraper — news + opportunities | Cron |
| `GET` | `/api/scrape-opportunities` | Legacy opportunity scraper | Cron |
| `GET` | `/api/scrape-jobs` | Deprecated (returns notice) | None |
| `POST` | `/api/admin/recheck-link` | Recheck single opportunity link | ⚠️ **None (vulnerable)** |
| `GET` | `/api/check-links` | Verify opportunity links | Cron |
| `POST` | `/api/cleanup-news` | Deduplicate news articles | None |
| `GET` | `/api/archive-news` | Archive old news (db1→db2) | Cron |
| `GET` | `/api/sync-replica` | Sync to Neon read replica | Cron |
| `GET` | `/api/send-digest` | Weekly email digest | Cron |

## Core Aggregator Routes
*Public routes used by the main application.*

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/opportunities` | List with filters | — |
| `POST` | `/api/opportunities` | Create opportunity | ⚠️ **None (should be Admin)** |
| `GET` | `/api/opportunities/[id]` | Single opportunity detail | — |
| `PATCH` | `/api/opportunities/[id]` | Update opportunity | ⚠️ **None (should be Admin)** |
| `DELETE` | `/api/opportunities/[id]` | Delete opportunity | ⚠️ **None (should be Admin)** |
| `GET` | `/api/opportunities-feed` | Public JSON feed | — |
| `GET` | `/api/news` | List news with filters | — |
| `GET` | `/api/organizations` | List organizations with counts | — |
| `GET` | `/api/similar/[id]` | Similar opportunities | — |
| `POST` | `/api/subscribe` | Newsletter subscribe | — |
| `DELETE` | `/api/subscribe` | Unsubscribe | — |
| `POST` | `/api/report-issue` | Report opportunity issue | — |
| `POST` | `/api/track-click` | Track apply link clicks | — |
| `GET` | `/api/calendar-export/[id]` | ICS calendar download | — |

## Social / Networking Routes (Dormant)
*These routes interact with DB2 (Social Graph) and require an authenticated session.*

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/feed` | Fetch the user timeline or create a new post |
| `GET/POST/DELETE` | `/api/feed/posts/[id]/like` | 5-reaction picker |
| `GET/POST` | `/api/feed/posts/[id]/comment` | Add comment |
| `GET/POST` | `/api/feed/posts/[id]/repost` | Repost toggle |
| `GET/POST` | `/api/messages` | Fetch conversations or send message |
| `GET/POST` | `/api/network/connect` | Send or accept connection request |
| `GET` | `/api/network/connections` | List connections |
| `GET` | `/api/network/suggestions` | People suggestions |
| `GET` | `/api/profile/[userId]` | Fetch user profile |
| `GET` | `/api/profile/[userId]/endorse` | Skill endorsements |
| `GET` | `/api/people/search` | User search |
| `GET` | `/api/notifications` | List notifications |
| `GET/POST` | `/api/companies` | List/search companies |

## AI Routes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/ai/chat` | Electronics career chatbot |
| `POST` | `/api/ai/match` | Profile-to-opportunity matcher |
| `POST` | `/api/ai/search` | Natural language → DB filters |
| `POST` | `/api/ai/summarize` | Raw description → structured summary |
| `GET` | `/api/ai/expire` | AI-based expiry detection |
| `GET` | `/api/ai/opportunity-summary/[slug]` | AI insight panel |

## System Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Multi-DB health check (all 4 databases) |
| `GET` | `/api/og` | Default OG image |
| `GET` | `/api/og/opportunity/[slug]` | Per-opportunity OG image |

## Community Routes

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/community/posts` | List/create forum posts |
| `GET/DELETE` | `/api/community/posts/[id]` | Single post with comments / delete |
| `POST` | `/api/community/comments` | Add comment |
| `POST` | `/api/community/vote` | Toggle upvote |

## Resume Builder

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/resume` | Get/create/update resume with AI ATS scoring |

## Auth

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/signout` | Sign out — clears Supabase SSR cookie |

## Scheduled Cron Jobs (vercel.json)

| Path | Schedule | Purpose |
|---|---|---|
| `/api/cron/scrape-india` | Daily 06:00 UTC | Scrape Indian sources |
| `/api/cron/scrape-global` | Daily 08:00 UTC | Scrape global sources |
