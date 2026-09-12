# Changelog

All notable changes to SiliconPath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — 2026-09-12

### Added
- Complete SiliconPath branding (replaced all BerojgarDegreeWala references)
- 15 learning paths with 148 modules (5 Foundation + 6 Backend + 4 Tools & Career)
- Engineering Lab with 4 real violation debugging cases
- 128 STA interview questions across 11 topics
- Free Resources page (OpenLane guide, Career Roadmap, Resume Tips)
- About page describing SiliconPath mission
- Do-follow backlinks to BerojgarDegreeWala and ElectroBridge in footer
- Navigation: Learn dropdown with all 15 paths, Academy link
- Footer: 6-column layout with Our Ecosystem section
- Academy system migrated from BerojgarDegreeWala (tracks, days, assessments, progress)
- 9 API routes for academy functionality
- PracticeQuiz and YoutubeEmbed components
- Academy library (types, queries, progress-local, fallback)

### Removed
- All pricing and course-selling content
- All authentication requirements for learning content
- Mentorship section
- Newsletter signup
- All "Buy", "Purchase", "Bundle" references
- Resume builder (migrated to ElectroBridge)
- All BerojgarDegreeWala branding references

### Changed
- "Courses" → "Resources" throughout
- "Browse Courses" → "Start Learning Free"
- All testimonials reference "SiliconPath" not "the course"
- Layout title: "SiliconPath — Free VLSI Learning Platform"
- Metadata: keywords emphasize free learning
- package.json name → "siliconpath"
- docker-compose.yml container names → "siliconpath_*"
- render.yaml service name → "siliconpath-backend"

### Fixed
- sitemap.ts: added all 15 learning paths + static pages
- robots.ts: added private path disallow rules
- Footer.tsx: removed dead links (/vlsi, /jobs, /community, /blog, /book)
- Navbar.tsx: removed dead links (/jobs, /blog)

### Documentation
- PRODUCT.md: rewritten for SiliconPath (6 learning surfaces, 15 paths, 148 modules)
- ARCHITECTURE.md: rewritten for single-purpose learning platform
- DEVELOPMENT.md: updated branding from BDW to SiliconPath
- README.md: rewritten for SiliconPath VLSI learning platform
- SECURITY.md: updated all domain references to siliconpath.vercel.app

---

## [1.0.0] — 2026-09-08

### Note
SiliconPath was forked from BerojgarDegreeWala on 2026-09-08. The platform was stripped to Academy-only features and rebranded as a free VLSI learning platform. All previous BDW-specific history (opportunity aggregation, employer portal, social network, resume builder) has been migrated to their respective platforms:

- **Opportunities + Social** → [BerojgarDegreeWala](https://berojgardegreewala.vercel.app)
- **Resume Builder** → [ElectroBridge](https://electrobridge.vercel.app)
- **Academy + Learning** → SiliconPath (this platform)
