⚠️ SUPERSEDED by 2026-08-29 Final Platform Reality Audit. This plan reflects Aug 22 state only.

# SiliconPath / BerojgarDegreeWala — Master Remediation Plan

## Version
2026-08-22 (Post-Forensic-Gate)

## Generated
2026-08-22

---

## PHASE A — CRITICAL SECURITY

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| A1 | Verify middleware `EMPLOYER_ONLY_PATHS` uses `/employer` (not `/employers`) | ✅ P0 | Middleware RBAC ineffective — any authenticated user could access employer routes | Employer tenant isolation broken; cross-employer IDOR possible | `frontend/src/middleware.ts:33` | None | Change path string; re-deploy middleware | None | Low | None | Trivial (1-line string change) | `npm run build`; manual API test all employer routes |
| A2 | Retest all employer IDOR after middleware fix | ✅ P0 | No verification that fix actually blocks cross-employer access | Cannot confirm security posture without retesting | N/A | N/A | Re-run all employer API IDOR tests | N/A | Low | A1 | Medium | All 7 employer IDOR tests pass (403 for Employer A → Employer B) |

---

## PHASE B — HIGH SECURITY

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| B1 | Reconcile ARCHITECTURE.md — remove `employer_id` from opportunities doc | 📅 P1 | Doc claims `employer_id` column on opportunities but DB only has `created_by` | Inconsistency between source-of-truth doc and live schema; developer confusion | `project-bible/ARCHITECTURE.md:71` | None | None | None | Low | None | Trivial (1-line doc change) | Read doc after change; verify no `employer_id` references in code |
| B2 | Reconcile ARCHITECTURE.md — `employer_settings` columns | 📅 P1 | Doc lists `dm_notifications`, `default_stage_notes`; migration has 3 alert columns | Documentation drift; developer reads wrong columns | `project-bible/ARCHITECTURE.md:80` | None | None | None | Low | None | Trivial (2-line doc change) | Read doc after change; verify code reads correct columns |
| B3 | Verify pipeline writes `pending` not `unverified` for opportunity verification | 🔒 P1 | KNOWN_ISSUES #16 — `unverified` NOT in CHECK constraint; historically zero inserts since 2026-08-02 | Critical data integrity issue; opportunity ingestion broken | `frontend/src/lib/scrapers/run-opportunity-scrape.ts` | None | Change `verification_status: "unverified"` → `"pending"` | None | Medium | Owner action | Moderate (1 env var + 1 string change) | Run scraper; verify `pending` inserts accepted; `verified` pipeline moves `pending → verified` |
| B4 | Update migration `20260821000001` to reflect current code state | 📅 P1 | Migration additive but not yet applied; drift between code and DB schema | If applied, schema may not match code; or code not matched to schema | `frontend/supabase/migrations/20260821000001_employer_portal.sql` | Apply migration | None | None | Medium | Owner action | Moderate (review + possible re-apply) | `supabase db push`; verify all tables/columns match code |

---

## PHASE C — DATA INTEGRITY

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| C1 | Verify 0 orphaned records across all new tables | ✅ P0 | Potential orphans in `company_claims`, `recruiter_saved_candidates`, `employer_settings`, `workspace_members` | Orphans indicate broken FK relationships or failed inserts | N/A | Run: `SELECT count(*) FROM table WHERE fk NOT IN (SELECT id FROM ref_table)` for each | N/A | N/A | Low | None | Trivial (30 sec per table) | Orphan count = 0 for all 4 tables |
| C2 | Verify 0 duplicate records (usernames, applications, saved candidates) | ✅ P0 | Duplicate usernames break uniqueness; duplicate applications skew ATS metrics; duplicate saved candidates break analytics | Data integrity compromised; metrics unreliable | N/A | Run dedup queries per section 7.2 | N/A | N/A | Low | None | Trivial (10 min) | All dedup queries return 0 |
| C3 | Verify all CHECK constraints satisfied (no invalid statuses) | ✅ P0 | Invalid status values in DB would cause app errors | Data corruption; app crashes | N/A | Run: `SELECT * FROM opportunities WHERE job_status NOT IN ('draft','active','paused','closed')` etc. | N/A | N/A | Low | None | Trivial (5 min) | 0 rows returned for each CHECK violation query |

---

## PHASE D — CORE FUNCTIONAL BUGS

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| D1 | Confirm all 7 employer IDOR tests pass (Employer A → Employer B) | ✅ P0 | IDOR vulnerability would allow cross-employer data access | Security breach; data leakage between tenants | N/A | N/A | Re-run IDOR attack matrix (AUTHORIZATION-ATTACK-MATRIX.md) | N/A | Low | A1, phase 2 verification | Medium | All 7 tests: 403 Forbidden | Manual API test suite or E2E |
| D2 | Confirm candidate regression — employer changes don't break candidate routes | ✅ P0 | Employer RBAC leak into candidate surface | Candidate functionality broken; UX failure | N/A | N/A | Test all candidate routes (auth, login, profile, network, messages, applications, saved) | N/A | Low | None | Medium | All candidate routes unaffected by employer middleware changes |
| D3 | Verify analytics are employer-scoped (not platform-wide) | ✅ P1 | Analytics previously fetched platform-wide data | Misleading metrics; employer thinks their funnel is different than it is | `frontend/src/app/api/employer/analytics/route.ts` | None | Change `or()` to `eq("created_by", user.id)` | None | Low | B1, B2 | Trivial (1 query change) | Analytics only show current employer's data; verify with two test employers |

---

## PHASE E — PERFORMANCE

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| E1 | Confirm all employer APIs respond < 2s | ✅ P1 | Slow APIs degrade recruiter experience | Recruiter frustration; potential abandonment | N/A | N/A | Profile API endpoints with `console.time`; verify < 2s | N/A | Low | None | Trivial (5 min profiling) | All employer APIs < 2s p95 |
| E2 | Verify database index coverage for employer queries | ✅ P1 | Missing indexes = full table scans | Poor performance at scale; timeouts | N/A | Verify indexes: `idx_opportunities_created_by`, `idx_opportunities_active`, `idx_opportunities_category` exist + used | N/A | N/A | Low | None | Trivial (5 min) | All 3 indexes present and used by query planner |

---

## PHASE F — UX/UI

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| F1 | Verify responsive breakpoints (320/375/390/414/768/1024/1440) | ✅ P1 | Layout breaks on some viewports | Poor UX on mobile/desktop; accessibility issues | N/A | N/A | Manual testing at each breakpoint; inspect CSS media queries | N/A | Low | None | Trivial (30 min) | Layout OK at all 7 breakpoints |
| F2 | Verify card/border/badge count is restrained | ✅ P2 | Too many visual elements → cognitive overload | Professional appearance; not AI-generated looking | N/A | N/A | Inspect `employer/` pages; count border-2/shadow-brutal vs legacy | N/A | Low | None | Trivial (10 min) | restrained brutalist identity (border-2, shadow-brutal only) |

---

## PHASE G — PRODUCT FEATURES

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| G1 | Evaluate feature gaps vs product roadmap | 📅 P2 | Prioritize features that materially improve employer/ candidate/ admin experience | Resource allocation; roadmap alignment | N/A | N/A | Product review session; stakeholder input | N/A | Medium | Product team | High (workshop) | Prioritized P0/P1/P2/P3 features per section 30-33 |
| G2 | Validate employer feature: talent search with domain filters | 📅 P2 | Employer talent sourcing capability | Core recruiting functionality | N/A | N/A | Test `/employer/talent` and `[username]` pages with filter queries | N/A | Medium | None | Medium | Talent search returns correct candidates with domain/exp filters |

---

## PHASE H — SCALABILITY

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| H1 | Test database connection pooling at 100 concurrent employer API calls | 📅 P2 | Connection exhaustion at scale | Performance degradation; potential downtime | N/A | Configure PgBouncer or Supabase connection limits | N/A | N/A | Medium | DevOps | High (infrastructure) | P95 latency < 2s at 100 concurrent calls |
| H2 | Evaluate Vercel cron scalability (3 crons + worker) | 📅 P2 | Cron jobs missed or delayed at scale | Missed scrapers; stale data | N/A | Monitor cron health logs; evaluate Render worker alternative | N/A | Medium | DevOps | Medium | Cron health verified; no missed runs at expected load |

---

## PHASE I — OBSERVABILITY

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| I1 | Add structured logging for employer API mutations | 📅 P2 | Inability to debug production issues | Extended MTTR; blind to security incidents | N/A | Add structured log entries to API routes | N/A | N/A | Low | DevOps | Low | Log entries appear in Vercel/Render logs for all PATCH/POST/DELETE |
| I2 | Add error tracking for 403/401 responses | 📅 P2 | Cannot identify authz failures in production | Security monitoring gap; blind to IDOR attempts | N/A | Integrate with Sentry / error tracking | N/A | Medium | DevOps | Medium | Error events captured for all 403/401 responses |

---

## PHASE J — LONG-TERM ARCHITECTURE

| ID | Task | Priority | Problem | Why It Matters | Files | DB Changes | API Changes | Frontend Changes | Risk | Dependencies | Complexity | Acceptance Criteria | Tests Required |
|----|------|----------|---------|----------------|-------|------------|-------------|------------------|------|--------------|------------|-------------------|----------------|
| J1 | Evaluate modular monolith vs service extraction | 📅 P3 | Current architecture may not scale to 1M users | Premature microservices = distributed complexity; too early | N/A | N/A | Architecture review session; benchmark vs current | N/A | High | Principal Architect + DevOps | High (months) | Documented decision: keep modular monolith or extract specific services |
| J2 | Recommend background worker separation for scrapers | 📅 P3 | Current Vercel cron + worker model | at some scale, cron reliability becomes bottleneck | N/A | N/A | Compare Vercel cron + worker vs dedicated Render worker service | N/A | Medium | DevOps + Principal Architect | Medium | Documented recommendation with Go/No-Go criteria |

---

## FINAL REMEDIATION PRIORITY ORDER

| Priority | ID | Task | Effort | Risk if Delayed |
|----------|----|------|--------|-----------------|
| **P0** | A1 | Middleware path fix verification | Trivial | Critical security gap |
| **P0** | A2 | Retest employer IDOR | Trivial | Cannot confirm security |
| **P1** | B3 | Fix pipeline `unverified` → `pending` | Moderate | Data ingestion broken since 2026-08-02 |
| **P1** | B1, B2 | Doc reconciliations | Trivial | Doc/code drift |
| **P1** | B4 | Apply migration to DB | Moderate | Schema not yet in production |
| **P2** | C1-C3 | Data integrity verification | Trivial | Potential undetected corruption |
| **P2** | D1-D3 | Functional verification | Low | Unknown current state |
| **P3** | E1-E2 | Performance profiling | Low | Scalability concerns |
| **P3** | F1-F2 | UX verification | Low | Aesthetic concerns |
| **P3** | G1 | Feature gap analysis | Medium | Product alignment |
| **P3** | H1-H2 | Scalability evaluation | Medium | Premature optimization |
| **P3** | I1-I2 | Observability additions | Low | Debuggability concerns |
| **P3** | J1-J2 | Architecture evaluation | Medium | Premature service extraction |

---
*Master Remediation Plan — evidence from all prior audit documents, code inspections, and audit session fixes.*