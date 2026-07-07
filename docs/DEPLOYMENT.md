# Deployment Guide

SiliconPath is optimized for deployment on **Vercel**, utilizing Edge caching and Serverless functions. 

## Vercel Deployment

Pushing to the `main` branch automatically triggers a production deployment on Vercel. 
The project directory for Vercel is `electrobridge`.

### Required Environment Variables

The following environment variables must be configured in the Vercel project settings:

**Databases:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Primary URL (DB1)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Primary Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Primary Service Role Key
- `SUPABASE_2_URL`: Supabase Secondary URL (DB2 - Social)
- `SUPABASE_2_ANON_KEY`: Supabase Secondary Anon Key
- `SUPABASE_2_SERVICE_ROLE_KEY`: Supabase Secondary Service Role Key
- `NEON_1_DATABASE_URL`: Neon Primary Postgres Connection String (DB3)
- `NEON_2_DATABASE_URL`: Neon Secondary Postgres Connection String (DB4)

**AI Providers (Fallback Chain):**
- `BEDROCK_AWS_REGION`
- `BEDROCK_AWS_ACCESS_KEY_ID`
- `BEDROCK_AWS_SECRET_ACCESS_KEY`
- `NVIDIA_API_KEY`
- `CLOUDFLARE_API_KEY`
- `CLOUDFLARE_ACCOUNT_ID`
*(Optional/Backup keys: `GROQ_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`)*

**Cron & Auth:**
- `CRON_SECRET`: Secret used to authenticate Vercel Cron requests to `/api/cron/*` routes.

## Cron Configuration

The automated scraping pipeline is scheduled via Vercel Cron. The configuration is defined in `electrobridge/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-india",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/scrape-global",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/check-links",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/digest",
      "schedule": "0 12 * * 0"
    }
  ]
}
```

## Rollback Process

If a critical bug is deployed to production:
1. Navigate to the **Deployments** tab in the Vercel Dashboard.
2. Select the previous stable deployment.
3. Click the three dots (...) and select **Promote to Production** (or **Instant Rollback**).
4. Vercel will instantly map the domain to the older, stable deployment.
