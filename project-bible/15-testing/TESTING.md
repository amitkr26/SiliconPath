# Quality Assurance & Test Data Lifecycle Guidelines

## 1. Mandatory Rule for QA & Testing Sessions
To ensure that test job postings and simulated employer entries never remain visible to public users on production (`https://berojgardegreewala.vercel.app`), the following rules are strictly enforced:

1. **Automated API Safeguard:**
   - The `/api/opportunities` route automatically filters out entries containing test markers (`QA Audit Test`, `UI Verified`, unrealistic salaries, or self-referential apply URLs).
2. **Post-Testing Deletion:**
   - At the conclusion of every QA or browser testing session, the test data cleanup command MUST be run before considering the session complete:
     ```bash
     npm run clean:test-data
     ```
3. **Never Use Unrealistic Test Values:**
   - Always use realistic stipend values (e.g. ₹37,000–42,000/month for JRF positions) when testing forms to prevent confusing visitors if database sync occurs.

---

## 2. Test Accounts Reference (Testing Only)

Canonical accounts (2026-08-19). Legacy accounts (`xasefe9251@bejum.com`, `weqolyji@forexzig.com`) were deleted; do not reuse them.

- **Candidate Account:** `amittest1@berojgardegreewala.com` / `TestPassword123!` (UUID 56b47f8e-8501-45c5-b9a3-8d4fcef8252e)
- **Candidate Account:** `amittest2@berojgardegreewala.com` / `TestPassword123!` (UUID 9e55b282-0d5b-4210-9fd4-54ec5c45da45)

Before full E2E runs, delete inter-account rows: connections, `user_follows`, `feed_posts` like `E2E test post%`, notifications, messages by `sender_id`, conversations by participant. `frontend/scripts/test-social-e2e.mjs` leaves residue (accepted connection).

---

## 3. Automated Test Suites (repo-wide)

| Workspace | Runner | How to run | Notes |
| :--- | :--- | :--- | :--- |
| `backend/server` (`@berojgardegreewala/server`) | node:test | `npm test --workspace @berojgardegreewala/server` | 46 tests (parity 30 + hardening 16): health/CORS/404 envelope, opportunities (pagination, slug lookup, validation), profiles (public field stripping, `/me` auth), Bearer auth (401s, invalid tokens, caller scoping), admin guard (403/200) + AI stubbed-provider routes, XFF shim buckets, admin 429, readiness, invalid-JSON 400 |
| `backend/api` (`@berojgardegreewala/api`) | jest | `npm test --workspace @berojgardegreewala/api` | 97 tests: validation, error handling, content helpers, openapi |
| `backend/ai-gateway` (`@berojgardegreewala/ai-gateway`) | jest | `npm test --workspace @berojgardegreewala/ai-gateway` | 15 tests: provider fallback chain, cooldown, telemetry, logger-throw resilience |
| All workspaces | — | `npm test` / `make test` | `--workspaces --if-present` |

### Server suite details
- **No credentials needed**: Supabase clients are fakes (`backend/server/tests/fake.ts`) — a select-aware chainable fake that filters returned objects to the requested `select()` columns, so repositories that leak private columns (e.g. `email`) are caught by tests.
- **Real HTTP**: tests boot the app on an ephemeral port and exercise it with `fetch`.
- Envelope/error-shape tests double as the API contract: `{ success, error: { code, message } }`.
