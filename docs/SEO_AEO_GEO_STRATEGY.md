# SEO / AEO / GEO Strategy

## 1. Keyword Strategy

### Primary Keyword Clusters

| Cluster | Target Pages | Search Intent |
|---------|-------------|---------------|
| Electronics jobs India | `/opportunities`, `/category/[category]` | Job seekers looking for electronics roles in India |
| Semiconductor jobs | `/opportunities?search=semiconductor` | Professionals in semiconductor/VLSI industry |
| JRF positions | `/opportunities?search=JRF`, `/resources/jrf-guide` | MSc/PhD graduates seeking funded research positions |
| PhD electronics | `/opportunities?search=PhD`, `/resources/phd-guide` | Students seeking doctoral positions in electronics |
| VLSI careers | `/resources/vlsi-careers`, `/opportunities?search=VLSI` | VLSI engineers and students |
| DRDO recruitment | `/opportunities?search=DRDO` | Candidates targeting DRDO research jobs |
| ISRO JRF | `/opportunities?search=ISRO` | Applicants for ISRO research fellowships |
| CSIR fellowship | `/opportunities?search=CSIR` | CSIR fellowship aspirants |

### Secondary Keywords

- Embedded systems jobs
- Research fellowship India
- Government research jobs
- NET electronics jobs
- GATE electronics jobs
- SRF positions
- Postdoc electronics India
- Electronics teaching jobs

### Page-Level Keyword Targeting

Every page has a targeted `generateMetadata()` call with page-specific title, description, and keywords arrays. The global `layout.tsx` sets defaults for pages without explicit metadata.

---

## 2. Technical SEO

### URL Structure

All content URLs use clean, human-readable keyword slugs — never UUIDs:

| Content Type | URL Pattern | Example |
|-------------|------------|---------|
| Opportunities | `/opportunities/[slug]` | `/opportunities/jrf-drdo-electronics-2026` |
| News | `/news/[slug]` | `/news/semiconductor-market-growth-2026` |
| Organizations | `/organizations/[slug]` | `/organizations/drdo` |
| People | `/people/[username]` | `/people/amit-kumar` |
| Companies | `/companies/[slug]` | `/companies/intel` |
| Categories | `/category/[category]` | `/category/jrf` |
| Resources | `/resources/[guide]` | `/resources/jrf-guide` |

### Canonical URLs

Every page includes a canonical `<link>` via `alternates.canonical` in `generateMetadata()`. The canonical URL is always the clean slug-based URL with the production domain: `https://siliconpath.vercel.app`.

### Sitemap Generation

`sitemap.ts` dynamically generates a sitemap.xml split by content type:

- **Static pages** (17 entries): Homepage, listing pages, utilities — with appropriate change frequencies (homepage=daily, login=monthly)
- **Category pages** (7): Each JRF, SRF, PhD, Govt Job, Fellowship, Private, International
- **Resource/guide pages** (5): Each career guide page
- **Opportunity detail pages**: All active, verified opportunities with slugs — fetched from Supabase via `supabaseAdmin`
- **Organization pages**: Unique org slugs derived from active opportunities
- **Company pages**: All slugs from `company_pages` table
- **News articles**: Up to 200 most recent articles with non-null slugs

Sitemap is served at `/sitemap.xml` and referenced in `robots.txt`.

### Robots.txt

`/robots.ts` generates `robots.txt`:
- Allows all user agents on `/`
- Disallows `/admin` and `/api/` paths
- Points sitemap to `https://siliconpath.vercel.app/sitemap.xml`
- Sets canonical host

### Core Web Vitals Optimization

- **ISR (Incremental Static Regeneration)**: Opportunity detail pages cached for 3600s, news detail for 1800s, reducing server load
- **Lazy data fetching**: Components like `SimilarOpportunities` and `AIOpportunitySummary` fetch data client-side after page render
- **Responsive images**: Next.js `Image` component with proper sizing and remote patterns
- **Minimal blocking resources**: Plausible script loaded with `strategy="afterInteractive"` (not render-blocking)

### Mobile Responsiveness

- Tailwind responsive breakpoints throughout (sm/md/lg/xl)
- Mobile drawer for navigation, filter bars collapse below `lg`
- Touch-friendly tap targets (minimum 44px)
- Single-column layout on mobile, multi-column on desktop

---

## 3. Schema.org Implementation

### Types by Page

| Page Type | Schema Type | Location |
|-----------|-------------|----------|
| **Homepage** | `WebSite` + `FAQPage` | `app/page.tsx` |
| **Opportunity Detail** | `JobPosting` + `BreadcrumbList` | `app/opportunities/[slug]/page.tsx` |
| **News Detail** | `NewsArticle` | `app/news/[slug]/page.tsx` |
| **Organization/Company** | `Organization` | Organization/company detail pages |
| **Resource Guides** | `FAQPage` | Guide pages (`/resources/*`) |
| **All Pages** | `BreadcrumbList` | Embedded per-page |

### JobPosting (Opportunity Detail)

Key properties included:
- `title`, `description`
- `hiringOrganization` (name + sameAs URL)
- `jobLocation` (addressLocality + addressCountry)
- `employmentType` (FULL_TIME, CONTRACTOR, etc.)
- `validThrough` (deadline date)
- `baseSalary` (currency + value)
- `datePosted`
- `url`

### NewsArticle (News Detail)

- `headline`, `description`
- `datePublished`, `dateModified`
- `author`, `publisher`
- `image`
- `mainEntityOfPage`

### Organization (Org/Company Pages)

- `name`, `url`
- `logo`
- `description`
- `sameAs` (social links)
- `foundingDate` (where applicable)

### BreadcrumbList (All Pages)

Three-level breadcrumb: Home > Section > Entity — with position markers and canonical URLs.

### WebSite (Homepage)

Includes `SearchAction` potential action with target template for site search.

### FAQPage (Resource Guides)

Structured Q&A with `Question`/`Answer` pairs. Each question covers a high-intent search query (e.g., "What is the stipend for JRF in DRDO/ISRO/CSIR?").

---

## 4. AEO (Answer Engine Optimization)

### Direct-Answer Format on Guide Pages

Guide pages at `/resources/*` are written as direct-answer content:
- Clear question in H1/H2 headings
- Concise, factual answer immediately following
- Structured lists for eligibility, deadlines, stipend ranges
- No fluff or filler content

Example guides:
- `/resources/jrf-guide` — "What is JRF? How to apply?"
- `/resources/phd-guide` — "PhD in Electronics: Complete Guide"
- `/resources/international-fellowships` — "International Fellowships for Electronics Researchers"
- `/resources/vlsi-careers` — "VLSI Career Path: From Fresher to Expert"
- `/resources/net-vs-gate` — "NET vs GATE: Which is Better for Electronics Jobs?"

### FAQ Schema on Resource Pages

FAQPage structured data with 4–6 high-intent questions per guide, each with a complete, authoritative answer. This targets Google's "People Also Ask" and direct answer features.

### Structured Q&A on Homepage

The homepage embeds 4 FAQ entries in FAQPage schema covering:
- What is JRF in electronics?
- How to find JRF positions in India?
- JRF stipend at DRDO/ISRO/CSIR?
- Do I need NET or GATE for JRF positions?

---

## 5. GEO (Generative Engine Optimization)

### Trust Signals

| Signal | Implementation | Location |
|--------|---------------|----------|
| **Dated content** | Articles and opportunities display `posted_at` / `published_at` dates | Cards and detail pages |
| **Sourced factual statements** | Claims cite official sources (DRDO, ISRO, CSIR websites) | Description and metadata |
| **Verification transparency** | Badge system: verified / unverified / expired / flagged | Opportunity cards and detail pages |
| **Auto-scrape disclaimer** | "This opportunity was auto-scraped and is pending manual verification" | Unverified opportunity banners |
| **Verification pipeline** | All items start as "pending", link-checked before going public | Backend `check-links` cron |
| **Data freshness** | ISR caches with known revalidation intervals | Headers and page metadata |

### Verification Transparency Page Content

Every opportunity detail page for unverified items shows a yellow warning banner:
> "This opportunity was auto-scraped and is pending manual verification. Always confirm details on the official website before applying."

Expired opportunities show a red banner with the deadline date.

### Factual Authoritative Content Pattern

- All descriptions are pulled from official sources (RSS feeds, government HTML scrapes)
- AI summaries are labeled as "AI-generated" with appropriate disclaimers
- Stipend figures cite DST/SERB norms where applicable
- Organization types (Government/Private/Research) are auto-classified per page

---

## 6. Content Strategy

### Internal Linking

- Opportunity cards link to detail pages via keyword slug
- Tag chips on detail pages link back to filtered search results
- "Similar Opportunities" component suggests related content
- Organization names link to organization detail pages
- Trending tags on homepage link to filtered search
- Quick facts and related content cross-link between sections

### Guide Page Content Pattern

Each resource guide follows this structure:
1. **H1**: Direct question or clear topic (e.g., "JRF in Electronics: Complete Guide 2026")
2. **Intro paragraph**: 2–3 sentences answering the core question
3. **What is [topic]**: Definition and scope
4. **Eligibility criteria**: Bulleted list
5. **Stipend and benefits**: Table or structured list
6. **How to apply**: Step-by-step instructions
7. **Top organizations offering this**: List with links
8. **FAQ**: 4–6 questions with direct answers
9. **Related resources**: Links to other guides

### Page-Level Keyword Targeting

Each page targets 1–2 primary keywords and 2–3 secondary keywords in:
- `<title>` tag (via `generateMetadata`)
- `<meta name="description">`
- `<meta name="keywords">`
- H1 heading
- Opening paragraph

### Monitoring

- Plausible Analytics tracks page views, enabling content performance analysis
- AI provider usage logs capture search query patterns to identify content gaps
- Admin analytics dashboard provides opportunity and news engagement metrics
