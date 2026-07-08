# Deployment Guide

SiliconPath is optimized for deployment on **Vercel**, utilizing Edge caching and Serverless functions. 

## Vercel Deployment

Pushing to the `main` branch automatically triggers a production deployment on Vercel. 
The project directory for Vercel is `electrobridge`.

### Required Environment Variables

The following environment variables must be configured in the Vercel project settings (26 total):

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
- `AWS_BEARER_TOKEN_BEDROCK`: Bedrock Bearer token (primary AI provider)
- `GROQ_API_KEY`: Groq API key (first fallback)
- `NVIDIA_NIM_API_KEY`: NVIDIA NIM API key (second fallback)
- `GEMINI_API_KEY`: Google Gemini API key (third fallback)
- `OPENROUTER_API_KEY`: OpenRouter API key (fourth fallback)
- `CLOUDFLARE_AI_TOKEN`: Cloudflare Workers AI token (fifth fallback)
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID
- `HUGGINGFACE_API_KEY`: HuggingFace Inference API key (last resort)

**Cron & Auth:**
- `CRON_SECRET`: Secret used to authenticate Vercel Cron requests to `/api/*` routes
- `NEXT_PUBLIC_ADMIN_PASSWORD`: Admin panel password (⚠️ prefixed with NEXT_PUBLIC — visible in client JS)

**Email & Notifications:**
- `RESEND_API_KEY`: Resend API key for email digest
- `FROM_EMAIL`: Email sender address
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `TELEGRAM_CHANNEL_ID`: Telegram channel ID

**Other:**
- `NEXT_PUBLIC_SITE_URL`: Canonical site URL (default: https://siliconpath.vercel.app)
- `NEXT_PUBLIC_APP_URL`: Fallback app URL for redirects
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN ❌ (not yet set)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID ❌ (not yet set)
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret ❌ (not yet set)

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

Note: Vercel Hobby plan only supports one cron job. For production with both crons, a Pro plan is required.

## Rollback Process

If a critical bug is deployed to production:
1. Navigate to the **Deployments** tab in the Vercel Dashboard.
2. Select the previous stable deployment.
3. Click the three dots (...) and select **Promote to Production** (or **Instant Rollback**).
4. Vercel will instantly map the domain to the older, stable deployment.
