# Deployment Report — v1.0.0

## Summary

| Component | Platform | Status | URL |
|-----------|----------|--------|-----|
| Frontend | Vercel | ✅ Auto-deploy from `main` | https://berojgardegreewala.vercel.app |
| Backend | Render | ✅ Manual deploy via Dockerfile | Render dashboard |
| DB1 (Core) | Supabase | ✅ Active | Supabase dashboard |
| DB2 (Social) | Supabase | ✅ Active | Supabase dashboard |
| Analytics | Neon | ✅ Active | Neon dashboard |
| Workers | Neon | ✅ Active | Neon dashboard |

## Deployment Commands

### Frontend (Vercel — automatic)
```bash
# Push to main triggers auto-deploy
git checkout main && git pull origin main
```

### Backend (Render — manual)
```bash
# Build and push Docker image
docker build -t berojgardegreewala-backend ./backend
# Render auto-deploys from GitHub repo
# Manual: Render dashboard → Manual Deploy
```

## Environment Variables

- Frontend: 26 vars in Vercel dashboard (project settings → Environment Variables)
- Backend: 8 vars in Render dashboard (Environment)
- All secrets: Centralized in `SECRETS.md` (gitignored)
- Templates: `.env.local.example` (frontend), `.env.example` (backend)

## Rollback

See `rollback-report.md`.
