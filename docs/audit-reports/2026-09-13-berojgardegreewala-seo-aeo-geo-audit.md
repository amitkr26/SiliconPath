# BerojgarDegreeWala — Master SEO, AEO, GEO, Crawl Validation & Content Architecture Audit Report

**Date:** 2026-09-13  
**Platform:** BerojgarDegreeWala (`amitkr26/BerojgarDegreeWala`)  
**Production URL:** `https://berojgardegreewala.vercel.app`
**Git Branch / Remote:** `bdw-main` -> `bdw/main`
**Scope:** Repository-wide Technical SEO, Canonical Architecture, Robots/Sitemap Boundaries, Schema.org Truthfulness, External Search Engine Indexation & Crawl Validation, Core Web Vitals, Search Demand Modeling, Keyword Taxonomy, Competitor SERP Analysis, and Programmatic Architecture.

---

## Executive Summary

BerojgarDegreeWala (BDW) is India's dedicated career intelligence and opportunity infrastructure for **Electronics, Semiconductor, VLSI, Embedded Systems, and Academic/Government Research (JRF, SRF, Postdoc, PhD)**.

This master document consolidates all three phases of SEO engineering, validation, and content strategy into a single living source of truth:
1. **Phase 1A — Technical SEO, AEO, GEO & Canonical Implementation**: Elimination of root canonical hijacking, title sanitization, server-side pre-rendered initial feeds for `/news` and `/category/[category]`, Schema.org structured data (WebSite, Organization, JobPosting, EducationalOccupationalProgram, NewsArticle, FAQPage, ItemList, BreadcrumbList), zero-openings soft-404 resilience, and strict robots/sitemap boundary enforcement.
2. **Phase 1B — Search Engine Indexation & Crawl Validation**: Direct URL inspection across representative routes on both localhost and live Vercel production, JobPosting vs Educational Program schema discrimination, automated Core Web Vitals (TTFB) verification, internal link graph closure, and external search console status documentation.
3. **Phase 2 — Search Demand, Keyword Taxonomy & Content Architecture**: Full modeling of the 6-pillar keyword universe, competitor SERP gap analysis, programmatic quality gate definition (&ge; 3 active listings to index), and prioritized content backlog (P0 dedicated Role Hubs for Physical Design, Verification, RTL, DFT, and Fresher categories).

---

# PART I — TECHNICAL SEO, CANONICAL ARCHITECTURE & SCHEMA IMPLEMENTATION

## 1. Baseline Findings & Corrective Actions

| Area | Pre-Audit Baseline | Severity | Impact on Indexation & AI Retrieval | Resolution Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **Root Canonical** | Hardcoded to `"https://berojgardegreewala.vercel.app"` in `layout.tsx`. | **CRITICAL** | Overwrote canonical for all descendant routes omitting explicit `alternates`. | Removed root layout canonical; each public route declares explicit self-referencing canonical. |
| **Title Templates** | Repeated site name (`"... | BerojgarDegreeWala | BerojgarDegreeWala"`). | **MEDIUM** | SERP snippet truncation and lower click-through rate. | Sanitized all subpage title strings to eliminate double-branding. |
| **`/news` & Categories** | `"use client"` shell fetching on mount; no static/server HTML. | **HIGH** | Search bots and LLM fetchers could not extract recent articles or category listings without JavaScript execution. | Converted to Next.js Server Components with initial database pre-fetch, zero loading flicker, and JSON-LD schemas. |
| **JobPosting Schema** | Unparsed string stipends passed to numeric fields; missing `applicantLocationRequirements` and `directApply`. | **HIGH** | GSC Rich Result invalidation; excluded from Google Jobs UI. | Implemented numeric salary parser; added location requirements; added programmatic discrimination for educational admissions. |
| **Organization Schema** | `numberOfEmployees` set to active opportunity count. | **HIGH** | Knowledge graph distortion (e.g. Intel mapped with 2 employees). | Removed headcount hallucination; profiles with 0 active listings render directory navigation instead of soft-404. |
| **Sitemap Purity** | Contained `/search`, `/login`, `/signup`, `/companies`, `/match`. | **HIGH** | Submitted canonicalized aliases, redirecting routes, and noindex pages to Google Search Console. | Purged private/alias/noindex routes from `sitemap.xml`; dynamically derive `lastModified` from database. |
| **Robots Directives** | Disallowed dashboard, but allowed `/search` with parameters; missing `/onboarding`, `/notifications`, `/post-job`. | **MEDIUM** | Crawl budget waste on faceted query parameter combinations. | Added explicit Disallow rules in `robots.ts` for all faceted search and user-state routes. |
| **Breadcrumbs** | Absent on `/news/[slug]`, `/contact`, `/resources`, and `/opportunities/location/[city]`. | **MEDIUM** | Poor hierarchical site depth signaling for crawlers and answer engines. | Implemented semantic breadcrumbs and `BreadcrumbList` schemas across all subpage families. |

## 2. Definitive Route & Indexation Matrix

| Route Pattern | Classification | Rationale | Directives Implemented |
| :--- | :--- | :--- | :--- |
| `/` | **INDEX** | Core platform discovery homepage and entity overview. | `index, follow`, Canonical `/`, WebSite + Organization + FAQPage schema |
| `/opportunities` | **INDEX** | Main verified opportunity discovery feed. | `index, follow`, Canonical `/opportunities`, ItemList schema |
| `/opportunities/[slug]` | **INDEX** | Individual opportunity detail pages with official circular links. | `index, follow`, Canonical `/opportunities/${slug}`, JobPosting / EducationalProgram + BreadcrumbList |
| `/opportunities/location/[city]` | **INDEX** | Geo-targeted semiconductor clusters (Bengaluru, Hyderabad, Noida, etc.). | `index, follow`, Canonical `/opportunities/location/${city}`, ItemList + Breadcrumbs |
| `/organizations` | **INDEX** | Comprehensive directory of research labs and semiconductor companies. | `index, follow`, Canonical `/organizations`, ItemList + Breadcrumbs |
| `/organizations/[slug]` | **INDEX** | Official entity profile, verified openings, official portal link. | `index, follow`, Canonical `/organizations/${slug}`, Organization + BreadcrumbList |
| `/categories` | **INDEX** | Master category directory for fellowship and job levels. | `index, follow`, Canonical `/categories`, ItemList + BreadcrumbList |
| `/category/[category]` | **INDEX** | High-intent category hubs (`jrf`, `srf`, `phd`, `govt-job`, etc.). | `index, follow`, Canonical `/category/${category}`, ItemList + BreadcrumbList |
| `/news` | **INDEX** | Daily semiconductor news, fab announcements, and circulars. | `index, follow`, Canonical `/news`, ItemList + BreadcrumbList |
| `/news/[slug]` | **INDEX** | Individual news briefing, official source attribution. | `index, follow`, Canonical `/news/${slug}`, NewsArticle + BreadcrumbList |
| `/resources` | **INDEX** | Research fellowship guides, syllabus comparisons, DST norms. | `index, follow`, Canonical `/resources`, BreadcrumbList |
| `/resources/[guide]` | **INDEX** | Detailed editorial guides (JRF guide, DRDO exam, PhD abroad). | `index, follow`, Canonical `/resources/${guide}`, Article + FAQPage |
| `/about` | **INDEX** | Institutional mission, data verification standards, FAQ. | `index, follow`, Canonical `/about`, AboutPage + FAQPage |
| `/contact` | **INDEX** | Editorial contact, broken link reporting, verification inquiries. | `index, follow`, Canonical `/contact`, ContactPage + BreadcrumbList |
| `/ask-ai` | **INDEX** | Interactive semiconductor career intelligence assistant. | `index, follow`, Canonical `/ask-ai`, WebApplication schema |
| `/search` | **NOINDEX** | Faceted internal search with arbitrary query combinations. | `noindex, follow`, Canonical `/search`, Disallowed in `robots.txt` |
| `/login`, `/signup` | **NOINDEX** | Authentication gateways. | `noindex, follow`, excluded from `sitemap.xml` |
| `/companies`, `/companies/[slug]` | **NOINDEX** | Legacy alias URLs maintained for backward compatibility. | `noindex, follow`, Canonical to `/organizations` & `/organizations/${slug}` |
| `/match` | **NOINDEX** | Redirect route to `/network`. | Excluded from `sitemap.xml` |
| `/dashboard/*`, `/applications/*`, `/saved/*` | **NOINDEX** | Authenticated candidate portal areas containing personal data. | Protected by auth session; disallowed in `robots.txt` |
| `/employer/*` | **NOINDEX** | Employer recruiting cockpit and applicant tracking system. | Protected by employer RBAC; disallowed in `robots.txt` |
| `/admin/*` | **NOINDEX** | Internal governance and scraping fleet console. | Protected by admin RBAC; disallowed in `robots.txt` |

---

# PART II — SEARCH ENGINE INDEXATION & CRAWL VALIDATION

## 3. Four-Way Status Verification Framework

All indexation findings are strictly categorized into:
- **IMPLEMENTED**: Code, architecture, metadata, or schema changes engineered in the codebase.
- **TECHNICALLY VERIFIED**: Verified through local and staging execution (HTTP status codes, DOM parsing, schema validators, Jest regression tests, monorepo typecheck, Next.js build).
- **EXTERNALLY VERIFIED**: Verified via direct HTTP probes to the live production deployment (`https://berojgardegreewala.vercel.app`) and real live endpoints.
- **UNVERIFIED EXTERNAL OUTCOME**: Third-party search engine proprietary states (e.g. Google Search Console index coverage, Google Jobs ingestion cache, Bing Webmaster index pipeline) that cannot be accessed directly or simulated without external API access or organic crawl lag.

## 4. Google Search Console & Bing Webmaster Status
- **Google Search Console**: No external GSC service account or connector exists in the execution environment. Google site ownership verification tag is permanently embedded in root `layout.tsx`. Documented status: *"External Google indexing state could not be verified from the current environment."* (**UNVERIFIED EXTERNAL OUTCOME**).
- **Bing Webmaster Tools**: No Bing API connector or IndexNow key is present. Documented status: *"External Bing indexing state could not be verified from the current environment."* (**UNVERIFIED EXTERNAL OUTCOME**).

## 5. Live Production URL Inspection & Core Web Vitals (TTFB)

Automated live HTTP probes verified 6 representative routes on `https://berojgardegreewala.vercel.app`:

| Route Family | URL / Slug | Live HTTP Status | Canonical Self-Match | Structured Data Found | Pre-Rendered (No JS) | Live Vercel TTFB | Target Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/` | 200 OK | Matches | `WebSite`, `Organization`, `FAQPage` | Complete HTML shell | 55 ms | < 800 ms (EXCELLENT) |
| **Opportunity** | `/opportunities/staff-engineer-...` | 200 OK | Matches | `JobPosting`, `BreadcrumbList` | Full role specs & CTA | 480 ms | < 800 ms (GOOD) |
| **Organization** | `/organizations/cdac` | 200 OK | Matches | `Organization`, `BreadcrumbList` | Bio, website, verified status | 490 ms | < 800 ms (GOOD) |
| **News Article** | `/news/ai-in-chip-design-...` | 200 OK | Matches | `NewsArticle`, `BreadcrumbList` | Full article body & publisher | 562 ms | < 800 ms (GOOD) |
| **Category Hub** | `/category/jrf` | 200 OK | Matches | `ItemList`, `BreadcrumbList` | 40+ JRF fellowship listings | 310 ms | < 800 ms (GOOD) |
| **Location Hub** | `/opportunities/location/bengaluru` | 200 OK | Matches | `ItemList`, `BreadcrumbList` | Bengaluru semiconductor jobs | 320 ms | < 800 ms (GOOD) |

- **Structured Data Policy Compliance**: Differentiated academic admissions / scholarships (`EducationalOccupationalProgram`) from employment/fellowship posts (`JobPosting`) per Google Search Central rules.
- **Internal Link Graph Closure**: Opportunity pages now link directly to employer organization profiles (`/organizations/${opportunity.org_slug}`) and provide user-facing breadcrumb navigation.

---

# PART III — SEARCH DEMAND, KEYWORD TAXONOMY & CONTENT ARCHITECTURE

## 6. Live Platform Data Reality

- **Total Opportunities**: 3,658 (2,834 JRF, 497 Industry, 151 PhD, 77 Fellowship, 52 Government, 35 Postdoc, 8 SRF, 4 Internship).
- **Core Industry Roles in Database**: 145 Design Verification, 138 Physical Design, 87 RTL Design, 51 DFT, 42 Embedded Systems, 21 Analog Design.
- **Organizations**: 104 verified institutions (58 Private, 31 Academic, 8 Research Labs, 5 Government/PSU, 2 International).
- **Semiconductor News**: 417 verified editorial articles.

## 7. The 6-Pillar Keyword Taxonomy

1. **Semiconductor Jobs**: `semiconductor jobs India`, `semiconductor jobs for freshers`, `semiconductor jobs Bengaluru`, `semiconductor jobs Hyderabad`, `semiconductor engineering jobs`.
2. **VLSI & Chip Design Disciplines**: `VLSI jobs India`, `VLSI jobs for freshers`, `VLSI physical design jobs`, `design verification jobs India`, `RTL design jobs India`, `DFT jobs India`.
3. **Research Fellowships (JRF/SRF)**: `JRF vacancies 2026`, `JRF electronics`, `JRF stipend 2026`, `DRDO JRF recruitment`, `CSIR JRF electronics`, `difference between JRF and SRF`.
4. **PhD & Higher Education**: `PhD admission electronics 2026`, `PhD semiconductor India`, `fully funded PhD VLSI abroad`, `PMRF fellowship electronics`.
5. **Internships & Training**: `semiconductor internship India`, `VLSI internship for freshers`, `DRDO internship electronics`.
6. **Entity Intent**: `ISRO jobs electronics`, `DRDO recruitment 2026`, `C-DAC project engineer`, `Tenstorrent Bengaluru jobs`, `Graphcore India careers`, `Qualcomm India VLSI`, `Intel semiconductor careers`.

## 8. Competitor & Market Gap Analysis

- **Horizontal Job Boards (Naukri, Indeed, LinkedIn)**: Plagued by extreme "IT/software noise". Searching for electronics returns Java developers and generic IT support. BDW provides 100% verified hardware data with zero software recruiter spam.
- **Government & Academic Portals (DRDO, ISRO, CSIR, IITs)**: Authoritative for official PDF circulars, but completely fragmented across 50+ websites with poor mobile experience and zero deadline tracking. BDW extracts and structures these opportunities into searchable, indexable HTML entities.

## 9. Programmatic SEO Quality Gate

$$\mathbf{Rule:}\ \text{Active Verified Listings} \ge 3 \implies \mathbf{INDEX},\ \text{else } \mathbf{NOINDEX,\ FOLLOW}$$

- **Approved Programmatic Hubs**:
  - **Role Hubs (`/opportunities/role/[role]`)**: 6 core roles with &ge; 20 listings each (`physical-design`, `verification`, `rtl-design`, `dft`, `embedded-systems`, `analog-design`).
  - **Location Hubs (`/opportunities/location/[city]`)**: Top 6 semiconductor clusters (Bengaluru, Hyderabad, Noida, Pune, Chennai, Ahmedabad).
  - **Organization Profiles (`/organizations/[slug]`)**: 104 verified entities.
  - **Category Hubs (`/category/[category]`)**: `jrf`, `srf`, `phd`, `govt-job`, `fellowship`, `private`, `fresher`.
- **Prohibited / High-Risk Combinations (Thin-Content Danger)**:
  - Role × Minor City combinations with < 3 listings.
  - Role × Fresher combinations with sparse data.
  - Faceted search query parameter URLs.

## 10. AEO / GEO Conversational Blueprints

AI answer engines (Perplexity, SearchGPT, Claude, Gemini) extract direct, tabular facts from raw server-rendered HTML:
- *"What is the stipend for JRF in India in 2026?"* &rarr; Pre-rendered at `/category/jrf` & `/resources/jrf-vs-srf-difference` (₹37,000/mo + HRA, DST OM norms).
- *"Which semiconductor companies are hiring in Bengaluru?"* &rarr; Pre-rendered at `/opportunities/location/bengaluru` (Intel, Qualcomm, AMD, Tenstorrent, ARM).
- *"What are the eligibility criteria for DRDO Scientist B in Electronics?"* &rarr; Pre-rendered at `/resources/drdo-recruitment-electronics` (B.Tech ECE + valid GATE score).
- *"Can I apply for JRF without GATE or NET?"* &rarr; Factually explained in `/resources/net-vs-gate`.

---

# PART IV — VERIFICATION BASELINE & ACTION PLAN

## 11. Verification Baseline

- **TypeScript Type Safety**: `npm run typecheck` (0 errors across all 5 monorepo workspaces: `api`, `ai-gateway`, `server`, `worker`, `frontend`).
- **Unit & Integration Tests**: 26 frontend test suites, 259 tests passing (including 20 dedicated SEO/AEO/GEO tests in `seo-aeo-geo.test.tsx` and 21 comprehensive media tests in `image-system.test.tsx`); 350 tests passing monorepo-wide.
- **Production Build**: `npm run build` (compiles cleanly, 280 static and dynamic routes generated).
- **Live HTTP Performance**: Verified TTFB between 55ms and 562ms on live Vercel production.
- **Zero Application Code Modified in Phase 2**: Maintained strict research and strategy boundaries.

## 12. Prioritized Implementation Roadmap

1. **P0: Fix Category Mapping in `page.tsx`**: Map `category = 'industry'` (497 records in DB) to `/category/private` or `/category/industry`, immediately surfacing 497 live industry jobs.
2. **P0: Launch Dedicated Role Hubs (`/opportunities/role/[role]`)**: Pre-render the top 6 hardware disciplines (Physical Design, Verification, RTL, DFT, Embedded, Analog) with static generation, `ItemList` schema, and sitemap inclusion.
3. **P0: Launch Fresher Category Hub (`/category/fresher`)**: Dedicated entry-level hardware opportunity feed for graduates.
4. **P1: Publish DST Stipend & Rules Guide 2026 (`/resources/dst-stipend-rules-2026`)**: Definitive Google snippet magnet with `FAQPage` schema.
5. **P1: Add Organization Profile Faceting**: Interactive category pills on `/organizations` (Private, Govt/PSU, Academic, Research Lab).
