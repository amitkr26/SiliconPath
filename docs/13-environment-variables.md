# 13 — Environment Variables

## Shared (frontend + backend)
| Var | Notes |
|-----|-------|
| NEXT_PUBLIC_SUPABASE_URL | DB1 URL (public) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | DB1 anon (public) |
| SUPABASE_SERVICE_ROLE_KEY | DB1 service role (SECRET) |
| SUPABASE_2_URL | DB2 URL |
| SUPABASE_2_ANON_KEY | DB2 anon |
| SUPABASE_2_SERVICE_ROLE_KEY | DB2 service role (SECRET) |
| NEON_DATABASE_URL | Neon analytics (SECRET) |

## Frontend only
| Var | Purpose |
|-----|---------|
| ADMIN_PASSWORD | Admin auth. **Server-only, never NEXT_PUBLIC_** |
| CRON_SECRET | Auth for Vercel cron routes |
| SCRAPER_SECRET | Shared secret to call backend (must match backend) |
| RENDER_BACKEND_URL | Backend base URL |
| UPSTASH_REDIS_REST_URL / _TOKEN | Durable rate limiting (required in prod) |
| RESEND_API_KEY / FROM_EMAIL | Email |
| GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, CLOUDFLARE_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID, AWS_BEARER_TOKEN_BEDROCK, HUGGINGFACE_API_KEY, NVIDIA_NIM_API_KEY | AI fallback chain (>=1) |
| NEXT_PUBLIC_SITE_URL | Canonical URL (public) |
| NEXT_PUBLIC_SENTRY_DSN | Error tracking (public DSN) |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth |
| TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID | Telegram notifications |

## Backend only
| Var | Purpose |
|-----|---------|
| PORT | default 3001 |
| ALLOWED_ORIGINS | CORS origins (comma-sep) |
| RATE_LIMIT_MAX | max req/min/IP |
| SCRAPER_SECRET | must match frontend |

Commit only `*.example` files; real `.env.local` is gitignored.
