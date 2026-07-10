# Architecture

SiliconPath is a Next.js 14 (App Router) application backed by Supabase and Neon, with a separate Express scraper service. This document reflects the **v2 rebuild**.

---

## 1. Three layers, one app

1. **Aggregator (public).** Server-rendered pages read verified opportunities directly from Supabase Project 1. No auth required.
2. **Academy (public).** Static curriculum in Project 1; per-user progress in Project 2 (or LocalStorage for anonymous users).
3. **Professional network (authenticated).** Profiles, connections, feed, messaging, applications in Project 2, gated by Supabase SSR auth middleware.

---

## 2. The 3-database strategy (down from 4)

| DB | Provider | Contents | Why separate |
|---|---|---|---|
| Project 1 | Supabase | Opportunities, orgs, scrape sources, academy content, news | Hot read path for anonymous visitors; kept lean |
| Project 2 | Supabase | Users, connections, feed, messages, saved, applications | Relational social graph, auth-scoped RLS |
| Analytics | Neon | Page views, searches, clicks | High-write, disposable, cheap serverless Postgres |

We removed the 4th database (a second Neon read-replica) as premature optimization. A single Neon instance is more than enough at current scale, and Neon offers built-in read scaling if needed later.

### Cross-DB references
Project 2 rows reference `opportunities.id` in Project 1. Supabase does not support cross-project FKs, so these are validated in the application layer, never assumed by the database.

---

## 3. Security model

- **RLS everywhere.** Public content (verified opportunities, orgs, academy, news) is read-only for anon. All writes go through the service role (admin/cron) or are user-scoped.
- **Admin auth is server-only.** `ADMIN_PASSWORD` and `CRON_SECRET` are never exposed with `NEXT_PUBLIC_`. Every admin/write API route calls `verifyAdmin()`.
- **Field whitelisting.** Profile and source updates only accept an explicit allowlist of columns (no mass assignment / privilege escalation).
- **Input sanitization.** User search input is stripped of PostgREST filter metacharacters before being interpolated into `.or()`/`.ilike()`.
- **SSRF prevention.** New scrape source URLs are rejected if they resolve to localhost, link-local (`169.254.169.254`), or private IP ranges.
- **Durable rate limiting.** Uses Upstash Redis in production (in-memory limiting is a no-op on serverless).

---

## 4. Scraper pipeline

```
Vercel Cron → /api/cron/* → (proxy via SCRAPER_SECRET) → backend /scrape/run
   → orchestrator (concurrency-limited) → adapters (Greenhouse/Lever/Workday/HTML/RSS/…)
   → AI parse (safe JSON, multi-provider fallback) → normalize → insert into Project 1 (pending)
   → admin review → verified → public
```

Scraped opportunities start as `pending`. Only `verified` rows appear on the site. This keeps garbage data (bad titles, wrong categories) off the public surface.

---

## 5. AI fallback chain

Unstructured job descriptions (PDFs, HTML, DRDO/ISRO notices) are parsed through a resilient multi-provider chain. If a provider fails (rate limit, downtime, expired key), the next takes over. All AI output is parsed with a tolerant JSON parser (`lib/ai/safe-parse.ts`) so malformed model output degrades gracefully instead of returning a 500.

Keep at least one working provider key (Groq or Gemini) configured. Remove deprecated models promptly.

---

## 6. Frontend

- **RSC-first.** Public pages (home, opportunities, academy tracks) render on the server for SEO and speed. Only user-specific state (progress, auth) is client-fetched.
- **Responsive design system.** `globals.css` defines fluid type (`clamp()`), a 4pt spacing scale, OKLCH tinted neutrals, and mobile-first breakpoints (640 / 768 / 1024 / 1280). Touch targets are ≥ 44px on coarse pointers; layouts are redesigned per breakpoint, not merely shrunk.
- **Error boundaries.** Every data-driven page has explicit loading, error, and empty states so nothing hangs on an infinite spinner.
