# Technical Architecture — ElectroBridge

> **Version:** 1.0  
> **Last Updated:** July 3, 2026  
> **Status:** In Production

---

## 1. System Overview

ElectroBridge is a full-stack Next.js application with a multi-database backend, a background scraping engine, and a chain of AI providers for intelligent features. The system is designed to operate entirely on free-tier infrastructure while maintaining high reliability.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Next.js 14)                          │
│                                                                         │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│   │  30+ Pages  │  │ 40+ API      │  │ Middleware    │  │ Cron Jobs │  │
│   │  (RSC/SSR/  │  │ Routes       │  │ (Supabase SSR │  │ (vercel.  │  │
│   │   Client)   │  │ (REST)       │  │  Auth Refresh)│  │  json)    │  │
│   └─────────────┘  └──────┬───────┘  └──────────────┘  └─────┬─────┘  │
│                            │                                   │        │
└────────────────────────────┼───────────────────────────────────┼────────┘
                             │                                   │
              ┌──────────────┼───────────────────────┐           │
              │              │                       │           │
              ▼              ▼                       ▼           ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                       DATABASE LAYER                                │
   │                                                                      │
   │  ┌──────────────────────┐  ┌──────────────────────┐                │
   │  │  Supabase Primary    │  │  Supabase Secondary  │                │
   │  │  (db1)               │  │  (db2)               │                │
   │  │  ap-southeast-1      │  │  ap-southeast-1      │                │
   │  │  31 tables           │  │  13 tables           │                │
   │  │  Core app data       │  │  News archive +      │                │
   │  │                      │  │  subscriber overflow │                │
   │  └──────────────────────┘  └──────────────────────┘                │
   │                                                                      │
   │  ┌──────────────────────┐  ┌──────────────────────┐                │
   │  │  Neon Primary        │  │  Neon Secondary      │                │
   │  │  (db3)               │  │  (db4)               │                │
   │  │  aws-us-east-1       │  │  aws-us-east-1       │                │
   │  │  4 tables            │  │  2 tables            │                │
   │  │  Analytics + logs    │  │  Read replica mirror │                │
   │  └──────────────────────┘  └──────────────────────┘                │
   └──────────────────────────────────────────────────────────────────────┘
                             │
                             │
              ┌──────────────┼───────────────────────┐
              │              │                       │
              ▼              ▼                       ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                    EXTERNAL SERVICES                                │
   │                                                                      │
   │  ┌────────────────────────────────────────────┐                    │
   │  │          AI PROVIDER FALLBACK CHAIN         │                    │
   │  │                                            │                    │
   │  │  #1 AWS Bedrock  ← primary (~60% traffic)  │                    │
   │  │  #2 Groq         ← fastest fallback        │                    │
   │  │  #3 NVIDIA NIM   ← high quality fallback   │                    │
   │  │  #4 Gemini       ← free tier fallback      │                    │
   │  │  #5 OpenRouter   ← fallback                │                    │
   │  │  #6 Cloudflare   ← fallback                │                    │
   │  │  #7 HuggingFace  ← last resort             │                    │
   │  └────────────────────────────────────────────┘                    │
   │                                                                      │
   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ┌─────────────┐ │
   │  │ Resend   │  │ Telegram │  │ Plausible        │  │ Sentry      │ │
   │  │ (Email)  │  │ Bot API  │  │ (Analytics)      │  │ (Errors)    │ │
   │  └──────────┘  └──────────┘  └──────────────────┘  └─────────────┘ │
   │                                                                      │
   │  ┌────────────────────────────────────────────────────────────────┐ │
   │  │                  SCRAPE SOURCES                               │ │
   │  │  ┌──────────┐  ┌────────────┐  ┌──────────────┐              │ │
   │  │  │ 16 RSS   │  │ ATS APIs   │  │ HTML Scrape  │              │ │
   │  │  │ Feeds    │  │ (preferred)│  │ (ISRO,DRDO,  │              │ │
   │  │  │          │  │            │  │  CSIR)       │              │ │
   │  │  └──────────┘  └────────────┘  └──────────────┘              │ │
   │  └────────────────────────────────────────────────────────────────┘ │
   └──────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────┐
   │                    RENDER (Background Worker)                       │
   │  Repurposed as scrape-worker, triggered by Vercel cron via HTTP     │
   │  Executes heavy scraping tasks that exceed Vercel serverless limits │
   └──────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **User Request Flow:** Browser → Vercel Edge (middleware) → Next.js App Router → React Server/Client Component → API Route → DB Router (`getDB()`) → Target Database → Response
2. **Scrape Flow:** Vercel Cron (06:00 UTC) → `/api/scrape?mode=all` → Orchestrator → Adapter-based scrapers → Supabase Primary (db1) → Deep Scraper → AI Summarizer → Pending queue
3. **AI Flow:** Client/Server → `callAI()` → Provider loop (Bedrock → Groq → ... → HuggingFace) → Log to `ai_usage_log` (Neon db3) → Return response
4. **Sync Flow:** Weekly cron → `/api/archive-news` → db1→db2 (archive). Daily cron → `/api/sync-replica` → db1→db4 (read replica mirror)

---

## 2. Hosting & Deployment

### 2.1 Vercel (Production)

| Setting | Value |
|---------|-------|
| **Project** | `amitk26/electrobridge` |
| **Framework** | Next.js |
| **Root Directory** | `electrobridge/` |
| **Node.js Version** | 24.x |
| **Auto-deploy** | From `main` branch (GitHub integration) |
| **Production URL** | https://electrobridge.vercel.app |
| **Preview URLs** | Auto-generated per PR |

**Vercel Configuration (`electrobridge/vercel.json`):**

```json
{
  "crons": [
    { "path": "/api/scrape?mode=all", "schedule": "0 6 * * *" },
    { "path": "/api/send-digest", "schedule": "0 3 * * 0" },
    { "path": "/api/archive-news", "schedule": "0 2 * * 0" },
    { "path": "/api/sync-replica", "schedule": "0 7 * * *" }
  ]
}
```

**Build Configuration (`next.config.mjs`):**
- Image remotePatterns: allows all HTTPS hosts (`**`)
- Redirects: UUID-format opportunity URLs → `/opportunities` (strips invalid UUID paths)
- Sentry integration via `withSentryConfig`
- TypeScript: strict mode, path aliases `@/` → `src/`

### 2.2 Render (Background Worker)

Render is repurposed as a background scrape worker, not a web server. The instance is triggered by Vercel cron jobs via HTTP requests to avoid serverless function timeouts for heavy scraping operations.

| Setting | Value |
|---------|-------|
| **Purpose** | Background scrape worker |
| **Trigger** | Vercel cron → HTTP request |
| **Token** | `rnd_GCEmbLzqTpnOKy202LGW9tiGrOla` |
| **Status** | Provisioned, pending active usage |

### 2.3 CI/CD Pipeline (GitHub Actions)

**Workflow file:** `.github/workflows/ci.yml`

**Triggers:**
- Push to `main` branch
- Pull requests targeting `main`

**Steps:**
1. **Lint:** `npm run lint` (Next.js ESLint config)
2. **Test:** `npm test` (Jest 30 — 31 tests across 4 suites)
3. **Build:** `npm run build` (Next.js production build)

**Current limitation:** Vercel auto-deploy from `main` is configured via GitHub integration, but the CI pipeline cannot trigger deploys directly because `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are not set as GitHub secrets.

**Secrets in CI:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

These are set as GitHub secrets or fall back to empty strings for build safety.

---

## 3. The 4-Database Strategy

ElectroBridge uses four independent PostgreSQL databases, each serving a specific purpose. This architecture separates concerns, keeps core data performant, maintains an archive, enables analytics without impacting production, and provides a read replica for scalable public access.

### 3.1 Database Routing

The database router at `src/lib/db/index.ts` provides a unified interface for routing queries to the correct database based on purpose:

```typescript
function getDB(purpose:
  | 'opportunities'   // → db1 (Supabase Primary)
  | 'news'            // → db1 (Supabase Primary)
  | 'auth'            // → db1 (Supabase Primary)
  | 'community'       // → db1 (Supabase Primary)
  | 'analytics'       // → db3 (Neon Primary)
  | 'news_archive'    // → db2 (Supabase Secondary)
  | 'read_replica'    // → db4 (Neon Secondary)
)
```

Guard clauses (`trySupabase`/`tryNeon`) return `undefined` if the corresponding environment variable is missing, preventing build-time crashes during local development.

### 3.2 db1 — Supabase Primary (Core Application Data)

**Project:** `aqauempuwmbizqoaolop` ("electrobridge")  
**Region:** `ap-southeast-1` (Singapore)  
**Type:** PostgreSQL via Supabase  
**Client:** `@supabase/supabase-js` (anon key + service role key)  
**Status:** ✅ ACTIVE_HEALTHY  
**Tables:** 31

#### Core Tables

| Table | Purpose | Key Columns | Row-Level Security |
|-------|---------|-------------|-------------------|
| `opportunities` | Core R&D job opportunities | id, title, org, category, deadline, stipend, tags, slug, verification_status, is_active | Public read (active only), Admin all |
| `news_articles` | Electronics/semiconductor news | id, title, summary, source, tags, slug, published_at | Public read, Admin all |
| `subscribers` | Email newsletter subscribers | email, keywords, categories, frequency, is_active | Anyone insert, Admin read |
| `ai_usage_log` | AI provider audit trail (also mirrored to db3) | id, provider, model, endpoint, duration_ms, success, created_at | Service role insert, Admin read |
| `link_check_logs` | Link verification audit (also mirrored to db3) | id, opportunity_id, status, checked_at | Admin all |
| `opportunity_reports` | User issue reports (also mirrored to db3) | id, opportunity_id, reason, status, created_at | Anyone insert, Admin manage |
| `telegram_subscribers` | Telegram bot user subscriptions | chat_id, is_active, subscribed_at | Admin manage |
| `calendar_exports` | Calendar export logs | id, opportunity_id, user_id, exported_at | Admin manage |
| `suggestions` | User feature suggestions | id, title, description, votes, created_at | Anyone insert, Admin read |
| `scrape_sources` | Scraping engine configuration | id, name, url, type (rss/html/api), tier, is_active | Admin manage |

#### User Data Tables

| Table | Purpose | Key Columns | Row-Level Security |
|-------|---------|-------------|-------------------|
| `user_profiles` | Extended user profiles (31 columns) | id (FK→auth.users), full_name, username, headline, about, avatar_url, banner_url, skills[], education, experience, is_open_to_work, etc. | Own read/update, Admin all |
| `saved_opportunities` | Bookmarked opportunities | user_id, opportunity_id (unique pair) | Own manage |
| `applications` | Application tracking pipeline | user_id, opportunity_id, status (saved/applied/interview/offer/rejected/accepted) | Own manage |
| `user_alerts` | Keyword/category alerts | user_id, keywords[], categories[], frequency (instant/daily/weekly) | Own manage |
| `user_resumes` | Resume data + ATS scores | user_id, full_name, education (jsonb), skills[], experience (jsonb), projects (jsonb), ats_score, ats_feedback (jsonb) | Own manage |

#### Community Tables

| Table | Purpose | Key Columns | Row-Level Security |
|-------|---------|-------------|-------------------|
| `community_posts` | Forum posts | id, user_id, title, content, category, tags[], upvotes, comment_count | Anyone read, Auth create/update own/delete own |
| `community_comments` | Post comments | id, post_id, user_id, content, created_at | Anyone read, Auth create/delete own |
| `community_votes` | Upvotes (toggle) | post_id, user_id (unique pair) | Anyone read, Auth vote/unvote |

#### LinkedIn-Feature Tables (12 tables, added Session 10)

| Table | Purpose |
|-------|---------|
| `user_follows` | One-way follow relationships |
| `connection_requests` | Pending/withdrawn connection requests |
| `connections` | Mutually accepted connections |
| `feed_posts` | Social feed posts with type (Post/Article/Achievement/Question) |
| `feed_post_likes` | 5-type reaction tracking |
| `feed_post_comments` | Feed post comments |
| `feed_post_reposts` | Repost tracking |
| `company_pages` | Company/organisation directory (10 seed entries) |
| `company_followers` | Company follow relationships |
| `skill_endorsements` | Peer skill endorsements |
| `recommendations` | Written recommendations |
| `conversations` | Direct message conversations (linked to messages table) |
| `messages` | Individual messages within conversations |
| `notifications` | In-app notifications with type, actor, read tracking |

#### Key Stored Procedures

**`toggle_upvote(p_post_id uuid, p_user_id uuid)`** — PostgreSQL function:
1. Checks if a vote exists for (post_id, user_id)
2. If exists: deletes vote, decrements `post.upvotes`
3. If not: inserts vote, increments `post.upvotes`
4. Uses `SECURITY DEFINER` to bypass RLS

**`sync_ats_score()`** — Trigger function:
1. On INSERT or UPDATE of `user_resumes`, copies `ats_score` to `user_profiles.resume_ats_score`
2. Used by trigger `sync_resume_ats` on `user_resumes`

#### Row-Level Security Policies (30 total)

| Scope | Count | Pattern |
|-------|-------|---------|
| Public read (opportunities, news, community posts) | 4 | `USING (is_active = true)` or `USING (true)` |
| Auth own manage (profiles, saved, applications, alerts, resume) | 6 | `USING (auth.uid() = user_id)` |
| Auth create (community posts/comments/votes) | 3 | `WITH CHECK (auth.uid() = user_id)` |
| Auth delete own (community posts/comments/votes) | 3 | `FOR DELETE USING (auth.uid() = user_id)` |
| Anyone insert (subscribe, report, suggest) | 3 | `WITH CHECK (true)` |
| Admin all (opportunities, news, logs, reports) | 8 | `USING (true) WITH CHECK (true)` |
| Admin read (subscribers, suggestions, ai_usage_log) | 3 | `FOR SELECT USING (true)` |
| LinkedIn-feature policies | 6+ | Various auth and ownership patterns |

#### Migrations

| File | Purpose |
|------|---------|
| `20260630000001_base_schema.sql` | Core tables (opportunities, news, subscribers, profiles, saved, applications, alerts) |
| `20260630000002_extensions.sql` | Database extensions (pgcrypto, etc.) |
| `20260630000003_rls_policies.sql` | 19 RLS policies across all core tables |
| `20260702000001_resume_builder.sql` | user_resumes table + ATS sync trigger |
| `20260702000002_community.sql` | community tables + toggle_upvote RPC |
| `20260703000003_linkedin_features.sql` | 12 LinkedIn tables + 17 profile columns + seed companies |

### 3.3 db2 — Supabase Secondary (Archive / Overflow)

**Project:** `jbqjipwanfsxyqkfrrpx` ("ElectroBridge")  
**Region:** `ap-southeast-1` (Singapore)  
**Client:** `@supabase/supabase-js` (separate project credentials)  
**Status:** ✅ ACTIVE_HEALTHY  
**Tables:** 13

| Table | Purpose |
|-------|---------|
| `news_archive` | News articles older than 30 days (moved by weekly `/api/archive-news` cron) |
| `subscribers_overflow` | Extra subscriber storage capacity |
| 11 legacy tables | Same schema as db1 (from legacy codebase, retained for backwards compatibility) |

### 3.4 db3 — Neon Primary (Analytics / Logs)

**Project:** `raspy-mouse-45454356` ("electrobridge")  
**Region:** `aws-us-east-1`  
**Client:** `@neondatabase/serverless` (HTTP-based driver via `neon()` function)  
**Status:** ✅ Active  
**Tables:** 4

| Table | Purpose |
|-------|---------|
| `ai_usage_log` | AI provider audit trail (copy of db1 data for analytics queries without impacting core DB) |
| `link_check_logs` | Link verification audit (analytics copy) |
| `opportunity_reports` | User issue reports (analytics copy) |
| `platform_analytics` | Page views, apply clicks, share counts |

### 3.5 db4 — Neon Secondary (Read Replica)

**Project:** `plain-glade-52224468` ("electrobridge")  
**Region:** `aws-us-east-1`  
**Client:** `@neondatabase/serverless` (HTTP-based driver)  
**Status:** ✅ Active  
**Tables:** 2

| Table | Purpose |
|-------|---------|
| `opportunities_mirror` | Read-only copy of active opportunities (synced daily by `/api/sync-replica`) |
| `news_mirror` | Read-only copy of recent news (synced daily by `/api/sync-replica`) |

### 3.6 Entity Relationships

```
auth.users (Supabase Auth, managed by Supabase)
  └── user_profiles (1:1, FK → auth.users.id CASCADE)
        ├── saved_opportunities (1:N, FK → user_profiles.id)
        │     └── opportunities (N:1, FK → opportunities.id)
        ├── applications (1:N, FK → user_profiles.id)
        │     └── opportunities (N:1, FK → opportunities.id)
        ├── user_alerts (1:N, FK → user_profiles.id)
        ├── user_resumes (1:1, FK → auth.users.id CASCADE)
        ├── feed_posts (1:N, FK → user_profiles.id)
        ├── connections (N:M via connections table)
        ├── conversations (1:N)
        └── notifications (1:N)

community_posts
  ├── community_comments (1:N, FK → community_posts.id CASCADE)
  │     └── auth.users (N:1, FK → auth.users.id)
  └── community_votes (1:N, FK → community_posts.id CASCADE)
        └── auth.users (N:1, FK → auth.users.id)

opportunities (can be reported, saved, or linked-checked)
  ├── opportunity_reports (1:N, FK → opportunities.id)
  └── link_check_logs (1:N, FK → opportunities.id)

feed_posts
  ├── feed_post_likes (1:N)
  ├── feed_post_comments (1:N)
  └── feed_post_reposts (1:N)

company_pages
  └── company_followers (1:N)
```

### 3.7 Data Synchronization Flows

```
Weekly (Sunday 02:00 UTC):
  db1.news_articles (age > 30 days) ──(/api/archive-news)──→ db2.news_archive

Weekly (Sunday 03:00 UTC):
  db1.subscribers ──(/api/send-digest)──→ Resend API (email)

Daily (06:00 UTC):
  External sources ──(/api/scrape)──→ db1.opportunities + db1.news_articles

Daily (07:00 UTC):
  db1.opportunities (active) ──(/api/sync-replica)──→ db4.opportunities_mirror
  db1.news_articles (recent)  ──(/api/sync-replica)──→ db4.news_mirror
```

---

## 4. AI Provider Fallback Chain

### 4.1 Architecture

The AI system at `src/lib/ai/providers.ts` implements a cascading fallback chain of 7 providers. When a provider fails (network error, rate limit, auth error, empty response), the system automatically falls through to the next provider in the chain.

### 4.2 Provider Order and Models

| Rank | Provider | Model | Daily Free Limit | Environment Variable |
|------|----------|-------|-----------------|---------------------|
| **#1** | AWS Bedrock (Mantle) | `openai.gpt-oss-120b` | Provisioned token | `AWS_BEARER_TOKEN_BEDROCK` |
| **#2** | Groq | `llama-3.1-8b-instant` | 14,400 req/day | `GROQ_API_KEY` |
| **#3** | NVIDIA NIM | `meta/llama-3.1-8b-instruct` | Generous free credits | `NVIDIA_NIM_API_KEY` |
| **#4** | Google Gemini | `gemini-1.5-flash` | 1,500 req/day | `GEMINI_API_KEY` |
| **#5** | OpenRouter | `meta-llama/llama-3.1-8b-instruct:free` | Free tier | `OPENROUTER_API_KEY` |
| **#6** | Cloudflare Workers AI | `@cf/meta/llama-3.1-8b-instruct` | 10,000 neurons/day | `CLOUDFLARE_AI_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| **#7** | HuggingFace | `mistralai/Mistral-7B-Instruct-v0.3` | Always available (slow) | `HUGGINGFACE_API_KEY` |

### 4.3 Fallback Logic

```typescript
async function callAI(prompt, systemPrompt?, options?): Promise<AIResponse> {
  const order = options?.preferredProvider
    ? [options.preferredProvider, ...PROVIDER_ORDER.filter(p !== preferred)]
    : PROVIDER_ORDER;

  for (const provider of order) {
    if (!process.env[envKey[provider]]) continue; // skip if no key

    try {
      const text = await callProvider(provider, prompt, systemPrompt);
      logAIUsage({ feature, provider, model, success: true });
      return { text, provider, model };
    } catch (error) {
      logAIUsage({ feature, provider, model, success: false, error_message });
      continue; // fall through to next provider
    }
  }

  throw new Error("All AI providers failed. Please try again later.");
}
```

### 4.4 Quota Detection

Provider skipping occurs when:
- Environment variable for the provider key is missing or empty
- Provider returns HTTP 4xx/5xx status
- Provider returns empty or malformed response
- Network timeout or connection failure

### 4.5 Cooldown Behavior

There is no cooldown mechanism — if a provider fails on one request, the system does not penalise it for subsequent requests. Each call iterates through the full chain independently. This ensures maximum availability at the cost of occasionally hitting a rate-limited provider.

### 4.6 Usage Logging

Every AI call (success or failure) is logged to `ai_usage_log` in both db1 and db3 (Neon Primary for analytics). The log entry includes:

```typescript
interface AILogEntry {
  feature: string;         // chat, match, search, summarize, expire, ats, digest, news-filter
  provider: AIProvider;    // bedrock | groq | nvidia | gemini | openrouter | cloudflare | huggingface
  model: string | null;    // model name used
  prompt_length: number;   // character count
  response_length: number; // character count (0 on failure)
  success: boolean;        // true = response returned, false = exception caught
  error_message: string | null;
}
```

### 4.7 Advanced Mode

A separate `callAIAdvanced()` function uses a subset of providers (NVIDIA → Gemini → Groq) for features requiring higher quality or longer outputs. This uses `mistralai/mistral-7b-instruct-v0.3` on NVIDIA with 2048 max tokens.

### 4.8 AI Feature Mapping

| Feature | Provider (Primary) | Avg Latency | Function | File |
|---------|-------------------|-------------|----------|------|
| Chatbot | Bedrock | ~2s | `callAI()` | `src/lib/ai/providers.ts` |
| Opportunity Matcher | Bedrock | ~3s | `callAI()` | `src/lib/ai/matcher.ts` |
| NL Search | Gemini/OpenRouter | ~1s | `callAI()` | `src/lib/ai/search-parser.ts` |
| Summarizer | Groq | ~1.5s | `callAI()` | `src/lib/ai/summarizer.ts` |
| Expiry Detection | Cloudflare | ~2s | `callAI()` | `src/lib/ai/expiry-checker.ts` |
| ATS Scoring | Bedrock | ~3s | `callAI()` | `src/lib/ai/matcher.ts` (resume endpoint) |
| Opportunity Summary | Groq | ~1.5s | `callAI()` | `src/lib/ai/summarizer.ts` |
| Weekly Digest | Gemini | ~2s | `callAIAdvanced()` | `src/lib/ai/newsletter.ts` |
| News Filter | NVIDIA | ~3s | `callAI()` | `src/lib/ai/news-filter-ai.ts` |

**Current uptime:** ~99% (Bedrock handles ~60%, fallbacks catch the rest)

---

## 5. Scraping Engine Architecture

### 5.1 Overview

The scraping engine is a config-driven, multi-tier data collection pipeline that sources opportunities and news from diverse sources. It is orchestrated by `opportunity-scraper.ts` and triggered by the daily Vercel cron at 06:00 UTC.

### 5.2 Source Tiers (Priority Order)

| Tier | Type | Examples | Technology | Priority |
|------|------|----------|------------|----------|
| **1** | ATS APIs | Direct API integrations with applicant tracking systems | HTTP fetch + JSON parse | Highest |
| **2** | Aggregator APIs | Academic Positions, Scholarship Roof, Jobs.ac.uk | `rss-parser` | Medium |
| **3** | RSS Feeds | 16 news sources (IEEE Spectrum, Semiconductor Engineering, EE Times, etc.) | `rss-parser` | Medium |
| **4** | HTML Scraping | ISRO Careers, DRDO Vacancies, CSIR Recruitment | `cheerio` | Lowest |

### 5.3 Adapter Pattern

Each scraper source implements a consistent interface defined in `src/lib/scrapers/types.ts`:

```typescript
interface ScrapedOpportunity {
  title: string;
  organization: string;
  category: string;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  eligibility: string | null;
  description: string | null;
  apply_link: string | null;
  source_url: string;
  tags: string[];
}

interface ScrapeResult {
  source: string;
  success: boolean;
  count: number;
  error?: string;
}
```

### 5.4 Scrape Sources Configuration

The `scrape_sources` table stores source metadata:

| Column | Type | Description |
|--------|------|-------------|
| `name` | text | Human-readable source name |
| `url` | text | Source URL or RSS feed URL |
| `type` | text | `rss` / `html` / `api` |
| `tier` | integer | Priority tier (1–4) |
| `is_active` | boolean | Enable/disable without code changes |
| `schedule` | text | Cron expression (optional, overrides default) |

### 5.5 Scraper Modules

| Module | File | Purpose | Lines |
|--------|------|---------|-------|
| Orchestrator | `src/lib/scrapers/opportunity-scraper.ts` | Runs all scrapers in sequence | 51 |
| RSS Parser | `src/lib/scrapers/rss-parser.ts` | 16 news RSS feeds + 3 opportunity RSS feeds | 278 |
| News Filter | `src/lib/scrapers/news-filter.ts` | 380+ keywords, 45 blocked patterns, auto-tagging | 576 |
| ISRO Scraper | `src/lib/scrapers/isro-scraper.ts` | HTML scrape of ISRO careers page | 127 |
| DRDO Scraper | `src/lib/scrapers/drdo-scraper.ts` | HTML scrape of DRDO vacancies page | 123 |
| CSIR Scraper | `src/lib/scrapers/csir-scraper.ts` | HTML scrape of CSIR recruitment page | 108 |
| Govt Scraper | `src/lib/scrapers/govt-scraper.ts` | CSIR RSS + combined government scraper | 141 |
| Deep Scraper | `src/lib/scrapers/deep-scraper.ts` | Visits apply_link URLs for full detail extraction | ~200 |
| Utils | `src/lib/scrapers/utils.ts` | Text cleaning, slugification, URL resolution | 57 |
| Types | `src/lib/scrapers/types.ts` | Shared type definitions | 20 |
| AI News Filter | `src/lib/ai/news-filter-ai.ts` | AI-based relevance classification for borderline articles | 61 |

### 5.6 News RSS Sources (16)

**Tier 1:** IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, Chip Design, SemiWiki, Electronics For You, Nature Electronics, Science Daily (×2), Phys.org (×2), India Semiconductor Mission, IESA

**Tier 2:** AnandTech, The Register

### 5.7 Opportunity Feed Sources

- Academic Positions (RSS)
- Scholarship Roof (RSS)
- Jobs.ac.uk (RSS)

### 5.8 HTML Scraped Sources

- ISRO Careers (`isro.gov.in`)
- DRDO Vacancies (`drdo.gov.in`)
- CSIR Recruitment (`csir.res.in`)

### 5.9 Verification Pipeline

Every scraped opportunity goes through a verification pipeline:

```
Scrape → Insert (status: pending)
         ├── Link Check → HTTP HEAD/GET apply_link
         │     ├── 2xx/3xx → status: verified
         │     └── 4xx/5xx → status: flagged
         ├── Deep Scrape → Extract full description, detect link type
         ├── AI Summarize → Generate structured summary
         └── AI Expiry Check → Classify as active/expired/uncertain
```

### 5.10 Deduplication Logic

News deduplication runs within the scrape pipeline via `/api/cleanup-news`:
1. Title similarity comparison (fuzzy match)
2. URL exact match dedup
3. Content hash comparison for near-duplicates

Opportunity deduplication is performed by source URL and title similarity — if the same opportunity appears from multiple sources, only one is kept.

### 5.11 Content Filtering Rules (news-filter.ts)

**Blocklist:** 45 regex patterns filtering out:
- AI/ML content not specific to electronics hardware
- General technology news (consumer gadgets, software)
- Biotech, pharma, healthcare
- Gaming, entertainment
- Space exploration (beyond electronics components)
- Consumer electronics reviews
- Finance, business (beyond semiconductor markets)
- Weather, social media

**Keywords:** 380+ electronics/semiconductor keywords organised by domain

**Auto-tagging:** 20+ tag categories:
- Foundry, EDA, Chip Design, AI Chips, Materials, Equipment, Markets
- Policy, India, IoT, EV/Power, 5G/6G, Quantum, Photonics, Memory
- Sensors, Security, Aerospace, Manufacturing, Research

**AI Classifier:** For borderline articles, `news-filter-ai.ts` uses the AI fallback chain to determine electronics/semiconductor relevance.

---

## 6. Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 14.2.21 | React framework with App Router |
| **Language** | TypeScript | ^5.0 | Type safety across the codebase |
| **UI Library** | React | ^18.3.1 | UI rendering |
| **Styling** | Tailwind CSS | ^3.4.1 | Utility-first CSS with dark theme |
| **Typography** | @tailwindcss/typography | ^0.5.20 | Prose styling for content pages |
| **Icons** | lucide-react | ^0.383.0 | SVG icon library |
| **Toast Notifications** | sonner | ^2.0.7 | Toast/snackbar notifications |
| **CSS Processing** | autoprefixer | ^10.5.2 | PostCSS vendor prefixes |
| **Date Handling** | date-fns | ^3.6.0 | Date formatting and manipulation |
| **Classnames** | clsx | ^2.1.1 | Conditional class merging |
| **Error Tracking** | @sentry/nextjs | ^10.63.0 | Error monitoring (DSN pending) |

### Database & ORM

| Technology | Version | Purpose |
|------------|---------|---------|
| @supabase/supabase-js | ^2.108.2 | Supabase client (db1 + db2) |
| @supabase/ssr | ^0.12.0 | SSR auth middleware + cookie management |
| @neondatabase/serverless | ^1.1.0 | Neon HTTP-based Postgres driver (db3 + db4) |
| pg | ^8.22.0 | PostgreSQL client for migrations (dev dependency) |

### Scraping & Content

| Technology | Version | Purpose |
|------------|---------|---------|
| cheerio | ^1.2.0 | HTML scraping (ISRO, DRDO, CSIR) |
| rss-parser | ^3.13.0 | RSS feed parsing (16 sources) |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Jest | ^30.4.2 | Test runner (31 tests) |
| ts-jest | ^29.4.11 | TypeScript Jest transformer |
| @testing-library/react | ^16.3.2 | React component testing |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| jest-environment-jsdom | ^30.4.1 | JSDOM environment for component tests |

### AI & External Services

| Service | Type | Purpose |
|---------|------|---------|
| AWS Bedrock Mantle | AI Provider (#1 primary) | Chat, Match, ATS Scoring |
| Groq | AI Provider (#2) | Summarizer, Opportunity Summary |
| NVIDIA NIM | AI Provider (#3) | News Filter (AI relevance) |
| Google Gemini | AI Provider (#4) | NL Search, Weekly Digest |
| OpenRouter | AI Provider (#5) | Fallback for all AI features |
| Cloudflare Workers AI | AI Provider (#6) | Expiry Detection |
| HuggingFace Inference | AI Provider (#7) | Last-resort fallback |
| Resend | Email Service | Weekly email digest delivery |
| Telegram Bot API | Messaging | Real-time opportunity alerts |
| Plausible Analytics | Web Analytics | Visitor and page-view tracking |

### Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Web Application | Vercel | https://electrobridge.vercel.app |
| Background Worker | Render | (pending active scrape routing) |

---

## 7. Environment Variables

### 7.1 Complete Variable List

26 environment variables are required. 24 are set in Vercel Production and Development environments. 2 are not yet set.

| # | Variable | Public | Set in Vercel | Purpose |
|---|----------|--------|---------------|---------|
| 1 | `NEXT_PUBLIC_SITE_URL` | ✅ Public | ✅ | Canonical site URL for email verification, OAuth redirects |
| 2 | `NEXT_PUBLIC_APP_URL` | ✅ Public | ✅ | Fallback app URL for redirects |
| 3 | `NEXT_PUBLIC_SUPABASE_URL` | ✅ Public | ✅ | Supabase Primary (db1) project URL |
| 4 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Public | ✅ | Supabase Primary (db1) anonymous key |
| 5 | `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Private | ✅ | Supabase Primary (db1) service role key for admin ops |
| 6 | `SUPABASE_2_URL` | 🔒 Private | ✅ | Supabase Secondary (db2) project URL |
| 7 | `SUPABASE_2_ANON_KEY` | ✅ Public | ✅ | Supabase Secondary (db2) anonymous key |
| 8 | `SUPABASE_2_SERVICE_ROLE_KEY` | 🔒 Private | ✅ | Supabase Secondary (db2) service role key |
| 9 | `NEON_1_DATABASE_URL` | 🔒 Private | ✅ | Neon Primary (db3) connection string for analytics |
| 10 | `NEON_2_DATABASE_URL` | 🔒 Private | ✅ | Neon Secondary (db4) connection string for read replica |
| 11 | `NEXT_PUBLIC_ADMIN_PASSWORD` | ✅ Public | ✅ | Admin panel password (plain-text comparison) |
| 12 | `CRON_SECRET` | 🔒 Private | ✅ | Authentication for cron endpoint invocations |
| 13 | `AWS_BEARER_TOKEN_BEDROCK` | 🔒 Private | ✅ | AI Provider #1 — AWS Bedrock Mantle API token |
| 14 | `GROQ_API_KEY` | 🔒 Private | ✅ | AI Provider #2 — Groq API key |
| 15 | `NVIDIA_NIM_API_KEY` | 🔒 Private | ✅ | AI Provider #3 — NVIDIA NIM API key |
| 16 | `GEMINI_API_KEY` | 🔒 Private | ✅ | AI Provider #4 — Google Gemini API key |
| 17 | `OPENROUTER_API_KEY` | 🔒 Private | ✅ | AI Provider #5 — OpenRouter API key |
| 18 | `CLOUDFLARE_AI_TOKEN` | 🔒 Private | ✅ | AI Provider #6 — Cloudflare Workers AI API token |
| 19 | `CLOUDFLARE_ACCOUNT_ID` | 🔒 Private | ✅ | AI Provider #6 — Cloudflare account ID |
| 20 | `HUGGINGFACE_API_KEY` | 🔒 Private | ✅ | AI Provider #7 — HuggingFace Inference API key |
| 21 | `RESEND_API_KEY` | 🔒 Private | ✅ | Resend email service API key |
| 22 | `FROM_EMAIL` | 🔒 Private | ✅ | Email sender address for digests and notifications |
| 23 | `TELEGRAM_BOT_TOKEN` | 🔒 Private | ✅ | Telegram bot API token for opportunity alerts |
| 24 | `TELEGRAM_CHANNEL_ID` | 🔒 Private | ✅ | Telegram channel ID for broadcasting |
| 25 | `NEXT_PUBLIC_SENTRY_DSN` | ✅ Public | ❌ | Sentry DSN for error tracking (not yet configured) |
| 26 | `GOOGLE_CLIENT_ID` | 🔒 Private | ❌ | Google OAuth client ID for Supabase Auth (not yet configured) |
| 27 | `GOOGLE_CLIENT_SECRET` | 🔒 Private | ❌ | Google OAuth client secret for Supabase Auth (not yet configured) |

### 7.2 Variable Categorisation

**Public variables** (prefixed `NEXT_PUBLIC_`): These are exposed to client-side code via Next.js's `NEXT_PUBLIC_` convention. They include site URLs, Supabase anonymous keys, the admin password, and the Sentry DSN. None contain secrets.

**Private variables**: Accessed server-side only via `process.env`. These include database URLs, API keys, service role credentials, and OAuth secrets. They are never sent to the client.

### 7.3 Usage by Module

| Module | Environment Variables Used |
|--------|--------------------------|
| `src/lib/db/index.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_2_URL`, `SUPABASE_2_SERVICE_ROLE_KEY`, `NEON_1_DATABASE_URL`, `NEON_2_DATABASE_URL` |
| `src/lib/ai/providers.ts` | `AWS_BEARER_TOKEN_BEDROCK`, `GROQ_API_KEY`, `NVIDIA_NIM_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `CLOUDFLARE_AI_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `HUGGINGFACE_API_KEY` |
| `src/lib/email-digest.ts` | `RESEND_API_KEY`, `FROM_EMAIL` |
| `src/lib/telegram-bot.ts` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID` |
| `src/lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| `src/lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `src/middleware.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `src/lib/utils.ts` | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` |
| `src/app/admin/page.tsx` | `NEXT_PUBLIC_ADMIN_PASSWORD` |
| `sentry.client.config.ts` | `NEXT_PUBLIC_SENTRY_DSN` |
| `sentry.server.config.ts` | `NEXT_PUBLIC_SENTRY_DSN` |
| Cron API routes | `CRON_SECRET` |

### 7.4 Security Notes

- All 24 set variables are stored in Vercel Environment Variables (Production + Development).
- Preview branches inherit from Production environment.
- Local development uses `.env.local` (gitignored).
- Public variables are prefixed `NEXT_PUBLIC_` for Next.js client-side exposure.
- The admin password uses plain-text comparison (no role-based access control).
- The rate limiter (`src/lib/rate-limiter.ts`) is in-memory and resets on Vercel cold start — not suitable for production rate limiting.
- Google OAuth keys are not set — OAuth sign-in is currently non-functional.
- Sentry DSN is not set — error tracking infrastructure exists but is inactive.

---

## Appendix A: API Route Reference

### Public Endpoints (No Auth Required)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/opportunities` | List opportunities with filters |
| GET | `/api/opportunities/[id]` | Single opportunity detail |
| GET | `/api/opportunities-feed` | Public JSON feed |
| GET | `/api/news` | List news articles |
| GET | `/api/organizations` | List organisations with counts |
| GET | `/api/similar/[id]` | Similar opportunities |
| POST | `/api/ai/chat` | AI career chatbot |
| POST | `/api/ai/match` | Profile-to-opportunity matcher |
| POST | `/api/ai/search` | Natural language search |
| POST | `/api/ai/summarize` | AI description summarizer |
| GET | `/api/ai/opportunity-summary/[slug]` | AI insight panel |
| GET | `/api/community/posts` | List forum posts |
| GET | `/api/community/posts/[id]` | Single post with comments |
| POST | `/api/subscribe` | Newsletter subscription |
| DELETE | `/api/subscribe` | Unsubscribe |
| POST | `/api/report-issue` | Report issue |
| POST | `/api/track-click` | Track apply button click |
| GET | `/api/calendar-export/[id]` | ICS calendar download |
| GET | `/api/health` | Multi-DB health check |

### Authenticated Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/applications` | List saved applications |
| PATCH | `/api/applications` | Update application status |
| DELETE | `/api/applications` | Delete application |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/resume` | Get user resume |
| POST | `/api/resume` | Create/update resume with AI ATS scoring |
| POST | `/api/community/posts` | Create community post |
| DELETE | `/api/community/posts/[id]` | Delete own post |
| POST | `/api/community/comments` | Add comment |
| POST | `/api/community/vote` | Toggle upvote |

### LinkedIn Features Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET/PATCH | `/api/profile/me` | Own profile CRUD |
| GET | `/api/people/[userId]` | Public profile |
| POST | `/api/network/connect` | Send connection request |
| GET | `/api/network/connections` | List connections |
| GET | `/api/network/followers` | List followers |
| GET | `/api/network/following` | List following |
| GET | `/api/network/suggestions` | People suggestions |
| POST | `/api/network/follow` | Follow/unfollow |
| GET/POST | `/api/feed` | Feed CRUD |
| POST | `/api/feed/posts/[id]/like` | Toggle reaction |
| POST | `/api/feed/posts/[id]/comment` | Add feed comment |
| POST | `/api/feed/posts/[id]/repost` | Toggle repost |
| GET | `/api/companies` | List/search companies |
| GET | `/api/companies/[id]` | Company detail |
| POST | `/api/companies/[id]/follow` | Follow/unfollow company |
| GET | `/api/messages` | List conversations |
| GET/POST | `/api/messages/[conversationId]` | Conversation messages |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/[id]` | Mark notification read |
| GET | `/api/notifications/count` | Unread count |
| GET | `/api/people/search` | Search users |

### Admin Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/opportunities` | Create opportunity |
| PATCH | `/api/opportunities/[id]` | Update opportunity |
| DELETE | `/api/opportunities/[id]` | Delete opportunity |
| POST | `/api/admin/recheck-link` | Recheck single opportunity link |
| GET | `/api/analytics/ai-usage` | AI provider usage analytics |
| GET | `/api/analytics/platform` | Platform analytics |

### Cron Endpoints (protected by `CRON_SECRET`)

| Method | Route | Schedule | Purpose |
|--------|-------|----------|---------|
| GET | `/api/scrape?mode=all` | Daily 06:00 UTC | Scrape news + opportunities |
| GET | `/api/scrape-opportunities` | (legacy) | Legacy opportunity scraper |
| GET | `/api/check-links` | (embedded) | Verify opportunity links |
| POST | `/api/cleanup-news` | (embedded) | Deduplicate news |
| GET | `/api/archive-news` | Weekly Sun 02:00 UTC | Archive old news to db2 |
| GET | `/api/sync-replica` | Daily 07:00 UTC | Sync to Neon read replica |
| GET | `/api/send-digest` | Weekly Sun 03:00 UTC | Send weekly email digest |
| GET | `/api/ai/expire` | (embedded) | AI-based expiry detection |

---

## Appendix B: Project Structure

```
JobsAI/
├── .github/workflows/           # CI/CD
│   └── ci.yml                   # Lint → Test → Build
├── electrobridge/               # Active codebase (~18,000 LOC)
│   ├── src/
│   │   ├── app/                 # 30+ page routes (App Router)
│   │   │   ├── api/             # 40+ API routes (44 HTTP methods)
│   │   │   ├── admin/           # Admin panel pages
│   │   │   ├── auth/            # Auth callback
│   │   │   ├── category/        # Category listing
│   │   │   ├── categories/      # Category overview
│   │   │   ├── chat/            # AI chatbot
│   │   │   ├── community/       # Forum
│   │   │   ├── companies/       # Company pages (LinkedIn)
│   │   │   ├── contact/
│   │   │   ├── dashboard/       # User dashboard
│   │   │   ├── feed/            # Social feed (LinkedIn)
│   │   │   ├── login/
│   │   │   ├── match/           # AI opportunity matcher
│   │   │   ├── messages/        # Direct messaging (LinkedIn)
│   │   │   ├── network/         # Network connections (LinkedIn)
│   │   │   ├── news/            # News aggregation
│   │   │   ├── notifications/   # Notifications (LinkedIn)
│   │   │   ├── opportunities/   # Opportunity browsing
│   │   │   ├── organizations/   # Organisation directory
│   │   │   ├── people/          # User profiles (LinkedIn)
│   │   │   ├── profile/         # Profile management
│   │   │   ├── resources/       # Career guides
│   │   │   ├── resume/          # Resume builder
│   │   │   ├── search/          # Search (LinkedIn)
│   │   │   └── signup/
│   │   ├── components/          # 25+ React components
│   │   ├── lib/                 # 24+ modules
│   │   │   ├── ai/              # 7 AI provider modules
│   │   │   ├── db/              # Database router
│   │   │   └── scrapers/        # 8 scraper modules
│   │   ├── types/               # TypeScript interfaces
│   │   ├── __tests__/           # 4 test suites (31 tests)
│   │   └── middleware.ts        # Supabase SSR auth
│   ├── supabase/migrations/     # 9 migration files
│   ├── jest.config.ts           # Jest 30 configuration
│   ├── tsconfig.json            # TypeScript config
│   ├── tailwind.config.ts       # Tailwind CSS config
│   ├── next.config.mjs          # Next.js configuration
│   ├── vercel.json              # Vercel deployment + crons
│   ├── .eslintrc.json           # ESLint configuration
│   └── package.json             # Dependencies
├── docs/                        # Documentation
│   ├── PRD.md                   # Product Requirements Document
│   ├── FEATURE_SPEC.md          # Full Feature Specification
│   └── ARCHITECTURE.md          # Technical Architecture (this file)
├── PROJECT_AUDIT.md             # Comprehensive project audit
├── README.md                    # Project overview
└── SECRETS.md                   # API keys and credentials (gitignored)
```

---

## Appendix C: Design System Reference

### Theme Tokens

| Token Group | Values |
|-------------|--------|
| **Background** | `bg-primary: #0A0E1A`, `bg-secondary: #0B0F1C` |
| **Surface** | `surface: #111827`, `surface-elevated: #141B2D` |
| **Border** | `border: #1E2A3F`, `border-hover: #22D3EE33` |
| **Accent** | `accent: #22D3EE`, `accent-hover: #06B6D4`, `accent-glow: rgba(34,211,238,0.15)` |
| **Success** | `#10B981` |
| **Warning** | `#F59E0B` |
| **Danger** | `#EF4444` |
| **Text** | `text-primary: #F8FAFC`, `text-secondary: #94A3B8`, `text-muted: #64748B` |
| **Org brands** | `isro: #A0784C`, `intel: #5B7DB1`, `tifr: #8B6CB4`, `tata: #4A8C6F`, `drdo: #B85450` |

### Typography

- Display: `Space Grotesk`
- Body: `Inter`
- Mono: `Geist Mono`

### Gradients

- `gradient-hero`: `linear-gradient(to right, #22D3EE, #3B82F6)`
- `gradient-deadline`: `linear-gradient(to right, #F59E0B, #EF4444)`
- `gradient-card-border`: `linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)`
- `gradient-radial-cyan`: `radial-gradient(ellipse at center, rgba(34,211,238,0.05) 0%, transparent 70%)`

### Navbar

Glass morphism pattern: `bg-bg-primary/80 backdrop-blur-2xl` with gradient bottom glow line, 9 navigation items, active indicator pill, resources dropdown (server-rendered), search overlay, mobile drawer, auth section with gradient button and user dropdown.

---

## Appendix D: Cost & Infrastructure Summary

| Service | Tier | Monthly Cost | Monthly Limits |
|---------|------|-------------|----------------|
| Vercel | Hobby | $0 | 2 concurrent builds, 100GB bandwidth, serverless functions |
| Supabase Primary | Free | $0 | 500MB DB, 2GB bandwidth, 50K MAU |
| Supabase Secondary | Free | $0 | 500MB DB, 2GB bandwidth |
| Neon Primary | Free | $0 | 0.5GB DB, 100 compute hours |
| Neon Secondary | Free | $0 | 0.5GB DB, 100 compute hours |
| Resend | Free | $0 | 100 emails/day |
| Sentry | Free | $0 | 5K events/month |
| Plausible | Self-hosted/Cloud | $0–9 | Open-source or cloud |
| AWS Bedrock | Free tier | $0 | Provisioned token |
| Groq | Free tier | $0 | 14,400 req/day |
| NVIDIA NIM | Free tier | $0 | Generous free credits |
| Gemini | Free tier | $0 | 1,500 req/day |
| OpenRouter | Free tier | $0 | Free model access |
| Cloudflare | Free tier | $0 | 10,000 neurons/day |
| HuggingFace | Free tier | $0 | Inference API free |
| **Total** | | **~$0/month** | |

---

## Appendix E: Known Technical Debt

| Issue | Priority | Impact | Status |
|-------|----------|--------|--------|
| `calendar_exports` table exists but never written to | Low | Feature gap | Open |
| `telegram_subscribers` has no web UI | Low | Users can't subscribe via browser | Open |
| Cron jobs (archive-news, sync-replica) never triggered | Medium | No first-run data in archive/replica | Open |
| No E2E tests | Medium | Critical flows untested end-to-end | Open |
| No monitoring for cron failures | Medium | Silent failures go unnoticed | Open |
| Rate limiter is in-memory (resets on cold start) | Low | Rate limits reset after inactivity | Open |
| No analytics dashboard for non-admin users | Low | Users can't see own usage | Open |
| No database backup verification | Medium | No restore confidence | Open |
| No CDN for static assets | Low | All assets from Vercel | Open |
| No API documentation (OpenAPI/Swagger) | Medium | No API reference for consumers | Open |
| Vercel deploy via GitHub Actions blocked | High | Cannot deploy from CI | Blocked |
| Sentry DSN not set | Medium | Error tracking inactive | Open |
| Google OAuth keys not set | Medium | Google sign-in non-functional | Blocked |
| Neon/Supabase2 migrations not in repo | Medium | Schema not version-controlled | Open |
