# 20-TECHNICAL-DEBT — Prioritized Technical Debt Inventory

- **P1 (Local Dev Service Role Key)**: `siliconpath-credentials.txt` holds a stale service role key for offline testing. Production environments (Vercel/Render) use valid active keys and are unaffected.
- **P2 (Render Free Tier Cold Starts)**: Backend replica runs on Render Free tier (~30s cold start). Vercel frontend has 0ms cold start.
- **P3 (Global Feed Default)**: `/api/feed` defaults to global community posts; network-only filtering is architected for future toggle.
