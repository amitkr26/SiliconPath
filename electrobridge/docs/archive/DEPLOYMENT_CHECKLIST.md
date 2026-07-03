# ElectroBridge Deployment Checklist

## Vercel Environment Variables (add all of these)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] SUPABASE_2_URL
- [ ] SUPABASE_2_ANON_KEY
- [ ] SUPABASE_2_SERVICE_ROLE_KEY
- [ ] NEON_1_DATABASE_URL
- [ ] NEON_2_DATABASE_URL
- [ ] NEXT_PUBLIC_ADMIN_PASSWORD
- [ ] CRON_SECRET
- [ ] GROQ_API_KEY
- [ ] NVIDIA_NIM_API_KEY
- [ ] GEMINI_API_KEY
- [ ] OPENROUTER_API_KEY
- [ ] HUGGINGFACE_API_KEY
- [ ] CLOUDFLARE_AI_TOKEN
- [ ] CLOUDFLARE_ACCOUNT_ID
- [ ] AWS_BEARER_TOKEN_BEDROCK
- [ ] RESEND_API_KEY
- [ ] FROM_EMAIL
- [ ] TELEGRAM_BOT_TOKEN
- [ ] TELEGRAM_CHANNEL_ID

## Supabase Primary — Run These SQL Files
- [ ] `electrobridge/supabase/migrations/20260703000003_linkedin_features.sql` — **LinkedIn features** (14 tables, profile extensions, seed data)
- [ ] `electrobridge/supabase/migrations/20260702000001_resume_builder.sql`
- [ ] `electrobridge/supabase/migrations/20260702000002_community.sql`
- [ ] `electrobridge/supabase/migrations/20260630000001_user_profiles.sql`
- [ ] All earlier migrations in order

## Post-Deploy Verification
- [ ] https://electrobridge.vercel.app loads
- [ ] /opportunities shows listings
- [ ] /news shows articles
- [ ] /login works (email signup)
- [ ] /dashboard accessible after login
- [ ] /resume loads
- [ ] /community loads
- [ ] /admin accessible
- [ ] AI chat responds (/chat)
- [ ] /feed loads and shows posts
- [ ] /network loads (requires login)
- [ ] /companies shows company list
- [ ] /messages loads (requires login)
- [ ] /notifications shows bell count + list
- [ ] /people/[username] shows public profile
- [ ] /search works with People + Opportunities tabs
- [ ] /admin/talent-pool shows open-to-work candidates
- [ ] Manually trigger scrape: `curl https://electrobridge.vercel.app/api/scrape?mode=all -H "Authorization: Bearer [CRON_SECRET]"`
