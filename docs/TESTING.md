# Testing Strategy

SiliconPath uses **Jest** and **React Testing Library** for its testing suite.

## Current Coverage

There are currently **4 test suites** with **31 passing tests**.

**What is covered:**
- Unit tests for core utilities (`src/lib/utils.ts`).
- Logic tests for the news filter function (`news-filter.test.ts`).
- API route logic for `opportunities.test.ts`.
- Component tests for isolated UI components (`DeadlineCountdown.tsx`).

**What is NOT covered:**
- End-to-End (E2E) testing (Playwright/Cypress) — none configured.
- Full integration tests for the AI scraping fallback chain.
- Social features (Feed, Messaging, Network, Community) — untested.
- Authentication flows.
- Database integration tests.

## Running Tests Locally

Ensure all dependencies are installed, then run:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (for active development)
pnpm run test:watch

# Generate a coverage report
pnpm run test:coverage
```

## Continuous Integration (CI)

A CI pipeline exists at `.github/workflows/ci.yml` that runs lint, test, and build on pushes/PRs to `main`. The pipeline uses `npm ci` (not `pnpm`, despite the README recommending `pnpm`). Both `package-lock.json` and `pnpm-lock.yaml` exist in the repo, creating ambiguity.

**Issues with current CI:**
1. Uses `npm ci` but README says to use `pnpm` — inconsistent
2. Secrets fallback to empty strings in CI (`secrets.* || ''`), which may cause build failures for routes that check env vars at build time
3. `NEXT_PUBLIC_ADMIN_PASSWORD` has a weak hardcoded fallback: `'electrobridge2026'`
4. No E2E tests, no database integration tests
