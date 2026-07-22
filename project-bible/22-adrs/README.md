# Architecture Decision Records

## Overview

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made during BerojgarDegreeWala development. Each ADR follows the MADR (Markdown Architectural Decision Records) template.

## ADR Index

| # | Decision | Status | Date |
|---|----------|--------|------|
| 000 | Use ADRs to document architectural decisions | Accepted | 2024-01 |
| 001 | Four-database architecture (2x Supabase + 2x Neon) | Accepted | 2024-01 |
| 002 | Next.js App Router for frontend | Accepted | 2024-01 |
| 003 | Express.js for scraper backend | Accepted | 2024-01 |
| 004 | Centralized AI Gateway with fallback chain | Accepted | 2024-02 |
| 005 | Dark-first design system with OKLCH colors | Accepted | 2024-02 |
| 006 | Server Components for public pages, Client Components for interactivity | Accepted | 2024-02 |
| 007 | Slug-based URLs for opportunities | Accepted | 2024-03 |
| 008 | Verification pipeline for data quality | Accepted | 2024-03 |
| 009 | RLS for auth, service role for server-side | Accepted | 2024-03 |
| 010 | ISR with 5-min revalidation for public pages | Accepted | 2024-04 |
| 011 | Free-tier-first infrastructure policy | Accepted | 2024-04 |
| 012 | Dual table name fallback (academy) | Accepted | 2024-04 |
| 013 | Tolerant JSON parser for AI output | Accepted | 2024-04 |
| 014 | Dedicated project-bible documentation | Accepted | 2024-06 |

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

- [adr-000-use-adrs.md](./adr-000-use-adrs.md) — This file's ADR
- [adr-template.md](./adr-template.md) — ADR template
- [decision-log.md](./decision-log.md) — Quick reference decision log
