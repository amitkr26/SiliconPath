# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-04
### Added
- Complete UI overhaul with Tailwind CSS and Next.js App Router.
- 4-Database architecture across Supabase (DB1, DB2) and Neon (DB3, DB4).
- Multi-provider AI Fallback chain for intelligent parsing of DRDO/ISRO job postings.
- `JobPosting` and `ItemList` schema injections for improved SEO.
- `/resources` hub with comprehensive guides for JRF vs SRF, fully funded PhDs abroad, and DRDO recruitment.
- Complete documentation suite (Architecture, Security, API Reference, Testing).

### Changed
- Pivoted primary application focus from a logged-in LinkedIn clone to a frictionless, no-login aggregator.
- Moved all social and networking links (Feed, Network, Messages) to the footer navigation.
- Consolidated `render-backend` into native Next.js API routes (`src/app/api`).
- Resolved various strict ESLint warnings regarding unescaped entities and `react-hooks/exhaustive-deps`.

### Removed
- Legacy Express backend (`render-backend/`).
- Outdated root documentation and scratch files.
