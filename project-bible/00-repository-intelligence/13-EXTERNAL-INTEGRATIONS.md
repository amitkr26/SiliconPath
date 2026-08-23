# 13-EXTERNAL-INTEGRATIONS — Third-Party Services Index

| Service | Category | Environment Variables | Usage |
| :--- | :--- | :--- | :--- |
| **Supabase** | Core Database & Auth | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Primary PostgreSQL & Auth |
| **Neon** | Analytics Database | `NEON_1_DATABASE_URL`, `NEON_2_DATABASE_URL` | Telemetry & Ingestion |
| **Render** | Backend Hosting | Render Environment Secret Vault | Standalone Express Server |
| **Vercel** | Frontend Hosting | Vercel Environment Configuration | Edge/Serverless Hosting |
| **Groq** | Primary Fast LLM | `GROQ_API_KEY` | AI Chat & Matching |
| **Google AI** | High-Context LLM | `GEMINI_API_KEY` | Grounded Summarization |
| **Resend** | Transactional Email | `RESEND_API_KEY` | Notifications & Alerts |
| **Telegram** | Alert Webhooks | `TELEGRAM_BOT_TOKEN` | Scraper Error Alerts |
