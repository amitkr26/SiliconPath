# Known Issues — v1.0.0

## Pre-Existing (deferred from production audit)

- **ESLint warning** (academy/page.tsx:68): `useEffect` missing `loadData` dep. False positive — `user?.id` is the correct semantic dependency.
- **No Playwright E2E tests**: Only Jest unit tests exist (424 total). E2E is a separate upcoming phase.
- **No runtime schema validation**: Schema drift detection is manual via project-bible audit reports only.
- **~90 console.error calls in API route catch blocks**: Output is semi-structured. Pattern is consistent; not a launch blocker.

## Dependencies

- **10 npm vulnerabilities** (4 high, 6 moderate): All in transitive dependencies. Fixing would require breaking upgrades:
  - `next@14.2.35` → `next@16` (breaking, React 19 migration needed)
  - `eslint-config-next@14` → `@16` (breaking)
  - `uuid` in `@google-cloud/storage` transitive deps
  - Risk accepted for launch. Next.js 14 receives security patches for critical CVEs. Plan upgrade to Next 16 in next phase.

## Infrastructure

- **Backend (Render)**: Free tier spins down after inactivity — first request after idle has ~30s cold start
- **Upstash**: 10,000 commands/day free limit — monitor usage after launch
- **Neon**: Shared compute may have cold starts on first daily query
- **No `render.yaml`**: Backend deployment config is manual, not infrastructure-as-code

## Features

- **LinkedIn**: Disabled by default (`NEXT_PUBLIC_LINKEDIN_ENABLED=false`). Social features work with in-app connections only.
- **Employer dashboard**: Employer signup and company profile management is planned for next phase.
- **Rate limiting**: Uses Upstash in production, in-memory fallback in development. Single Upstash instance — no regional distribution.
