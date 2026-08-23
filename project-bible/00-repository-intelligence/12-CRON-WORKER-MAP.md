# 12-CRON-WORKER-MAP — Scheduled Jobs & Workers

- **Vercel Cron**: Configured via `cron.json` invoking `/api/cron/news-sync` and `/api/cron/link-checker`.
- **Render Worker**: Standalone background scheduler executing periodic batch runs.
- **Authentication**: Secured with `CRON_SECRET` Bearer token verification.
