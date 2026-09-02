**Last Verified:** 2026-08-30 · **Status:** Current · **Scope:** Frontend architecture and page inventory**

# Frontend Architecture

> Last reconciled: 2026-08-19

## Stack (`frontend/package.json`, measured 2026-08-19)

- Next.js 14.2 (App Router), React 18, TypeScript 5, Tailwind CSS 3.4
- Auth: `@supabase/ssr` (cookie-based SSR auth)
- Data fetching: Server Components; `@tanstack/react-query` for client-side fetching
- UI: `lucide-react` (icons), `sonner` (toasts)
- Observability: `@sentry/nextjs`
- Workspace deps: `@berojgardegreewala/api` (auth guards, rate limiting, validation, error helpers), `@berojgardegreewala/ai-gateway` (AI provider chain)

## Structure (`frontend/src/app`)

- 34 top-level route groups: about, academy, admin, api, applications, ask-ai, auth, categories, category, chat, community, companies, contact, dashboard, employer, employers, feed, login, match, messages, network, news, notifications, onboarding, opportunities, organizations, people, post-job, profile, resources, resume, saved, search, signup.
- Flagship Workspaces:
  - **Resume Studio (`/resume`)**: 3 workspace modes (Content, Customize, AI Tools), shared primitives (`ResumeHeader`, `ContactBlock`, `SectionHeading`, `ExperienceItem`, `EducationItem`, `ProjectItem`, `SkillList`, `PublicationItem`), 10 templates, role-targeted ATS scoring, and local/cloud multi-resume versioning.
  - **Opportunity Intelligence (`/ask-ai`)**: 4 intelligence modes (Ask AI, Discover, Saved, Alerts), date-aware freshness & expiry engine (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `UNVERIFIED`), institutional source tracking (DRDO, ISRO, CSIR, top IITs/IISc), grounded multi-modal cards, and weekly email digest subscriptions.
- API surface: ~140 handlers under `api/` — see `project-bible/07-api/README.md`.
- Error boundaries: root `error.tsx`, `global-error.tsx`, plus `academy/error.tsx`, `admin/error.tsx`, `profile/error.tsx`.
- Loading states: `loading.tsx` skeletons on list/detail pages (opportunities, organizations, news, chat, resume, category).
- SEO: `sitemap.ts` (+ `/api/sitemap`), `robots.ts` (disallows `/admin` and `/api/`, points at sitemap.xml), metadata in `layout.tsx`.
- Shared libs under `frontend/src/lib/`: `supabase.ts` (supabaseAdmin service-role client), `logger.ts`, `ai/`, `scrapers/`, `admin-auth.ts`, `opportunity-freshness.ts`, `sources/source-registry.ts`.

## Middleware (`frontend/src/middleware.ts`)

Applied to every request: origin-allowlist CSRF guard on mutations, per-bucket rate limits (api/auth/search/scrape/ai), auth gate for social and employer paths (401 for APIs, `/login?redirectTo=` redirect for pages), employer role check (`user_metadata.role` or legacy `account_type`), security headers (CSP, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, HSTS in prod), `code` param → `/auth/callback` redirect. Details and exact buckets: `project-bible/07-api/README.md`.

## Key Patterns

- Server Components by default; client components as interactive islands (filters, search, bookmarks, networking).
- Server-side data access via `supabaseAdmin`; auth state via Supabase SSR cookies.
- All `/api/admin/*` routes call `requireAdmin` fail-closed; cron routes call `requireCron` / `requireCronOrAdmin`; validation via Zod schemas from `@berojgardegreewala/api`.

## Deploy

- `vercel.json`: `cd frontend && npm run build`, output `frontend/.next`, 3 scheduled crons (`/api/cron/scrape-opportunities` 00:00, `/api/cron/check-links` 08:00, `/api/news/sync` 06:00 UTC), permanent redirect `/auth/signin` → `/login`.

## Related

- API surface and guards: `project-bible/07-api/README.md`
- AI utilities and gateway wiring: `project-bible/08-ai/README.md`
- Scraping pipeline: `project-bible/09-scrapers/README.md`
