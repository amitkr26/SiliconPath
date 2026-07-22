# Epic 11: Performance & Scale

**Priority**: P2 | **Estimated effort**: 10 days | **Dependencies**: Epic 02 (API), Epic 03 (UI), Epic 07 (DB)

## Description

Optimize platform performance and prepare for scale. Add response compression, optimize database queries, audit image loading, and improve Lighthouse scores.

## Feature 11.1: API Performance

### User Story 11.1.1
As a user, I want fast API responses.

#### Task 11.1.1.1: Add response compression
- **Description**: Add gzip/brotli compression middleware to both frontend (Next.js config) and backend (Express compression package). Compress all JSON responses > 1KB
- **Dependencies**: None
- **Acceptance Criteria**: API responses serve with Content-Encoding header. Compression reduces response size by > 60%. Configurable threshold
- **Database changes**: None
- **API changes**: Add compression middleware
- **UI changes**: None
- **Testing requirements**: Verify Content-Encoding header. Measure size reduction
- **Documentation updates**: None

#### Task 11.1.1.2: Optimize database queries
- **Description**: Review slow queries using Supabase query analyzer. Add missing indexes. Optimize JOIN patterns. Reduce N+1 query patterns. Target: p99 query time < 100ms
- **Dependencies**: Epic 07 (stable schema)
- **Acceptance Criteria**: All frequent queries under 100ms. Missing indexes added. N+1 queries eliminated
- **Database changes**: New migration(s) for indexes
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Profile before/after query times
- **Documentation updates**: Document indexing strategy in project-bible/06-database/

## Feature 11.2: Frontend Performance

### User Story 11.2.1
As a user, I want pages to load quickly.

#### Task 11.2.2.1: Audit and optimize image loading
- **Description**: Audit all images using `next/image`. Ensure proper sizing, lazy loading, and WebP format. Add blur placeholder for above-fold images. Set explicit width/height to prevent CLS
- **Dependencies**: None
- **Acceptance Criteria**: All images use next/image. Lazy loading below fold. No layout shift from images. Lighthouse image optimization score > 90
- **Database changes**: None
- **API changes**: None
- **UI changes**: Image component updates
- **Testing requirements**: Lighthouse audit before/after
- **Documentation updates**: None

#### Task 11.2.2.2: Implement code splitting
- **Description**: Audit large component bundles using Next.js bundle analyzer. Add dynamic imports for: AI panels, resume builder, admin dashboard, chat. Route-based code splitting via lazy loading
- **Dependencies**: None
- **Acceptance Criteria**: Large components loaded on interaction, not on page load. Initial bundle size reduced > 30%
- **Database changes**: None
- **API changes**: None
- **UI changes**: Dynamic imports added
- **Testing requirements**: Measure bundle sizes before/after
- **Documentation updates**: None

#### Task 11.2.2.3: Add CDN caching headers
- **Description**: Add Cache-Control headers to static assets (images, fonts, CSS, JS). Set long TTL (1 year) for versioned assets. Configure CDN caching in Vercel for public pages
- **Dependencies**: None
- **Acceptance Criteria**: Static assets have Cache-Control: public, max-age=31536000, immutable. Public pages cached at CDN
- **Database changes**: None
- **API changes**: Cache headers on API responses
- **UI changes**: None
- **Testing requirements**: Verify cache headers in browser devtools
- **Documentation updates**: None

#### Task 11.2.2.4: Lighthouse score optimization
- **Description**: Run Lighthouse audit on top 5 pages (homepage, opportunities list, opportunity detail, academy, news). Fix issues: render-blocking resources, unused CSS/JS, proper font-display, meta viewport, tap targets
- **Dependencies**: 11.2.2.1-3
- **Acceptance Criteria**: All 5 pages score > 90 on Performance, Accessibility, Best Practices, SEO
- **Database changes**: None
- **API changes**: None
- **UI changes**: Optimization fixes
- **Testing requirements**: Lighthouse audit before/after
- **Documentation updates**: Document Lighthouse scores in project-bible/16-operations/

## Feature 11.3: PWA Support

### User Story 11.3.1
As a user, I want to install BerojgarDegreeWala as a PWA.

#### Task 11.3.3.1: Add PWA manifest and service worker
- **Description**: Create `manifest.json` with app name, icons, theme color (`#0A0E1A`), display mode (`standalone`). Register service worker for offline caching of static assets and public pages
- **Dependencies**: None
- **Acceptance Criteria**: Lighthouse PWA audit passes. App can be installed on mobile. Public pages load offline from cache
- **Database changes**: None
- **API changes**: None
- **UI changes**: PWA install prompt
- **Testing requirements**: Test PWA install, offline access, Lighthouse PWA audit
- **Documentation updates**: Add PWA section to project-bible/04-frontend/

## Feature 11.4: Database Scalability

### User Story 11.4.1
As a platform operator, I want the database to handle growth.

#### Task 11.4.4.1: Add connection pooling configuration
- **Description**: Configure Supabase connection pooling (pgbouncer). Set pool size: 5 for web, 3 for backend. Add pool configuration to env vars. Verify performance under load
- **Dependencies**: Epic 07
- **Acceptance Criteria**: Connection pooling active. No connection exhaustion under normal load
- **Database changes**: None (Supabase config)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Load test with concurrent requests
- **Documentation updates**: Document pool config in project-bible/14-devops/

## Master Execution Checklist — Epic 11

- [ ] 11.1.1.1 Add response compression
- [ ] 11.1.1.2 Optimize database queries
- [ ] 11.2.2.1 Audit and optimize image loading
- [ ] 11.2.2.2 Implement code splitting
- [ ] 11.2.2.3 Add CDN caching headers
- [ ] 11.2.2.4 Lighthouse score optimization
- [ ] 11.3.3.1 Add PWA manifest and service worker
- [ ] 11.4.4.1 Add connection pooling configuration
