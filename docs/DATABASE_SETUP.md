# Database Setup (Wipe & Rebuild)

This is the full runbook to reset SiliconPath's databases from scratch and seed clean, verified data. **These steps delete all existing data.** There is no undo. Take a backup first if you need one.

SiliconPath uses **3 databases**:

| DB | Provider | Purpose |
|---|---|---|
| Project 1 | Supabase | Core data: opportunities, organizations, scrape sources, academy content, news |
| Project 2 | Supabase | User/social: profiles, connections, feed, messages, saved items, applications |
| Analytics | Neon | Page views, searches, click events |

---

## Step 1 — Back up (optional but recommended)

In each Supabase project: **Database → Backups**, or run `pg_dump` via the connection string. For Neon, use a branch snapshot.

---

## Step 2 — Reset Supabase Project 1 (core)

1. Open Supabase **Project 1 → SQL Editor**.
2. Paste and run the entire file:
   ```
   electrobridge/supabase/migrations/20260710_000_reset_core.sql
   ```
   This drops all core tables, recreates them with a clean schema, adds indexes, and enables RLS (public read for verified content; writes only via the service role).

---

## Step 3 — Seed Project 1

Still in Project 1's SQL editor, run in order:

1. `electrobridge/supabase/seed/01_organizations.sql` (25 verified orgs, worldwide)
2. `electrobridge/supabase/seed/02_academy_tracks.sql` (7 academy tracks)

Add more organizations over time. **Prefer quality over quantity:** only mark `is_verified = true` for sources you've confirmed produce clean listings.

---

## Step 4 — Reset Supabase Project 2 (user/social)

1. Open Supabase **Project 2 → SQL Editor**.
2. Paste and run:
   ```
   electrobridge/supabase/migrations/20260710_001_reset_social.sql
   ```
   This drops all user tables (deleting every registered user and their data), recreates profiles, companies, connections, feed, messaging, saved items, job applications, and academy progress, then enables strict user-scoped RLS.

> Note: this migration does **not** delete rows from Supabase's `auth.users`. To fully remove accounts, also clear users in **Authentication → Users** (or via the admin API). The `user_profiles` table cascades from `auth.users`, so removing an auth user removes their profile.

---

## Step 5 — Reset Neon analytics

1. Open the Neon **SQL Editor** (or connect via `psql`).
2. Run:
   ```
   neon/schema.sql
   ```
   This drops and recreates the analytics tables. We consolidated from 2 Neon DBs to 1; you can delete the second Neon project.

---

## Step 6 — Verify

Run in Project 1:
```sql
SELECT count(*) FROM organizations;   -- expect 25
SELECT count(*) FROM academy_tracks;   -- expect 7
SELECT count(*) FROM opportunities;    -- expect 0 (populated by scraper)
```

Then trigger a scrape from the backend to populate opportunities:
```bash
curl -X POST https://<backend>/scrape/run \
  -H "Authorization: Bearer $SCRAPER_SECRET"
```

Only `verification_status = 'verified'` opportunities appear publicly. Review scraped rows and promote good ones to `verified` (via the admin panel or an SQL update) before they show on the site.

---

## Cross-database references

`saved_opportunities.opportunity_id`, `job_applications.opportunity_id`, and `feed_posts.opportunity_id` in Project 2 reference `opportunities.id` in Project 1. Supabase cannot enforce cross-project foreign keys, so these are validated at the application layer. Always check the opportunity exists before inserting.
