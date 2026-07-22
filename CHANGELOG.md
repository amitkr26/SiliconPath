# Changelog

## [Unreleased] - clean/main branch

### Removed
- `docs/10-api-specification.md` (duplicate of `10-api-spec.md`)
- `docs/13-environment.md` (duplicate of `13-environment-variables.md`)
- `docs/ARCHITECTURE.md` (duplicate of `07-architecture.md`)
- `docs/DATABASE.md` (duplicate of `09-database.md` + `DATA_MODEL.md`)
- `docs/PRD.md` (duplicate of `03-prd.md`)
- `docs/ROADMAP.md` (duplicate of `22-roadmap.md`)
- `docs/SECURITY.md` (duplicate of `12-security.md` + `SECURITY_AND_COMPLIANCE.md`)
- `docs/API_REFERENCE.md` (duplicate of `API_SPEC.md`)
- `docs/00-README.md` (redundant with `docs/README.md`)
- `berojgardegreewala/api_test_results.txt` (test artifact)
- `berojgardegreewala/audit_report.json` (test artifact)
- `berojgardegreewala/batch1_results.json` (test artifact)
- `berojgardegreewala/live_test_results.txt` (test artifact)
- `berojgardegreewala/LEGACY_READONLY.md` (obsolete legacy notice)

### Changed
- `docs/README.md` - Consolidated as single documentation index with complete navigation
- `README.md` - Rewritten with clear platform vision, two-tier architecture, and setup guide
- `.gitignore` - Added patterns to prevent test artifacts from being committed

---

## [0.9.0] - 2026-07-10

### Added
- Academy learning paths with career progression
- Resume builder with AI analysis
- DB reset migrations for clean Supabase schema
- Batch 1 scrape sources configuration

## [0.8.0] - 2026-07-05

### Added
- LinkedIn-like social features (profiles, connections, messages)
- AI opportunity matching and analytics
- Community feed and posts
- Company pages
- Neon analytics database integration

## [0.7.0] - 2026-07-03

### Added
- Multi-database architecture (2x Supabase + 2x Neon)
- Scrape sources and verification system
- User profiles and onboarding
- Notification system

## [0.6.0] - 2026-06-30

### Added
- Supabase Auth integration (Google, GitHub, Email)
- User profiles table
- Protected routes and middleware

## [0.5.0] - 2026-05-01

### Added
- Core scraping infrastructure
- News feed with AI curation
- Opportunity verification badges
- SEO/AEO/GEO optimization
- Admin dashboard
- Email digest system

## [0.1.0] - 2026-03-15

### Added
- Initial project setup
- Next.js 14 frontend (berojgardegreewala)
- Express.js backend scraping service
- Basic opportunity listing
- Category filtering
