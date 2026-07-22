# Reference Documentation

## Overview

This directory contains comprehensive reference documents for the BerojgarDegreeWala platform. Use these files as the single source of truth for environment variables, API keys, URL schemes, commands, and patterns.

## Document Index

| Document | Purpose |
|----------|---------|
| `environment-variables.md` | Complete catalog of all 76+ env vars across frontend and backend |
| `api-keys.md` | All API keys, tokens, and secrets required (values not included — see SECRETS.md) |
| `commands.md` | Common development commands: dev, build, test, lint, typecheck, seed |
| `url-schemes.md` | URL patterns: opportunity slugs, profile paths, track pages, admin routes |
| `cron-schedule.md` | Complete cron job schedule with source batches |
| `regex-patterns.md` | Regex patterns used across the codebase (garbage titles, URL validation, etc.) |
| `supabase-queries.md` | Common Supabase query patterns and column names |
| `error-codes.md` | Error code catalog with descriptions and resolutions |
| `dependent-repos.md` | Links to all repository dependencies and their purposes |

## Key Facts

- **Monorepo**: Single repo at `github.com/getberojgardegreewala/berojgardegreewala`
- **Frontend URL**: `https://berojgardegreewala.vercel.app` (production)
- **Backend URL**: Render-generated URL (check Render dashboard)
- **Primary Database**: Supabase DB1 — `berojgardegreewala` project
- **Secondary Database**: Supabase DB2 — `berojgardegreewala-social` project
- **Analytics Database**: Neon — `berojgardegreewala-analytics` project
- **Email Provider**: Resend — project `berojgardegreewala`

## Quick Commands

```bash
# Development
npm run dev              # Next.js dev server (localhost:3000)
npm run dev:backend      # Express dev server (localhost:4000)
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm test                 # Jest tests
npm run build            # Production build

# Database
npx supabase start       # Local Supabase
npx supabase db push     # Push migrations
npx supabase db pull     # Pull schema from Supabase

# Docker
docker build -t berojgardegreewala-backend ./backend
docker run -p 4000:4000 berojgardegreewala-backend
```

## Related Documents

- [environment-variables.md](./environment-variables.md) — Full env var catalog
- [commands.md](./commands.md) — Development commands
- [url-schemes.md](./url-schemes.md) — URL patterns
