# 🏛️ Technical Architecture Document

## Overview
**BerojgarDegreeWala** is engineered as a high-performance microservices and serverless web architecture optimized for reliability, rapid data aggregation, and real-time opportunity verification.

---

## 1. Core Component Breakdown

### A. Frontend Layer (Next.js 14 App Router)
- **Framework**: Next.js 14 with React 18 & Server Components (RSC).
- **Styling**: Tailwind CSS 3.4 with HSL design system tokens, glassmorphism card components, and custom CSS animations.
- **Routing Structure**:
  - `/` — Main Landing Page with hero statistics and featured live opportunities.
  - `/opportunities` — Dynamic opportunity discovery engine with search, category, and eligibility filters.
  - `/opportunities/[slug]` — Verified detail page with authentic organization metadata.
  - `/news` — Live July 2026 semiconductor news digest stream.
  - `/academy` — 7 core microelectronics learning tracks.
  - `/network` & `/community` — Engineering community hub.
  - `/chat` — Contextual AI career guidance copilot.

### B. Database & Persistence Layer
1. **Primary Database (Supabase)**:
   - Hosts tables for `opportunities`, `news_articles`, `organizations`, `bookmarks`, `users`, and `community_posts`.
   - Uses Row-Level Security (RLS) for data integrity.
2. **Analytics & Mirror Database (Neon PostgreSQL)**:
   - High-concurrency serverless PostgreSQL pooler.
   - Houses `opportunities_mirror`, `news_mirror`, `page_views`, `click_events`, `search_queries`, and `trending_cache`.

### C. Multi-Source Ingestion & Scrapers
- **Government Portals**: Custom DOM parsers for DRDO (`drdo.gov.in`), ISRO (`isro.gov.in`), CSIR (`csir.res.in`), SCL Mohali, and C-DAC.
- **Academic Portals**: Direct crawlers for IIT Bombay (IRCC), IIT Madras (ICSR), IISc Bangalore, and TIFR.
- **Enterprise GreenHouse / Workday APIs**: Integrated scraper pipelines for Intel, Qualcomm, AMD, TSMC, Arm Ltd, Graphcore, and Tata Electronics.
- **Automated RSS Feed Sync**: Parsers for IEEE Spectrum, EE Times, and Semiconductor Engineering.

---

## 2. Authentication Flow

```
[User Click Sign-In] ──> [Supabase OAuth / Google]
                              │
                              ▼
                 [Callback at /auth/callback]
                              │
                              ▼
                 [Session Code Exchange]
                              │
                              ▼
            [Redirect to /dashboard on BerojgarDegreeWala]
```

---

## 3. Data Integrity & Security Standards
- **Authentic Link Enforcement**: All opportunity links map strictly to official `.gov.in`, `.ac.in`, or corporate Greenhouse/Workday application URLs.
- **Clean Content Sanitization**: Multi-pass HTML entity decoding converts unescaped HTML into clean, human-readable text.
- **Cross-App Redirect Guards**: Middleware guarantees that login sessions remain strictly bound to the `BerojgarDegreeWala` origin.
