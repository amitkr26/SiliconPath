# Security & Compliance

## Reporting a Vulnerability

If you discover a security vulnerability within SiliconPath, please do NOT submit an issue on GitHub. Instead, send an email directly to the project maintainers. We will acknowledge your report within 48 hours and provide a timeline for remediation.

## Current Security Posture & Limitations

SiliconPath is primarily an open aggregator (read-only for users). However, it does contain dormant logic for user accounts and a social network.

1. **Authentication:** Currently disabled for end-users on the primary UI. Admin routes (like scraper triggers) are protected via Vercel Cron secrets or require the `SUPABASE_SERVICE_ROLE_KEY`.
2. **Admin Operations:** Admin operations bypass Row-Level Security (RLS) policies by design and rely entirely on the secure server-side execution environment of Vercel. 
3. **Known Limitation (Admin Auth):** The admin authentication relies solely on secret header verification (`Authorization: Bearer <secret>`). There is no dedicated admin dashboard with OAuth or 2FA implemented yet.
4. **Data Encryption:** All data in transit is encrypted via HTTPS/TLS (enforced by Vercel and Supabase/Neon). Data at rest is encrypted by default by the database providers (Supabase on AWS/GCP, Neon on AWS).
5. **Secrets Management:** Secrets are stored exclusively in Vercel Environment Variables. The `.env.local` file is explicitly ignored in Git.

## API Key Rotation

The multi-provider AI fallback chain relies on several API keys (AWS, Nvidia, Cloudflare, Groq, Gemini). If any key is compromised, it should be immediately revoked at the provider level, and the new key updated in the Vercel Dashboard. The system is designed to gracefully fallback to the next provider during a single provider's downtime or key rotation.
