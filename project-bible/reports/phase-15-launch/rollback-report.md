# Rollback Report — v1.0.0

## Frontend (Vercel)

**Method**: Vercel Dashboard → Deployments → Select previous deployment → "Promote to Production"

**Procedure**:
1. Go to https://vercel.com/.../berojgardegreewala/deployments
2. Identify the last known-good deployment
3. Click "..." → "Promote to Production"
4. Verify: Homepage loads, no Sentry errors spike
5. Time: ~2 minutes

**Rollback via git** (if needed):
```bash
git revert HEAD --no-edit
git push origin main
```
Vercel auto-deploys the reverted commit.

## Backend (Render)

**Method**: Render Dashboard → Service → Manual Deploy → Deploy last successful deploy

**Procedure**:
1. Go to Render dashboard → berojgardegreewala-backend
2. Click "Manual Deploy" → "Deploy last successful deploy"
3. Verify health endpoint: `GET /health`
4. Time: ~3 minutes (build + deploy)

## Database (Supabase)

**Method**: Point-in-Time Recovery (PITR)

**Procedure**:
1. Supabase Dashboard → Database → Backups
2. Select restore point (7-day retention on free tier)
3. Confirm restoration
4. Verify data integrity
5. Note: PITR creates a new database — update connection strings if using new DB

## Database (Neon)

**Method**: Automated daily backup → Restore via dashboard

**Procedure**:
1. Neon Dashboard → Branches → Restore
2. Select backup timestamp
3. Confirm
4. Update connection strings if branch changed

## Migration Rollback

All migrations are additive (no destructive operations). Rollback is:
1. Revert the application code
2. Revert the migration SQL (if needed)
3. Deploy the reverted code

## Quick Rollback (All-in-one)

```bash
# Revert code
git revert HEAD --no-edit && git push origin main    # triggers Vercel deploy
# Re-deploy backend
# Render Dashboard → Manual Deploy → Last successful deploy
# Database: No action needed (additive migrations only)
```
