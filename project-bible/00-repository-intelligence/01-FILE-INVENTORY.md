# 01-FILE-INVENTORY — Master File Catalog

This catalog documents the critical source files, configs, and entrypoints across the platform.

| File | Type | Purpose / Major Exports | Domain | Dependencies | Status | Last Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/middleware.ts` | Edge Middleware | RBAC routing, security headers, rate limiting | Security / Routing | `next/server` | CURRENT | 2026-08-23 |
| `frontend/src/lib/supabase.ts` | Client Lib | Supabase public, service-role admin clients | Database Client | `@supabase/supabase-js` | CURRENT | 2026-08-23 |
| `frontend/src/lib/employer-auth.ts` | Auth Helper | `getAuthenticatedEmployerUser` (Dual Cookie/Bearer) | Auth / RBAC | `@supabase/supabase-js` | CURRENT | 2026-08-23 |
| `frontend/src/lib/profile-completeness.ts` | Domain Logic | Deterministic 0-100% profile score algorithm | Candidate Identity | Pure TypeScript | CURRENT | 2026-08-23 |
| `frontend/src/lib/candidate-profile-store.ts` | State Store | In-memory resilient store for candidate entities | Resilience Fallback | Pure TypeScript | CURRENT | 2026-08-23 |
| `frontend/src/types/index.ts` | Type Defs | Unified interfaces (`Opportunity`, `UserProfile`, `CandidateExperience`) | Domain Model | None | CURRENT | 2026-08-23 |
| `backend/server/src/index.ts` | Server Entry | Express 4 app bootstrap, CORS, rate limits | Backend Server | Express, Supabase | CURRENT | 2026-08-23 |
| `backend/ai-gateway/src/index.ts` | AI Engine | 9-provider fallback LLM execution engine | AI Gateway | Groq, Gemini, OpenRouter | CURRENT | 2026-08-23 |
| `frontend/supabase/migrations/20260823000001_candidate_profile_entities.sql` | SQL Migration | Instantiates candidate profile entity tables in DB1 | Database DDL | PostgreSQL 15 | APPLIED LIVE | 2026-08-23 |
| `frontend/supabase/migrations/20260823120000_security_hardening_followup.sql` | SQL Migration | RLS policies, search_path, trigger privilege hardening | Security DDL | PostgreSQL 15 | APPLIED LIVE | 2026-08-23 |
| `project-bible/ARCHITECTURE.md` | Architecture Spec | Authoritative architecture specification | System Design | None | CURRENT | 2026-08-23 |
