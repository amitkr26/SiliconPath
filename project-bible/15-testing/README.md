# Testing Strategy

## Overview

BerojgarDegreeWala uses a pragmatic testing approach focused on the areas that provide the most value: database query correctness, API contract validation, and AI output parsing. Full branch coverage is not a goal.

## Test Pyramid

```
    /\          E2E (Cypress) — 0 tests (planned)
   /  \         Integration (API routes, DB) — 10 tests
  /    \        Unit (utils, validation, AI parsing, helpers) — ~30 tests
 /______\
```

## Test Runner

- **Jest** with `@swc/jest` for fast TypeScript transpilation
- **@testing-library/react** for component tests (minimal)
- **supertest** for API route integration tests (planned)

## Configuration

- Config: `jest.config.ts`
- Setup: `jest.setup.ts` (loads `.env.test`, sets up mocks)
- Transform: `@swc/jest` (not `ts-jest`)
- Test files: `*.test.ts`, `*.test.tsx` co-located with source
- Coverage directory: `./coverage`

## What We Test

### High Priority (must test)
- **Validation schemas**: Zod schemas accept valid input and reject invalid
- **AI response parsing**: Tolerant parser handles malformed JSON
- **Database queries**: SQL parameterization, column name correctness
- **Auth middleware**: Route gating works correctly
- **Deduplication logic**: Duplicate opportunities are correctly identified

### Medium Priority (should test)
- **API response format**: All responses match `{ data, count, page, pageSize }` or `{ error }`
- **Pagination**: Page/offset calculations are correct
- **Rate limiting**: Limits are enforced correctly
- **Error boundaries**: Loading, error, and empty states render

### Low Priority (not testing)
- **UI component rendering**: Tailwind class changes do not need tests
- **Page-level integration**: Single-page click flows
- **E2E flows**: Registration → browse → apply flow

## Mock Strategy

- **Supabase client**: Mocked at the client factory level
- **AI providers**: Mocked at the gateway level
- **External APIs**: Nock for HTTP requests
- **Database**: In-memory SQLite or mocked Supabase responses
- **Environment**: `.env.test` with test-specific values

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## CI Integration

Tests run in GitHub Actions (`ci.yml`) on every push to `main`:
```
- npm ci
- npm run lint
- npm run typecheck
- npm test
- npm run build
```

## Related Documents

- [test-catalog.md](./test-catalog.md) — Complete test inventory
- [mocking.md](./mocking.md) — Mock strategy and patterns
- [ci-testing.md](./ci-testing.md) — CI test configuration
