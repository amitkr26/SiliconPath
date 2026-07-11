# 09 - Database

> The **live schema is the source of truth**, not migration files (they have drifted). Always read live columns before writing a query. This doc reflects the intended v2 schema; where the live DB differs, reconcile toward this.

## DB1 (Supabase primary) - core tables

### organizations
| column | type | notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| name | text | unique |
| slug | text | unique |
| type | text | academic\|government\|private\|international\|psu\|research_lab |
| country | text | |
| location | text | |
| website, careers_url, logo_url, description | text | |
| is_verified | bool | |
| created_at, updated_at | timestamptz | |

### opportunities
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| title | text | must be a real role title, never a nav heading |
| slug | text unique | generate in APP code (DB fn is broken) |
| organization_id | uuid FK -> organizations | NOT a text `organization` column |
| category | text | jrf\|srf\|phd\|postdoc\|industry\|government\|fellowship\|internship (lowercase) |
| specialization | text[] | |
| description, eligibility, location, country | text | |
| is_international, is_remote | bool | |
| salary_range | text | (was `stipend`) |
| apply_url | text | (was `apply_link`) redirect target |
| deadline | date | |
| posted_date | date | |
| verification_status | text | pending\|verified\|rejected\|expired; only `verified` is public |
| source_type | text | scraped\|manual\|employer_posted |
| source_url, scrape_source_id | | per-listing unique URL for dedup |
| tags | text[] | |
| is_active | bool | |
| view_count | int | |

### scrape_sources / scrape_runs
- `scrape_sources`: id, name, url, adapter (greenhouse\|lever\|smartrecruiters\|workday\|html\|rss\|schema), category, organization_id, is_active, priority, batch, last_scrape_at, last_success_at, last_error, consecutive_failures, total_runs, total_results.
- `scrape_runs`: id, source_id FK, status (running\|success\|failed), results_count, error, duration_ms, started_at, completed_at.

### news_articles / resources / subscribers
- `news_articles`: id, title, url (unique), source_name, summary, image_url, published_at, tags[], is_active.
- `resources`: id, name, url, kind (course\|channel\|tool\|book\|paper), difficulty, topic_tags[], track_slug, notes, is_active.
- `subscribers`: id, email (unique), categories[], keywords[], countries[], is_verified, verification_token, unsubscribe_token.

### Academy content
- `academy_tracks` (or `learning_tracks` live): slug, title/name, description, icon, color, order_index, estimated_days, estimated_hours, prerequisites[], is_active.
- `academy_days` (or `learning_days`): track_id FK, day_number, title, objectives/theory, resources jsonb, practice_questions/checkpoint_quiz jsonb.
- `academy_assessments` / `track_checkpoints`: track_id, questions jsonb, passing_score (>=70), time_limit_minutes.

## DB1 - social/user tables (auth-scoped)

> These physically live on DB1 (see 07-architecture). Watch for live column drift.

- **user_profiles** (PK id -> auth.users): display_name, email, avatar_url, headline, bio, location, country, account_type (seeker\|provider), job_title (NOT reserved `current_role`), current_company, experience_years, skills[], interests[], linkedin_url, github_url, website_url, is_profile_public, is_open_to_work, email_notifications, profile_views, follower_count, following_count, connection_count.
- **company_profiles**: owner_id FK, name, slug, kind (company\|institution\|university\|government\|research_lab\|startup), logo_url, website, industry, size, location, country, about, is_verified.
- **connections**: requester_id, addressee_id, status (pending\|accepted\|rejected\|blocked). (Some legacy rows use user_id_1/user_id_2/connected_at + a separate connection_requests table; reconcile to requester/addressee/status.)
- **user_follows**: follower_id, following_id.
- **feed_posts**: author_id, content, media_urls[], opportunity_id, like_count, comment_count. (Legacy drift: user_id/likes_count/comments_count.)
- **post_reactions / feed_post_likes / feed_post_comments / feed_post_reposts**.
- **conversations**: participant_a, participant_b, last_message_at, last_message_preview, unread counts. (Legacy drift: participant_1/2.)
- **messages**: conversation_id, sender_id, body/content, is_read.
- **notifications**: user_id, type, actor_id, entity_type, entity_id, message, is_read.
- **saved_opportunities**: user_id, opportunity_id (app-level ref to DB1 opportunities).
- **job_applications**: user_id, opportunity_id, status (applied\|reviewing\|interview\|offer\|rejected\|withdrawn), note.
- **academy_user_progress / academy_assessment_results**.
- **skill_endorsements / recommendations**.

## DB3 (Neon) - analytics
- **page_views**: path, referrer, user_agent, ip_hash (hashed, never raw), session_id, country.
- **search_queries**: query, results_count, filters jsonb.
- **click_events**: opportunity_id, event_type (view\|apply_click\|share\|save).

## RLS
- Core public tables: public `SELECT` where `is_active` / `verified`; all writes via service role.
- Social tables: user-scoped via `auth.uid()`; public profiles/feed/company readable.

## Known DB bugs to fix
1. `generate_opp_slug()` empty body -> trigger inserts fail. Generate slug in app.
2. Column drift between code and live (display_name vs full_name, requester_id vs user_id_1, body vs content, author_id vs user_id). Reconcile in a single migration + code pass.
