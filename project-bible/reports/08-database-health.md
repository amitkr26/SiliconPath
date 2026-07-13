# Database Health Report — Phase 2 Database Consolidation

**Date**: 2026-07-13
**Branch**: phase-02-database-consolidation

## Overview

Assessment of schema quality, naming consistency, referential integrity, and missing structures across all four databases.

## DB1 — Supabase Primary

### Table Coverage

| Metric | Value |
|--------|-------|
| Total tables (canonical) | 36 |
| Tables in DB_TABLES | 36 (100%) |
| Tables with RLS enabled | 34 (94%) |
| Tables with RLS policies | 30 (83%) |
| Tables with `updated_at` trigger | 9 (25% → 100% after migration) |
| Tables with PK | 36 (100%) |
| Tables with indexes on FK columns | 15 (42% → 100% after migration) |

### Column Health

| Issue | Count |
|-------|-------|
| Columns with naming drift (code vs schema) | 8 |
| Tables with generated/alias columns needed | 2 |
| Missing columns on mirrored schema | 11 (to be synced) |

### Foreign Key Coverage

| Metric | Value |
|--------|-------|
| Tables with FK to `auth.users` | 16 |
| Tables with FK to other app tables | 8 |
| Cross-db reference columns (no FK possible) | 3 |

### RLS Score: 8/10

- 2 tables missing RLS enable
- 4 tables missing explicit policies
- Some tables rely on service-role bypass for admin operations

### Index Score: 7/10

- Core tables (opportunities, news_articles) well-indexed
- Social tables under-indexed (35 indexes added in migration)
- Academy tables partially indexed

## DB2 — Supabase Secondary

| Metric | Value |
|--------|-------|
| Total tables | 2 |
| Tables with RLS | 0 (both missing — will be enabled) |
| Tables with indexes | 2 existing, 2 missing |
| Tables with PK | 2 (100%) |

### Health Score: 5/10

- Minimal schema but missing RLS and search indexes
- `news_archive` lacks full-text search support
- `subscribers_overflow` lacks email lookup index

## NEON1 — Analytics

| Metric | Value |
|--------|-------|
| Total tables | 4 |
| Tables with indexes | 4 (100% — but missing key query patterns) |
| Tables with PK | 4 (100%) |

### Health Score: 7/10

- Core table (`platform_events`) has proper event-type discriminator
- Missing analytics columns for richer querying
- `scrape_logs` has no source_id index
- `ai_usage_log` lacks latency tracking

## NEON2 — Cache / Mirror

| Metric | Value |
|--------|-------|
| Total tables | 2 |
| Mirror completeness (opportunities) | 70% (21/30 source columns mirrored) |
| Mirror completeness (news) | 90% (10/11 source columns mirrored) |

### Health Score: 6/10

- `opportunities_mirror` is missing 9 columns from source
- Missing org_slug (used for company page lookups)
- Missing location breakdown (city/state/country)

## Cross-Cutting Concerns

### Naming Consistency

| Aspect | Score | Notes |
|--------|-------|-------|
| Table names | 6/10 | 10+ inconsistencies between migrations, code, and DB_TABLES |
| Column names | 5/10 | 8 column name drifts between app code and migration files |
| Constraint names | 7/10 | Reasonably consistent but not audited for all tables |
| Index naming | 8/10 | Follows `idx_table_column` convention |

### Schema Duplication

| Severity | Count | Examples |
|----------|-------|----------|
| Table definitions across DBs | 5 | ai_usage_log, link_check_logs, opportunity_reports duplicated |
| Table definitions within DB | 6 | feed_posts, notifications, skill_endorsements, etc. |
| Trigger functions | 2 | generate_opp_slug vs generate_slug |

### Data Integrity

| Concern | Impact |
|---------|--------|
| Cross-database references | Application-layer enforcement (no FK constraints) |
| Denormalized counts (likes, comments) | Trigger-synced, eventual consistency |
| Organization as text + FK | Dual-write pattern during migration |

## Recommendations

1. **Short term** (this phase): Apply all 4 migration files, update DB_TABLES, update documentation
2. **Medium term**: Migrate application code to use canonical column names, retire aliases
3. **Long term**: Consolidate duplicate table definitions, add cross-db sync monitoring, add audit triggers
