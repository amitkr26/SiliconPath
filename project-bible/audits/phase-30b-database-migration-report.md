# Phase 30B: Database Migration & Schema Integrity Report

**Platform**: BerojgarDegreeWala  
**Audit Date**: August 28, 2026  
**Primary Database**: Supabase PostgreSQL (`aqauempuwmbizqoaolop`)  
**Telemetry / Analytics**: Neon PostgreSQL (`ep-mute-wave-a5m04ucl`)  
**Status**: **VALIDATED & RLS HARDENED**

---

## 1. Migration Overview

Two migrations govern Phase 30 / 30B RBAC, schema integrity, and security hardening:

1. **`20260828000001_unified_rbac_and_lifecycle.sql`**:
   - `user_roles`: Relates `user_id` to platform roles (`owner`, `platform_admin`, `manager`, `moderator`, `support`, `user`).
   - `user_permissions`: Relates `user_id` to explicit capabilities (`opportunities.verify`, `scrapers.run`, `system.settings`).
   - `audit_logs`: Relates administrative actors to timestamped mutations with JSONB metadata.
   - `opportunities`: Extends table with `quality_score (integer DEFAULT 50)`, `last_verified_at (timestamptz)`, `verification_source (text)`, and `audit_notes (text)`.
2. **`20260828010000_fix_rls_policies.sql`**:
   - Drops overly broad `FOR ALL USING (true)` policies.
   - Restricts `SELECT` to `auth.uid() = user_id` for role/permission introspection.
   - Routes all privileged mutations via `supabaseAdmin` service role (bypassing RLS safely on the server side).

---

## 2. Table Topology & Inventory (21 Supabase Entity Tables)

| Entity Table | Primary Key | Foreign Keys / References | Row Count (Live) | RLS Status |
| :--- | :--- | :--- | :--- | :--- |
| `user_profiles` | `id (UUID)` | `auth.users(id)` | 5 | Enabled |
| `user_resumes` | `id (UUID)` | `user_id -> auth.users(id)` | 2 | Enabled |
| `user_roles` | `id (UUID)` | `user_id -> auth.users(id)` | Dynamic | Enabled (Hardened) |
| `user_permissions` | `id (UUID)` | `user_id -> auth.users(id)` | Dynamic | Enabled (Hardened) |
| `audit_logs` | `id (UUID)` | `actor_id -> auth.users(id)` | Dynamic | Enabled (Admin only) |
| `opportunities` | `id (UUID)` | `employer_id -> auth.users(id)`, `organization_id -> organizations(id)` | 3,609 | Enabled |
| `applications` | `id (UUID)` | `opportunity_id -> opportunities(id)`, `candidate_id -> auth.users(id)` | 11 | Enabled |
| `saved_opportunities` | `id (UUID)` | `opportunity_id -> opportunities(id)`, `user_id -> auth.users(id)` | 0 | Enabled |
| `feed_posts` | `id (UUID)` | `author_id -> auth.users(id)` | 3 | Enabled |
| `feed_post_comments`| `id (UUID)` | `post_id -> feed_posts(id)`, `author_id -> auth.users(id)` | 22 | Enabled |
| `feed_post_likes` | `id (UUID)` | `post_id -> feed_posts(id)`, `user_id -> auth.users(id)` | 21 | Enabled |
| `conversations` | `id (UUID)` | `participant_one`, `participant_two -> auth.users(id)` | 4 | Enabled |
| `messages` | `id (UUID)` | `conversation_id -> conversations(id)`, `sender_id -> auth.users(id)` | 22 | Enabled |
| `notifications` | `id (UUID)` | `recipient_id -> auth.users(id)` | 32 | Enabled |
| `connections` | `id (UUID)` | `requester_id`, `receiver_id -> auth.users(id)` | 6 | Enabled |
| `skill_endorsements`| `id (UUID)` | `user_id`, `endorser_id -> auth.users(id)` | 15 | Enabled |
| `recommendations` | `id (UUID)` | `author_id`, `recipient_id -> auth.users(id)` | 1 | Enabled |
| `organizations` | `id (UUID)` | `created_by -> auth.users(id)` | 103 | Enabled |
| `news_articles` | `id (UUID)` | None | 285 | Enabled |
| `scrape_sources` | `id (UUID)` | None | 13 | Enabled |
| `scrape_runs` | `id (UUID)` | `source_id -> scrape_sources(id)` | 42 | Enabled |

---

## 3. Data Safety & Integrity Guarantees

1. **Zero Data Loss**: No columns or tables were dropped or destructively altered.
2. **Backward Compatibility**: Existing `account_type` strings in `user_profiles` continue to resolve seamlessly through the unified `useUser()` hook and `@berojgardegreewala/api`.
3. **No Phantom Keys**: All entity relationships reference valid `auth.users(id)` with `ON DELETE CASCADE` or `ON DELETE SET NULL` clauses.
