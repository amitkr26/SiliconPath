# Migration Report — Phase 2 Database Consolidation

**Date**: 2026-07-13
**Branch**: phase-02-database-consolidation

## Migration Files

| File | Database | Purpose |
|------|----------|---------|
| `001_db1_schema_consolidation.sql` | Supabase DB1 | Missing tables, columns, indexes, RLS, triggers |
| `002_db2_schema_consolidation.sql` | Supabase DB2 | Missing indexes, RLS policies |
| `003_neon1_schema_consolidation.sql` | Neon DB1 | Missing columns, indexes |
| `004_neon2_schema_consolidation.sql` | Neon DB2 | Missing columns, indexes |

## Migration Principles

- **Additive only**: No destructive operations (`DROP`, `DELETE`, `ALTER COLUMN DROP`)
- **Idempotent**: All statements use `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`
- **Backward compatible**: Generated columns added as aliases; existing data preserved
- **Ordered**: DB1 → DB2 → NEON1 → NEON2 (independent, can run in parallel)

## Summary of Changes

### DB1 (001)
| Category | Count | Details |
|----------|-------|---------|
| New tables | 1 | `user_alerts` |
| New columns | 12 | Core + social + academy tables |
| Generated columns | 2 | `apply_url`, `salary_range` (backward compat) |
| New indexes | 35 | FK columns, frequently queried columns |
| RLS policies | 2 | `user_profiles`, `user_alerts` |
| Triggers | 9 | `updated_at` auto-update on 9 tables |
| Function cleanup | 1 | Dropped duplicate slug function |

### DB2 (002)
| Category | Count | Details |
|----------|-------|---------|
| New indexes | 2 | FTS on news_archive, email on subscribers_overflow |
| RLS policies | 3 | news_archive SELECT, subscribers_overflow INSERT/SELECT |

### NEON1 (003)
| Category | Count | Details |
|----------|-------|---------|
| New columns | 6 | session_id, user_id, duration_ms, model_version, feature_version, response_time_ms |
| New indexes | 8 | Events, scrape_logs, AI usage, link_check |

### NEON2 (004)
| Category | Count | Details |
|----------|-------|---------|
| New columns | 11 | Location, requirements, page, org fields on mirror |
| New indexes | 4 | News source, org, posted, verification |

## Code Changes

### packages/database/src/index.ts
- **DB_TABLES**: Complete rewrite with canonical table names
  - DB1: 36 tables (was 24, added 12 missing, renamed 8)
  - DB2: 2 tables (unchanged)
  - NEON1: 4 tables (was 3 virtual + 1 real — fixed to actual table names)
  - NEON2: 2 tables (was 0 — added missing)
- **BRIDGE_FIELDS**: Updated to reflect canonical naming

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Generated columns may conflict with existing data | Low | `COALESCE` ensures non-NULL values; existing data preserved |
| New indexes impact write performance | Low | Indexes on frequently read columns; write volume is low |
| New RLS policies may block existing queries | Low | Policies are additive, permissive |
| Missing `updated_at` trigger on modified tables | Low | Trigger is new; existing rows unaffected |

## Execution Order

1. Apply `001_db1_schema_consolidation.sql` on Supabase Primary
2. Apply `002_db2_schema_consolidation.sql` on Supabase Secondary
3. Apply `003_neon1_schema_consolidation.sql` on Neon Primary
4. Apply `004_neon2_schema_consolidation.sql` on Neon Secondary
5. Deploy updated `packages/database` to consuming apps
6. Update application code to use canonical column names (future phase)
