# Architecture Decision Records

## Overview

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made during BerojgarDegreeWala development. Each ADR follows the MADR (Markdown Architectural Decision Records) template.

## ADR Index

Files exist only for 001, 002, 004, 011, 013, 014. ADRs 003, 005-010, and 012 are planned but not yet written.

| # | Decision | Status | File |
|---|----------|--------|------|
| 001 | Four-database architecture (2x Supabase + 2x Neon) | SUPERSEDED (2026-08-16) | [adr-001-four-database-architecture.md](./adr-001-four-database-architecture.md) |
| 002 | Next.js App Router for frontend | IMPLEMENTED | [adr-002-nextjs-app-router.md](./adr-002-nextjs-app-router.md) |
| 003 | Express.js for scraper backend | not yet written | — |
| 004 | Centralized AI Gateway with fallback chain | IMPLEMENTED (2026-08-16) | [adr-004-centralized-ai-gateway.md](./adr-004-centralized-ai-gateway.md) |
| 005 | Dark-first design system with OKLCH colors | not yet written | — |
| 006 | Server Components for public pages, Client Components for interactivity | not yet written | — |
| 007 | Slug-based URLs for opportunities | not yet written | — |
| 008 | Verification pipeline for data quality | not yet written | — |
| 009 | RLS for auth, service role for server-side | not yet written | — |
| 010 | ISR with 5-min revalidation for public pages | not yet written | — |
| 011 | Free-tier-first infrastructure policy | IMPLEMENTED | [adr-011-free-tier-first-infrastructure.md](./adr-011-free-tier-first-infrastructure.md) |
| 012 | Dual table name fallback (academy) | not yet written | — |
| 013 | Tolerant JSON parser for AI output | IMPLEMENTED | [adr-013-tolerant-json-parser.md](./adr-013-tolerant-json-parser.md) |
| 014 | Dedicated project-bible documentation | IMPLEMENTED | [adr-014-project-bible-documentation.md](./adr-014-project-bible-documentation.md) |

Live state, verified 2026-08-19:
- ADR-001 superseded: live topology is DB2 = news_archive + user_profiles mirror; Neon2 = cache mirror (page_views/search_queries/click_events), not a background queue. See `06-database/README.md`.
- ADR-004 live chain (9 providers, 10-min cooldown on failure): groq → gemini → openrouter → nvidia → agentrouter → omnirouter → cloudflare → bedrock → huggingface. Source: `backend/ai-gateway/src/gateway/index.ts`.

## Template

```markdown
# ADR-{NNN}: {Title}

**Status**: {Accepted | Proposed | Deprecated | Superseded}
**Date**: {YYYY-MM-DD}
**Author**: {Author name or "AI Agent"}

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
Why this is a good or bad idea, and what the trade-offs are.
```

## Decision Making Principles

1. **Document before implementing**: Write the ADR first, then implement
2. **Every option considered**: At least 2 alternatives must be documented
3. **Cost-awareness**: Free tier constraints must be evaluated
4. **Reversible decisions**: Prefer reversible decisions over irreversible ones
5. **Explicit rejection**: When reconsidering a past decision, supersede the old ADR

## Related Documents

- [Database architecture](../../06-database/README.md) — live topology (supersedes ADR-001)
- [AI gateway](../../08-ai/README.md) — provider chain (supersedes ADR-004 body details)
