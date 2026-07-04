# Testing Strategy

SiliconPath uses **Jest** and **React Testing Library** for its testing suite.

## Current Coverage

Currently, there are **31 passing tests** across 4 test suites. 

**What is covered:**
- Unit tests for core utilities (`src/lib/utils.ts`).
- Logic tests for the news and opportunity filtering functions.
- API route logic for `opportunities.test.ts`.
- Component tests for isolated UI components (e.g., `DeadlineCountdown.tsx`).

**What is NOT covered:**
- End-to-End (E2E) testing (e.g., Playwright/Cypress). There is no automated browser testing yet.
- Full integration tests for the AI scraping fallback chain (this relies on external API responses and is currently tested via manual scripts).
- Social features (Feed, Messaging, Network graph) are currently untested, as they are dormant.

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

Tests are not currently enforcing build failure in Vercel. However, they can be wired into a GitHub Action before allowing merges to `main`. 

Example minimal GitHub Action for Jest:
```yaml
name: Node.js CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v3
    - run: pnpm install
    - run: pnpm test
```
