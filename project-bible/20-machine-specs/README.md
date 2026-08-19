# Machine Specifications

## Overview

This directory contains machine-readable specifications that enable automated tooling, code generation, validation, and documentation.

## Spec Index

| Spec | Format | Purpose | Maintained |
|------|--------|---------|------------|
| `design-tokens.json` | JSON | Design tokens (colors, typography, spacing, radius, shadows) | Manual |
| `route-manifest.json` | JSON | API route manifest (inventory of `frontend/src/app/api` route files) | Manual |
| `env-schema.json` | JSON | Environment variable definitions with types and visibility | Manual |
| `scraper-source-registry.json` | JSON | Scraper module and source configuration | Manual |
| `state-machines.json` | JSON | State machine definitions (verification, connection, application, scrape run) | Manual |

## OpenAPI Specification

The canonical OpenAPI spec lives at `backend/api/openapi.json` (51 paths, frontend API surface). It is not duplicated in this directory.

## Route Manifest

`route-manifest.json` inventories the live route files under `frontend/src/app/api`: 136 `route.ts` + 2 `route.tsx` = 138 total (inventory source: recursive glob of `frontend/src/app/api`).

## State Machines

The state machines in `state-machines.json` define valid state transitions for:
1. **Opportunity verification**: unverified → verified (admin) / link_unavailable (link-checker) / expired (cleanup cron)
2. **Connection request**: pending → accepted/rejected
3. **Application status**: submitted → reviewed → shortlisted → accepted/rejected
4. **Scrape run**: queued → running → completed/failed

## Related Documents

- [Database schema](../../06-database/README.md) — live tables and columns (canonical schema reference)
- [OpenAPI spec](../../../backend/api/openapi.json) — API specification
- [Scrapers](../../09-scrapers/README.md) — scraper architecture