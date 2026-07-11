# 13 - Environment Variables

> Rule: secrets must NOT be prefixed `NEXT_PUBLIC_`. Only truly public values (URLs, anon keys, site URL, public DSN) may be.

## Supabase
| Var | Scope | Purpose |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | public | DB1 project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | public | DB1 anon key |
| SUPABASE_SERVICE_ROLE_KEY | secret | DB1 admin ops |
| SUPABASE_2_URL | public | DB2 (news archive) URL |
| SUPABASE_2_ANON_KEY | public | DB2 anon key |
| SUPABASE_2_SERVICE_ROLE_KEY | secret | DB2 admin |

## Neon
| Var | Scope | Purpose |
|---|---|---|
| NEON_DATABASE_URL | secret | analytics connection string |

## Admin / cron / backend
| Var | Scope | Purpose |
|---|---|---|
| ADMIN_PASSWORD | secret | admin auth (server-only) |
| CRON_SECRET | secret | Vercel cron auth |
| SCRAPER_SECRET | secret | must match between Vercel and Render |
| RENDER_BACKEND_URL | public-ish | backend base URL |

## Rate limiting
| Var | Scope | Purpose |
|---|---|---|
| UPSTASH_REDIS_REST_URL | secret | durable rate limiting |
| UPSTASH_REDIS_REST_TOKEN | secret | " |

## AI providers (>=1 required; keep the multi-provider chain)
| Var | Provider |
|---|---|
| GROQ_API_KEY | Groq |
| OPENROUTER_API_KEY | OpenRouter |
| CLOUDFLARE_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID | Cloudflare Workers AI |
| GEMINI_API_KEY | Google Gemini |
| AWS_BEARER_TOKEN_BEDROCK | AWS Bedrock |
| HUGGINGFACE_API_KEY | HuggingFace |
| NVIDIA_NIM_API_KEY | NVIDIA NIM |

## Email / notifications / misc
| Var | Purpose |
|---|---|
| RESEND_API_KEY, FROM_EMAIL | transactional email |
| TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID | telegram posts |
| NEXT_PUBLIC_SENTRY_DSN | error tracking (public DSN) |
| GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | Google OAuth |
| NEXT_PUBLIC_SITE_URL | canonical URL |

Backend-only: PORT, ALLOWED_ORIGINS, RATE_LIMIT_MAX, SCRAPER_SECRET.
