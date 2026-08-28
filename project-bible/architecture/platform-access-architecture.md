# Platform Access & Unified Persona Architecture

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30 Unified Architecture)  
**Author**: Antigravity Architecture Team  

---

## 1. Unified Portal Philosophy

BerojgarDegreeWala is engineered as a single, cohesive full-stack web application. We reject the fragmented "multi-app" pattern where Candidates, Employers, and Admins are isolated into disconnected sub-applications.

Instead, every user traverses a **progressive capability spectrum**:

```
[ GUEST ] ──> [ CANDIDATE ] ──> [ EMPLOYER ] ──> [ MANAGER ] ──> [ ADMIN ] ──> [ OWNER ]
  (Public)      (Career)         (Hiring)       (Scoped)        (Global)      (Sovereign)
```

A user is an individual who may hold candidate capabilities (seeking learning, networking, jobs) and employer capabilities (posting roles, reviewing applicants) simultaneously under the same verified account.

---

## 2. Guest Transition & Preserve-Destination Pattern

When an unauthenticated guest clicks on a privileged action (e.g. `Apply to Job`, `Save Bookmark`, `Comment on Feed Post`, `Send Message`), the platform executes the **Preserve-Destination Pattern**:

1. **Capture Intent**:
   The current path and target action parameters are encoded in the query parameter:
   `https://berojgardegreewala.vercel.app/login?redirectTo=/opportunities/intel-soc-design-lead&action=apply`
2. **Authenticate / Register**:
   User completes Supabase Auth sign-in or registration.
3. **Seamless Return**:
   Post-authentication callback redirects directly to the original target opportunity, auto-opening the application drawer with previously filled details intact.

---

## 3. Role & Capability Definitions

### 1. Guest
- Full access to opportunity discovery, category filters, semiconductor news, public academy tracks, and public engineer profiles.
- Basic AI career inquiries (rate-limited via `@berojgardegreewala/api`).

### 2. Candidate
- Full guest capabilities plus personal profile editing (experience, education, projects, certifications, achievements, skills).
- 1-click job applications with resume attachment and real-time application stage tracking (`applied` -> `review` -> `interview` -> `offered` -> `rejected`).
- Social feed participation: authoring posts, liking, commenting, reposting.
- Direct messaging with peers and recruiters.
- AI Career Copilot, AI Job Matching, and AI Skill Gap analysis with direct links to Academy modules.

### 3. Employer
- Full candidate capabilities plus organization/company profile management.
- Job posting creation, editing, closing, and candidate screening questions.
- ATS Kanban applicant tracking pipeline with reviewer notes.
- Direct talent search & engineer sourcing across verified skill tags.
- Direct outreach and recruitment invitations.

### 4. Manager
- Granular, permission-scoped operational authority (e.g. `scrapers.run`, `content.moderate`, `organizations.verify`).
- No access to platform billing, administrative secrets, or owner configuration.

### 5. Admin
- Global platform telemetry, user moderation, opportunity verification, scraper health monitoring, and system latency insights.

### 6. Owner
- Sovereign platform authority. Only the owner can promote/demote admins, configure system API secrets, and manage root system policies.
- Immune to modification or demotion by any other role.
