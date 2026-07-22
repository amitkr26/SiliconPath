# Release Notes — v1.0.0

## BerojgarDegreeWala — First Public Release

### What's Included

- **Opportunity Aggregation**: 332+ sources across ISRO, DRDO, CSIR, IndiaPSU, global semiconductor, international academic, fellowships — 7 adapter types
- **Smart Matching**: AI-powered opportunity matching against user profiles (qualification, specialization, NET/GATE, location preferences)
- **AI Chat**: Multi-provider AI assistant (7 fallback providers: Groq → OpenRouter → Cloudflare → Gemini → NVIDIA → Bedrock → HuggingFace)
- **Academy**: 7 learning tracks (VLSI Foundations, Digital Design, Verification, Physical Design, Analog, DFT, Semiconductor Business) with assessment gating
- **User Profiles**: Auth (email, Google, GitHub), resume parsing (AI + Document AI), skill extraction, bookmarking
- **Social Features**: Connections, messaging, feed, notifications, company profiles
- **Search**: Full-text search with faceted filters, autocomplete, spelling correction, trending, recommendations
- **Admin Dashboard**: Scraper management, analytics, subscriber management, link verification
- **Weekly Digest**: AI-curated weekly email digest with top opportunities

### Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS — deployed on Vercel (Hobby)
- **Backend**: Express.js scraper service — deployed on Render (Free)
- **Databases**: 2x Supabase (core + social), 2x Neon (analytics + replica) — all free tier
- **AI Gateway**: 7-provider fallback chain with cooldown, caching, telemetry
- **Monitoring**: Sentry error tracking + Plausible analytics + custom health checks
- **Infrastructure**: Free-tier-first (Vercel, Render, Supabase, Neon, Upstash, Resend)

### Known Issues

See `known-issues.md` for the complete list.
