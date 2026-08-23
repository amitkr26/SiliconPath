# 03-ARCHITECTURE-MAP — Authoritative System Architecture

SiliconPath operates as a **modular monolith** on Next.js 14 deployed to Vercel, backed by a unified Supabase PostgreSQL database (`aqauempuwmbizqoaolop`) and Neon analytics database.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 14 Modular Monolith (Vercel)                   │
├───────────────────┬────────────────────┬────────────────┬────────────────┤
│   PUBLIC PORTAL   │  CANDIDATE PORTAL  │ EMPLOYER SUITE │  ADMIN CONSOLE │
│  (Navbar + Hero)  │ (Candidate Shell)  │(Employer Shell)│ (Admin Shell)  │
├───────────────────┴────────────────────┴────────────────┴────────────────┤
│       Universal Auth Guard (Cookie Session + Authorization Bearer JWT)   │
├──────────────────────────────────────────────────────────────────────────┤
│                  API Route Handlers (frontend/src/app/api/*)             │
│            • Public Reads  • Candidate Actions  • Employer Endpoints     │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼────────────────────────────┐
        ▼                             ▼                            ▼
  Supabase DB1 (Core & Social)   Neon DB 1 (Analytics)       AI Gateway (9 Providers)
  • opportunities (+created_by)  • click_events              • Groq (qwen/qwen3.6-27b)
  • user_profiles (+username)    • page_views                • Gemini 1.5 Pro/Flash
  • applications (+status)       • search_queries            • OpenRouter, Bedrock
  • candidate sub-resources      • opportunities_mirror      • DB-grounded RAG
  • company_claims
  • recruiter_saved_candidates
  • employer_settings
  • workspace_members
```
