# Database Architecture Reference

SiliconPath strictly enforces a 4-database split to maximize performance, isolate concerns, and ensure high availability. 

## The 4 Databases

1. **DB1: Supabase Primary (Core Aggregator)**
   - **Purpose**: Stores all public, read-heavy data. This is the only database the core aggregator (unauthenticated user) interacts with.
   - **Key Tables**: `opportunities`, `organizations`, `news_articles`, `subscribers`

2. **DB2: Supabase Secondary (Social Graph)**
   - **Purpose**: Stores all relational, authenticated user data. 
   - **Key Tables**: `users`, `connections`, `messages`, `posts`, `comments`, `likes`, `companies`
   - *Note: This database is currently dormant as social features are hidden from the primary UI.*

3. **DB3: Neon Primary (Analytics & Cache)**
   - **Purpose**: A fast, serverless PostgreSQL instance dedicated to storing high-volume click-tracking data and caching complex search queries.
   - **Key Tables**: `click_events`, `search_cache`

4. **DB4: Neon Secondary (Failover)**
   - **Purpose**: Hot standby for DB3. If Neon Primary is unreachable or rate-limited, writes and reads automatically route here.

## Entity Relationship (DB1 - Core)

- `opportunities`
  - `id` (uuid, PK)
  - `title` (text)
  - `type` (text - JRF, PhD, Job)
  - `organization_id` (uuid, FK -> organizations.id)
  - `deadline` (timestamp)
  - `metadata` (jsonb - stores scraped structured data)
  - `url` (text)

- `organizations`
  - `id` (uuid, PK)
  - `name` (text)
  - `type` (text - e.g., "Government", "University")
  - `logo_url` (text)

## Migration Process

Database schemas are managed via migration files in `electrobridge/supabase/migrations/` (14 files). These are manually applied via Supabase SQL editor or Neon SQL console. There is no automated Prisma or Drizzle migration pipeline.

**Known Issues:**
- Migration `20260704000001_db1_core_schema.sql:120-127` contains a broken `generate_opp_slug()` function that declares variables but has no body — the slug auto-generation trigger will fail on INSERT.
- Migrations `20260703000003_linkedin_features.sql` and `20260704000002_db2_user_social.sql` create overlapping tables, with ambiguous execution order.
- Cross-database foreign keys between DB1 and DB2 are not enforceable in Supabase.

## Backup & Restore

- **Supabase**: Automated daily backups are managed by Supabase (Point-in-Time Recovery available depending on the paid tier).
- **Neon**: Neon automatically maintains branching and Point-in-Time Recovery out of the box. 
- *Note: There is no custom, off-site backup script configured in this repository yet.*
