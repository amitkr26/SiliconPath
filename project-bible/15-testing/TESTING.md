# 🧪 Quality Assurance & Test Data Lifecycle Guidelines

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
- **Candidate Account:** `xasefe9251@bejum.com`
- **Employer Account:** `weqolyji@forexzig.com`

---

## 3. Automated Test Suites (repo-wide)

| Workspace | Runner | How to run | Notes |
| :--- | :--- | :--- | :--- |
| `backend/server` (`@berojgardegreewala/server`) | node:test | `npm test --workspace @berojgardegreewala/server` | 16 tests: health/CORS/404 envelope, opportunities (pagination, slug lookup, validation), profiles (public field stripping, `/me` auth), Bearer auth (401s, invalid tokens, caller scoping), admin guard (403/200) |
| `backend/api` (`@berojgardegreewala/api`) | jest | `npm test --workspace @berojgardegreewala/api` | Validation/error unit tests |
| All workspaces | — | `npm test` / `make test` | `--workspaces --if-present` |

### Server suite details
- **No credentials needed**: Supabase clients are fakes (`backend/server/tests/fake.ts`) — a select-aware chainable fake that filters returned objects to the requested `select()` columns, so repositories that leak private columns (e.g. `email`) are caught by tests.
- **Real HTTP**: tests boot the app on an ephemeral port and exercise it with `fetch`.
- Envelope/error-shape tests double as the API contract: `{ success, error: { code, message } }`.
