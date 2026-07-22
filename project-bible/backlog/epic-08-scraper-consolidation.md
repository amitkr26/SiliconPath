# Epic 08: Scraper Consolidation

**Priority**: P1 | **Estimated effort**: 6 days | **Dependencies**: Epic 01 (monorepo for config package), Epic 07 (stable schema)

## Description

Consolidate the duplicate scraper systems (frontend + backend) into a single backend service. Migrate India-specific scrapers to the backend. Create a shared source configuration package. Eliminate all duplicate scraper code.

## Feature 8.1: Shared Source Configuration

### User Story 8.1.1
As a developer, I want a single source of truth for scraper configurations.

#### Task 8.1.1.1: Create shared config package
- **Description**: Extract `backend/src/scrapers/source-config.ts` into `packages/config/`. Move frontend's `companies.json` and `institutions.json` data into the same package as TypeScript. Export as `@berojgardegreewala/config`. Ensure all 500+ sources are represented
- **Dependencies**: 1.1.1.1 (monorepo)
- **Acceptance Criteria**: Single config package contains all sources from both systems. Both apps import from it. No duplicate source definitions
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify all sources from both systems are represented
- **Documentation updates**: Update project-bible/09-scrapers/source-registry.md

## Feature 8.2: India Scraper Migration

### User Story 8.2.1
As a developer, I want all scraping logic in the backend.

#### Task 8.2.2.1: Migrate India scrapers to backend
- **Description**: Move India-specific scraper files from `berojgardegreewala/src/lib/scrapers/` (drdo-scraper.ts, isro-scraper.ts, csir-scraper.ts, govt-scraper.ts, india-psu-scraper.ts, india-academic-scraper.ts, international-academic-scraper.ts, global-semiconductor-scraper.ts, fellowship-scraper.ts, deep-scraper.ts) to `apps/api/src/scrapers/adapters/`. Refactor to match backend adapter interface
- **Dependencies**: 8.1.1.1
- **Acceptance Criteria**: India scrapers run from backend. Same output quality. No regressions
- **Database changes**: None
- **API changes**: Move scrape endpoints from frontend to backend
- **UI changes**: None
- **Testing requirements**: Run each migrated scraper, compare output
- **Documentation updates**: Update project-bible/09-scrapers/

#### Task 8.2.2.2: Update cron to route India sources to backend
- **Description**: Update Vercel cron (`/api/cron/scrape-india`) to forward India source scraping to backend POST /scrape/run instead of running frontend-side scrapers. Add India source batches to backend scheduler
- **Dependencies**: 8.2.2.1
- **Acceptance Criteria**: India cron triggers backend scrape. Sources are scraped on schedule. Results in DB
- **Database changes**: None
- **API changes**: Frontend cron delegates to backend
- **UI changes**: None
- **Testing requirements**: Test cron trigger, verify results in DB
- **Documentation updates**: Update cron schedule in project-bible/09-scrapers/

#### Task 8.2.2.3: Delete frontend scraper files
- **Description**: After migration verified, delete all scraper files from `apps/web/src/lib/scrapers/`. Remove scraper-related API routes from frontend (scrape.ts, scrape-jobs.ts, scrape-opportunities.ts, scrape-sources.ts)
- **Dependencies**: 8.2.2.2
- **Acceptance Criteria**: No scraper code remains in frontend. Build succeeds
- **Database changes**: None
- **API changes**: Remove frontend scraper API routes
- **UI changes**: None
- **Testing requirements**: Full test suite passes
- **Documentation updates**: Update project-bible/04-frontend/ (remove scraper references)

## Feature 8.3: Frontend Config Cleanup

### User Story 8.3.1
As a developer, I want no duplicate config files.

#### Task 8.3.3.1: Delete frontend source configs
- **Description**: Delete `apps/web/src/config/scrapers/` directory after migration confirmed
- **Dependencies**: 8.1.1.1, 8.2.2.3
- **Acceptance Criteria**: Directory removed. No broken references
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Build succeeds
- **Documentation updates**: None

## Master Execution Checklist — Epic 08

- [ ] 8.1.1.1 Create shared config package
- [ ] 8.2.2.1 Migrate India scrapers to backend
- [ ] 8.2.2.2 Update cron to route India sources to backend
- [ ] 8.2.2.3 Delete frontend scraper files
- [ ] 8.3.3.1 Delete frontend source configs
