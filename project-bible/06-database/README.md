# Database Architecture

## Overview

SiliconPath uses exactly four databases across two providers. This architecture is a locked decision — do not add or remove databases.

## Database Map

| DB | Provider | Role | Tables |
|----|----------|------|--------|
| DB1 | Supabase (Primary) | **Core platform data** | organizations, opportunities, news_articles, resources, academy_tracks, academy_days, track_checkpoints, subscribers, scrape_sources, scrape_runs, link_check_results, opportunity_reports |
| DB2 | Supabase (Secondary) | **Social + Auth layer** | Auth is on DB1. Social tables on DB2: user_profiles, connections, feed_posts, messages, notifications, saved_opportunities, applications, company_profiles, resumes, community_posts |
| Neon | (Consolidated) | **Analytics** | page_views, search_queries, click_events |

**Critical clarification:** Although early design docs implied the social layer lives on DB2, the actual route handlers use `createClient()` which points at DB1 (because Supabase Auth + `auth.uid()` lives on DB1). So `user_profiles`, `connections`, `feed_posts`, `messages`, `notifications` all physically live on **DB1**. DB2 is effectively just `news_archive` and `subscribers_overflow`. Treat DB1 as the home of both core and social tables.

## Key Schema Decisions

### opportunities table
- `slug` is UNIQUE and NOT NULL — generated in application code (the DB function `generate_opp_slug` has an empty body and cannot be relied upon)
- `verification_status` controls visibility: only `'verified'` rows are public
- `source_url` is UNIQUE for deduplication
- `organization_id` references `organizations(id)` — never store organization name as text

### Verification Status Values
- `'verified'`: Public — shown to all users
- `'pending'`: Awaiting admin review — hidden from public
- `'rejected'`: Rejected by admin — hidden
- `'expired'`: Past deadline or confirmed closed
- `'link_unavailable'`: Apply link is broken

### Academy Tables
- `academy_tracks` (or `learning_tracks`): 7 VLSI tracks with gated prerequisites
- `academy_days` (or `learning_days`): Day-wise content within tracks
- `track_checkpoints`: End-of-track assessments with questions
- `user_learning_progress`: Per-user per-day completion tracking
- `academy_assessment_results`: Assessment scores

### Social Tables
- `user_profiles`: Extended profile data linked to `auth.users`
- `connections`: requester_id, addressee_id, status (pending/accepted/rejected)
- `feed_posts`: Posts with author_id, content, engagement counters
- `messages`: Messages within conversations
- `notifications`: User notification queue

## Known Database Issues

1. **Column drift**: The codebase uses `apply_link` but the live DB may have `apply_url`. The `mapDbOpportunityToClient` bridge function handles both.
2. **Column drift**: Code uses `stipend` but live DB may have `salary_range`. The bridge function handles both.
3. **generate_opp_slug()** has an empty body. Always generate slugs in application code.
4. **Migration files are not the source of truth** — the live schema is. Always read live columns before writing queries.

## Related Documents

- [supabase-db1.md](./supabase-db1.md) — Full DB1 schema
- [supabase-db2.md](./supabase-db2.md) — Full DB2 schema
- [neon-analytics.md](./neon-analytics.md) — Analytics schema
- [migrations.md](./migrations.md) — Migration history
- [rls-policies.md](./rls-policies.md) — Row Level Security
