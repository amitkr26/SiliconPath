# Phase 30: Database Reality Audit

**Platform**: BerojgarDegreeWala  
**Audit Date**: August 28, 2026  
**Auditor**: Antigravity Pair-Programming Agent & Database Reliability Specialist  
**Database Engines**: Supabase PostgreSQL (`aqauempuwmbizqoaolop`) & Neon Serverless Postgres  

---

## 1. Live Supabase Table Entity Reality Table

| Table | Purpose | Primary Consumer APIs | Row Count | Status | Observations / Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`user_profiles`** | Master user profile & account metadata | `/api/profile/*`, `/api/people/*`, `/api/employer/talent` | 5 | **ACTIVE** | Canonical profiles table. `account_type` maps to role (`candidate`, `employer`). |
| **`user_resumes`** | User resume builder & ATS metadata | `/api/resume`, `/api/resume/ai-suggest` | 0–2 | **ACTIVE** | Stores structured resume JSON, contact info, ATS scores and feedback. |
| **`opportunities`** | Jobs, JRF, SRF, PhD listings | `/api/opportunities/*`, `/api/categories`, `/api/employer/jobs` | 3,609 | **ACTIVE** | 343 active, 316 verified, 82 pending, 3,061 rejected/archived. Unique slugs enforced. |
| **`applications`** | Candidate job applications | `/api/applications/*`, `/api/employer/applicants/*` | 11 | **ACTIVE** | Tracks candidate ID, opportunity ID, resume URL, status, and pipeline stage. |
| **`saved_opportunities`**| Bookmarked opportunities | `/api/opportunities/saved`, `/api/bookmarks` | 0 | **ACTIVE** | Relational link between user ID and opportunity ID. |
| **`feed_posts`** | Community posts & discussions | `/api/feed/*`, `/api/community/*` | 3 | **ACTIVE** | Tracks author ID, content, media URLs, likes and comments counts. |
| **`feed_post_comments`** | Post discussion replies | `/api/feed/posts/[id]/comment` | 22 | **ACTIVE** | Nested comments with parent comment ID support. |
| **`feed_post_likes`** | Post reactions & upvotes | `/api/feed/posts/[id]/like` | 21 | **ACTIVE** | User upvote records with unique constraint on `(post_id, user_id)`. |
| **`conversations`** | Messaging thread headers | `/api/messages` | 4 | **ACTIVE** | Direct messaging thread between participant A and participant B. |
| **`messages`** | Direct message payloads | `/api/messages`, `/api/messages/[conversationId]` | 22 | **ACTIVE** | Body, sender ID, read receipt timestamps, conversation foreign key. |
| **`notifications`** | System alerts & social activity | `/api/notifications/*` | 32 | **ACTIVE** | Alert notifications with actor ID, entity ID, type, and read status. |
| **`connections`** | Professional network graph | `/api/network/connections`, `/api/network/connect` | 6 | **ACTIVE** | Status: `pending`, `accepted`, `rejected`. Bi-directional connection query support. |
| **`skill_endorsements`**| Candidate peer endorsements | `/api/profile/[userId]/endorsements` | 15 | **ACTIVE** | Recipient ID, endorser ID, skill name. Anti-self endorsement enforced. |
| **`recommendations`** | Written peer recommendations | `/api/profile/[userId]/recommendations` | 1 | **ACTIVE** | Author ID, recipient ID, relationship, content text, visibility flag. |
| **`news_articles`** | Semiconductor news & RSS cache | `/api/news/*`, `/api/cron/scrape-news` | 285 | **ACTIVE** | Title, summary, URL, source name, image URL, publication date. |
| **`organizations`** | Company & research institution profiles | `/api/organizations/*`, `/api/companies/*`, `/api/employer/company` | 103 | **ACTIVE** | Slug, logo, website, description, verification status, claim ownership. |
| **`scrape_sources`** | Scraper target configurations | `/api/admin/scrapers`, `/api/cron/*` | 13 | **ACTIVE** | Scraper adapter name, category, priority, scrape interval, last status. |
| **`scrape_runs`** | Scraper execution logs | `/api/admin/scrape-health` | 42 | **ACTIVE** | Source ID, status, results count, duration ms, error messages. |
| **`candidate_experiences`**| Profile work history entries | `/api/profile/me/experience` | 6 | **ACTIVE** | Candidate ID, company name, role title, duration, skills used. |
| **`candidate_educations`**| Profile academic history | `/api/profile/me/education` | 6 | **ACTIVE** | Candidate ID, institution, degree, field of study, graduation year. |
| **`candidate_projects`** | Profile portfolio projects | `/api/profile/me/projects` | 6 | **ACTIVE** | Candidate ID, project title, tech stack, github/demo URL. |
| **`candidate_certifications`**| Profile certifications | `/api/profile/me/certifications` | 6 | **ACTIVE** | Candidate ID, certification name, issuer, issue date, credential URL. |
| **`candidate_achievements`**| Profile awards & publications | `/api/profile/me/achievements` | 6 | **ACTIVE** | Candidate ID, title, issuer, date, description. |
| **`subscribers`** | Newsletter & alert subscribers | `/api/subscribe`, `/api/cron/digest` | 4 | **ACTIVE** | Email, category preferences, verification token, active status. |

---

## 2. Neon Serverless Telemetry Tables

| Table | Purpose | Row Count / Storage |
| :--- | :--- | :--- |
| **`click_events`** | Real-time click tracking on opportunities & search | Active Telemetry |
| **`search_queries`** | Search query latency and popular search terms | Active Telemetry |
| **`page_views`** | High-throughput anonymous page view counters | Active Telemetry |
| **`keyword_stats`** | Trending keyword aggregations for hardware roles | Cached Rollup |
| **`trending_cache`** | Top trending opportunities & news articles cache | Cached Rollup |
| **`news_mirror`** | Fast edge mirror for semiconductor news articles | Mirror Cache |
| **`opportunities_mirror`**| Fast edge mirror for opportunity search indexing | Mirror Cache |

---

## 3. Discovered Entity Relationships & Data Integrity Checklist

- **Profiles Hierarchy**: `user_profiles.id` matches `auth.users.id`.
- **Profile Sections**: `candidate_experiences`, `candidate_educations`, `candidate_projects`, `candidate_certifications`, `candidate_achievements` use `candidate_id` foreign key referencing `user_profiles(id)`.
- **Opportunities & Applications**: `applications.opportunity_id` references `opportunities(id)`, `applications.user_id` references `user_profiles(id)`.
- **Social Graph**: `feed_posts.author_id` references `user_profiles(id)`. `feed_post_comments` and `feed_post_likes` reference `feed_posts(id)` and `user_profiles(id)`.
