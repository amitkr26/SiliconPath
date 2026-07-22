# Knowledge Base

## Overview

The BerojgarDegreeWala knowledge base is a living document for domain expertise, platform-specific patterns, debugging guides, and lessons learned. Unlike other directories, the knowledge base is constantly updated.

## Contents

### VLSI Domain Knowledge
- Semiconductor industry glossary
- Key VLSI design flow stages (spec → RTL → synthesis → layout → tapeout)
- Major semiconductor companies and their segments
- Indian VLSI ecosystem (government labs, PSUs, universities, startups)
- Research fellowship types (JRF, SRF, RA, PDF, etc.)
- VLSI career paths and skill requirements

### Platform Patterns
- Database query patterns with column aliases (mapDbOpportunityToClient)
- AI response parsing patterns
- Auth middleware patterns
- Pagination pattern
- Filter/search query construction
- Error handling conventions

### Debugging Guides
- Scraper not returning results → check source_config.ts, verify TLS fallback
- Academy showing fallback data → check supabase tables, null check
- Auth redirect loop → check middleware.ts, callback URL
- Opportunity not showing → check verification_status
- Build errors → check TypeScript strict mode, missing imports
- Rate limiting → check Upstash dashboard, fallback Map
- Slug conflict → check DB for duplicates, regenerate

### Common Errors & Fixes
| Error | Cause | Fix |
|-------|-------|-----|
| `generate_opp_slug` empty | DB function body empty | Generate slug in app code |
| Column `apply_link` not found | DB column is `apply_url` | Update query or migration |
| Academy returns no days | `getCompletedDays()` returns [] | Check DB connection |
| Scrape returns 0 results | Network timeout for .gov.in | TLS fallback needed |
| Type error `string | null` vs `string` | Nullable DB column | Add nullish coalescing |

### Lessons Learned
1. **Always look at both DB and code**: Column names can drift between schema and application
2. **Never trust DB function bodies**: `generate_opp_slug()` is empty — always handle in app code
3. **Free tier requires creativity**: Work within constraints (cold starts, memory limits, concurrency caps)
4. **Fallback data is essential**: Academy must work without Supabase connection
5. **ISR is fragile**: On-demand revalidation is preferable for stale data
6. **AI output is unpredictable**: Always use tolerant parser, never `JSON.parse()`
7. **Migration files are not the truth**: The live database schema is the truth
8. **Column drift is real**: Bridge functions (map* patterns) are necessary
9. **Backend cold starts**: Render spins down after inactivity — first request takes ~30s
10. **Supabase OAuth limit**: Free tier only allows 2 OAuth providers

## Related Documents

- [vlsi-glossary.md](./vlsi-glossary.md) — Domain glossary
- [debugging-guides.md](./debugging-guides.md) — Debugging procedures
- [lessons-learned.md](./lessons-learned.md) — Full lessons learned
