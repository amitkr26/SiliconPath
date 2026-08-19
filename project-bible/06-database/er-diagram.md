# Entity-Relationship Diagram

Simple ER summary of live tables (verified 2026-08-19). Cross-database FKs are not possible; references are enforced at the application layer.

## DB1 — Supabase Project 1 (production core)

```mermaid
erDiagram
    organizations ||--o{ opportunities : "organization_id"
    user_profiles ||--o{ feed_posts : "user_id"
    user_profiles ||--o{ connections : "requester_id/addressee_id"
    user_profiles ||--o{ conversations : "participant_a/b"
    user_profiles ||--o{ messages : "sender_id"
    user_profiles ||--o{ applications : "user_id"
    user_profiles ||--o{ saved_opportunities : "user_id"
    user_profiles ||--o{ user_follows : "follower_id"
    user_profiles ||--o{ notifications : "user_id"
    user_profiles ||--o{ resumes : "user_id"
    conversations ||--o{ messages : "conversation_id"
    feed_posts ||--o{ feed_post_likes : "post_id"
    feed_posts ||--o{ feed_post_comments : "post_id"
    feed_posts ||--o{ feed_post_reposts : "post_id"
    community_posts ||--o{ community_comments : "post_id"
    company_pages ||--o{ company_followers : "company_id"
    opportunities ||--o{ applications : "opportunity_id"
    opportunities ||--o{ opportunity_reports : "opportunity_id"

    opportunities {
        uuid id PK
        text title
        uuid organization_id FK
        text salary_range
        text apply_url
        text source_type
        text verification_status "verified|unverified|link_unavailable|expired"
        text slug UK
        boolean is_active
    }
    organizations {
        uuid id PK
        text name
        text slug UK
        text type
        boolean is_verified
    }
    user_profiles {
        uuid id PK
        text username UK
        text display_name
        text headline
        text location
        boolean is_profile_public
        integer follower_count
        integer following_count
        integer connection_count
    }
    connections {
        uuid id PK
        uuid requester_id FK
        uuid addressee_id FK
        text status "pending|accepted|rejected"
    }
    feed_posts {
        uuid id PK
        uuid user_id FK
        text content
        integer like_count
        integer comment_count
    }
    conversations {
        uuid id PK
        uuid participant_a FK
        uuid participant_b FK
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text body
        boolean is_read
    }
```

## DB2 — Supabase Project 2 (legacy mirror)

```mermaid
erDiagram
    news_archive {
        uuid id PK
        text title
        text source_url UK
        text slug UK
    }
```

`user_profiles` also mirrored here via `syncProfile` (`frontend/src/lib/db/index.ts`).

## Neon 1 — analytics + mirrors

```mermaid
erDiagram
    click_events ||--o{ page_views : ""
    page_views {
        uuid id PK
        text path
        text referrer
    }
    click_events {
        uuid id PK
        text event
    }
    search_queries {
        uuid id PK
        text query
    }
    trending_cache {
        uuid id PK
        text key
        jsonb payload
    }
    keyword_stats {
        uuid id PK
        text keyword
    }
    opportunities_mirror {
        uuid id PK
        text slug UK
    }
    news_mirror {
        uuid id PK
        text source_url UK
    }
```

## Neon 2 — cache mirror

```mermaid
erDiagram
    page_views {
        uuid id PK
    }
    search_queries {
        uuid id PK
    }
    click_events {
        uuid id PK
    }
```

Neon 2 holds a subset (cache mirror) of Neon 1's `page_views` / `search_queries` / `click_events`. Mirrors are written by `/api/sync-replica`.
