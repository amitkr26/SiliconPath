# Data Model — SiliconPath

> **Last Updated:** July 4, 2026

---

## 1. Multi-Database Architecture Overview

SiliconPath uses a **4-database polyglot persistence** architecture to separate concerns by access pattern and workload.

| ID | Database | Type | Region | Purpose |
|----|----------|------|--------|---------|
| **db1** | Supabase Primary | PostgreSQL (managed) | `ap-southeast-1` (Singapore) | Core application data — opportunities, users, community, LinkedIn features |
| **db2** | Supabase Secondary | PostgreSQL (managed) | `ap-southeast-1` (Singapore) | News archive (>30 days), subscriber overflow |
| **db3** | Neon Primary | PostgreSQL (serverless) | `aws-us-east-1` | Analytics — AI usage, link checks, platform metrics |
| **db4** | Neon Secondary | PostgreSQL (serverless) | `aws-us-east-1` | Read-only mirror of active opportunities and recent news |

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  (Next.js API Routes / RSC / Server Actions)             │
└──────────┬──────────┬──────────┬──────────┬────────────┘
           │          │          │          │
     db1 ──┤  db2 ───┤  db3 ───┤  db4 ────┤
  Supabase  Supabase   Neon       Neon
  Primary   Secondary  Primary    Secondary
  (R/W)     (R/W)      (R/W)      (R/O)
```

The DB router (`src/lib/db/index.ts`) maps logical purposes to the correct database instance:

| Purpose | Target | Connection |
|---------|--------|------------|
| `core` (opportunities, users, community) | db1 — Supabase Primary | `@supabase/ssr` client |
| `archive` (news >30 days, overflow) | db2 — Supabase Secondary | `@supabase/ssr` client |
| `analytics` (AI logs, link checks, reports) | db3 — Neon Primary | `@neondatabase/serverless` |
| `replica` (read-only mirrors) | db4 — Neon Secondary | `@neondatabase/serverless` |

---

## 2. Supabase Primary — db1 (Core Data)

**Project:** `aqauempuwmbizqoaolop.supabase.co` (`ap-southeast-1`)

**31+ tables** across 5 domains: core opportunities, users, community, automation, LinkedIn.

#### `companies`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `slug` | `text` | UNIQUE NOT NULL |
| `name` | `text` | NOT NULL |
| `short_name` | `text` | |
| `tagline` | `text` | |
| `description` | `text` | |
| `logo_url` | `text` | |
| `banner_url` | `text` | |
| `website` | `text` | |
| `careers_page_url` | `text` | |
| `linkedin_url` | `text` | |
| `company_type` | `text` | CHECK: Government PSU, Research Lab, IIT/NIT, etc. |
| `country` | `text` | default 'India' |
| `is_active` | `boolean` | default true |
| `is_verified` | `boolean` | default false |
| `is_auto_scraped` | `boolean` | default true |
| `follower_count` | `integer` | default 0 |
| `opportunity_count` | `integer` | default 0 |

#### `news_articles`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `title` | `text` | NOT NULL |
| `slug` | `text` | UNIQUE |
| `summary` | `text` | |
| `content` | `text` | |
| `source` | `text` | |
| `source_url` | `text` | UNIQUE |
| `author` | `text` | |
| `image_url` | `text` | |
| `category` | `text` | CHECK: industry, research, policy, etc. |
| `tags` | `text[]` | |
| `companies_mentioned` | `text[]` | |
| `published_at` | `timestamptz` | |
| `views` | `integer` | default 0 |
| `is_featured` | `boolean` | default false |
| `created_at` | `timestamptz` | default now() |

#### `scraper_sources` (note: also spelled `scrape_sources` in another migration — duplicate)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `url` | `text` | NOT NULL |
| `type` | `text` | CHECK: rss_news, rss_opportunities, html_careers, api |
| `company_id` | `uuid` | FK → companies.id |
| `country` | `text` | default 'India' |
| `is_active` | `boolean` | default true |
| `scrape_frequency` | `text` | default 'daily' |
| `last_scraped_at` | `timestamptz` | |
| `last_error` | `text` | |
| `items_found_last_run` | `integer` | |
| `items_inserted_last_run` | `integer` | |
| `total_items_scraped` | `integer` | |
| `config` | `jsonb` | |

#### `subscribers`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `email` | `text` | UNIQUE NOT NULL |
| `keywords` | `text[]` | |
| `categories` | `text[]` | |
| `locations` | `text[]` | |
| `created_at` | `timestamptz` | default now() |
| `is_active` | `boolean` | default true |
| `last_email_sent_at` | `timestamptz` | |
| `email_count` | `integer` | |

#### `link_check_results`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `opportunity_id` | `uuid` | FK → opportunities.id ON DELETE CASCADE |
| `checked_at` | `timestamptz` | default now() |
| `http_status` | `integer` | |
| `is_reachable` | `boolean` | |
| `response_time_ms` | `integer` | |
| `error_message` | `text` | |

#### `opportunity_reports`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `opportunity_id` | `uuid` | FK → opportunities.id ON DELETE CASCADE |
| `report_type` | `text` | CHECK: broken_link, wrong_info, expired, duplicate, other |
| `description` | `text` | |
| `reporter_email` | `text` | |
| `reported_at` | `timestamptz` | default now() |
| `is_resolved` | `boolean` | default false |

#### `suggestions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `type` | `text` | |
| `name` | `text` | |
| `email` | `text` | |
| `url` | `text` | |
| `notes` | `text` | |
| `submitted_at` | `timestamptz` | default now() |
| `is_reviewed` | `boolean` | default false |

### 2.2 Core Opportunity Tables (Legacy Schema — for reference)

#### `opportunities` (Legacy columns — actual schema has additional fields from migrations)
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `title` | `text` | NOT NULL |
| `organization` | `text` | NOT NULL |
| `company_id` | `uuid` | FK → `companies.id` ON DELETE SET NULL |
| `category` | `text` | NOT NULL — one of: `JRF`, `SRF`, `PhD`, `Postdoc`, `Research Associate`, `Internship`, `Trainee`, `Govt Job`, `Private Job`, `Fellowship`, `Scholarship`, `Faculty` |
| `location` | `text` | |
| `city` | `text` | |
| `state` | `text` | |
| `country` | `text` | default `'India'` |
| `is_remote` | `boolean` | default `false` |
| `stipend` | `text` | |
| `stipend_min` | `integer` | For range filtering |
| `stipend_max` | `integer` | |
| `stipend_currency` | `text` | default `'INR'` |
| `deadline` | `date` | |
| `posted_date` | `date` | |
| `duration` | `text` | e.g., "6 months", "2 years" |
| `eligibility` | `text` | |
| `min_qualification` | `text` | CHECK: BTech/BE, MTech/ME, MSc, PhD, etc. |
| `experience_required` | `text` | |
| `skills_required` | `text[]` | |
| `description` | `text` | |
| `short_description` | `text` | AI-generated summary |
| `responsibilities` | `text[]` | AI-extracted |
| `requirements` | `text[]` | AI-extracted |
| `apply_link` | `text` | |
| `official_page_url` | `text` | |
| `source_url` | `text` | UNIQUE |
| `apply_link_type` | `text` | default `'homepage'` — one of: `direct`, `homepage`, `pdf`, `email`, `portal` |
| `is_active` | `boolean` | default `true` |
| `verification_status` | `text` | default `'unverified'` — one of: `pending`, `verified`, `unverified`, `link_unavailable`, `expired` |
| `verified_at` | `timestamptz` | |
| `tags` | `text[]` | |
| `slug` | `text` | UNIQUE |
| `org_slug` | `text` | |
| `apply_clicks` | `integer` | default `0` |
| `views` | `integer` | default `0` |
| `saves_count` | `integer` | default `0` |
| `posted_at` | `timestamptz` | default `now()` |
| `last_link_checked` | `timestamptz` | |
| `link_check_status` | `integer` | |
| `admin_notes` | `text` | |
| `scrape_source` | `text` | Source identifier |
| `company_page_id` | `uuid` | FK → `company_pages.id` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
- **⚠️ Known Bug:** The trigger function `generate_opp_slug()` has no body — slug auto-generation on INSERT will fail.
- **RLS:** Public SELECT where `is_active = true`; Admin all (service-role bypass).
- **Indexes:** FTS on title+org+description, slug, category, company, source_url, is_active+deadline.

#### `news_articles`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `title` | `text` | NOT NULL |
| `summary` | `text` | |
| `source` | `text` | NOT NULL |
| `source_url` | `text` | UNIQUE |
| `image_url` | `text` | |
| `tags` | `text[]` | |
| `slug` | `text` | UNIQUE |
| `published_at` | `timestamptz` | |
| `created_at` | `timestamptz` | default `now()` |
- **RLS:** Public SELECT; Admin all.
- **Indexes:** `slug`, `source`, `published_at`.

#### `scrape_sources`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `type` | `text` | NOT NULL — `rss`, `ats`, `html` |
| `url` | `text` | NOT NULL |
| `adapter` | `text` | |
| `is_active` | `boolean` | default `true` |
| `last_scraped_at` | `timestamptz` | |
| `created_at` | `timestamptz` | default `now()` |

#### `saved_opportunities`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `opportunity_id` | `uuid` | FK → `opportunities.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(user_id, opportunity_id)`
- **RLS:** Own manage (`auth.uid() = user_id`).

#### `applications`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `opportunity_id` | `uuid` | FK → `opportunities.id` |
| `status` | `text` | NOT NULL — one of: `saved`, `applied`, `interview`, `offer`, `rejected`, `accepted` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
- **RLS:** Own manage.

#### `calendar_exports`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `opportunity_id` | `uuid` | FK → `opportunities.id` |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `exported_at` | `timestamptz` | default `now()` |

### 2.2 User & Profile Tables

#### `user_profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, FK → `auth.users.id` ON DELETE CASCADE |
| `full_name` | `text` | |
| `username` | `text` | UNIQUE |
| `headline` | `text` | |
| `about` | `text` | |
| `avatar_url` | `text` | |
| `banner_url` | `text` | |
| `current_position` | `text` | |
| `current_org` | `text` | |
| `qualification` | `text` | |
| `specialization` | `text` | |
| `has_net` | `boolean` | |
| `has_gate` | `boolean` | |
| `city` | `text` | |
| `country` | `text` | |
| `preferred_location` | `text` | |
| `website_url` | `text` | |
| `skills` | `text[]` | |
| `is_open_to_work` | `boolean` | default `false` |
| `open_to_work_types` | `text[]` | |
| `profile_views` | `integer` | default `0` |
| `follower_count` | `integer` | default `0` |
| `following_count` | `integer` | default `0` |
| `connection_count` | `integer` | default `0` |
| `is_profile_public` | `boolean` | default `true` |
| `resume_ats_score` | `integer` | |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
- **RLS:** Own read/update; Admin all.

#### `user_alerts`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `keywords` | `text[]` | |
| `categories` | `text[]` | |
| `frequency` | `text` | NOT NULL — one of: `instant`, `daily`, `weekly` |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamptz` | default `now()` |
- **RLS:** Own manage.

#### `user_resumes`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `full_name` | `text` | |
| `education` | `jsonb` | |
| `skills` | `text[]` | |
| `experience` | `jsonb` | |
| `projects` | `jsonb` | |
| `publications` | `jsonb` | |
| `ats_score` | `integer` | |
| `ats_feedback` | `jsonb` | |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
- **RLS:** Own manage.
- **Trigger:** `sync_resume_ats` → calls `sync_ats_score()` on INSERT/UPDATE.

### 2.3 Community Tables

#### `community_posts`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `title` | `text` | NOT NULL |
| `content` | `text` | NOT NULL |
| `category` | `text` | |
| `tags` | `text[]` | |
| `upvotes` | `integer` | default `0` |
| `comment_count` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |
- **RLS:** Public SELECT; Auth INSERT (own); Auth DELETE (own).

#### `community_comments`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `community_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |
- **RLS:** Public SELECT; Auth INSERT (own); Auth DELETE (own).

#### `community_votes`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `community_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(post_id, user_id)`
- **RLS:** Public SELECT; Auth INSERT/DELETE (own).

### 2.4 Automation & Log Tables

#### `subscribers`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `email` | `text` | NOT NULL |
| `keywords` | `text[]` | |
| `categories` | `text[]` | |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamptz` | default `now()` |
- **RLS:** Anyone INSERT; Admin SELECT.

#### `telegram_subscribers`
| Column | Type | Constraints |
|--------|------|-------------|
| `chat_id` | `bigint` | PK |
| `is_active` | `boolean` | default `true` |
| `subscribed_at` | `timestamptz` | default `now()` |

#### `suggestions`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `title` | `text` | NOT NULL |
| `description` | `text` | |
| `votes` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |

#### `opportunity_reports`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `opportunity_id` | `uuid` | FK → `opportunities.id` |
| `report_type` | `text` | NOT NULL — one of: `broken_link`, `wrong_info`, `expired`, `other` |
| `description` | `text` | |
| `reported_at` | `timestamptz` | default `now()` |
| `is_resolved` | `boolean` | default `false` |

#### `link_check_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `opportunity_id` | `uuid` | FK → `opportunities.id` |
| `checked_at` | `timestamptz` | default `now()` |
| `http_status` | `integer` | |
| `is_reachable` | `boolean` | |
| `error_message` | `text` | |

#### `ai_usage_log`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `feature` | `text` | |
| `provider` | `text` | |
| `model` | `text` | |
| `prompt_length` | `integer` | |
| `response_length` | `integer` | |
| `success` | `boolean` | |
| `error_message` | `text` | |
| `created_at` | `timestamptz` | default `now()` |

### 2.5 LinkedIn Feature Tables (12)

#### `user_follows`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `follower_id` | `uuid` | FK → `auth.users.id` |
| `following_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(follower_id, following_id)`

#### `connection_requests`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `sender_id` | `uuid` | FK → `auth.users.id` |
| `receiver_id` | `uuid` | FK → `auth.users.id` |
| `status` | `text` | default `'pending'` — `pending`, `accepted`, `declined` |
| `created_at` | `timestamptz` | default `now()` |

#### `connections`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `connected_user_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(user_id, connected_user_id)`

#### `feed_posts`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `type` | `text` | default `'post'` — `post`, `article`, `achievement`, `question` |
| `content` | `text` | NOT NULL |
| `media_url` | `text` | |
| `reaction_counts` | `jsonb` | default `'{}'` |
| `comment_count` | `integer` | default `0` |
| `repost_count` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

#### `feed_post_likes`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `feed_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `reaction` | `text` | default `'like'` — `like`, `celebrate`, `support`, `love`, `insightful`, `curious` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(post_id, user_id)`

#### `feed_post_comments`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `feed_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamptz` | default `now()` |

#### `feed_post_reposts`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `feed_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(post_id, user_id)`

#### `feed_post_saved`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `post_id` | `uuid` | FK → `feed_posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(post_id, user_id)`

#### `company_pages`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `name` | `text` | NOT NULL |
| `slug` | `text` | UNIQUE |
| `description` | `text` | |
| `logo_url` | `text` | |
| `banner_url` | `text` | |
| `website` | `text` | |
| `industry` | `text` | |
| `size` | `text` | |
| `headquarters` | `text` | |
| `founded_year` | `integer` | |
| `follower_count` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

#### `company_followers`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `company_id` | `uuid` | FK → `company_pages.id` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(company_id, user_id)`

#### `skill_endorsements`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `skill` | `text` | NOT NULL |
| `endorsed_by` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(user_id, skill, endorsed_by)`

#### `recommendations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `recommended_by` | `uuid` | FK → `auth.users.id` |
| `content` | `text` | NOT NULL |
| `relationship` | `text` | |
| `created_at` | `timestamptz` | default `now()` |

#### `conversations`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `participant_one` | `uuid` | FK → `auth.users.id` |
| `participant_two` | `uuid` | FK → `auth.users.id` |
| `last_message_at` | `timestamptz` | |
| `created_at` | `timestamptz` | default `now()` |

#### `messages`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `conversation_id` | `uuid` | FK → `conversations.id` ON DELETE CASCADE |
| `sender_id` | `uuid` | FK → `auth.users.id` |
| `content` | `text` | NOT NULL |
| `read_at` | `timestamptz` | |
| `created_at` | `timestamptz` | default `now()` |

#### `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users.id` |
| `actor_id` | `uuid` | FK → `auth.users.id` |
| `type` | `text` | NOT NULL |
| `reference_type` | `text` | |
| `reference_id` | `uuid` | |
| `content` | `text` | |
| `is_read` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |

#### `user_blocks`
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `blocker_id` | `uuid` | FK → `auth.users.id` |
| `blocked_id` | `uuid` | FK → `auth.users.id` |
| `created_at` | `timestamptz` | default `now()` |
- **UNIQUE:** `(blocker_id, blocked_id)`

---

## 3. Supabase Secondary — db2 (Archive / Overflow)

**Project:** `jbqjipwanfsxyqkfrrpx.supabase.co` (`ap-southeast-1`)

**13 tables** — 2 active tables + 11 legacy tables (same schema as db1 equivalents).

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `news_archive` | News articles >30 days old, moved by weekly cron | Same as `news_articles` + `archived_at timestamptz` |
| `subscribers_overflow` | Subscriber table overflow (if db1 reaches row limit) | Same as `subscribers` |

---

## 4. Neon Primary — db3 (Analytics)

**Project:** `raspy-mouse-45454356` (`aws-us-east-1`)

**4 tables** for analytics workloads that should not affect core DB performance.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ai_usage_log` | AI provider audit trail (migrated from db1) | `id`, `feature`, `provider`, `model`, `prompt_length`, `response_length`, `success`, `error_message`, `created_at` |
| `link_check_logs` | Link verification audit (migrated from db1) | `id`, `opportunity_id`, `checked_at`, `http_status`, `is_reachable`, `error_message` |
| `opportunity_reports` | User issue reports (migrated from db1) | `id`, `opportunity_id`, `report_type`, `description`, `reported_at`, `is_resolved` |
| `platform_analytics` | Page views, clicks, shares | `id`, `event`, `path`, `metadata`, `created_at` |

---

## 5. Neon Secondary — db4 (Read Replica)

**Project:** `plain-glade-52224468` (`aws-us-east-1`)

**2 tables** — read-only mirrors synced daily from db1 via cron.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `opportunities_mirror` | Read-only copy of active opportunities | Same as db1 `opportunities` (active only) |
| `news_mirror` | Read-only copy of recent news | Same as db1 `news_articles` |

---

## 6. Entity-Relationship Diagram

```
auth.users (Supabase Auth — managed externally)
  │
  ├── user_profiles (1:1, FK: id → auth.users.id CASCADE)
  │     ├── saved_opportunities (1:N, FK: user_id → auth.users.id)
  │     │     └── opportunities (N:1, FK: opportunity_id → opportunities.id)
  │     ├── applications (1:N, FK: user_id → auth.users.id)
  │     │     └── opportunities (N:1, FK: opportunity_id → opportunities.id)
  │     ├── user_alerts (1:N, FK: user_id → auth.users.id)
  │     ├── user_resumes (1:1, FK: user_id → auth.users.id CASCADE)
  │     ├── calendar_exports (1:N, FK: user_id → auth.users.id)
  │     ├── user_follows (as follower, 1:N, FK: follower_id → auth.users.id)
  │     │     └── user_follows (as following, N:1, FK: following_id → auth.users.id)
  │     ├── connection_requests (as sender, 1:N)
  │     │     └── connection_requests (as receiver, N:1)
  │     ├── connections (1:N, FK: user_id → auth.users.id)
  │     │     └── connections (as connected, N:1, FK: connected_user_id → auth.users.id)
  │     ├── feed_posts (1:N, FK: user_id → auth.users.id)
  │     │     ├── feed_post_likes (1:N, FK: post_id → feed_posts.id CASCADE)
  │     │     ├── feed_post_comments (1:N, FK: post_id → feed_posts.id CASCADE)
  │     │     ├── feed_post_reposts (1:N, FK: post_id → feed_posts.id CASCADE)
  │     │     └── feed_post_saved (1:N, FK: post_id → feed_posts.id CASCADE)
  │     ├── company_followers (1:N, FK: user_id → auth.users.id)
  │     │     └── company_pages (N:1, FK: company_id → company_pages.id CASCADE)
  │     ├── skill_endorsements (as owner, 1:N)
  │     │     └── skill_endorsements (as endorser, N:1)
  │     ├── recommendations (as owner, 1:N)
  │     │     └── recommendations (as recommender, N:1)
  │     ├── conversations (as participant_one, 1:N)
  │     │     └── conversations (as participant_two, 1:N)
  │     │           └── messages (1:N, FK: conversation_id → conversations.id CASCADE)
  │     ├── notifications (1:N, FK: user_id → auth.users.id)
  │     │     └── notifications (as actor, N:1, FK: actor_id → auth.users.id)
  │     └── user_blocks (as blocker, 1:N)
  │           └── user_blocks (as blocked, N:1)
  │
  ├── community_posts (1:N, FK: user_id → auth.users.id)
  │     ├── community_comments (1:N, FK: post_id → community_posts.id CASCADE)
  │     │     └── auth.users (N:1, FK: user_id → auth.users.id)
  │     └── community_votes (1:N, FK: post_id → community_posts.id CASCADE)
  │           └── auth.users (N:1, FK: user_id → auth.users.id)
  │
  ├── opportunities (via community_posts — no direct FK)
  │     ├── opportunity_reports (1:N, FK: opportunity_id → opportunities.id)
  │     ├── link_check_logs (1:N, FK: opportunity_id → opportunities.id)
  │     └── calendar_exports (N:1, FK: opportunity_id → opportunities.id)
  │
  └── company_pages (admin-managed, no direct FK to auth.users)
        └── company_followers (1:N, FK: company_id → company_pages.id CASCADE)
```

---

## 7. Row-Level Security Policies (30 Total)

| # | Scope | Target Tables | Policy Pattern |
|---|-------|--------------|----------------|
| 1-4 | Public read | `opportunities` (active only), `news_articles`, `community_posts`, `community_comments` | `USING (is_active = true)` or `USING (true)` |
| 5-10 | Auth own manage | `user_profiles`, `saved_opportunities`, `applications`, `user_alerts`, `user_resumes`, `feed_posts` | `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE |
| 11-13 | Auth create | `community_posts`, `community_comments`, `community_votes` | `WITH CHECK (auth.uid() = user_id)` |
| 14-16 | Auth delete own | `community_posts`, `community_comments`, `community_votes` | `FOR DELETE USING (auth.uid() = user_id)` |
| 17-19 | Anyone insert | `subscribers`, `opportunity_reports`, `suggestions` | `WITH CHECK (true)` |
| 20-27 | Admin all (app-level) | `opportunities`, `news_articles`, `opportunity_reports`, `link_check_logs`, `ai_usage_log`, `telegram_subscribers`, `calendar_exports`, all LinkedIn tables | `USING (true) WITH CHECK (true)` — enforced via service-role key in app, not RLS |
| 28-30 | Admin read | `subscribers`, `suggestions`, `user_profiles` | `FOR SELECT USING (true)` |

---

## 8. Key Stored Procedures

### `toggle_upvote(p_post_id uuid, p_user_id uuid)`

PostgreSQL function used by the community vote API to atomically toggle an upvote.

```sql
CREATE OR REPLACE FUNCTION toggle_upvote(p_post_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_vote community_votes%ROWTYPE;
BEGIN
  SELECT * INTO existing_vote
  FROM community_votes
  WHERE post_id = p_post_id AND user_id = p_user_id;

  IF FOUND THEN
    DELETE FROM community_votes
    WHERE id = existing_vote.id;

    UPDATE community_posts
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = p_post_id;
  ELSE
    INSERT INTO community_votes (post_id, user_id)
    VALUES (p_post_id, p_user_id);

    UPDATE community_posts
    SET upvotes = upvotes + 1
    WHERE id = p_post_id;
  END IF;
END;
$$;
```

- `SECURITY DEFINER` — runs with owner privileges to bypass RLS on `community_votes`
- Atomically checks existence, mutates vote row, and updates post counter in a single transaction.

### `sync_ats_score()`

Trigger function that synchronizes ATS score from `user_resumes` to `user_profiles.resume_ats_score`.

```sql
CREATE OR REPLACE FUNCTION sync_ats_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles
  SET resume_ats_score = NEW.ats_score,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_resume_ats
  AFTER INSERT OR UPDATE OF ats_score
  ON user_resumes
  FOR EACH ROW
  EXECUTE FUNCTION sync_ats_score();
```

- Fires on INSERT or UPDATE of `ats_score` in `user_resumes`
- Copies score to `user_profiles.resume_ats_score` so the dashboard can display it without joining the resumes table.

---

## 9. Migrations History

| # | File | Database | Purpose |
|---|------|----------|---------|
| 1 | `20260501000001_fix_duplicates_and_cleanup.sql` | Supabase Primary | Duplicate cleanup, data fixes |
| 2 | `20260501000002_verification_and_slugs.sql` | Supabase Primary | Verification status + slug improvements |
| 3 | `20260501000003_cleanup_irrelevant_news.sql` | Supabase Primary | Remove non-electronics news |
| 4 | `20260501000004_ai_usage_log.sql` | Supabase Primary | AI usage logging table |
| 5 | `20260501000005_news_slug_suggestions.sql` | Supabase Primary | News slug suggestions |
| 6 | `20260630000001_user_profiles.sql` | Supabase Primary | User profiles table |
| 7 | `20260703000001_neon_schema.sql` | Neon | Neon analytics schema |
| 8 | `20260703000002_supabase2_schema.sql` | Supabase Secondary | DB2 archive schema |
| 9 | `20260703000003_linkedin_features.sql` | Supabase Primary | 12 LinkedIn tables + 17 profile columns + 10 seed companies |
| 10 | `20260703000004_scrape_sources_and_verification.sql` | Supabase Primary | `scrape_sources` table + verification status update |
| 11 | `20260704000001_db1_core_schema.sql` | Supabase Primary | Core schema: opportunities, companies, news, subscribers, RLS |
| 12 | `20260704000001_linkedin_tables.sql` | Supabase Primary | LinkedIn tables (alternative/overlapping) |
| 13 | `20260704000002_db2_user_social.sql` | Supabase Secondary | User social features, feed, messaging |
| 14 | `20260704000003_neon1_analytics.sql` | Neon | Analytics tables |

**⚠️ Migration Conflicts:**
- `20260703000003_linkedin_features.sql` and `20260704000002_db2_user_social.sql` create overlapping tables (`user_follows`, `connection_requests`, `feed_posts`, `skill_endorsements`, `recommendations`, `conversations`, `messages`, `notifications`). Execution order is ambiguous.
- `20260704000001_db1_core_schema.sql` creates `scraper_sources` while `20260703000004_scrape_sources_and_verification.sql` creates `scrape_sources` (different name, similar purpose).
- The function `generate_opp_slug()` in `20260704000001_db1_core_schema.sql:120-127` has no body — it declares variables but never returns a value.

**Migration directory:** `electrobridge/supabase/migrations/` (14 files total).
