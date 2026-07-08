# Product Requirements Document (PRD)

**Product Name**: SiliconPath (formerly SiliconPath)  
**Status**: Live / Active Development  

## 1. Product Vision
SiliconPath aims to be the single source of truth and global aggregator for hardware, semiconductor, and VLSI careers. It removes the friction of manual searching by automatically indexing, categorizing, and presenting high-quality opportunities (JRFs, PhDs, industry roles) worldwide, without requiring users to create an account.

## 2. Target Audience
- Final year students (B.Tech/M.Tech) in ECE, EE, and related fields.
- Researchers seeking PhD or PostDoc positions.
- Professionals looking for industry roles in VLSI, Embedded Systems, and hardware design.

## 3. Core Features (Live)

### 3.1 Aggregator Board (No-Login Required)
- **Opportunities Page** (`/opportunities`): A central feed of all parsed jobs, internships, and research fellowships. Supports instant client-side filtering by role, location, and institution.
- **News Feed** (`/news`): Aggregated industry news from top sources (IEEE, semiconductor engineering blogs).
- **Resources Hub** (`/resources`): Curated guides for career paths (e.g., "JRF vs SRF", "Fully Funded PhDs Abroad", "DRDO Recruitment Guide").

### 3.2 Automated Ingestion
- **Scraping Engine**: Scheduled cron jobs pull data from DRDO, ISRO, and global university RSS feeds.
- **AI Normalization**: Unstructured HTML and PDF text is passed through an LLM to extract JSON (Role, Deadline, Stipend, Requirements).
- **Quality Control**: Regex and keyword filtering ensure only hardware/VLSI relevant posts are stored.

### 3.3 SEO & Discoverability
- **Structured Data**: Automatic generation of `JobPosting` and `ItemList` schema.org JSON-LD scripts on relevant pages.
- **Dynamic Location Pages**: Auto-generated landing pages for specific tech hubs (e.g., `/opportunities/location/bangalore`) to capture high-intent search traffic.
- **LLM Visibility**: Dedicated `/llms.txt` file to ensure the platform is easily ingested by AI search engines like Perplexity, ChatGPT, and Gemini.

## 6. Known Limitations (from July 2026 Audit)

- **Security gaps:** Admin API endpoints (create/update/delete opportunities, recheck links, manage scrape sources) have zero authentication. `NEXT_PUBLIC_ADMIN_PASSWORD` is exposed in client-side JS bundles.
- **Broken DB function:** `generate_opp_slug()` has no body — slug auto-generation on INSERT fails.
- **Ineffective rate limiter:** In-memory rate limiter resets on every Vercel serverless invocation.
- **PostgREST injection risk:** User input interpolated into `.or()` filter strings.
- **Conflicting migrations:** Two migration files create overlapping tables with ambiguous execution order.

## 4. Dormant Features (Built but Hidden)

During initial development, a full suite of "LinkedIn-style" social features were built. However, product strategy pivoted to a friction-free, no-login aggregator. These features are fully functional in the codebase but are currently relegated to the footer navigation and are not actively maintained:

- **User Profiles** (`/profile`, `/people/[username]`): Full profile creation with skills and endorsements.
- **Social Feed** (`/feed`): A timeline for users to post updates, like, and comment.
- **Messaging** (`/messages`): Direct messaging between connected users.
- **Network** (`/network`): Follower/following graph logic.
- **Organizations** (`/companies`): Company profiles with follower tracking.

*Note: These features rely on `Supabase DB2`. If the product strategy shifts back towards community features, they can be easily re-activated in the main navigation.*

## 5. Non-Functional Requirements

- **Performance**: Sub-second page loads. Achieved via Next.js SSR and Vercel edge caching.
- **Resilience**: The AI extraction pipeline must not fail completely if a single provider (e.g., Gemini) goes down. A multi-provider fallback chain is required.
- **Design**: "Cyber-blob" aesthetic. Dark mode by default, high-contrast, premium tech feel.
