# BerojgarDegreeWala — Product Specification

## Overview

**BerojgarDegreeWala** is India's career intelligence and opportunity infrastructure for Electronics, Semiconductor, VLSI, Embedded Systems, Research (JRF/SRF/Postdoc), and Academia.

It aggregates verified opportunities across premier institutions (ISRO, DRDO, CSIR, BARC, IITs, NITs) and private semiconductor leaders (Qualcomm, Intel, NVIDIA, AMD, TI, Synopsys, Cadence, Micron, Tata Electronics), eliminating the friction of manual cross-portal job hunting.

---

## 1. Product Surfaces

### A. Public Discovery & Opportunity Intelligence
- **Homepage (`/`)**: Value proposition, opportunity search, domain categories (Semiconductors, Space/Defence, National Labs, Academia), featured opportunities, verified news, FAQ.
- **Opportunities Directory (`/opportunities`)**: Multi-parameter filtering (Category, Field, Location, Eligibility), grid/list views, deadline countdowns, verification badges.
- **Opportunity Intelligence Engine (`/ask-ai`)**: BDW AI Career Intelligence — natural language search with RAG-backed responses, 7 AI tools, source citations, domain badges.
- **Organizations Directory (`/organizations`)**: 106+ verified semiconductor companies, research labs, and academic institutions with active opportunity counts.
- **Academy (`/academy`)**: Free video courses, learning paths, and VLSI skill development.
- **News & Resources (`/news`, `/resources`)**: Deep-tech recruitment guides, GATE/NET comparisons, DRDO/ISRO roadmaps, international fellowships.

### B. Candidate Career Cockpit
- **Dashboard (`/dashboard`)**: Active applications, saved opportunities, upcoming deadlines, profile completion.
- **Profile & Resume (`/profile`, `/resume`)**: Verified skills, educational history, research publications, portfolio links.
- **Applications Tracking (`/applications`)**: Real-time status across recruitment stages.
- **Professional Network (`/network`, `/feed`)**: Technical discussions, peer connections, post reactions.
- **Messaging (`/messages`)**: Real-time 1-on-1 candidate messaging.

### C. Employer / Recruiter Suite
- **Recruitment Cockpit (`/employer/dashboard`)**: Active listings, total applicants, pipeline overview.
- **Job Studio (`/employer/post-job`)**: Multi-step opportunity creation with role classification.
- **ATS Pipeline (`/employer/applicants`)**: Kanban/table pipeline with 6-stage state machine.
- **Talent Discovery (`/employer/talent`)**: Candidate search with skill/experience filters.
- **Company Branding (`/employer/company`, `/employer/team`)**: Verification badges, team seat management.

### D. Admin Console
- **Admin Command Center (`/admin`)**: Platform health, verification queue, moderation.
- **Scraper Fleet (`/admin/scrape-health`)**: Source health, error diagnostics, ingestion timestamps.
- **SEO Intelligence (`/admin/seo`)**: Site audit scores, gate violations, cannibalization detection.

---

## 2. User Tiers & Feature Matrix

| Feature | Guest | Candidate | Employer | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse opportunities & search | ✓ | ✓ | ✓ | ✓ |
| Ask AI (Career Intelligence) | ✓ | ✓ | ✓ | ✓ |
| View organizations & news | ✓ | ✓ | ✓ | ✓ |
| Save opportunities | — | ✓ | — | ✓ |
| Profile & Resume | — | ✓ | ✓ | ✓ |
| Applications tracking | — | ✓ | — | ✓ |
| Professional network & feed | — | ✓ | ✓ | ✓ |
| Messaging | — | ✓ | ✓ | ✓ |
| Post opportunities & ATS | — | — | ✓ | ✓ |
| Talent sourcing | — | — | ✓ | ✓ |
| Company claim & team seats | — | — | ✓ | ✓ |
| Scraper fleet & moderation | — | — | — | ✓ |
| SEO intelligence dashboard | — | — | — | ✓ |

---

## 3. Data Integrity Standards

1. **Zero Fabricated Content**: No fake testimonials, fabricated reviews, or artificial user counts.
2. **Primary Official Sources**: Every listing links to the official portal, career page, or company ATS.
3. **Evidence-Gated Verification**: No organization is verified without domain or cryptographic proof.
4. **Data Freshness**: Scrapers normalize deadlines, enforce expiration, flag stale posts.
5. **Media Truthfulness**: No stock imagery. Organization identity via verified logos or deterministic monograms.
6. **2026-09-18 DB1 data-quality pass**: 2,941 zombie/inactive/rejected duplicate rows deleted (`opportunities` 4,849 → 1,908; ≈1,009 active verified live). Provable per-job duplicates deactivated (5, reversible). **84 ambiguous duplicate groups** (identical titles on shared Workday/ATS board URLs) queued for human admin review in `project-bible/DUPLICATE_REVIEW_2026-09-18.csv` — never auto-deleted because one ATS board URL legitimately hosts many distinct jobs.
