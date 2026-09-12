# BerojgarDegreeWala — Product Specification

## Overview

**BerojgarDegreeWala** is India's career intelligence and opportunity infrastructure for Electronics, Semiconductor, VLSI, Embedded Systems, Research (JRF/SRF/Postdoc), and Academia (M.Tech/PhD).

It aggregates verified opportunities across premier institutions (ISRO, DRDO, CSIR, BARC, IITs, NITs, IIITs, Central Universities) and private semiconductor fabless/fab leaders (Qualcomm, Intel, NVIDIA, AMD, TI, Synopsys, Cadence, ARM, Micron, Tata Electronics, CG Power), eliminating the friction of manual cross-portal job hunting.

---

## 1. Product Surfaces & Workflows

### A. Public Discovery & Opportunity Intelligence
- **Homepage (`/`)**: Direct value proposition, unified opportunity discovery search, high-density opportunity cards, curated institutional domain pathways (Government/PSU, Private VLSI/Embedded, JRF/SRF, PhD/Master's), verified editorial news, and transparent platform metrics without marketing fluff.
- **Opportunities Directory (`/opportunities`)**: Dynamic listing with multi-parameter filtering (Category: Jobs, Internships, Research/JRF/SRF, PhD/Academic, Hackathons; Work Mode: On-site, Hybrid, Remote; Experience level; Location; Verification status). Table and high-density card layouts.
- **Opportunity Intelligence Engine (`/ask-ai`)**: Context-aware natural language search and semantic matching with 4 operational modes (Ask AI, Discover, Saved, Alerts), strict date-aware freshness checks, and institutional source tracking.
- **Organizations Directory (`/organizations`)**: Curated database of semiconductor firms, national research labs, and academic institutions with active opportunity counts.
- **Editorial News & Resources (`/news`, `/resources/*`)**: Domain-specific recruitment guides, GATE/NET comparisons, DRDO/ISRO examination roadmaps, and international semiconductor fellowships.

### B. Candidate Career Cockpit
- **Dashboard (`/dashboard`)**: Unified candidate command center showing active applications, saved opportunities, upcoming deadlines, and profile completion.
- **Profile & Resume (`/profile`, `/resume`)**: Verified skills, educational history, research publications, portfolio links, and privacy/visibility controls (`is_profile_public`).
- **Applications Tracking (`/applications`)**: Real-time status tracking across recruitment stages (Submitted, Under Review, Interview, Selected, Rejected).
- **Saved Opportunities (`/saved`)**: Personal opportunity bookmarks with deadline countdowns.
- **Professional Network & Feed (`/network`, `/feed`)**: Technical discussions, peer connections, follow/connection requests, and post reactions/comments.
- **Notifications (`/notifications`)**: Real-time alerts for application status changes, connection acceptances, and direct messages.

### C. Employer / Recruiter Suite
- **Recruitment Cockpit (`/employer/dashboard`)**: Active listings overview, total applicants, unread applications, and time-to-hire velocity.
- **Job Studio (`/employer/post-job`, `/employer/jobs/[id]/edit`)**: Multi-step opportunity creation with role classification, eligibility criteria, compensation/stipend ranges, work modes, and application destination (Direct apply URL or platform ATS).
- **Multi-Stage ATS Pipeline (`/employer/applicants`, `/employer/jobs/[id]/applicants`)**: Kanban and table pipelines for candidate evaluation, note taking, status progression, and rejection/shortlisting.
- **Talent Discovery (`/employer/talent`)**: Candidate search across verified engineering domains with profile preview and direct messaging.
- **Company Branding & Team (`/employer/company`, `/employer/team`, `/employer/settings`)**: Company verification badges, claim requests, team seat management, and notification preferences.

### D. Admin Moderation & Infrastructure Console
- **Admin Command Center (`/admin`)**: Platform health, user activity metrics, opportunity verification queue, and moderation audit trail.
- **Scraper & Fleet Health (`/admin/scrape-health`)**: Status of automated crawlers, source health, last ingestion timestamps, and error rate diagnostics.
- **User & Company Management (`/admin/users`, `/admin/companies`)**: User privilege governance, company verification review, and organization claim dispute resolution.

---

## 2. User Tiers & Feature Matrix

| Feature | Guest | Candidate | Employer / Recruiter | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse opportunities & search | ✓ | ✓ | ✓ | ✓ |
| Opportunity Intelligence (`/ask-ai`) | ✓ | ✓ | ✓ | ✓ |
| View organizations & editorial news | ✓ | ✓ | ✓ | ✓ |
| Save opportunities & deadline tracking | — | ✓ | — | ✓ |
| Profile, Resume & Network connection | — | ✓ | ✓ | ✓ |
| Feed interactions (posts, comments, reposts) | — | ✓ | ✓ | ✓ |
| Direct Messaging (real-time) | — | ✓ | ✓ | ✓ |
| Post opportunities & ATS management | — | — | ✓ | ✓ |
| Talent pool search & candidate sourcing | — | — | ✓ | ✓ |
| Company claim & team seat management | — | — | ✓ | ✓ |
| Scraper fleet monitoring & moderation | — | — | — | ✓ |

---

## 3. Data Integrity & Verification Standard

1. **Zero Fabricated Content**: BDW contains no fake testimonials, fabricated company reviews, or artificial user counts. Metrics displayed derive from database counts.
2. **Primary Official Sources**: Every aggregated listing links directly to the official government portal, institutional career page, or company ATS.
3. **Institutional Trust Strip**: Listings visibly attribute source domain, verification timestamp, and clear disclaimers affirming non-affiliation with government hiring bodies.
4. **Data Freshness**: Scrapers normalize deadlines, enforce expiration filters, and flag expired posts to prevent user application fatigue.
5. **Media Truthfulness & Minimalist Visual Identity**: BDW prohibits generic stock photos and AI-generated decorative illustrations. Organization identity relies on official verified logos or deterministic monograms derived from name hashes. Editorial news defaults to designed metadata banners rather than arbitrary scraped images. Logo uploads update visual branding only and never grant automatic institutional verification.
