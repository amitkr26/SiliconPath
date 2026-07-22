# Epic 07: Database & Schema Consolidation

**Priority**: P0 | **Estimated effort**: 6 days | **Dependencies**: None

## Description

Resolve column drift between code and database. Fix the empty `generate_opp_slug()` function. Clarify DB2's role. Add the `ai_usage_log` table. Standardize migration naming. This epic is foundational — all API and feature work depends on stable schema.

## Feature 7.1: Column Drift Resolution

### User Story 7.1.1
As a developer, I want the database schema to match the code.

#### Task 7.1.1.1: Audit live DB columns
- **Description**: Connect to live Supabase DB1 and DB2. Query information_schema.columns for all tables. Compare against code references. Document all discrepancies beyond the known `apply_link`/`apply_url` and `stipend`/`salary_range` drifts
- **Dependencies**: Access to Supabase project
- **Acceptance Criteria**: Full audit document produced listing every column discrepancy
- **Database changes**: None (read-only audit)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Update project-bible/06-database/ with live schema

#### Task 7.1.1.2: Create alignment migration for DB1
- **Description**: Create new migration that adds missing columns, renames drifted columns, and adds any missing constraints. Use IF NOT EXISTS / IF EXISTS to make it idempotent. Target migration order: after the last existing migration
- **Dependencies**: 7.1.1.1
- **Acceptance Criteria**: Migration runs safely. Columns aligned between code and DB. No data loss
- **Database changes**: New migration file
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Run migration against staging DB first
- **Documentation updates**: Document column mapping in project-bible/06-database/

#### Task 7.1.1.3: Update bridge functions
- **Description**: After migration, simplify or remove `mapDbOpportunityToClient()` bridge function if columns are now aligned. If both columns coexist, keep bridge but add deprecation warning
- **Dependencies**: 7.1.1.2
- **Acceptance Criteria**: Bridge function handles both old and new column names during transition. Code queries use canonical column names
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: All opportunity queries return correct data before and after migration
- **Documentation updates**: None

#### Task 7.1.1.4: Fix generate_opp_slug() DB function
- **Description**: Rewrite the `generate_opp_slug()` PostgreSQL function body. Slug generation logic: lowercased, hyphenated, truncated to 100 chars, append random 4-char suffix for uniqueness. Test in staging first
- **Dependencies**: None
- **Acceptance Criteria**: Function returns valid slug. Slug is unique. Slug is URL-safe. Function is deterministic for same input
- **Database changes**: Update function body via migration
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test function with various inputs (special chars, long titles, duplicates)
- **Documentation updates**: Update project-bible/06-database/ note about slug generation

## Feature 7.2: DB2 Role Clarification

### User Story 7.2.1
As a developer, I want a clear purpose for the secondary Supabase database.

#### Task 7.2.2.1: Audit DB2 usage
- **Description**: Check all code for queries to DB2. Check supabase-2 migrations. Determine if DB2 is actively needed or if its tables can be moved to DB1
- **Dependencies**: None
- **Acceptance Criteria**: Documented list of all DB2 queries. Decision: consolidate or keep separate
- **Database changes**: None (audit)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Update project-bible/06-database/ with actual DB2 role

#### Task 7.2.2.2: Consolidate DB2 into DB1 (if decision)
- **Description**: If DB2's archive tables can fit in DB1 (current usage 150MB of 500MB), create migration to move `news_archive` and `subscribers_overflow` into DB1. Update all code to query DB1
- **Dependencies**: 7.2.2.1
- **Acceptance Criteria**: All data migrated. All queries point to DB1. DB2 can be deprecated
- **Database changes**: New migration for DB1 + data copy
- **API changes**: Point all archive reads/writes to DB1
- **UI changes**: None
- **Testing requirements**: Data integrity check after migration
- **Documentation updates**: Mark DB2 as deprecated in project-bible/06-database/

## Feature 7.3: Missing Tables

### User Story 7.3.1
As a developer, I want all spec-defined tables to exist.

#### Task 7.3.3.1: Create ai_usage_log table
- **Description**: Create migration for `ai_usage_log` table if not exists. Columns: id, provider, model, prompt_tokens, completion_tokens, duration_ms, prompt_version, user_id, created_at. Add indexes on provider and created_at
- **Dependencies**: None
- **Acceptance Criteria**: Table exists. AI Gateway logs to it. Indexed for analytics queries
- **Database changes**: New migration for DB1
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test insert, select with indexes
- **Documentation updates**: Add ai_usage_log to project-bible/06-database/

## Feature 7.4: Migration Naming Standardization

### User Story 7.4.1
As a developer, I want consistent migration naming.

#### Task 7.4.4.1: Rename migrations to standard format
- **Description**: Rename all existing migration files to `YYYYMMDD_HHMMSS_description.sql` format. Update migration tracking table if needed. Create a migration manifest file
- **Dependencies**: None
- **Acceptance Criteria**: All migrations follow naming convention. Order is preserved. No data loss
- **Database changes**: Migration files renamed
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Run migration sequence from clean state
- **Documentation updates**: Update project-bible/06-database/migrations.md

## Master Execution Checklist — Epic 07

- [ ] 7.1.1.1 Audit live DB columns
- [ ] 7.1.1.2 Create alignment migration for DB1
- [ ] 7.1.1.3 Update bridge functions
- [ ] 7.1.1.4 Fix generate_opp_slug() DB function
- [ ] 7.2.2.1 Audit DB2 usage
- [ ] 7.2.2.2 Consolidate DB2 into DB1 (if decided)
- [ ] 7.3.3.1 Create ai_usage_log table
- [ ] 7.4.4.1 Rename migrations to standard format
