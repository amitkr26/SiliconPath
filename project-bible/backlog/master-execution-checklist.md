# Master Execution Checklist

**Total tasks: 143** | **Last updated**: 2026-07-13

## Layer 1: Foundation (30 tasks)

### Epic 07: Database & Schema Consolidation
- [ ] 7.1.1.1 Audit live DB columns against code
- [ ] 7.1.1.2 Create alignment migration for DB1
- [ ] 7.1.1.3 Update bridge functions
- [ ] 7.1.1.4 Fix generate_opp_slug() DB function
- [ ] 7.2.2.1 Audit DB2 usage
- [ ] 7.2.2.2 Consolidate DB2 into DB1 (if decided)
- [ ] 7.3.3.1 Create ai_usage_log table
- [ ] 7.4.4.1 Rename migrations to standard format
- [ ] **Epic 07 complete**

### Epic 09: Testing Infrastructure
- [ ] 9.1.1.1 Configure jest for monorepo
- [ ] 9.1.1.2 Create test environment setup
- [ ] 9.2.2.1 Zod validation schema tests
- [ ] 9.2.2.2 AI tolerant parser tests
- [ ] 9.2.2.3 Auth middleware tests
- [ ] 9.2.2.4 Database query tests
- [ ] 9.2.2.5 Deduplication logic tests
- [ ] 9.3.3.1 Test public API routes
- [ ] 9.3.3.2 Test protected API routes
- [ ] 9.3.3.3 Test rate limiting
- [ ] 9.4.4.1 Test backend health endpoint
- [ ] 9.4.4.2 Test backend scraper orchestrator
- [ ] **Epic 09 complete**

### Epic 10: Security Hardening
- [ ] 10.1.1.1 Rotate Supabase service role keys
- [ ] 10.1.1.2 Rotate AI provider keys
- [ ] 10.1.1.3 Rotate deployment tokens
- [ ] 10.1.1.4 Remove deprecated keys from SECRETS.md
- [ ] 10.2.2.1 Implement CSRF token validation
- [ ] 10.3.3.1 Audit and document RLS policies
- [ ] 10.3.3.2 Create missing RLS policies
- [ ] 10.4.4.1 Audit input validation coverage
- [ ] 10.4.4.2 Add missing validation to routes
- [ ] 10.5.5.1 Add rate limiting to admin routes
- [ ] **Epic 10 complete**

---

## Layer 2: API + UI (31 tasks)

### Epic 02: API Route Completion
- [ ] 2.1.1.1 GET /api/bookmarks
- [ ] 2.1.1.2 POST /api/bookmarks
- [ ] 2.1.1.3 DELETE /api/bookmarks/[id]
- [ ] 2.2.2.1 POST /api/resume/upload
- [ ] 2.2.2.2 PATCH /api/resume
- [ ] 2.2.2.3 DELETE /api/resume
- [ ] 2.3.3.1 POST /api/messages/send
- [ ] 2.4.4.1 PATCH /api/notifications/read
- [ ] 2.5.5.1 POST /api/admin/opportunities/[id]/verify
- [ ] 2.5.5.2 POST /api/admin/opportunities/[id]/reject
- [ ] 2.6.6.1 GET /api/academy/days/[trackId]/[dayNumber]
- [ ] 2.6.6.2 GET /api/academy/checkpoints/[trackId]
- [ ] 2.7.7.1 POST /api/cron/newsletter
- [ ] 2.7.7.2 POST /api/cron/cleanup
- [ ] 2.8.8.1 GET /api/opportunities/stats
- [ ] **Epic 02 complete**

### Epic 03: UI Component Library
- [ ] 3.1.1.1 Sidebar component
- [ ] 3.1.1.2 Breadcrumb component
- [ ] 3.2.2.1 Tabs component
- [ ] 3.2.2.2 Tooltip component
- [ ] 3.2.2.3 Dropdown component
- [ ] 3.2.2.4 Pagination component
- [ ] 3.2.2.5 EmptyState component
- [ ] 3.2.2.6 ErrorState component
- [ ] 3.3.3.1 OpportunityFilters component
- [ ] 3.3.3.2 AdminTable component
- [ ] 3.3.3.3 ScrapeHealthCard component
- [ ] 3.3.3.4 ConnectionCard component
- [ ] 3.3.3.5 MessageThread component
- [ ] 3.3.3.6 NotificationItem component
- [ ] 3.3.3.7 FeedPost component
- [ ] 3.4.4.1 Error boundaries for all route groups
- [ ] **Epic 03 complete**

---

## Layer 3: Features (53 tasks)

### Epic 04: Social & Engagement
- [ ] 4.1.1.1 Feed post creation UI
- [ ] 4.1.1.2 Feed post engagement UI
- [ ] 4.1.1.3 Feed infinite scroll
- [ ] 4.2.2.1 Connection request UI
- [ ] 4.2.2.2 Connection suggestions
- [ ] 4.2.2.3 People search UI
- [ ] 4.3.3.1 Conversation list UI
- [ ] 4.3.3.2 Message thread UI
- [ ] 4.3.3.3 New conversation flow
- [ ] 4.4.4.1 Notification center UI
- [ ] 4.5.5.1 Bookmark button on opportunities
- [ ] 4.5.5.2 Saved opportunities page
- [ ] 4.6.6.1 Onboarding wizard
- [ ] **Epic 04 complete**

### Epic 05: Employer Tools
- [ ] 5.1.1.1 Company profile page
- [ ] 5.1.1.2 Employer dashboard
- [ ] 5.1.1.3 Company claim flow
- [ ] 5.2.2.1 Job posting form
- [ ] 5.2.2.2 Job editing workflow
- [ ] 5.3.3.1 Application review dashboard
- [ ] 5.3.3.2 Application status workflow
- [ ] 5.3.3.3 Applicant notification system
- [ ] 5.4.4.1 Candidate search for employers
- [ ] 5.4.4.2 Skill-based AI recommendations
- [ ] **Epic 05 complete**

### Epic 06: AI Gateway & Intelligence
- [ ] 6.1.1.1 Create shared AI Gateway package
- [ ] 6.1.1.2 Add response caching
- [ ] 6.1.1.3 Add streaming support
- [ ] 6.1.1.4 Add prompt versioning
- [ ] 6.1.1.5 Migrate frontend to shared gateway
- [ ] 6.1.1.6 Migrate backend to shared gateway
- [ ] 6.1.1.7 Delete legacy AI provider files
- [ ] 6.2.2.1 Build recommendation engine
- [ ] 6.3.3.1 Build resume skill extraction
- [ ] 6.3.3.2 Build skill gap analysis
- [ ] 6.4.4.1 Enhance search with AI parsing
- [ ] **Epic 06 complete**

---

## Layer 4: Consolidation (16 tasks)

### Epic 08: Scraper Consolidation
- [ ] 8.1.1.1 Create shared config package
- [ ] 8.2.2.1 Migrate India scrapers to backend
- [ ] 8.2.2.2 Update cron to route India sources to backend
- [ ] 8.2.2.3 Delete frontend scraper files
- [ ] 8.3.3.1 Delete frontend source configs
- [ ] **Epic 08 complete**

### Epic 01: Infrastructure & Monorepo Restructure
- [ ] 1.1.1.1 Create root package.json with workspaces
- [ ] 1.1.1.2 Create apps/web from berojgardegreewala/
- [ ] 1.1.1.3 Create apps/api from backend/
- [ ] 1.1.1.4 Create packages/types shared package
- [ ] 1.1.1.5 Create packages/database shared package
- [ ] 1.2.1.1 Update GitHub Actions for monorepo
- [ ] 1.2.1.2 Add backend ESLint configuration
- [ ] 1.2.1.3 Remove destructive reset migrations
- [ ] 1.2.1.4 Add make targets for workspace commands
- [ ] 1.3.1.1 Remove default Next.js assets
- [ ] 1.3.1.2 Remove skills-lock.json
- [ ] **Epic 01 complete**

---

## Layer 5: Polish (13 tasks)

### Epic 11: Performance & Scale
- [ ] 11.1.1.1 Add response compression
- [ ] 11.1.1.2 Optimize database queries
- [ ] 11.2.2.1 Audit and optimize image loading
- [ ] 11.2.2.2 Implement code splitting
- [ ] 11.2.2.3 Add CDN caching headers
- [ ] 11.2.2.4 Lighthouse score optimization
- [ ] 11.3.3.1 Add PWA manifest and service worker
- [ ] 11.4.4.1 Add connection pooling configuration
- [ ] **Epic 11 complete**

### Epic 12: Documentation & Machine Specs
- [ ] 12.1.1.1 Generate OpenAPI 3.1 spec
- [ ] 12.2.2.1 Generate full database DDL
- [ ] 12.3.3.1 Create AI provider contracts JSON
- [ ] 12.4.4.1 Create component manifest JSON
- [ ] 12.5.5.1 Audit project bible for accuracy
- [ ] **Epic 12 complete**

---

## Summary

| Layer | Tasks | Complete | Remaining | 
|-------|-------|----------|-----------|
| Foundation | 30 | 0 | 30 |
| API + UI | 31 | 0 | 31 |
| Features | 53 | 0 | 53 |
| Consolidation | 16 | 0 | 16 |
| Polish | 13 | 0 | 13 |
| **Total** | **143** | **0** | **143** |

## Quick Wins (Do First)

Highest-impact tasks that can be completed immediately (no dependencies):

1. **10.1.1.4** Remove deprecated keys from SECRETS.md (30 min)
2. **7.1.1.1** Audit live DB columns against code (2 hours)
3. **7.1.1.4** Fix generate_opp_slug() DB function (1 hour)
4. **10.4.4.1** Audit input validation coverage (2 hours)
5. **10.3.3.1** Audit and document RLS policies (2 hours)
6. **9.1.1.2** Create test environment setup (2 hours)
7. **1.3.1.1** Remove default Next.js assets (15 min)
8. **1.3.1.2** Remove skills-lock.json (5 min)
9. **7.4.4.1** Rename migrations to standard format (1 hour)
