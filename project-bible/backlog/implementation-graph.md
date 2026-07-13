# Implementation Graph

## Dependency Flow

```
                    ┌─────────────────────────────────────┐
                    │         FOUNDATION LAYER            │
                    │  (No external dependencies)         │
                    │                                     │
                    │  Epic 07: Database Schema           │
                    │  Epic 10: Security Hardening        │
                    │  Epic 09: Testing Infrastructure    │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │         API LAYER                    │
                    │  (Depends on stable schema +         │
                    │   security fundamentals)             │
                    │                                     │
                    │  Epic 02: API Route Completion       │
                    │  Epic 03: UI Component Library       │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │         FEATURE LAYER                │
                    │  (Depends on API + UI foundation)    │
                    │  (Can run in parallel)               │
                    │                                     │
                    │  ┌────────┐ ┌────────┐ ┌─────────┐  │
                    │  │Epic 04 │ │Epic 05 │ │Epic 06  │  │
                    │  │Social  │ │Employer│ │AI       │  │
                    │  └────────┘ └────────┘ └─────────┘  │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │         CONSOLIDATION LAYER          │
                    │  (Depends on features + stability)   │
                    │                                     │
                    │  Epic 08: Scraper Consolidation      │
                    │  Epic 01: Monorepo Restructure       │
                    └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────────────────────┐
                    │         POLISH LAYER                 │
                    │  (Depends on everything stable)      │
                    │                                     │
                    │  Epic 11: Performance & Scale        │
                    │  Epic 12: Documentation & Specs      │
                    └─────────────────────────────────────┘
```

## Critical Path

```
Epic 07 (DB) ──→ Epic 10 (Security) ──→ Epic 02 (API) ──→ Epic 04 (Social)
                                        │              └──→ Epic 05 (Employer)
                                        └──→ Epic 03 (UI) ──→ Epic 04, 05, 06 (features)
Epic 09 (Tests) ──→ (parallel with all epics)
Epic 08 (Scrapers) ──→ Epic 06 (AI Gateway)
Epic 01 (Monorepo) ──→ (optional, can be deferred)
Epic 11 (Performance) ──→ Epic 12 (Docs)
```

## Parallel Execution Strategy

```
Week:   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16

LAYER 1 (Foundation)
Epic 07 [═══]
Epic 09 [══════════════════════════════════════════════] (continuous)
Epic 10     [═══]

LAYER 2 (API + UI)  
Epic 02         [══════]
Epic 03         [══════════]

LAYER 3 (Features)
Epic 04                 [══════════════════]
Epic 05                 [════════════════]
Epic 06                     [══════════════════]

LAYER 4 (Consolidation)
Epic 08                                     [══════]
Epic 01                                         [══════]

LAYER 5 (Polish)
Epic 11                                               [══════]
Epic 12                                               [══════]
```

## Task-Level Dependency Graph (Partial)

```
7.1.1.1 (Audit DB) ──→ 7.1.1.2 (Migration) ──→ 7.1.1.3 (Bridge fix)
                └──→ 7.2.2.1 (Audit DB2)
7.1.1.4 (Fix slug fn) ──→ (no deps, can start immediately)

10.1.1.1 (Rotate Supabase) ──→ 10.1.1.4 (Clean secrets)
10.1.1.2 (Rotate AI keys) ──→ 10.1.1.4
10.1.1.3 (Rotate deploy tokens) ──→ 10.1.1.4
10.3.3.1 (Audit RLS) ──→ 10.3.3.2 (Create RLS)
10.4.4.1 (Audit validation) ──→ 10.4.4.2 (Add validation)

2.1.1.1 (GET bookmarks) ──→ 2.1.1.2 (POST bookmarks) ──→ 2.1.1.3 (DELETE bookmarks)
2.2.2.1 (POST upload) ──→ 2.2.2.2 (PATCH resume) ──→ 2.2.2.3 (DELETE resume)
2.7.7.1 (Cron newsletter) ←── 6.1.1.5 (AI Gateway)
2.7.7.2 (Cron cleanup) ←── 7.1.1.2 (Schema stable)

3.1.1.1 (Sidebar) ──→ 3.3.3.1 (OpportunityFilters)
3.2.2.4 (Pagination) ──→ 3.3.3.2 (AdminTable)
3.2.2.6 (ErrorState) ──→ 3.4.4.1 (Error boundaries)

4.1.1.1 (Feed create) ──→ 4.1.1.2 (Engagement) ──→ 4.1.1.3 (Infinite scroll)
4.3.3.1 (Conv list) ──→ 4.3.3.2 (Thread) ──→ 4.3.3.3 (New conv)
4.5.5.1 (Bookmark btn) ←── 2.1.1.2 (Bookmark API)

5.1.1.1 (Company page) ──→ 5.1.1.2 (Dashboard) ──→ 5.1.1.3 (Claim flow)
5.2.2.1 (Posting form) ──→ 5.2.2.2 (Edit workflow)
5.3.3.1 (App review) ──→ 5.3.3.2 (Status workflow) ──→ 5.3.3.3 (Notifications)
5.4.4.1 (Candidate search) ──→ 5.4.4.2 (AI recommendations) ←── 6.2.2.1

6.1.1.1 (AI pkg) ──→ 6.1.1.2 (Cache) ──→ 6.1.1.3 (Streaming) ──→ 6.1.1.4 (Versioning)
                         └──→ 6.1.1.5 (Frontend) ──→ 6.1.1.7 (Delete legacy)
                         └──→ 6.1.1.6 (Backend)  ──→ 6.1.1.7
6.2.2.1 (Recommend) ←── 6.1.1.5
6.3.3.1 (Resume AI)  ←── 6.1.1.5, 2.2.2.1
6.4.4.1 (Search AI)  ←── 6.1.1.5

8.1.1.1 (Config pkg) ──→ 8.2.2.1 (Migrate scrapers) ──→ 8.2.2.2 (Update cron)
                                                     └──→ 8.2.2.3 (Delete frontend)
8.1.1.1 ──→ 8.3.3.1 (Delete configs)

11.1.1.1 (Compression) ←── (no deps)
11.1.1.2 (Query opt)   ←── 7.1.1.2 (Schema stable)
11.2.2.1-4 (Frontend)  ←── 3.x (Components built)
```

## Task Count by Layer

| Layer | Epics | Total Tasks |
|-------|-------|-------------|
| Foundation | 07, 09, 10 | 30 |
| API + UI | 02, 03 | 31 |
| Features | 04, 05, 06 | 53 |
| Consolidation | 08, 01 | 16 |
| Polish | 11, 12 | 13 |
| **Total** | **12** | **~143** |

## Estimated Timeline

| Milestone | Week | Cumulative Days |
|-----------|------|-----------------|
| Foundation complete | 3 | 15 |
| API + UI complete | 6 | 30 |
| Features complete | 14 | 70 |
| Consolidation complete | 17 | 85 |
| Polish complete | 19 | 95 |
| **Full completion** | **~19 weeks** | **~95 days** |
