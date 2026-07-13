# Epic 09: Testing Infrastructure

**Priority**: P0 | **Estimated effort**: 10 days | **Dependencies**: None (can start immediately)

## Description

Build the testing infrastructure from the ground up. Add comprehensive test coverage for validation schemas, AI parsing, auth middleware, database queries, and API routes. Target: all high-priority tests from the Project Bible spec.

## Feature 9.1: Test Framework Setup

### User Story 9.1.1
As a developer, I want a solid testing foundation.

#### Task 9.1.1.1: Configure jest for monorepo
- **Description**: After monorepo restructure, ensure jest runs across all workspaces. Root jest config that picks up tests from `apps/*` and `packages/*`. Test pattern: `*.test.ts` and `*.test.tsx` co-located with source
- **Dependencies**: Epic 01 (optional — can start with current structure)
- **Acceptance Criteria**: `npm test` from root runs all tests across workspaces. Coverage report generated
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test that test runner works (meta-test)
- **Documentation updates**: Update testing docs in project-bible/15-testing/

#### Task 9.1.1.2: Create test environment setup
- **Description**: Create `.env.test` with test-specific values. Configure `jest.setup.ts` to load test env and set up mocks (Supabase client, AI providers, external APIs via nock)
- **Dependencies**: None
- **Acceptance Criteria**: Tests run in isolated environment. No external calls in unit tests. Supabase calls are mocked
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify tests run without network access
- **Documentation updates**: Add test environment setup to project-bible/15-testing/

## Feature 9.2: High-Priority Tests

### User Story 9.2.1
As a developer, I want all critical code paths tested.

#### Task 9.2.2.1: Zod validation schema tests
- **Description**: Write tests for all Zod schemas in validation.ts. Test: valid input passes, each field's invalid input is rejected, edge cases (empty strings, very long strings, special characters, URLs)
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: Each schema has tests for valid input and all invalid permutations. Coverage > 90% for validation module
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Tests verify schema behavior
- **Documentation updates**: None

#### Task 9.2.2.2: AI tolerant parser tests
- **Description**: Write tests for `safe-parse.ts`. Test: markdown code fences, leading text, trailing text, partial JSON, escaped characters, multiple JSON objects, completely unparseable input returns null
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: All parsing scenarios tested. Edge cases (empty string, malformed JSON, nested JSON) handled
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Parser tests cover all documented scenarios
- **Documentation updates**: None

#### Task 9.2.2.3: Auth middleware tests
- **Description**: Write tests for middleware.ts. Test: unauthenticated requests to protected routes return 401/redirect. Authenticated requests pass through. CRON_SECRET protected routes. Admin password protected routes. Invalid tokens rejected
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: All auth patterns tested. Redirect and JSON response paths covered
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Auth middleware tests
- **Documentation updates**: None

#### Task 9.2.2.4: Database query tests
- **Description**: Write tests for database queries. Test: parameterization (no SQL injection), column name correctness, null handling, pagination logic, error handling (DB down, table missing)
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: All query patterns tested with mocked Supabase responses
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Query tests
- **Documentation updates**: None

#### Task 9.2.2.5: Deduplication logic tests
- **Description**: Write tests for dedup logic in writer.ts. Test: exact duplicate rejected, same URL different title deduped, different URLs not deduped, case-insensitive matching
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: All dedup scenarios tested
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Dedup tests
- **Documentation updates**: None

## Feature 9.3: API Route Tests

### User Story 9.3.1
As a developer, I want critical API routes tested.

#### Task 9.3.3.1: Test public API routes
- **Description**: Write integration tests for key public routes: GET /api/opportunities (list, filter, paginate), GET /api/opportunities/[slug], GET /api/search
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: Each route tested: success response format, error responses, pagination correctness, filter correctness
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: API tests
- **Documentation updates**: None

#### Task 9.3.3.2: Test protected API routes
- **Description**: Write tests for protected routes: GET/POST feed, network, messages. Test: authenticated access, unauthenticated returns 401, data ownership
- **Dependencies**: 9.1.1.2, 9.2.2.3
- **Acceptance Criteria**: Each protected route tested with valid and invalid auth
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Protected route tests
- **Documentation updates**: None

#### Task 9.3.3.3: Test rate limiting
- **Description**: Write tests for rate limiter. Test: within limit requests pass, exceeding limit returns 429, limit resets after window
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: Rate limiter correctly enforces limits
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Rate limit tests
- **Documentation updates**: None

## Feature 9.4: Backend Tests

### User Story 9.4.1
As a developer, I want backend code tested.

#### Task 9.4.4.1: Test backend health endpoint
- **Description**: Write tests for GET /health. Test: returns valid JSON, DB status fields present, uptime field present
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: Health endpoint returns correct structure in all scenarios
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Backend health test
- **Documentation updates**: None

#### Task 9.4.4.2: Test backend scraper orchestrator
- **Description**: Write tests for orchestrator logic. Test: concurrency limiting (max 5), source error isolation, retry logic, circuit breaker
- **Dependencies**: 9.1.1.2
- **Acceptance Criteria**: Orchestrator correctly limits concurrency, isolates errors, retries
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Orchestrator tests
- **Documentation updates**: None

## Master Execution Checklist — Epic 09

- [ ] 9.1.1.1 Configure jest for monorepo
- [ ] 9.1.1.2 Create test environment setup
- [ ] 9.2.2.1 Zod validation schema tests
- [ ] 9.2.2.2 AI tolerant parser tests
- [ ] 9.2.2.3 Auth middleware tests
- [ ] 9.2.2.4 Database query tests
- [ ] 9.2.2.5 Deduplication logic tests
- [ ] 9.3.3.1 Test public API routes
- [ ] 9.3.3.2 Test protected API routes
- [ ] 9.3.3.3 Test rate limiting
- [ ] 9.4.4.1 Test backend health endpoint
- [ ] 9.4.4.2 Test backend scraper orchestrator
