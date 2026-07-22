# Implementation Roadmap

## Overview

This roadmap breaks the entire BerojgarDegreeWala project into independent implementation phases. Each phase is self-contained, with clear deliverables, acceptance criteria, and estimated effort.

---

## Phase 0: Foundation (Complete)

**Objective**: Core platform operational — scraping, public pages, academy, auth, CI/CD.

**Status**: ✅ COMPLETE

**Deliverables** (already implemented):
- Core scraping pipeline (332+ sources, 7 adapters)
- Public pages (opportunities, academy, news, organizations, resources)
- Academy curriculum (7 tracks with assessments)
- Authentication (email, Google, GitHub)
- Dark-first design system
- CI/CD pipeline (GitHub Actions + Vercel)
- Project Bible documentation (44 files)

**Known gaps** (carried to later phases):
- Missing 14 API routes
- Missing 46 UI components
- Minimal test coverage (4 tests)
- Column drift between code and DB
- Frontend/backend scraper duplication

---

## Phase 1: Social & Engagement

**Objective**: Build the BerojgarDegreeWala Network — social features, user engagement, and community tools.

### Phase 1.1: Feed & Community
| Item | Effort | Dependencies |
|------|--------|-------------|
| Feed post creation UI | 2 days | Phase 0 complete |
| Feed post engagement (likes, comments, reposts) | 3 days | Feed API exists |
| Community forum pages | 2 days | Community tables exist |
| Feed page polish (infinite scroll) | 1 day | Phase 1.1.1 |

### Phase 1.2: Connections & Networking
| Item | Effort | Dependencies |
|------|--------|-------------|
| Connection request UI | 2 days | Network API exists |
| Connection suggestions | 2 days | User profiles exist |
| People search and discovery | 2 days | Search API exists |
| Follow/unfollow system | 1 day | Follow API exists |

### Phase 1.3: Messaging
| Item | Effort | Dependencies |
|------|--------|-------------|
| Real-time messaging (WebSocket or polling) | 5 days | Message API exists |
| Conversation list UI | 2 days | Phase 1.3.1 |
| Message thread UI | 3 days | Phase 1.3.1 |
| Read receipts | 1 day | Phase 1.3.2 |
| File/image sharing | 2 days | Phase 1.3.2 |

### Phase 1.4: Notifications
| Item | Effort | Dependencies |
|------|--------|-------------|
| Notification center UI | 2 days | Notification API exists |
| Read/unread handling | 1 day | Phase 1.4.1 |
| Push notifications (email) | 2 days | Resend configured |
| Notification preferences | 1 day | Phase 1.4.1 |

### Phase 1.5: Bookmarks & Saved Searches
| Item | Effort | Dependencies |
|------|--------|-------------|
| Bookmark API (CRUD) | 1 day | Missing 3 routes |
| Bookmark UI | 2 days | Phase 1.5.1 |
| Saved search alerts | 3 days | Phase 1.5.2 |

### Phase 1 Acceptance Criteria
- User can create feed posts, like, comment, repost
- User can send/receive connection requests
- User can send/receive real-time messages
- User receives notifications for key events
- User can bookmark opportunities
- All new features have error/loading/empty states
- Test coverage > 50% for new API routes

**Phase 1 Effort: ~36 days**

---

## Phase 2: Employer Tools

**Objective**: Enable organizations to post opportunities and manage candidates.

### Phase 2.1: Company Profiles
| Item | Effort | Dependencies |
|------|--------|-------------|
| Company profile page UI | 3 days | Company tables exist |
| Company claim/verification flow | 3 days | Auth system |
| Company dashboard | 5 days | Phase 2.1.1 |

### Phase 2.2: Job Posting
| Item | Effort | Dependencies |
|------|--------|-------------|
| Job posting form | 3 days | Phase 2.1 |
| Job editing workflow | 2 days | Phase 2.2.1 |
| Job posting API (admin routes) | 2 days | Phase 2.2.1 |

### Phase 2.3: Application Management
| Item | Effort | Dependencies |
|------|--------|-------------|
| Application review dashboard | 4 days | Application API exists |
| Status workflow (submitted → reviewed → ...) | 2 days | Phase 2.3.1 |
| Bulk actions | 2 days | Phase 2.3.2 |
| Notes/history per application | 2 days | Phase 2.3.2 |

### Phase 2.4: Candidate Discovery
| Item | Effort | Dependencies |
|------|--------|-------------|
| Candidate search UI | 3 days | User profiles exist |
| Filter by skills/experience/tracks | 2 days | Phase 2.4.1 |
| Connection request from employer | 1 day | Phase 2.4.2 |

### Phase 2 Acceptance Criteria
- Employer can claim company profile
- Employer can post and manage opportunities
- Employer can review applications with status workflow
- Employer can search and discover candidates
- Candidate can apply to opportunities
- Application status changes trigger notifications

**Phase 2 Effort: ~32 days**

---

## Phase 3: AI & Personalization

**Objective**: Deliver intelligent features powered by the AI Gateway.

### Phase 3.0: AI Gateway Consolidation (Prerequisite)
| Item | Effort | Dependencies |
|------|--------|-------------|
| Create shared AI Gateway package | 3 days | Phase 0 complete |
| Unified provider interface | 2 days | Phase 3.0.1 |
| Response caching layer | 2 days | Phase 3.0.2 |
| Streaming support | 3 days | Phase 3.0.2 |
| Prompt versioning system | 2 days | Phase 3.0.2 |
| Usage analytics dashboard | 3 days | AI usage log exists |

### Phase 3.1: Opportunity Intelligence
| Item | Effort | Dependencies |
|------|--------|-------------|
| Personalized opportunity recommendations | 4 days | Phase 3.0 |
| AI-powered search improvements | 3 days | Phase 3.0 |
| Smart notifications (relevant matches) | 3 days | Phase 1.4 |

### Phase 3.2: Resume Intelligence
| Item | Effort | Dependencies |
|------|--------|-------------|
| Resume parsing improvement | 2 days | Phase 3.0 |
| Skill gap analysis | 3 days | Phase 3.2.1 |
| Resume optimization suggestions | 3 days | Phase 3.2.2 |

### Phase 3.3: Academy Intelligence
| Item | Effort | Dependencies |
|------|--------|-------------|
| AI-powered learning recommendations | 3 days | Phase 3.0 |
| Interview preparation assistant | 4 days | Phase 3.0 |
| Assessment question generation | 3 days | Phase 3.3.2 |

### Phase 3 Acceptance Criteria
- AI Gateway is a single shared package used by both frontend and backend
- All AI features use the gateway with fallback chain
- Response caching reduces redundant AI calls
- Usage is tracked and visible in admin dashboard
- Users receive personalized opportunity recommendations
- Resume builder suggests improvements

**Phase 3 Effort: ~38 days**

---

## Phase 4: Code Quality & Infrastructure

**Objective**: Resolve technical debt, improve test coverage, and harden infrastructure.

### Phase 4.1: Monorepo Restructure
| Item | Effort | Dependencies |
|------|--------|-------------|
| Create monorepo workspace structure | 2 days | Phase 0 complete |
| Extract shared packages | 4 days | Phase 4.1.1 |
| Rename directories (berojgardegreewala→apps/web, backend→apps/api) | 2 days | Phase 4.1.2 |
| Update CI/CD for monorepo | 2 days | Phase 4.1.3 |

### Phase 4.2: Scraper Consolidation
| Item | Effort | Dependencies |
|------|--------|-------------|
| Migrate India scrapers from frontend to backend | 3 days | Phase 4.1 |
| Consolidate source configurations | 2 days | Phase 4.2.1 |
| Remove duplicate scraper code | 1 day | Phase 4.2.2 |
| Verify all sources still functional | 2 days | Phase 4.2.3 |

### Phase 4.3: Test Coverage
| Item | Effort | Dependencies |
|------|--------|-------------|
| Zod validation tests (all schemas) | 3 days | Phase 4.1 |
| AI tolerant parser tests | 1 day | Phase 3.0 |
| Auth middleware tests | 2 days | Phase 4.1 |
| API route integration tests (critical routes) | 5 days | Phase 4.1 |
| Database query tests | 2 days | Phase 4.1 |
| Deduplication logic tests | 1 day | Phase 4.2 |

### Phase 4.4: Column Drift Resolution
| Item | Effort | Dependencies |
|------|--------|-------------|
| Audit live DB columns vs code | 1 day | Access to Supabase |
| Create migration to align columns | 1 day | Phase 4.4.1 |
| Update bridge functions | 1 day | Phase 4.4.2 |
| Fix `generate_opp_slug()` DB function | 0.5 day | Phase 4.4.1 |

### Phase 4.5: Security Hardening
| Item | Effort | Dependencies |
|------|--------|-------------|
| Rotate all exposed secrets | 2 days | Access to all service dashboards |
| Add CSRF protection | 2 days | Phase 4.1 |
| Verify RLS policies on all tables | 2 days | Phase 4.4 |
| Add rate limiting to admin routes | 1 day | Phase 4.1 |
| Input validation audit | 2 days | Phase 4.1 |

### Phase 4.6: Missing API Routes
| Item | Effort | Dependencies |
|------|--------|-------------|
| Bookmarks CRUD (3 routes) | 1 day | Phase 4.1 |
| Resume upload/update/delete (3 routes) | 1 day | Phase 4.1 |
| Notification read (1 route) | 0.5 day | Phase 4.1 |
| Message send (1 route) | 0.5 day | Phase 4.1 |
| Admin verify/reject (2 routes) | 1 day | Phase 4.1 |
| Cron newsletter + cleanup (2 routes) | 1 day | Phase 4.1 |
| Academy day/checkpoint (2 routes) | 1 day | Phase 4.1 |

### Phase 4.7: Missing UI Components
| Item | Effort | Dependencies |
|------|--------|-------------|
| Build Pagination component | 1 day | Phase 4.1 |
| Build Tabs component | 0.5 day | Phase 4.1 |
| Build Breadcrumb component | 0.5 day | Phase 4.1 |
| Build Tooltip component | 0.5 day | Phase 4.1 |
| Build Dropdown component | 0.5 day | Phase 4.1 |
| Build EmptyState component | 0.5 day | Phase 4.1 |
| Build ErrorState component | 0.5 day | Phase 4.1 |
| Build Sidebar component | 1 day | Phase 4.1 |
| Remaining domain components | 5 days | Phase 4.1 |

### Phase 4.8: Error Boundaries
| Item | Effort | Dependencies |
|------|--------|-------------|
| Add error.tsx to all route groups | 1 day | Phase 4.1 |
| Standardize error boundary pattern | 1 day | Phase 4.8.1 |

### Phase 4 Acceptance Criteria
- Test coverage > 60% for critical modules
- All 74 API routes implemented
- All ~90 UI components built
- 100% of route groups have error boundaries
- Scraper code is consolidated in backend only
- Column drift between code and DB is resolved
- All exposed secrets are rotated
- RLS policies are documented and verified

**Phase 4 Effort: ~63 days**

---

## Phase 5: Scale & Polish

**Objective**: Prepare for growth — performance optimization, scalability, and advanced features.

### Phase 5.1: Performance
| Item | Effort | Dependencies |
|------|--------|-------------|
| API response compression (gzip) | 1 day | Phase 4 |
| Database query optimization | 3 days | Phase 4.4 |
| CDN configuration for static assets | 1 day | Phase 4 |
| Image optimization audit | 2 days | Phase 4 |
| Lighthouse score target > 90 | 3 days | Phase 5.1.1-4 |

### Phase 5.2: Scalability
| Item | Effort | Dependencies |
|------|--------|-------------|
| Connection pooling optimization | 2 days | Phase 4 |
| Background job queue (Neon-based) | 3 days | Phase 4 |
| Rate limiting distribution analysis | 1 day | Phase 4.5 |
| Capacity planning for next tier | 1 day | Phase 5.2.3 |

### Phase 5.3: Advanced Features
| Item | Effort | Dependencies |
|------|--------|-------------|
| PWA support | 3 days | Phase 4 |
| Mobile-responsive polish | 5 days | Phase 4.7 |
| Multi-language i18n | 10 days | Phase 4 |
| Dark/light theme toggle | 2 days | Phase 4 |
| Accessibility audit (WCAG AA) | 3 days | Phase 4.5 |

### Phase 5.4: Documentation & Monitoring
| Item | Effort | Dependencies |
|------|--------|-------------|
| Complete OpenAPI 3.1 spec | 3 days | Phase 4.6 |
| Complete component manifest | 2 days | Phase 4.7 |
| Monitoring dashboard | 3 days | Phase 4 |
| Runbooks for common incidents | 2 days | Phase 5.4.3 |
| SLA definition and tracking | 1 day | Phase 5.4.3 |

### Phase 5 Acceptance Criteria
- Lighthouse score > 90 on all pages
- API response compression enabled
- Database queries optimized (sub-100ms p95)
- PWA support with offline capability
- WCAG AA compliance verified
- OpenAPI spec is complete and accurate
- Incident runbooks cover top 10 scenarios

**Phase 5 Effort: ~46 days**

---

## Roadmap Summary

| Phase | Total Effort | Dependencies | Business Value |
|-------|-------------|-------------|---------------|
| Phase 0: Foundation | ✅ Complete | None | Core platform operational |
| Phase 1: Social | ~36 days | Phase 0 | User engagement + retention |
| Phase 2: Employer | ~32 days | Phase 0 + Phase 1 | Revenue potential |
| Phase 3: AI | ~38 days | Phase 0 + Phase 1 | Differentiation |
| Phase 4: Code Quality | ~63 days | Phase 0-3 | Maintainability + reliability |
| Phase 5: Scale | ~46 days | Phase 4 | Performance + growth |
| **Total** | **~215 days** | | |

## Parallel Execution

Phases can run in parallel where dependencies allow:

```
Week:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
Phase 1 [═══════════════════════════]
Phase 2 [══════════════════════════════════════]
Phase 3    [══════════════════════════════════════════]
Phase 4                                            [════════════════════════════════════════════════]
Phase 5                                                          [══════════════════════════]
```

Phases 1, 2, and 3 can run in parallel as they share no code dependencies (different features). Phase 4 depends on 1-3 completing first (to avoid rework). Phase 5 depends on 4.

## Critical Path

The critical path through the project is:
```
Phase 0 → Phase 4.1 (Monorepo) → Phase 4.2-4.8 → Phase 5
```
Total critical path: ~75 days (Phase 4 + Phase 5, assuming Phase 1-3 complete in parallel).

## Quick Wins (Do First)

| Item | Effort | Impact |
|------|--------|--------|
| Rotate exposed secrets | 2 days | CRITICAL security fix |
| Add missing 14 API routes | 6 days | Complete the spec |
| Add Pagination + EmptyState + ErrorState components | 2 days | High-visibility UX fix |
| Add error.tsx to all route groups | 1 day | Better UX on failures |
| Fix `generate_opp_slug()` DB function | 0.5 day | Fix DB integrity |
