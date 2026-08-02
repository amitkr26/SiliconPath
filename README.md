# ⚡ SiliconPath — VLSI Opportunities Aggregator & Academy

> **Aggregated career opportunities + free structured VLSI learning. No login required.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald)](https://supabase.com/)

---

## What it is

SiliconPath is a single-purpose platform for semiconductor and VLSI engineers:

1. **Opportunity Aggregator (`/`)**
   - Curated JRF, SRF, PhD, fellowship, government and industry positions from DRDO, ISRO, CSIR, IITs, IISc, and semiconductor companies.
   - Search, categories, company directory, deadlines, verification status, calendar export, and link health checks.

2. **VLSI Academy (`/academy`)**
   - 7 structured tracks: Digital Logic, Verilog HDL, SystemVerilog, UVM, RTL Design & Synthesis, Physical Design, VLSI Interview Prep.
   - Day-wise lessons with YouTube content, practice quizzes, and end-of-track gating assessments.
   - Progress and bookmarks are stored locally in the browser — no accounts.

No login, no social network, no profiles. Just opportunities and learning.

## Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Database**: Supabase (Postgres) — opportunities, academy content, news, subscribers
- **Analytics**: Neon Postgres
- **AI**: classify/expire/summarize for opportunity ops (multi-provider gateway)
- **Workspaces**: `backend/api` (shared utils), `backend/ai-gateway` (AI provider routing)

## Quick start

```bash
npm install
cd frontend
cp .env.example .env.local   # fill with your Supabase/Neon credentials
npm run dev
```

## Repo layout

```text
SiliconPath/
├── frontend/            # Next.js app (opportunities + academy)
├── backend/api          # shared API utils (validation, rate-limit, errors)
├── backend/ai-gateway   # AI provider fallback chain
├── neon/                # analytics schema
└── vercel.json          # deployment + crons
```

## Scripts

```bash
npm run dev        # dev servers
npm run build      # production build
npm run test       # jest tests
```
