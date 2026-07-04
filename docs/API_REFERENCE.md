# API Reference

All backend logic in SiliconPath is handled via Next.js App Router API Routes (`src/app/api`).

## Admin / Cron Routes
*These routes require the `Authorization: Bearer <CRON_SECRET>` header.*

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/cron/scrape-global` | Triggers scraping of international university RSS feeds and parsing via AI chain. |
| `GET/POST` | `/api/cron/scrape-india` | Triggers scraping of DRDO and ISRO websites. |
| `GET/POST` | `/api/cron/scrape-news` | Scrapes industry news (IEEE, Semiconductor Engineering). |
| `GET/POST` | `/api/cron/check-links` | Verifies that parsed opportunity URLs are still active (returns 200). |
| `GET/POST` | `/api/cron/digest` | Generates and sends weekly email digests to subscribers via Resend. |

## Core Aggregator Routes
*Public routes used by the main application.*

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/opportunities` | Fetch paginated opportunities, optionally filtered by type or location. |
| `GET` | `/api/opportunities/[id]` | Fetch details for a specific opportunity. |
| `GET` | `/api/news` | Fetch paginated news articles. |
| `GET` | `/api/organizations` | Fetch all organizations and their metadata. |
| `POST` | `/api/subscribe` | Add an email to the newsletter subscriber list (DB1). |
| `POST` | `/api/track-click` | Logs an outbound click event to the Neon Analytics DB. |

## Social / Networking Routes (Dormant)
*These routes interact with DB2 (Social Graph) and require an authenticated session.*

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/feed` | Fetch the user timeline or create a new post. |
| `GET/POST` | `/api/messages` | Fetch active conversations or send a new direct message. |
| `GET/POST` | `/api/network/connect` | Send or accept a connection request. |
| `GET` | `/api/profile/[userId]` | Fetch a user's full profile, skills, and endorsements. |

## System Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Returns 200 OK and basic DB connection status. |
| `GET` | `/api/og` | Dynamic OpenGraph image generation. |
