# ADR-001: Four-Database Architecture

**Status**: Accepted
**Date**: 2024-01-15
**Author**: Architecture Board

## Context

BerojgarDegreeWala needs to store multiple types of data with different access patterns: core platform data (opportunities, organizations), user data (profiles, connections), analytics (page views, clicks), and background processing data. Supabase free tier limits (500 MB per project) require distribution across multiple projects.

## Decision

Use four databases across two providers:

| DB | Provider | Role | Free Tier Limit |
|----|----------|------|-----------------|
| DB1 | Supabase | Core + social data (opportunities, orgs, academy, users, feed, messages) | 500 MB |
| DB2 | Supabase | Overflow + archive (news_archive, subscribers_overflow) | 500 MB |
| Neon 1 | Neon | Analytics (page views, clicks, search queries) | 5 GB |
| Neon 2 | Neon | Background processing queue | 5 GB |

## Consequences

**Positive:**
- Stays within Supabase free tier storage limits
- Clear separation of concerns (operational vs. analytical)
- Neon's larger free tier allows more generous analytics storage

**Negative:**
- No cross-database joins (must query separately)
- Multiple Supabase project management
- More complex backup strategy

**Mitigation:**
- Use Neon's branching for read replicas
- Server-side joins in application code
- Synchronization via cron jobs for analytics rollups
