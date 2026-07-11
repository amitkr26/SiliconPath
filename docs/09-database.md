# 09 — Database

> Authoritative schema = the migration files in `electrobridge/supabase/migrations/`
> **reconciled with the live DB**. When they disagree, the live DB wins for reads;
> fix code or write a migration to converge. Never guess.

## DB1 (Supabase, core) — key tables

### organizations
`id uuid pk`, `name text unique`, `slug text unique`,
`type text CHECK (academic|government|private|international|psu|research_lab)`,
`country text`, `location text`, `website text`, `careers_url text`, `logo_url text`,
`description text`, `is_verified bool`, `created_at`, `updated_at`.

### opportunities
`id uuid pk`, `title text`, `slug text unique`,
`organization_id uuid fk -> organizations(id)`,
`category text CHECK (jrf|srf|phd|postdoc|industry|government|fellowship|internship)`,
`specialization text[]`, `description text`, `eligibility text`, `location text`,
`country text`, `is_international bool`, `is_remote bool`, `salary_range text`,
`apply_url text NOT NULL`, `deadline date`, `posted_date date`,
`verification_status text CHECK (pending|verified|rejected|expired)`,
`source_type text CHECK (scraped|manual|employer_posted)`, `source_url text`,
`scrape_source_id uuid`, `tags text[]`, `is_active bool`, `view_count int`,
`created_at`, `updated_at`.

**Indexes:** category; (is_active, verification_status); deadline (partial not-null);
organization_id; created_at desc; is_international.

**RLS:** public read WHERE `is_active AND verification_status='verified'`; writes via
service role only.

### scrape_sources / scrape_runs
`scrape_sources`: id, name, url, `adapter CHECK (greenhouse|lever|smartrecruiters|workday|html|rss|schema)`,
category, organization_id, is_active, priority, batch, last_scrape_at, last_success_at,
last_error, consecutive_failures, total_runs, total_results.
`scrape_runs`: id, source_id fk, `status CHECK (running|success|failed)`, results_count,
error, duration_ms, started_at, completed_at.

### news_articles / resources / academy_tracks / academy_days / academy_assessments / subscribers
See migration `20260710_000_reset_core.sql`. Academy content tables hold the 7-track
curriculum (see [26-academy-curriculum.md](26-academy-curriculum.md)).

## DB2 / social (physically on DB1 for auth, see arch doc) — key tables

### user_profiles  (PK = auth.users.id)
Canonical v2 columns: `display_name`, `email`, `avatar_url`, `headline`, `bio`,
`location`, `country`, `account_type CHECK (seeker|provider)`, `job_title`,
`current_company`, `experience_years`, `skills text[]`, `interests text[]`,
`linkedin_url`, `github_url`, `website_url`, `is_profile_public`, `is_open_to_work`,
`email_notifications`, `profile_views`, `created_at`, `updated_at`.

> DRIFT WARNING: some live rows historically used `full_name`, `about`,
> `current_position`, `current_org`, `city`. A reconciliation migration adds/backfills
> the v2 names. Confirm live columns before querying.

### connections
`id`, `requester_id fk`, `addressee_id fk`, `status CHECK (pending|accepted|rejected|blocked)`,
`created_at`, `updated_at`, UNIQUE(requester_id, addressee_id).

### feed_posts / post_reactions / conversations / messages
`feed_posts`: id, `author_id fk`, content, media_urls[], opportunity_id, like_count,
comment_count, created_at.
`conversations`: id, participant_a, participant_b, last_message_at.
`messages`: id, conversation_id fk, sender_id fk, `body text`, is_read, created_at.

### saved_opportunities / job_applications / company_profiles / academy_user_progress
company_profiles: id, owner_id fk, name, slug, `kind CHECK (company|institution|university|government|research_lab|startup)`, logo_url, website, industry, size, location, country, about, is_verified.

## DB3 (Neon, analytics)
`page_views`, `search_queries`, `click_events`. High-write, disposable. See `neon/schema.sql`.

## Known DB issues to fix
- `generate_opp_slug()` has an empty body → trigger-based inserts fail. Slugs are
  generated in app code instead; either give the function a body or drop the trigger.
- Conflicting migration files exist; converge on the `20260710_*` reset + reconcile set.
- Cross-project FKs are not enforceable in Supabase; validate at app layer.
