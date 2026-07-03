# Product Requirements Document — ElectroBridge

> **Version:** 1.0  
> **Last Updated:** July 3, 2026  
> **Status:** Approved

---

## 1. Vision & Mission

### Vision

One platform for every electronics, semiconductor, and VLSI opportunity in India and beyond.

### Mission

To eliminate the fragmentation of career and research opportunities in the Indian electronics ecosystem by aggregating every verified R&D job, fellowship, PhD position, government opening, and industry news into a single, searchable, AI-enhanced platform — accessible to anyone, without barriers.

### Core Value Proposition

ElectroBridge is the single source of truth for electronics professionals and researchers in India. Instead of hunting across dozens of institutional websites, RSS feeds, and government portals, users find everything in one place: verified links, AI-curated insights, community discussion, and personalised opportunity matching — all for free, with zero friction.

---

## 2. Problem Statement

### The Fragmentation Problem

The Indian electronics, semiconductor, and VLSI opportunity landscape is severely fragmented:

- **R&D opportunities** (JRF, SRF, PhD fellowships, project positions) are published ad-hoc on individual institutional websites — IITs, IISc, TIFR, CSIR, DRDO, ISRO, and dozens of others. There is no centralised listing.
- **Government openings** appear across separate portals (CSIR HRDG, DRDO CEPTAM, ISRO Careers) with inconsistent formats, differing deadlines, and no standardised metadata.
- **Industry jobs** are scattered across LinkedIn, Naukri, Indeed, and company career pages, making it impractical to monitor all sources.
- **PhD positions and fellowships** in electronics/semiconductor domains have no dedicated aggregator — academic positions are buried in general academic job boards.
- **Industry news** in electronics (IEEE Spectrum, Semiconductor Engineering, EE Times) has no single feed targeted at the Indian context.

**The result:** Students and professionals spend hours each week manually checking multiple websites. Opportunities are missed due to lack of awareness. The discovered information is siloed, unstructured, and rapidly becomes outdated.

### The Credibility Problem

Existing job boards suffer from:
- **Broken links** — listings persist after the application window closes.
- **Unverified sources** — third-party reposts of opportunities with no guarantee of accuracy.
- **Stale data** — opportunities that remain listed months after the deadline.
- **Paywalls and login gates** — users must create accounts just to browse listings.

### The Signal-to-Noise Problem

General-purpose job boards (LinkedIn, Naukri, Indeed) inundate users with irrelevant listings. An electronics engineer searching for "VLSI design engineer" on LinkedIn receives recommendations for unrelated software jobs. There is no dedicated platform focused solely on the electronics/semiconductor domain.

### The AI Gap

No existing platform provides:
- Natural language search queries tailored to electronics career paths
- AI-powered matching between user profiles and niche R&D opportunities
- Automated deadline and expiry detection
- AI-generated summaries of opportunity details
- Domain-specific career chatbot assistance

---

## 3. Target Users

### Persona 1: Arjun (Student / Job Seeker)

**Demographics:**
- Final-year B.Tech ECE student at a tier-2 Indian college
- Age 21–22, limited industry network
- Monthly stipend from family: ₹5,000–₹10,000

**Goals:**
- Find a JRF (Junior Research Fellow) position or internship in VLSI or embedded systems
- Identify PhD opportunities with funding
- Build a resume that stands out (no prior work experience)
- Get notified when relevant opportunities open

**Pain Points:**
- Does not know where to find JRF openings — they are scattered across 50+ institutional sites
- Has missed deadlines because there was no central calendar
- Cannot afford premium job board subscriptions
- His resume has no ATS scoring or feedback

**How ElectroBridge Helps:**
- Browse all JRF/SRF/internship opportunities in one place with AI summaries
- Use AI Match to find the most relevant opportunities based on his skills
- Build a resume with the 6-step wizard and get AI ATS feedback
- Subscribe to alerts for "VLSI" or "embedded systems" keywords
- Export ICS calendar reminders for deadlines
- Read career guides: "How to Get a JRF" in the Resources section

### Persona 2: Priya (Research Aspirant)

**Demographics:**
- MSc Physics graduate from University of Delhi
- Age 23–24, 1-year gap preparing for GATE/NET exams
- Seeking PhD or JRF in experimental condensed matter physics / semiconductor device physics

**Goals:**
- Find JRF/fellowship positions at IISc, IITs, TIFR, or national labs
- Get a fully funded PhD position with stipend
- Stay updated on research breakthroughs in semiconductor physics
- Connect with labs and research groups

**Pain Points:**
- PhD positions are posted on 30+ different department websites
- No way to filter by research area (device physics vs. materials vs. fabrication)
- Missed a deadline at TIFR because the posting was only on their website for 2 weeks
- Has no visibility into which labs are actively hiring

**How ElectroBridge Helps:**
- Filter opportunities by category (JRF, SRF, PhD, Postdoc) and eligibility (MSc, MTech)
- Read AI-summarised descriptions for each opportunity
- Browse news from Nature Electronics, Science Daily, and Phys.org filtered to semiconductor physics
- Use AI Chat to ask "Which labs in India work on 2D semiconductors?"
- Set alerts for "PhD" AND "semiconductor"
- Use the community forum to discuss with other aspirants

### Persona 3: Vikram (Industry Professional)

**Demographics:**
- 5-year experienced VLSI design engineer at a mid-size firm (Synopsys/GLOBALFOUNDRIES/startup)
- Age 28–30, BE/BTech in ECE
- Currently earning ₹18–25 LPA, looking for senior-level move

**Goals:**
- Find senior VLSI design engineer / RTL design roles at top semiconductor companies (Intel, Qualcomm, AMD, Texas Instruments, NXP)
- Track opportunities at specific organisations (his target list)
- Stay updated on industry trends (chip design, foundry news, EDA tools)
- Network with peers in the industry

**Pain Points:**
- General job boards show too many irrelevant listings (software, IT, management)
- No way to view all openings at a target company in one view
- Wants industry news but does not have time to read 10 different publications
- No domain-specific career chatbot for electronics engineering

**How ElectroBridge Helps:**
- Browse opportunities filtered to his exact domain (VLSI, chip design, RTL, verification)
- View organisation pages with all associated opportunities and company news
- Read filtered electronics news — AI ensures only semiconductor-relevant articles appear
- Use AI Match to find roles matching his experience level
- Follow target companies for updates
- Network with peers via the community forum and LinkedIn-style profiles

---

## 4. Non-Negotiable Product Principles

### 4.1 100% Verified Data, Zero Broken Links

**Statement:** Every opportunity listed on ElectroBridge must have a verified, valid apply link. Broken links are detected and removed or flagged automatically.

**Rationale:** Trust is the platform's primary asset. A single broken link erodes user confidence and undermines the value of aggregation. Unlike general job boards that allow anyone to post, ElectroBridge sources opportunities programmatically from official channels and verifies every link.

**Implementation:**
- All scrape sources are configured in the `scrape_sources` table with verified base URLs.
- A cron-based link checker (`/api/check-links`) re-checks opportunity links periodically.
- AI-based expiry detection (`/api/ai/expire`) classifies opportunities as active/expired.
- Opportunities are classified as `pending` → `verified` or `flagged` based on verification.
- The verification badge (`VerificationBadge` component) surfaces status to users.

### 4.2 No Login Wall for Browsing

**Statement:** Any feature that involves browsing, reading, or discovering content must be accessible without authentication.

**Rationale:** Login walls create friction and reduce organic reach. ElectroBridge's primary value driver is aggregation, not social networking. Requiring authentication for browsing would contradict the mission of making opportunities accessible to everyone.

**Scope:**
- Viewing opportunities, news, organisations, community posts, and career resources — no auth required.
- AI Chat and AI Match — no auth required.
- Subscribing to email newsletter — no auth required (with rate limiting).
- Reporting issues — no auth required.
- **Auth-gated features only:** Saved/bookmarked opportunities, application tracking, resume builder, alert configuration, community posting/commenting/voting, profile management, LinkedIn-style networking features.

### 4.3 Aggregation Is the Primary Value Driver

**Statement:** The core product is aggregation — collecting, normalising, deduplicating, and surfacing opportunities and news from diverse sources. Social/networking features are supplementary and must never distract from aggregation.

**Rationale:** Users come to ElectroBridge to find opportunities. Social features add stickiness but are not the reason users visit. Product decisions must prioritise aggregation quality, breadth, and timeliness above all else.

**Implications:**
- The homepage prominently features opportunities and news, not a social feed.
- Scraping engine reliability and coverage are the highest-priority engineering concerns.
- Social features (community, LinkedIn-style profiles, messaging) are accessible but secondary.
- New feature proposals are evaluated primarily on whether they improve opportunity discovery.

### 4.4 SEO/AEO/GEO-First Architecture

**Statement:** Every public page must be optimised for discovery via search engines (SEO), answer engines/assistants (AEO), and generative engine optimisation (GEO).

**Rationale:** Organic traffic is the primary acquisition channel. The platform is built for discovery, which means content must be indexable, structured, and citable by both traditional search engines and AI assistants.

**Implementation:**
- **Clean slug URLs:** `/opportunities/jrf-at-iisc-2026`, `/news/semiconductor-market-2026` — no query parameters for canonical content.
- **schema.org JSON-LD:** Every opportunity, news article, and organisation page includes structured data markup (`JobPosting`, `NewsArticle`, `Organization` schemas).
- **Server-side rendering (RSC/SSR):** All public pages use Next.js Server Components or ISR — no client-side rendering for primary content.
- **ISR caching:** Opportunity pages at 3600s, news at 1800s for freshness with performance.
- **Sitemap and RSS:** `/sitemap.xml` and `/robots.txt` configured for comprehensive indexing.
- **OG images:** Dynamic OG image generation at `/api/og/opportunity/[slug]` for social sharing.
- **Citable content:** All data is accessible via the public API at `/api/opportunities-feed` for external citations and integrations.

### 4.5 Card-Click UX

**Statement:** The browsing experience must be frictionless — one click from listing to detail page. No "View Details" buttons, no modal dance, no intermediate pages.

**Rationale:** Every extra click is a potential drop-off. Users scanning a list of 20+ opportunities should be able to rapidly preview and open details. The card itself is the entry point.

**Implementation:**
- Every `OpportunityCard` is wrapped in a `<Link>` that navigates directly to the detail page.
- No "View Details" button exists within cards.
- The card click targets the entire card area (not just a button or title).
- External apply links are surfaced on the detail page, not on the card — keeping the card a pure navigation element.

### 4.6 Electronics/Semiconductor Scope Only

**Statement:** News and content filtering must strictly enforce the electronics/semiconductor domain boundary. No general tech, software, AI/ML, biotech, or unrelated content.

**Rationale:** Domain specificity is the platform's moat. Diluting content scope would turn ElectroBridge into a generic job board and destroy the focused value proposition.

**Implementation:**
- `news-filter.ts` maintains 380+ electronics/semiconductor keywords and 45 blocked regex patterns.
- AI news filtering (`news-filter-ai.ts`) acts as a secondary classifier for borderline articles.
- Content is auto-tagged into 20+ categories: Foundry, EDA, Chip Design, AI Chips, Materials, Equipment, Markets, Policy, India, IoT, EV/Power, 5G/6G, Quantum, Photonics, Memory, Sensors, Security, Aerospace, Manufacturing, Research.
- Blocked categories include: AI/ML (general), general tech, biotech, gaming, space exploration (non-electronics), consumer electronics reviews, finance, weather, social media.

### 4.7 Everything on Free-Tier Infrastructure

**Statement:** All services, databases, AI providers, and hosting must operate within free-tier limits. No paid subscriptions for infrastructure.

**Rationale:** The platform is a community service with no monetisation. Operating costs must be zero to ensure sustainability and independence.

**Current cost: ~$0/month**

| Service | Tier | Monthly Limit |
|---------|------|---------------|
| Vercel | Hobby | 2 concurrent builds, 100GB bandwidth, serverless functions |
| Supabase Primary | Free | 500MB DB, 2GB bandwidth, 50K MAU |
| Supabase Secondary | Free | 500MB DB, 2GB bandwidth |
| Neon Primary | Free | 0.5GB DB, 100 compute hours/mo |
| Neon Secondary | Free | 0.5GB DB, 100 compute hours/mo |
| Resend | Free | 100 emails/day |
| Sentry | Free | 5K events/month |
| Plausible | Self-hosted/Cloud | Open-source option |
| AI Providers | Various free | Bedrock, Groq, NVIDIA, Gemini, OpenRouter, Cloudflare, HuggingFace free tiers |

### 4.8 Legal, Respectful Scraping Only

**Statement:** All data collection must be legal, ethical, and respectful of source websites. Scraping is a last resort, not a primary strategy.

**Rationale:** Legal compliance and good-faith operation are non-negotiable. Aggressive scraping damages relationships with source sites and risks legal action.

**Implementation:**
- **Tier 1 (preferred):** ATS/API integrations — direct access from source databases or official API endpoints.
- **Tier 2 (acceptable):** Aggregator APIs — RSS feeds from aggregators (Academic Positions, Scholarship Roof).
- **Tier 3 (last resort):** HTML scraping — only for government sites (ISRO, DRDO, CSIR) that have no API or RSS.
- **Scraping prohibited from:** LinkedIn, Indeed, Glassdoor, Naukri, or any site that explicitly forbids scraping in its robots.txt or ToS.
- Rate limiting is applied to all scrapers to avoid overloading source servers.
- The `deep-scraper.ts` pipeline respects robots.txt directives and limits depth to 5 pages per cron run.

---

## 5. Business Model & Monetization Stance

### Current Model

ElectroBridge is **completely free** with no monetization. The platform operates on free-tier infrastructure from all service providers.

### Monetization Stance

**No monetization has been decided.** The following positions are definitive:

- **No advertisements:** No ad infrastructure has been built, and none will be added without explicit community consultation and a separate product decision. Ads degrade user experience and conflict with the mission of barrier-free access.
- **No premium tiers:** All features are free for all users. There is no "Pro" or "Premium" subscription. The platform will never gate opportunity listings behind a paywall.
- **No recruitment agency model:** ElectroBridge does not charge recruiters, companies, or institutions to list opportunities. It is not an ATS-for-companies product. All aggregation is inbound (scraped) rather than outbound (submitted/sponsored).

### Potential Future Models (Not Committed)

If monetization is considered in the future, the following models would be evaluated for compatibility with the mission:
- Sponsorship by academic/research institutions
- Optional donation-based community support
- Grant funding from electronics/semiconductor industry bodies
- Premium career coaching / resume review services (opt-in, not gating existing features)

### Current Funding Status

- **Monthly cost:** ~$0
- **Revenue:** $0
- **Sustainability:** Full free-tier operation with no ongoing costs

---

## 6. Success Metrics

### 6.1 Daily Active Verified Opportunities Count

**Target:** Sustain 500+ verified active opportunities available for browsing at any time.

**Rationale:** The platform's primary value is breadth of opportunity coverage. A declining count indicates scraping engine degradation or verification pipeline issues.

**Measurement:** Count of rows in `opportunities` where `verification_status = 'verified'` AND `is_active = true` AND `deadline > NOW()`.

### 6.2 Zero Broken Links Rate

**Target:** >99% of live opportunities have valid apply links.

**Rationale:** Broken links are the #1 trust killer. Users who click an apply link and encounter a 404 will not return.

**Measurement:** Quotient of (opportunities with `link_check_logs` latest entry = `valid`) over (total active opportunities). Checked by the daily `/api/check-links` cron.

### 6.3 Time-to-First-Value (TTFV)

**Target:** Under 30 seconds for a new visitor to find a relevant opportunity.

**Rationale:** First-time user retention depends on immediate value. If a visitor cannot find something relevant within 30 seconds of landing, they will leave.

**Measurement:**
- Homepage load time (LCP < 2.5s)
- Time from landing to first card click (analytics event)
- Search query success rate (percentage of NL searches that return results)

### 6.4 AI Provider Uptime

**Target:** >99% of AI API calls successfully complete through the fallback chain.

**Rationale:** AI features (Chat, Match, Search, Summarizer, Expiry Detection) are value multipliers. If they are unreliable, user trust erodes.

**Measurement:** Logged in `ai_usage_log` (Neon Primary). Metric = (successful calls) / (total calls) across all 7 providers. Currently operating at ~99% with Bedrock handling ~60% of traffic.

### 6.5 Scrape Success Rate

**Target:** >95% of scheduled scrape runs complete without errors.

**Rationale:** The scraping engine is the platform's data pipeline. Scrape failures result in stale data and missed opportunities.

**Measurement:** Logged per scrape run (source, success/failure). Metric = (successful source pulls) / (total scheduled pulls). Checked daily and reported in `/api/health`.

---

## 7. Out of Scope

The following are explicitly **out of scope** for the ElectroBridge product:

### 7.1 NOT a Payroll / ATS-for-Companies Product

ElectroBridge does not provide applicant tracking systems, payroll management, hiring workflows, or recruitment process outsourcing for companies. It is an aggregator for job seekers, not an HR tool for employers.

**Implications:**
- No "post a job" functionality for external recruiters.
- No application tracking on behalf of companies.
- No interview scheduling or calendar management for employers.

### 7.2 NOT a General Tech News Site

ElectroBridge aggregates only electronics, semiconductor, and VLSI industry news. It does not cover:
- General technology (consumer gadgets, software releases)
- Computer science / IT industry news
- Biotech, pharma, healthcare
- Finance, business news (beyond semiconductor markets)
- Space exploration (beyond the electronics components thereof)

**Implications:**
- Content filtering is strictly scoped and enforced.
- If a news article cannot be categorised into the 20+ electronics/semiconductor tags, it is rejected.
- AI classifier (`news-filter-ai.ts`) validates borderline articles.

### 7.3 NOT a Social Media Platform

Networking features (profiles, connections, feed, messaging, notifications) exist as supplementary tools to support career development, but ElectroBridge is not a social media platform. These features:

- Do not gate access to primary content.
- Are not the default landing experience.
- Will never include advertising or promoted content.
- Are designed for professional networking in the electronics domain, not general social connection.

### 7.4 NOT a Recruitment Agency

ElectroBridge does not:
- Act as an intermediary between candidates and employers.
- Take commissions or finder's fees.
- Provide placement services.
- Offer any paid or unpaid recruitment consulting.

**Implications:**
- All apply links direct users to the source (institutional website, company career page, application portal).
- ElectroBridge does not process applications or forward resumes to employers.
- The platform provides information and discovery only.

### 7.5 NOT Monetized

As detailed in Section 5, the platform has:
- No paid tiers or subscriptions.
- No advertisements.
- No sponsored content.
- No commission or transaction fees.

This stance is subject to future review but is currently definitive.
