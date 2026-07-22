# ADR-011: Free-Tier-First Infrastructure Policy

**Status**: Accepted
**Date**: 2024-04-01
**Author**: Architecture Board

## Context

BerojgarDegreeWala is a bootstrapped project with no revenue. All infrastructure decisions must consider cost. Previously, there was no explicit policy on service tier selection, leading to potential accidental over-provisioning.

## Decision

All infrastructure must operate within free tier limits by default. Cloud credits (e.g., Vercel, Supabase credits from GitHub Student Developer Pack) are reserved for temporary or optional workloads only, never for baseline operation.

### Free Tier Allocation

| Service | Provider | Limit | Usage Allocation |
|---------|----------|-------|-----------------|
| Hosting | Vercel Hobby | 100 GB bandwidth, 10 concurrent functions | Frontend + API |
| Backend | Render Free | 512 MB RAM, 750 hr/month | Scraping service (will cold start) |
| Database | Supabase Free | 500 MB/project | Core + social (2 projects) |
| Analytics DB | Neon Free | 0.5 GB compute, 5 GB storage | Analytics |
| Rate Limiting | Upstash Free | 10K commands/day | API rate limiting |
| Email | Resend Free | 100 emails/day | Auth + notifications |
| AI | Groq Free | 30 req/min | Default AI provider |

### Graceful Degradation on Overage
- If a free tier limit is reached, the feature degrades gracefully (e.g., rate limiting becomes in-memory, AI uses next provider in chain, analytics queries return cached data)
- Never fail closed on free tier quota exhaustion

## Consequences

**Positive:**
- Zero monthly operating cost
- Forces engineering discipline (optimize queries, compress assets, cache aggressively)
- Easy path to upgrade (switch to paid tier when traffic justifies it)

**Negative:**
- Cold starts on Render (30s initial request)
- Supabase 500 MB limit requires multi-project strategy
- Upstash 10K commands/day requires efficient cache usage
- Resend 100 emails/day limits notification volume

**Mitigation**: Upgrade triggers are documented in operations docs — upgrade only when free tier becomes a bottleneck to user experience.
