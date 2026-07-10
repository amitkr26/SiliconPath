# Migration to v2 (rebuild/v2-platform-overhaul)

This branch is a from-scratch overhaul: security fixes, a fresh database schema, a responsive light-theme design system, and full documentation. Follow this runbook to adopt it safely.

---

## What changed

### Security (breaking for admin callers)
- `POST/PUT/DELETE /api/scrape-sources` now require admin auth. Callers must send `x-admin-password` or `Authorization: Bearer <ADMIN_PASSWORD>`.
- `POST /api/opportunities` is admin-only.
- `PATCH /api/profile/[userId]` only accepts whitelisted fields.
- Backend `GET /scrape/test/:sourceId` now requires `SCRAPER_SECRET`.
- Search input is sanitized; new scrape source URLs are SSRF-checked.

### Environment (action required)
- **Remove `NEXT_PUBLIC_ADMIN_PASSWORD`** entirely. Add server-only `ADMIN_PASSWORD`.
- Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for real rate limiting.
- Rotate any secret that was ever exposed with a `NEXT_PUBLIC_` prefix.

### Database (breaking)
- Schema fully reset. Run the migrations in [DATABASE_SETUP.md](DATABASE_SETUP.md).
- Consolidated from 4 DBs to 3. You can delete the second Neon project and drop `NEON_2_DATABASE_URL`; `NEON_1_DATABASE_URL` becomes `NEON_DATABASE_URL`.

### UI
- Light theme is now the default. `globals.css` is a full responsive design system.
- Academy page no longer hangs: it has timeout-guarded fetches plus error/empty states.

---

## Runbook

1. **Review this branch** and the diffs. Nothing is merged to `main` yet.
2. **Back up** all databases.
3. **Reset + seed databases** per [DATABASE_SETUP.md](DATABASE_SETUP.md).
4. **Update env vars** in Vercel and Render per the changes above.
5. **Deploy this branch to a preview** (Vercel preview deploy) and smoke-test:
   - Home + opportunities load
   - `/academy` loads without infinite spinner
   - Admin endpoints return 401 without credentials
   - Sign up / log in works
6. **Trigger a scrape** and verify rows land as `pending`, not auto-published.
7. **Promote** a handful of verified opportunities and confirm they appear publicly.
8. **Merge** to `main` when the preview is green.

---

## Rollback

Since `main` is untouched until you merge, rollback is simply: do not merge. If you already merged and need to revert, redeploy the previous `main` commit and restore the database backup from step 2.
