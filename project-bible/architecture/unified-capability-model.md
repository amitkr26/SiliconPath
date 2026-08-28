# Unified Capability Model Specification

**Platform**: BerojgarDegreeWala  
**Document Version**: 2.0 (Phase 30B Multi-Persona Architecture)  
**Author**: Antigravity Architecture Team  

---

## 1. Architectural Philosophy

Traditional platforms force a user into a single binary persona: "Job Seeker" OR "Employer" OR "Admin". This introduces severe UX friction:
- An employer who also wants to browse jobs or learn semiconductor topics is locked out of candidate features.
- A candidate who starts a startup or recruits for a research lab must create an entirely new account with a different email.

**BerojgarDegreeWala resolves this through the Unified Progressive Capability Model:**

```
                  ┌──────────────────────────────┐
                  │    BASE AUTHENTICATED USER   │
                  │ (Email, Pass / OAuth, Ident) │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ CANDIDATE SCOPE  │   │  EMPLOYER SCOPE  │   │  STAFF / MANAGER │
│ • Resume Studio  │   │ • Post Jobs      │   │ • Verify Jobs    │
│ • Applications   │   │ • ATS Pipeline   │   │ • Scraper Ops    │
│ • Saved Jobs     │   │ • Talent Sourcing│   │ • Telemetry Logs │
│ • Social Network │   │ • Org Management │   │ • Moderation     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 2. Capability Activation Flow

1. **Initial Registration (`/signup`)**:
   - User chooses primary intent:
     - `I am looking for opportunities` (Candidate enabled)
     - `I want to hire talent` (Employer enabled)
     - `I want both` (Candidate + Employer enabled)
2. **Post-Registration Capability Expansion**:
   - A Candidate can visit `/employer` or click "Post Opportunity" to activate an Employer profile without creating a secondary account.
   - The user metadata and `user_profiles` table record the expanded capabilities.
3. **Contextual Navigation Switching**:
   - Navigation automatically adapts: when the user is working on recruitment (`/employer/*`), the navigation surfaces the ATS pipeline, Talent Search, and Job Management.
   - When browsing the public feed, semiconductor news, or learning academy, the navigation provides the full community candidate experience.
