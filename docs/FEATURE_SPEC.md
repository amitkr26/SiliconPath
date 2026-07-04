# Full Feature Specification — SiliconPath

> **Version:** 1.0  
> **Last Updated:** July 3, 2026  
> **Status:** In Production

---

## Build Status Key

| Status | Meaning |
|--------|---------|
| **Done** | Fully implemented, deployed, and functional |
| **Partial** | Core implementation exists but some wiring, edge cases, or UI polish remain |
| **Not Started** | Not yet implemented |

---

## 1. Anonymous Visitor Features

Any user can access these features without authentication or login.

### 1.1 Opportunity Browsing & Discovery

#### 1.1.1 Browse All Opportunities

**Description:** A full listing page showing all verified, active opportunities with filtering and search capabilities.

**Pages/Routes:**
- `/opportunities` — Client-side rendered listing page with sidebar filters
- `/api/opportunities` (GET) — Returns paginated, filterable opportunity list

**Key User Flow:**
1. User navigates to `/opportunities` from the navbar or homepage
2. Page loads with paginated opportunity cards (20 per page)
3. User applies filters via sidebar: category, location, eligibility, deadline range
4. Filter state updates URL query parameters, triggering a new fetch
5. Results update in real-time as filters change
6. User clicks a card → navigates to `/opportunities/[slug]`

**Build Status:** **Done**

#### 1.1.2 View Opportunity Detail

**Description:** A dedicated detail page for each opportunity with full metadata, AI-generated insights, and apply actions.

**Pages/Routes:**
- `/opportunities/[slug]` — Server component with ISR (3600s cache)
- `/api/opportunities/[id]` (GET) — Single opportunity data
- `/api/ai/opportunity-summary/[slug]` (GET) — AI-generated insight paragraph

**Key User Flow:**
1. User clicks an `OpportunityCard` → navigates to `/opportunities/jrf-at-iisc-2026`
2. Page hydrates from server cache (ISR) with full opportunity details
3. AI insight panel loads asynchronously on the right sidebar
4. User can read the full description, check deadline, stipend, eligibility, tags
5. Clicking "Apply" triggers `/api/track-click` and opens the `apply_link` in a new tab
6. User can save the deadline to calendar via `/api/calendar-export/[id]` (ICS download)
7. "Report Issue" button opens `ReportIssueModal` → POST `/api/report-issue`
8. Similar opportunities section at the bottom (via `/api/similar/[id]`)

**Build Status:** **Done**

#### 1.1.3 Filter by Category

**Description:** A dedicated page showing opportunities filtered by a specific category.

**Pages/Routes:**
- `/category/[category]` — Server component
- `/categories` — Category overview grid page

**Key User Flow:**
1. User visits `/categories` to see all opportunity categories with counts
2. Clicking a category (e.g., "JRF") navigates to `/category/jrf`
3. Page shows all JRF opportunities with category metadata in the header
4. JSON-LD structured data is rendered for SEO

**Build Status:** **Done**

#### 1.1.4 Natural Language Search

**Description:** AI-powered search that converts natural language queries into structured database filters.

**Pages/Routes:**
- Integrated into `/opportunities` page via `SearchBar` component
- `/api/ai/search` (POST) — Converts NL query to filters

**Key User Flow:**
1. User types "Find PhD positions in VLSI in Bangalore with stipend above 30k" into the search bar
2. Query is sent to `/api/ai/search` which calls the AI provider chain
3. AI parses the query and returns structured filters: `{ category: "PhD", tags: ["VLSI"], location: "Bangalore", stipend_min: 30000 }`
4. Filters are applied to the opportunity listing automatically

**Build Status:** **Done**

#### 1.1.5 Quick Keyword Search

**Description:** Standard keyword-based search across opportunity titles, descriptions, and tags.

**Pages/Routes:**
- Integrated into `/opportunities` page
- `/api/opportunities?search=keyword` (GET)

**Key User Flow:**
1. User types a keyword in the `HeroSearch` component on the homepage
2. Submits → navigates to `/opportunities?search=keyword`
3. Results are filtered server-side by the API

**Build Status:** **Done**

### 1.2 News Aggregation

#### 1.2.1 Browse News Articles

**Description:** A filtered listing of electronics/semiconductor industry news from 16 RSS sources.

**Pages/Routes:**
- `/news` — Client-side rendered news listing
- `/api/news` (GET) — Returns news articles with source/tag filters

**Key User Flow:**
1. User navigates to `/news` from the navbar
2. Articles are displayed as `NewsCard` components with source color indicators
3. Source tab bar allows filtering by publication (IEEE Spectrum, Semiconductor Engineering, Nature Electronics, etc.)
4. Clicking a card navigates to `/news/[slug]`

**Build Status:** **Done**

#### 1.2.2 View News Detail

**Description:** Full news article detail page with AI-relevant classification indicators.

**Pages/Routes:**
- `/news/[slug]` — Server component with ISR (1800s cache)

**Key User Flow:**
1. User clicks a `NewsCard` → navigates to `/news/semiconductor-market-2026`
2. Full article displays with title, source, publication date, tags, and body
3. Related news suggestions at the bottom
4. JSON-LD `NewsArticle` schema rendered for SEO

**Build Status:** **Done**

### 1.3 Organisation Directory

#### 1.3.1 Browse Organisations

**Description:** Directory of organisations that have associated opportunities, with counts.

**Pages/Routes:**
- `/organizations` — Server component
- `/api/organizations` (GET) — List with opportunity counts

**Key User Flow:**
1. User navigates to `/organizations`
2. Grid of organisation cards with name and opportunity count
3. Clicking an organisation navigates to `/organizations/[slug]`

**Build Status:** **Done**

#### 1.3.2 View Organisation Detail

**Description:** Organisation detail page with associated opportunities.

**Pages/Routes:**
- `/organizations/[slug]` — Server component with ISR

**Key User Flow:**
1. User views organisation page with description, website, logo
2. Paginated list of the organisation's opportunities
3. JSON-LD `Organization` schema rendered for SEO

**Build Status:** **Done**

### 1.4 AI-Powered Tools

#### 1.4.1 AI Career Chatbot

**Description:** A domain-specific chatbot that answers questions about electronics/semiconductor careers in India.

**Pages/Routes:**
- `/chat` — Client component with `localStorage` chat history (20 chats max)
- `/api/ai/chat` (POST) — Chat completion via AI fallback chain

**Key User Flow:**
1. User visits `/chat`
2. Chat interface loads with an initial assistant greeting
3. User types a question: "What qualifications do I need for a JRF at IISC?"
4. Request goes to `/api/ai/chat` with conversation context
5. AI responds via the fallback chain (primary: Bedrock)
6. Response streams/displays in chat UI
7. "+ New Chat" button resets conversation
8. Recent chats persist in `localStorage` across sessions

**Build Status:** **Done**

#### 1.4.2 AI Opportunity Matcher

**Description:** Enter a text profile and receive AI-matched opportunity recommendations with relevance scores.

**Pages/Routes:**
- `/match` — Client component with text input
- `/api/ai/match` (POST) — Profile-to-opportunity matching (top 10)

**Key User Flow:**
1. User navigates to `/match`
2. User enters their skills, education, interests as free text
3. Submits → POST to `/api/ai/match`
4. AI finds the top 10 matching opportunities with relevance scores
5. Results display as clickable opportunity cards with match percentage badges

**Build Status:** **Done**

#### 1.4.3 AI Summarizer

**Description:** Automatically generates structured summaries (title, organisation, deadline, stipend, eligibility) from raw opportunity descriptions.

**Pages/Routes:**
- `/api/ai/summarize` (POST) — Raw description → structured summary
- Used internally by the deep scrape pipeline and admin add/edit forms

**Key User Flow:**
1. Internal feature — triggered during deep scrape when new opportunities are discovered
2. Raw HTML description is sent to the AI summarizer
3. Structured JSON summary is returned and stored in the opportunity record
4. The AI insight panel on detail pages (`AIOpportunitySummary`) uses this data

**Build Status:** **Done**

### 1.5 Community Forum (Read-Only)

#### 1.5.1 Browse Community Posts

**Description:** View community forum posts and discussions.

**Pages/Routes:**
- `/community` — Client component with category tabs
- `/api/community/posts` (GET) — List posts with filters

**Key User Flow:**
1. User visits `/community`
2. Posts displayed with category tabs (discussion, question, resource, etc.)
3. Clicking a post navigates to `/community/[id]`

**Build Status:** **Done**

#### 1.5.2 View Post Detail with Comments

**Description:** Read full community posts and their comment threads.

**Pages/Routes:**
- `/community/[id]` — Client component
- `/api/community/posts/[id]` (GET) — Post with comments

**Key User Flow:**
1. User reads the post content
2. Comments display in threaded order
3. Vote counts are visible (upvoting requires auth)

**Build Status:** **Done**

### 1.6 Career Resources

**Description:** Static educational content about career paths in electronics and VLSI.

**Pages/Routes:**
- `/resources` — Resources hub with links to all guides
- `/resources/jrf-guide` — JRF career guide
- `/resources/phd-guide` — PhD guide
- `/resources/international-fellowships` — Fellowships guide
- `/resources/vlsi-careers` — VLSI career guide
- `/resources/net-vs-gate` — NET vs GATE comparison

**Key User Flow:**
1. User visits `/resources` to browse available guides
2. Clicks a guide → reads comprehensive career advice content
3. All guides are server-rendered for SEO with clean slug URLs

**Build Status:** **Done**

### 1.7 Utility & Engagement

#### 1.7.1 Newsletter Subscription

**Description:** Subscribe to a weekly AI-generated email digest of top opportunities and news.

**Pages/Routes:**
- `SubscribeModal` — Modal overlay on detail pages
- `SubscribeSection` — Inline subscribe form on homepage and footer
- `/api/subscribe` (POST) — Subscribe with rate limiting (3 req/hr per IP)
- `/api/subscribe` (DELETE) — Unsubscribe
- `/api/send-digest` (GET) — Weekly cron trigger for digest generation

**Key User Flow:**
1. User clicks "Subscribe" in footer or opens `SubscribeModal`
2. Email form is presented with optional keyword/category preferences
3. POST to `/api/subscribe` → subscriber added to `subscribers` table
4. Weekly digest is generated every Sunday at 03:00 UTC via `/api/send-digest`
5. Digest email is sent via Resend with AI-curated content
6. Unsubscribe link in email triggers DELETE `/api/subscribe`

**Build Status:** **Done**

#### 1.7.2 Report Issue with Opportunity

**Description:** Users can report broken links, expired listings, or incorrect details.

**Pages/Routes:**
- `ReportIssueModal` — Triggered by "Report Issue" link on opportunity detail
- `/api/report-issue` (POST) — Submit issue report

**Key User Flow:**
1. User clicks "Report Issue" on an opportunity detail page
2. Modal opens with reason selection (broken link, expired, incorrect details, other)
3. User submits → entry logged in `opportunity_reports` table
4. Admin reviews and takes action

**Build Status:** **Done**

#### 1.7.3 Calendar Export

**Description:** Download deadline dates as ICS calendar files.

**Pages/Routes:**
- `/api/calendar-export/[id]` (GET) — ICS file download
- `calendar_exports` table — logs exports (exists but **never written to**)

**Key User Flow:**
1. User clicks "Add to Calendar" on opportunity detail page
2. ICS file downloads with opportunity title, deadline date, and apply link
3. (Known issue: `calendar_exports` table logging is not wired — build status: **Partial**)

**Build Status:** **Partial** (ICS download works, table logging is not implemented)

#### 1.7.4 Click Tracking

**Description:** Track apply link clicks for analytics.

**Pages/Routes:**
- `/api/track-click` (POST) — Record apply button click

**Key User Flow:**
1. User clicks "Apply" on an opportunity detail page
2. POST to `/api/track-click` with opportunity ID and timestamp
3. Click count is incremented for analytics

**Build Status:** **Done**

### 1.8 Public API & Data Feeds

#### 1.8.1 Public Opportunities Feed

**Description:** JSON feed of opportunities for external consumption and citation.

**Pages/Routes:**
- `/api/opportunities-feed` (GET) — Public JSON feed

**Key User Flow:**
1. External sites/apps can consume structured opportunity data
2. Returns paginated, active-only opportunities in JSON format

**Build Status:** **Done**

#### 1.8.2 Sitemap & Robots

**Description:** SEO infrastructure for search engine crawling.

**Pages/Routes:**
- `/sitemap.xml` — Generated sitemap of all indexable pages
- `/robots.txt` — Robot directives

**Build Status:** **Done**

#### 1.8.3 OG Image Generation

**Description:** Dynamic Open Graph images for social sharing of opportunities.

**Pages/Routes:**
- `/api/og` — Default OG image
- `/api/og/opportunity/[slug]` — Per-opportunity OG image

**Build Status:** **Done**

### 1.9 Health Monitoring

#### 1.9.1 Multi-DB Health Check

**Description:** Endpoint that checks connectivity to all 4 databases.

**Pages/Routes:**
- `/api/health` (GET) — Multi-database health status

**Key User Flow:**
1. (Internal/external monitoring) Hits `/api/health`
2. Checks all 4 DB connections, returns status and counts

**Build Status:** **Done**

### 1.10 Contact Form

**Description:** General contact form for user inquiries.

**Pages/Routes:**
- `/contact` — Client component

**Build Status:** **Done**

---

## 2. Registered User Features

Features available after authentication (email/password or Google OAuth via Supabase Auth).

### 2.1 Authentication & Account Management

#### 2.1.1 Sign Up / Sign In

**Description:** User registration and login with email/password or Google OAuth.

**Pages/Routes:**
- `/signup` — Registration page
- `/login` — Login page
- `/auth/callback` — OAuth code exchange handler
- `/api/auth/signout` (POST) — Session termination
- `middleware.ts` — Server-side session refresh on every request

**Key User Flow:**
1. User clicks "Sign Up" or "Get Started"
2. Chooses email/password registration or Google OAuth
3. For email/password: enters credentials, creates account in Supabase Auth
4. For Google OAuth: redirected to Google consent screen, callback at `/auth/callback`
5. Session stored in httpOnly Supabase SSR cookie
6. Middleware refreshes `getUser()` on every request
7. On error (expired link, invalid code, etc.) → redirect to `/login` with error toast
8. Sign out → POST `/api/auth/signout` → clears session cookie

**Build Status:** **Done**

#### 2.1.2 Edit Profile

**Description:** Manage user profile information including skills, education, experience, and social links.

**Pages/Routes:**
- `/profile` — Client component (protected)
- `/api/profile/me` — GET/PATCH user profile

**Key User Flow:**
1. User navigates to `/profile` from navbar dropdown
2. Form fields for: full name, skills (tags), education history, work experience, LinkedIn URL, GitHub URL
3. Profile updates saved to `user_profiles` table
4. Changes reflected immediately

**Build Status:** **Done**

### 2.2 Opportunity Management

#### 2.2.1 Save / Bookmark Opportunities

**Description:** Bookmark opportunities for later reference.

**Pages/Routes:**
- `/api/applications` — GET (list saved), PATCH (update status), DELETE (remove)
- Save button on `OpportunityCard` and detail page

**Key User Flow:**
1. User clicks a bookmark icon on any opportunity card or detail page
2. Opportunity is saved to `saved_opportunities` table (unique pair: user_id + opportunity_id)
3. Bookmarked opportunities appear in the user's dashboard under "Saved"

**Build Status:** **Done**

#### 2.2.2 Track Applications

**Description:** Manage application status with a workflow pipeline.

**Pages/Routes:**
- `/dashboard` — Client component (protected) with application status cards
- `/api/applications` — GET (list), PATCH (update status), DELETE (remove)

**Key User Flow:**
1. From dashboard, user sees saved opportunities with current status
2. Status workflow: Saved → Applied → Interview → Offer → Accepted / Rejected
3. User can update status inline via dropdown
4. Dashboard shows counts and visual progress

**Build Status:** **Done**

#### 2.2.3 Set Keyword/Category Alerts

**Description:** Configure alerts to be notified about new opportunities matching specified criteria.

**Pages/Routes:**
- `/dashboard` — Alert configuration section
- `/api/opportunities?alert=...` — Filtered feed for alert matching

**Key User Flow:**
1. User adds an alert with: keywords (e.g., "VLSI", "PhD"), categories, frequency (instant/daily/weekly)
2. Alerts stored in `user_alerts` table
3. Instant alerts trigger Telegram notification if Telegram is configured
4. Daily/weekly alerts batched and sent via email digest

**Build Status:** **Done**

### 2.3 Resume Builder

#### 2.3.1 AI Resume Builder

**Description:** A 6-step wizard that helps users build a professional resume with AI-powered ATS scoring.

**Pages/Routes:**
- `/resume` — Client component (protected), 6-step wizard
- `/api/resume` — GET (fetch), POST (create/update with AI scoring)

**Key User Flow:**
1. User navigates to `/resume` from navbar dropdown
2. 6-step wizard: Personal → Education → Skills → Experience → Projects → Publications
3. Each step collects structured data
4. On save, API sends resume JSON to AI for ATS scoring
5. AI returns score (0–100) and detailed feedback items
6. Resume stored in `user_resumes` table
7. Score synced to `user_profiles.resume_ats_score` via DB trigger `sync_ats_score()`
8. User can export resume as PDF via browser print (`.resume-print-area` class)

**Build Status:** **Done**

### 2.4 Community Forum (Interactive)

#### 2.4.1 Create Forum Posts

**Description:** Create new discussion posts in the community forum.

**Pages/Routes:**
- `/community` — "Create Post" form
- `/api/community/posts` (POST) — Create post

**Key User Flow:**
1. Authenticated user clicks "Create Post"
2. Fills in title, content, category, optional tags
3. Submits → POST to `/api/community/posts`
4. Post appears in community listing
5. User can delete own posts via DELETE `/api/community/posts/[id]`

**Build Status:** **Done**

#### 2.4.2 Comment on Posts

**Description:** Add comments to community forum posts.

**Pages/Routes:**
- `/community/[id]` — Comment input form
- `/api/community/comments` (POST) — Add comment

**Key User Flow:**
1. Authenticated user scrolls to comment section on a post
2. Writes comment and submits
3. Comment appears immediately in thread
4. User can delete own comments

**Build Status:** **Done**

#### 2.4.3 Upvote Posts

**Description:** Toggle upvote on community posts.

**Pages/Routes:**
- `/api/community/vote` (POST) — Toggle upvote via `toggle_upvote` stored procedure (RPC)

**Key User Flow:**
1. Authenticated user clicks upvote icon on a post
2. RPC toggles vote status (insert or delete from `community_votes`, update `post.upvotes` count)
3. Vote count updates in real-time

**Build Status:** **Done**

### 2.5 LinkedIn-Style Networking Features

These features were added in Session 10 and are fully implemented with working UI, API routes, and database tables.

#### 2.5.1 Enhanced User Profiles

**Description:** Rich public profiles with banner image, avatar, headline, about section, skills with endorsements, and open-to-work status.

**Pages/Routes:**
- `/people/[username]` — Public profile page
- `/profile` — Edit own profile
- `user_profiles` extended with 17 new columns (username, headline, about, avatar_url, banner_url, current_position, current_org, city, country, website, is_open_to_work, open_to_work_types, profile_views, follower_count, following_count, connection_count, is_profile_public)

**Key User Flow:**
1. User edits profile to add headline, about, current position, skills
2. Public profile accessible at `/people/[username]`
3. Other users can view profile, see skills, endorse skills
4. "Open to Work" toggle in profile settings
5. When enabled, banner shows on profile and opportunities sidebar suggests relevant roles

**Build Status:** **Done**

#### 2.5.2 Connections & Following

**Description:** Network system with connections (mutual accept), following (one-way), connection requests, and suggestions.

**Pages/Routes:**
- `/network` — 6-tab layout (Connections, Following, Followers, Sent, Received, Suggestions)
- `/api/network/connect` — Send connection request
- `/api/network/connections` — List connections
- `/api/network/followers` / `following` — Follow system
- `/api/network/suggestions` — People suggestions with mutual-connection scoring

**Key User Flow:**
1. User visits `/network` → sees connections, followers, following
2. "Sent" tab shows pending outgoing requests
3. "Received" tab shows incoming requests with Accept/Decline
4. "Suggestions" tab shows recommended connections based on mutual connections
5. User can follow/unfollow without connecting
6. Connect button on profile pages (`/people/[username]`)

**Build Status:** **Done**

#### 2.5.3 Home Feed

**Description:** A 3-column social feed with posts, reactions, comments, and reposts.

**Pages/Routes:**
- `/feed` — 3-column layout (left sidebar, main feed, right sidebar with suggestions)
- `/api/feed` — GET feed posts; POST create post
- `/api/feed/posts/[id]/like` — 5-reaction picker
- `/api/feed/posts/[id]/comment` — Add comment
- `/api/feed/posts/[id]/repost` — Repost toggle

**Key User Flow:**
1. User visits `/feed` → main column shows posts from connections and followed users
2. User can create a post with type selector: Post / Article / Achievement / Question
3. Posts can receive reactions (5 types: like, celebrate, support, insightful, funny)
4. Comments can be added and viewed inline with expand/collapse
5. Repost toggle shares post to follower feeds
6. Right sidebar shows people and company suggestions

**Build Status:** **Done**

#### 2.5.4 Company Pages

**Description:** Directory of company pages with follow functionality and detail views.

**Pages/Routes:**
- `/companies` — List grid with search and follow buttons
- `/companies/[slug]` — Detail page with banner, about, follower count
- `/api/companies` — List/search companies
- `/api/companies/[id]` — Company detail
- `/api/companies/[id]/follow` — Follow/unfollow

**Key User Flow:**
1. User visits `/companies` → grid of company cards with follower counts
2. Search filters by name
3. Follow button on card and detail page
4. Detail page shows: banner image, about section, follower count, related opportunities
5. 10 seed companies: DRDO, ISRO, CSIR, IIT Delhi, IIT Bombay, Texas Instruments, Qualcomm, Intel, Tata Electronics, IIST

**Build Status:** **Done**

#### 2.5.5 Direct Messaging

**Description:** Real-time chat with conversation list, read receipts, and profile-initiated conversations.

**Pages/Routes:**
- `/messages` — Conversation list sidebar + chat UI
- `/api/messages` — List conversations
- `/api/messages/[conversationId]` — Get/send messages in conversation
- Initiate from `/people/[username]` profile page

**Key User Flow:**
1. User clicks Messages icon in navbar dropdown
2. Conversation list shows on left sidebar with latest message previews
3. Clicking a conversation opens the chat panel
4. Messages display with read receipts
5. User can start a new conversation from someone's profile page

**Build Status:** **Done**

#### 2.5.6 Notifications

**Description:** Full notification system with bell badge, mark-read, mark-all-read, and type-specific icons.

**Pages/Routes:**
- `/notifications` — Full notification list
- `/api/notifications` — GET notifications
- `/api/notifications/[id]` — Mark single as read
- `/api/notifications/count` — Unread count for badge
- Notification bell in `Navbar.tsx` with live count

**Key User Flow:**
1. Navbar bell icon shows unread notification count
2. Clicking bell navigates to `/notifications`
3. Notifications display with actor photo, action description, and timestamp
4. Notification types: connection request, follow, post like, comment, repost, skill endorse, recommendation
5. "Mark all read" button updates all notifications at once
6. Clicking individual notification navigates to relevant context

**Build Status:** **Done**

#### 2.5.7 People Search

**Description:** Search users with filters and connect buttons.

**Pages/Routes:**
- `/search?tab=people` — People search tab
- `/api/people/search` — User search endpoint

**Key User Flow:**
1. User types in search bar and selects "People" tab
2. Results show matching user profiles with avatar, name, headline
3. Connect button available on each result
4. Filter by location, skills, current company

**Build Status:** **Done**

### 2.6 Telegram Notifications

**Description:** Receive real-time opportunity alerts via Telegram when matching opportunities are posted.

**Pages/Routes:**
- `telegram-bot.ts` — Telegram bot logic
- `telegram_subscribers` table — stores chat IDs

**Key User Flow:**
1. User subscribes via Telegram bot (initiate chat with bot)
2. Bot stores chat_id in `telegram_subscribers` table
3. When new matching opportunities are scraped, Telegram message is sent with details and link

**Known Issues:**
- No web UI for subscribe/unsubscribe — users must use the Telegram bot directly
- No UI to configure keyword filters for Telegram vs. email alerts

**Build Status:** **Partial** (bot works, no subscription UI)

### 2.7 Dashboard

**Description:** Central user dashboard showing stats, saved opportunities, application tracking, and resume score.

**Pages/Routes:**
- `/dashboard` — Client component (protected)

**Key User Flow:**
1. User logs in → redirected to `/dashboard`
2. Stats cards: saved opportunities count, active applications, resume score
3. "Saved" section: bookmarked opportunities with quick action buttons
4. "Applications" section: pipeline view with status dropdowns
5. Resume score card with link to resume builder
6. Profile completion indicator

**Build Status:** **Done**

---

## 3. Admin Features

Accessible via admin password (`NEXT_PUBLIC_ADMIN_PASSWORD`). The admin panel link is in the site footer.

### 3.1 Admin Dashboard

**Description:** Central admin interface for managing platform content.

**Pages/Routes:**
- `/admin` — Admin panel landing page

**Key User Flow:**
1. Admin enters admin password (plain-text comparison, no role-based auth)
2. Dashboard shows quick stats and links to all admin tools

**Build Status:** **Done**

### 3.2 Opportunity Management (CRUD)

**Description:** Full create, read, update, delete management of opportunities with verification workflow.

**Pages/Routes:**
- `/admin` — List all opportunities with status indicators
- `/admin/add-opportunity` — Create form
- `/admin/edit-opportunity/[id]` — Edit form
- `/api/opportunities` (POST) — Create
- `/api/opportunities/[id]` (PATCH) — Update
- `/api/opportunities/[id]` (DELETE) — Delete

**Key User Flow:**
1. Admin views opportunity list with verification status (pending/verified/flagged/expired)
2. Can add new opportunity manually via form
3. Can edit existing opportunity metadata
4. Can delete opportunities
5. Verification status can be manually set

**Build Status:** **Done**

### 3.3 News Management (CRUD)

**Description:** Create, edit, delete news articles.

**Pages/Routes:**
- `/admin/add-news` — Create news article

**Key User Flow:**
1. Admin fills in news article details (title, content, source, tags)
2. Article is saved to `news_articles` table
3. Admin can view/edit/delete via admin list

**Build Status:** **Done**

### 3.4 Link Checking

**Description:** Manually recheck individual opportunity links for validity.

**Pages/Routes:**
- `/api/admin/recheck-link` (POST) — Recheck single opportunity link

**Key User Flow:**
1. Admin clicks "Recheck Link" on an opportunity
2. System hits the apply URL and checks HTTP status
3. Result logged in `link_check_logs`
4. Verification status updated accordingly

**Build Status:** **Done**

### 3.5 AI Usage Analytics

**Description:** View AI provider usage statistics and success rates.

**Pages/Routes:**
- `/admin` — AI Analytics panel integrated in admin dashboard
- `/api/analytics/ai-usage` (GET) — AI usage stats from Neon Primary (`ai_usage_log` table)

**Key User Flow:**
1. Admin views `AIAnalyticsPanel` component
2. Charts show: calls per provider, success rates, latency, token usage
3. Data sourced from `neonPrimary` (Neon db3)

**Build Status:** **Done**

### 3.6 Platform Analytics

**Description:** View platform-wide analytics including page views, clicks, and shares.

**Pages/Routes:**
- `/api/analytics/platform` (GET) — Platform analytics from Neon Primary (`platform_analytics` table)

**Key User Flow:**
1. Admin views platform stats (page views, apply clicks, share counts)
2. Data from `neonPrimary.platform_analytics`

**Build Status:** **Done**

### 3.7 Admin Talent Pool

**Description:** View users who have enabled "Open to Work" with matched opportunities.

**Pages/Routes:**
- `/admin/talent-pool` — List of open-to-work users

**Key User Flow:**
1. Admin views users with `is_open_to_work = true`
2. Each user shows their profile headline, skills, current role
3. Sidebar shows matched opportunities for each candidate

**Build Status:** **Done**

---

## 4. Automated / Cron Features

### 4.1 Scrape All Sources

**Description:** Main scraper orchestrator — fetches news from 16 RSS feeds + scrapes ISRO/DRDO/CSIR for new opportunities.

**Pages/Routes:**
- `/api/scrape?mode=all` (GET) — Triggered by Vercel cron (daily 06:00 UTC)

**Key User Flow:**
1. Vercel cron fires at 06:00 UTC daily
2. `opportunity-scraper.ts` orchestrator runs all scrapers in sequence
3. News parsed from 16 RSS feeds via `rss-parser.ts`
4. ISRO, DRDO, CSIR scraped via cheerio HTML parsers
5. New articles filtered via `news-filter.ts` (380+ keywords, 45 blocked patterns)
6. Borderline articles classified by `news-filter-ai.ts` (AI relevance check)
7. New opportunities inserted into `opportunities` table with status `pending`
8. `deep-scraper.ts` visits up to 5 new opportunity `apply_link` URLs per run to extract full details
9. `news-filter.ts` deduplication runs on news articles

**Build Status:** **Done** (pipeline is complete; cron has been triggered at least once via manual invocation)

### 4.2 Weekly Email Digest

**Description:** AI-generated email roundup of top opportunities and news from the past week.

**Pages/Routes:**
- `/api/send-digest` (GET) — Triggered by Vercel cron (Sunday 03:00 UTC)
- `email-digest.ts` — Content generation and email sending via Resend
- `newsletter.ts` (AI) — Digest content curation

**Key User Flow:**
1. Vercel cron fires at 03:00 UTC on Sunday
2. AI curates top opportunities and news from the past 7 days
3. Email HTML is generated with sections: Top Opportunities, Latest News, Trending
4. Email is sent via Resend to all active subscribers
5. Unsubscribe link included in email footer

**Build Status:** **Done**

### 4.3 Archive Old News

**Description:** Move news articles older than 30 days from Supabase Primary to Supabase Secondary (archive).

**Pages/Routes:**
- `/api/archive-news` (GET) — Triggered by Vercel cron (Sunday 02:00 UTC)

**Key User Flow:**
1. Vercel cron fires at 02:00 UTC on Sunday
2. Queries `news_articles` in db1 for articles where `published_at < NOW() - 30 days`
3. Copies matching articles to `news_archive` table in db2
4. Deletes originals from db1

**Build Status:** **Partial** (route exists, code is written, but cron has never triggered — no first-run data in archive)

### 4.4 Sync Neon Read Replica

**Description:** Sync opportunities and news data from Supabase Primary to Neon Secondary read replica.

**Pages/Routes:**
- `/api/sync-replica` (GET) — Triggered by Vercel cron (daily 07:00 UTC)

**Key User Flow:**
1. Vercel cron fires at 07:00 UTC daily
2. Reads active opportunities from db1, upserts into `opportunities_mirror` in db4 (Neon Secondary)
3. Reads recent news from db1, upserts into `news_mirror` in db4

**Build Status:** **Partial** (route exists, code is written, but cron has never triggered — no first-run data in replica)

### 4.5 Link Checking

**Description:** Verify that opportunity apply links are still valid.

**Pages/Routes:**
- Embedded in scrape pipeline and also accessible via `/api/check-links` (GET) — Cron endpoint
- `link_check_logs` table — stores verification results

**Key User Flow:**
1. For each active opportunity, the link checker sends a HEAD/GET request to the `apply_link`
2. HTTP 2xx/3xx → status = valid
3. HTTP 4xx/5xx → status = invalid, opportunity flagged
4. Result logged in `link_check_logs`
5. Verification status updated in `opportunities` table

**Build Status:** **Done**

### 4.6 AI-Based Expiry Detection

**Description:** Use AI to classify opportunities as expired or active based on content analysis.

**Pages/Routes:**
- `/api/ai/expire` (GET) — Cron endpoint (runs within scrape pipeline)
- `expiry-checker.ts` — AI expiry classification logic

**Key User Flow:**
1. For opportunities nearing or past their listed deadline, AI analyses the description
2. AI classifies as "active", "expired", or "uncertain"
3. Expired opportunities are marked with `is_active = false`
4. Logged in `ai_usage_log`

**Build Status:** **Done**

### 4.7 News Cleanup

**Description:** Deduplicate news articles that were scraped from multiple sources.

**Pages/Routes:**
- `/api/cleanup-news` (POST) — Cron endpoint (runs within scrape pipeline)

**Key User Flow:**
1. Compares new articles against existing ones by title similarity
2. Duplicates are flagged or removed
3. Ensures the news listing contains only unique articles

**Build Status:** **Done**

### 4.8 Render Scrape Worker

**Description:** Repurposed Render instance acts as a background scrape worker, triggered by Vercel cron via HTTP.

**Pages/Routes:**
- `/api/scrape` can also be triggered from Render
- Render token: `rnd_GCEmbLzqTpnOKy202LGW9tiGrOla`

**Key User Flow:**
1. Vercel cron → HTTP request to Render worker
2. Render worker executes scrape tasks in the background (avoids Vercel serverless timeout limits)
3. Worker writes results to Supabase Primary

**Build Status:** **Partial** (Render instance exists and is configured; active usage is pending — scraping currently runs directly in Vercel serverless functions)

---

## 5. Features Not Started

### 5.1 Calendar Export Table Logging

The `calendar_exports` table exists in the database schema but has never been written to by the `/api/calendar-export/[id]` handler. The ICS download works, but exports are not logged.

**Build Status:** **Partial** (table exists, ICS works, no INSERT logic)

### 5.2 Telegram Subscription UI

The `telegram_subscribers` table exists and the Telegram bot (`telegram-bot.ts`) can send messages, but there is no web UI for users to subscribe or unsubscribe. Users must interact with the Telegram bot directly.

**Build Status:** **Partial** (bot works, no web UI)

### 5.3 Cron Jobs Initial Trigger

The following cron jobs have code and routes but have never been triggered by Vercel cron:
- `/api/archive-news` (Sunday 02:00 UTC)
- `/api/sync-replica` (Daily 07:00 UTC)

**Build Status:** **Partial** (routes exist, cron configured in vercel.json, never triggered)

### 5.4 E2E Tests

No end-to-end tests exist. There is no Playwright or Cypress configuration in the repository.

**Build Status:** **Not Started**

### 5.5 Monitoring / Alerting for Cron Failures

There is no monitoring or alerting system for cron job failures. Silent failures can go undetected.

**Build Status:** **Not Started**

### 5.6 Analytics Dashboard for Non-Admin Users

Users have no visibility into their own usage statistics (page views, saved opportunities trends, etc.).

**Build Status:** **Not Started**

### 5.7 OpenAPI / Swagger Documentation

API routes have no formal documentation. There is no OpenAPI/Swagger spec.

**Build Status:** **Not Started**

### 5.8 Vercel Deploy via GitHub Actions

The CI pipeline runs lint/test/build but cannot deploy automatically. `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are not set as GitHub secrets.

**Build Status:** **Not Started** (blocked)

### 5.9 Sentry Error Tracking (DSN Configuration)

Sentry client and server config files exist, but `NEXT_PUBLIC_SENTRY_DSN` is not set in Vercel environment variables.

**Build Status:** **Not Started** (blocked)

### 5.10 Database Backup Verification

No automated process verifies that database backups are restorable.

**Build Status:** **Not Started**

### 5.11 Google OAuth Provider Configuration

Google OAuth is configured in code but requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in Supabase Dashboard. These env vars are not set in Vercel.

**Build Status:** **Not Started** (blocked)

### 5.12 Light Mode Theme Toggle

The platform uses dark theme exclusively. No light mode support has been implemented.

**Build Status:** **Not Started**

### 5.13 CDN for Static Assets

All images, fonts, and static assets are served directly from Vercel. No CDN is configured.

**Build Status:** **Not Started**

### 5.14 Real-Time Messaging (WebSocket)

The messaging feature uses fetch-based polling. WebSocket/Supabase Realtime integration for true real-time chat is not implemented.

**Build Status:** **Not Started**

### 5.15 Mobile App (PWA / React Native)

No mobile application exists. The web app is responsive but not a PWA.

**Build Status:** **Not Started**

---

## 6. Feature Map Summary

| Feature Area | Anonymous | Registered | Admin | Status |
|-------------|-----------|------------|-------|--------|
| Browse opportunities | ✅ | ✅ | ✅ | Done |
| View opportunity detail | ✅ | ✅ | ✅ | Done |
| Filter by category | ✅ | ✅ | ✅ | Done |
| Natural language search | ✅ | ✅ | ✅ | Done |
| Keyword search | ✅ | ✅ | ✅ | Done |
| Browse news | ✅ | ✅ | ✅ | Done |
| View news detail | ✅ | ✅ | ✅ | Done |
| Browse organisations | ✅ | ✅ | ✅ | Done |
| View organisation detail | ✅ | ✅ | ✅ | Done |
| AI Chat | ✅ | ✅ | ✅ | Done |
| AI Match | ✅ | ✅ | ✅ | Done |
| AI Summarizer | — | — | ✅ | Done |
| Community (read-only) | ✅ | ✅ | ✅ | Done |
| Career resources | ✅ | ✅ | ✅ | Done |
| Newsletter subscribe | ✅ | ✅ | ✅ | Done |
| Report issue | ✅ | ✅ | ✅ | Done |
| Calendar export | ✅ | ✅ | ✅ | Partial |
| Click tracking | ✅ | ✅ | ✅ | Done |
| Public API feed | ✅ | ✅ | ✅ | Done |
| SEO (sitemap, JSON-LD, OG) | ✅ | ✅ | ✅ | Done |
| Health check | — | — | ✅ | Done |
| Contact form | ✅ | ✅ | ✅ | Done |
| Auth (login/signup) | — | ✅ | ✅ | Done |
| Edit profile | — | ✅ | ✅ | Done |
| Save/bookmark | — | ✅ | ✅ | Done |
| Track applications | — | ✅ | ✅ | Done |
| Set alerts | — | ✅ | ✅ | Done |
| Resume builder | — | ✅ | ✅ | Done |
| Create community posts | — | ✅ | ✅ | Done |
| Comment on posts | — | ✅ | ✅ | Done |
| Upvote posts | — | ✅ | ✅ | Done |
| Enhanced profiles | — | ✅ | ✅ | Done |
| Connections & following | — | ✅ | ✅ | Done |
| Home feed | — | ✅ | ✅ | Done |
| Company pages | — | ✅ | ✅ | Done |
| Direct messaging | — | ✅ | ✅ | Done |
| Notifications | — | ✅ | ✅ | Done |
| People search | — | ✅ | ✅ | Done |
| Telegram notifications | — | ✅ | — | Partial |
| Admin dashboard | — | — | ✅ | Done |
| Admin CRUD (opportunities) | — | — | ✅ | Done |
| Admin CRUD (news) | — | — | ✅ | Done |
| Link rechecking | — | — | ✅ | Done |
| AI usage analytics | — | — | ✅ | Done |
| Platform analytics | — | — | ✅ | Done |
| Admin talent pool | — | — | ✅ | Done |
| Scrape pipeline | — | — | ✅ | Done |
| Weekly digest | — | ✅ | ✅ | Done |
| Archive old news | — | — | ✅ | Partial |
| Sync read replica | — | — | ✅ | Partial |
| Link checking cron | — | — | ✅ | Done |
| AI expiry detection | — | — | ✅ | Done |
| News cleanup | — | — | ✅ | Done |
| Calendar table logging | — | — | — | Partial |
| Telegram subscription UI | — | — | — | Partial |
| E2E tests | — | — | — | Not Started |
| Cron monitoring | — | — | — | Not Started |
| User analytics dashboard | — | — | — | Not Started |
| API documentation | — | — | — | Not Started |
| CI/CD deployment | — | — | — | Not Started |
| Sentry DSN config | — | — | — | Not Started |
| DB backup verification | — | — | — | Not Started |
| Google OAuth config | — | — | — | Not Started |
| Light mode | — | — | — | Not Started |
| CDN assets | — | — | — | Not Started |
| Real-time messaging | — | — | — | Not Started |
| Mobile app | — | — | — | Not Started |
