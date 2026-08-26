# Phase 27 — Priority Map & Product Capability Matrix

**Document Version**: 1.0.0  
**Target Platform**: SiliconPath / BerojgarDegreeWala  
**Design Paradigm**: Neo-Brutalist Engineering Identity (Black border-2, sharp contrast, vibrant amber/emerald/indigo accents, zero generic purple SaaS gradients)  
**Acceptance Contract**: REAL USER → REAL ACTION → REAL API → REAL DATABASE → REAL PERSISTENCE → REAL UI RESULT  

---

## 1. Product Capability Gap Analysis

| Product Area | Current Baseline | Gap / Required Expansion | Priority |
| :--- | :--- | :--- | :---: |
| **Professional Profile** | Basic profile view with modal editor | Full public profile `/profile/[username]` with complete timeline (Experience, Education, Projects, Certifications, Achievements, Publications, Portfolio Links, Skills with Endorsement badges, Resume showcase, Open-To-Work banner, Connect/Message CTAs) | **P0** |
| **Skills & Endorsements** | Skill list in profile | Skill tag picker, category filters, interactive endorsement button (prevent self-endorsement, toggle endorse/unendorse), top skills showcase | **P0** |
| **Professional Feed** | Basic post & like feed | Dedicated semiconductor tag filters (RTL, UVM, Physical Design, STA, Embedded, Research), rich post creator, edit/delete own posts, comment thread drawer/collapsible, author profile hovercards | **P0** |
| **Professional Networking** | Connection requests & suggestions | People directory with domain & location filters, mutual connection signals, full request lifecycle (Connect → Pending/Withdraw → Accept/Reject → Disconnect), followers/following tab views | **P0** |
| **Messaging System** | Basic conversation thread | Production-grade real-time conversation list, unread message badges, conversation search, deep-linking (`?user=<id>` & `?conv=<id>`), auto-scroll, message status, employer-candidate direct messaging | **P0** |
| **Opportunity Discovery & Curation** | Search & experience filters | Quick-curated collections ("Recommended for you", "Closing soon", "New today", "For freshers", "Research / JRF / PhD", "PSU / Govt"), skill-based match percentage | **P0** |
| **Application Tracking Pipeline** | Basic applications list | Visual stage progression stepper (`Applied` → `Screening` → `Shortlisted` → `Interview` → `Offer/Accepted` / `Rejected`), stage notes, withdrawal action | **P0** |
| **Employer ATS Pipeline** | Job list & applicant view | Kanban-style / staged candidate pipeline, recruiter candidate notes, candidate tagging, interview scheduling/stage transition, candidate messaging shortcut | **P0** |
| **Talent Search for Recruiters** | Basic keyword query | Multi-dimensional candidate search (Skills, Experience years, Domain/Specialization, Open-To-Work, Location), one-click candidate save & direct message | **P0** |
| **Unified Global Search** | Search page with basic tabs | Global search across People, Opportunities, Organizations, News, Academy, and Resources with clear tabbed results and count badges | **P0** |
| **Unified Notification Center** | Notifications API endpoint | Dedicated notification center dropdown & page (`/notifications`), unread badge sync, mark all read, deep links to messages/network/applications | **P1** |
| **Resume Builder & Job Tailoring** | Resume CRUD & ATS score | One-click profile data import, ATS keyword comparison against target opportunity description, PDF preview/download format | **P1** |
| **AI Career & VLSI Copilot** | AI chat endpoint | Grounded opportunity lookup ("Find me JRF positions in Bangalore"), skill-gap roadmap generation, technical interview prep | **P1** |
| **VLSI Academy & Career Mapping** | Learning tracks & assessments | Track completion certificate preview, job recommendations matching completed Academy tracks | **P1** |
| **Company / Organization Hub** | Organizations list | Enhanced organization profile (`/organizations/[slug]`) with active verified listings, careers link, and organization claim flow | **P1** |
| **Job & Opportunity Alerts** | Subscription endpoint | In-app user alert preferences (keywords, categories, locations) stored in DB and notified in-app | **P2** |

---

## 2. Priority Classification (P0 / P1 / P2 / P3)

### **P0: Critical Core Professional Platform (Execution Wave 1)**
1. **Professional Identity & Public Profile** (`/profile/[username]`, `/profile`, Edit Modal):
   - Timeline display for Experience, Education, Projects, Certifications, Achievements.
   - Skill chips with interactive endorsement counters (prevent self-endorsement).
   - Open to work banner & recruiter visibility controls.
   - Clean public presentation with Connect / Message CTAs.
2. **Professional Semiconductor Feed** (`/feed`):
   - Semiconductor topic tags (`#RTL`, `#Verification`, `#PhysicalDesign`, `#STA`, `#Embedded`, `#Research`).
   - Post creation, edit, and deletion with persistent database sync.
   - Inline comments and likes with live count updates.
3. **Professional Networking Hub** (`/network`):
   - People directory & recommendation algorithm (matching domain/skills).
   - Connection request management (Send, Accept, Reject, Withdraw, Remove).
   - Followers and Following management.
4. **Direct Messaging System** (`/messages`):
   - Real-time conversation thread, search, unread badges, deep links (`/messages?user=<id>`).
5. **Opportunity Discovery & Curated Collections** (`/opportunities`):
   - Quick curated pills: "For Freshers", "Closing Soon", "Research / JRF", "PSU & Govt", "Top Semiconductor".
6. **Candidate Application Tracker & Employer ATS** (`/applications`, `/employer/jobs/[id]/applicants`):
   - Visual stage pipeline: Applied → Screening → Shortlisted → Interview → Accepted/Rejected.
   - Employer recruiter evaluation notes, tagging, and stage transitions.
7. **Recruiter Talent Search** (`/employer/talent`):
   - Filter by skills, experience, location, open-to-work; save candidate and message.
8. **Unified Multi-Tab Global Search** (`/search`):
   - Tabs: Jobs, People, Organizations, News, Academy, Resources.

### **P1: Major Product Capabilities (Execution Wave 2)**
1. **Unified Notification Center** (`/notifications`): Unread bell indicator in navbar, mark read, interactive notification cards.
2. **Resume Builder & Opportunity Tailoring** (`/resume`): Profile-to-resume sync, ATS analysis against job description, PDF format preview.
3. **Grounded AI Career Assistant** (`/ask-ai`, `/chat`, Modal): Real DB opportunity grounding, interview preparation, learning paths.
4. **VLSI Academy Career Bridge** (`/academy`): Track certificates, opportunity suggestions for track graduates.
5. **Organization Profiles & Claiming** (`/organizations/[slug]`, `/employer/company-claim`): Verified listings, org claim review.

### **P2: UX & Product Enhancements (Execution Wave 3)**
1. **Job Alert Subscriptions**: In-app alert criteria preference manager.
2. **Mobile Neo-Brutalist Polish**: Touch-target optimization across 320px–1440px viewports.
3. **Accessibility**: ARIA live regions for notifications and messaging, keyboard navigation.

### **P3: Future Enhancements**
1. Virtual video interviews integration.
2. Enterprise multi-seat recruiter billing.
