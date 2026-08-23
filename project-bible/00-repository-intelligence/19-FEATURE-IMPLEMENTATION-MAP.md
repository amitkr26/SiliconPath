# 19-FEATURE-IMPLEMENTATION-MAP — Platform Feature Status Matrix

| Feature | Surface | UI Route | API Route | Database Table | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deep-Tech Job Streams** | Public | `/opportunities` | `/api/opportunities` | `opportunities` | **VERIFIED LIVE** |
| **Candidate Profile Entities** | Candidate | `/profile` | `/api/profile/me/*` | `candidate_experiences` etc. | **VERIFIED LIVE** |
| **Profile Completeness (0-100%)** | Candidate | `/profile` | Pure Lib | Multi-table entity count | **VERIFIED LIVE** |
| **Professional Connections** | Candidate | `/network` | `/api/network/connections` | `connections` | **VERIFIED LIVE** |
| **Mutual Connections Graph** | Candidate | `/network` | `/api/network/mutual` | `connections` intersection | **VERIFIED LIVE** |
| **Follow / Unfollow System** | Candidate | `/network` | `/api/network/follow/*` | `user_follows` | **VERIFIED LIVE** |
| **Employer Job Studio** | Employer | `/employer/post-job` | `/api/employer/jobs` | `opportunities` | **VERIFIED LIVE** |
| **Multi-Stage ATS Pipeline** | Employer | `/employer/applicants` | `/api/employer/applicants` | `applications` | **VERIFIED LIVE** |
| **Talent Search & Dossier** | Employer | `/employer/talent` | `/api/employer/talent/[id]`| Structured Profile Entities | **VERIFIED LIVE** |
| **Recruiter Messaging** | Employer | `/employer/messages` | `/api/messages` | `conversations`, `messages`| **VERIFIED LIVE** |
| **Company Claims & Branding** | Employer | `/employer/company` | `/api/employer/company-claim`|`company_claims` | **VERIFIED LIVE** |
| **Workspace Team Seats** | Employer | `/employer/team` | `/api/employer/team` | `workspace_members` | **VERIFIED LIVE** |
| **Employer Settings** | Employer | `/employer/settings` | `/api/employer/settings` | `employer_settings` | **VERIFIED LIVE** |
| **Scoped Employer Analytics** | Employer | `/employer/analytics` | `/api/employer/stats` | Scoped queries | **VERIFIED LIVE** |
| **Multi-Provider AI Gateway** | AI System | `/match`, `/chat` | `/api/ai/*` | Grounded DB Context | **VERIFIED LIVE** |
| **Admin Scraper Control** | Admin | `/admin/scrape-health`| `/api/admin/scrape-health`| `scrape_sources`, `scrape_runs`| **VERIFIED LIVE** |
