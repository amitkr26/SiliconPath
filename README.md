<div align="center">

# 🎓 BerojgarDegreeWala

### **India's Premier Verified Opportunity Engine & Knowledge Ecosystem for Semiconductor, VLSI & Microelectronics Engineers**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment Status](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Explore Openings**](https://berojgardegreewala.vercel.app/opportunities) • [**July 2026 News Feed**](https://berojgardegreewala.vercel.app/news) • [**VLSI Academy**](https://berojgardegreewala.vercel.app/academy) • [**Documentation**](ARCHITECTURE.md)

</div>

---

## 📌 Executive Summary

**BerojgarDegreeWala** is an open, unified opportunity engine and technical ecosystem built specifically for microelectronics, VLSI design, semiconductor manufacturing, and embedded system engineers across India and globally.

By combining real-time multi-source web scrapers, automated RSS ingestion, structured VLSI curriculum tracks, and an AI-driven career assistant, BerojgarDegreeWala bridges the gap between research institutions (**DRDO**, **ISRO**, **CSIR**, **IIT Bombay**, **IIT Madras**, **IISc**) and global semiconductor leaders (**Intel**, **Qualcomm**, **AMD**, **TSMC**, **Arm Ltd**, **Graphcore**, **Tata Electronics**).

---

## ✨ Key Platform Features

### 🎯 1. Verified Live Opportunity Engine (`/opportunities`)
- **Direct Portal Links**: Zero dead links or fake aggregators. Every listing links directly to official government notifications (`drdo.gov.in`, `isro.gov.in`, `csir.res.in`, `iitb.ac.in`) or verified Greenhouse/Workday corporate portals.
- **Categorized Openings**: JRF (Junior Research Fellowship), SRF, PhD admissions, Postdoc, DRDO/ISRO Scientist B recruitment, Private VLSI/ASIC Engineer roles, and Internships.
- **Smart Filters**: Multi-field search by keyword, location (Bangalore, Hyderabad, Pune, Remote), eligibility (B.Tech, M.Tech, PhD), and deadline window.

### 📰 2. July 2026 Live Semiconductor News Stream (`/news`)
- **Real-Time News Aggregation**: Automated daily RSS sync from premier industry publications including *IEEE Spectrum*, *EE Times*, *Semiconductor Engineering*, and *SemiWiki*.
- **July 2026 Industry Coverage**: Major coverage of India Semiconductor Mission ($15B Fab investments), TSMC 2nm N2 GAA, Intel 18A EUV adoption, ISRO RISC-V space-grade processors, and Cadence/Synopsys AI-driven EDA design flows.

### 📚 3. VLSI Academy (`/academy`)
- **7 Core Microelectronics Tracks**:
  1. Verilog HDL & Digital Logic Design
  2. SystemVerilog & UVM Testbench Verification
  3. Physical Design, Floorplanning & PnR
  4. Static Timing Analysis (STA) & Synthesis
  5. RTL Design & System-on-Chip (SoC) Architecture
  6. Design for Testability (DFT) & Boundary Scan
  7. FPGA Prototyping & Emulation

### 🌐 4. Hardware Network & Community (`/network`, `/community`)
- Interactive community hub for hardware engineers, verified recruiters, and academic researchers to share tapeout insights, paper summaries, and interview experiences.

### 🤖 5. AI Career Assistant (`/chat`)
- Context-aware AI copilot tuned specifically for microelectronics career guidance, resume formatting, gate/NET preparation, and technical interview questions.

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │     BerojgarDegreeWala Client (Next.js 14)    │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                   ┌──────────────────┴──────────────────┐
                                   ▼                                     ▼
                      ┌─────────────────────────┐           ┌─────────────────────────┐
                      │    Supabase (Main DB)   │           │    Neon PostgreSQL DB   │
                      │  - Opportunities        │           │  - Analytics Mirror     │
                      │  - News Articles        │           │  - Search & Click Logs  │
                      │  - User Auth & Profiles │           │  - Trending Cache       │
                      └────────────▲────────────┘           └────────────▲────────────┘
                                   │                                     │
                                   └──────────────────┬──────────────────┘
                                                      │
                                     ┌────────────────┴────────────────┐
                                     │      Automated Multi-Scrapers   │
                                     │ - DRDO / ISRO / CSIR Ingestion  │
                                     │ - Greenhouse / Workday API      │
                                     │ - IEEE / EE Times RSS Sync      │
                                     └─────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Server-side rendering, static generation, API routes |
| **Language** | [TypeScript 5.4](https://www.typescriptlang.org/) | Type-safe enterprise codebase |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Glassmorphism UI, custom HSL color palette, dark mode |
| **Icons** | [Lucide React](https://lucide.dev/) | High-performance vector UI icons |
| **Primary Database** | [Supabase](https://supabase.com/) | PostgreSQL, Auth, Row-Level Security (RLS) |
| **Analytics & Cache DB** | [Neon PostgreSQL](https://neon.tech/) | Serverless PostgreSQL replica, query analytics, click tracking |
| **AI Providers** | OpenRouter, Groq, Gemini, NVIDIA NIM | LLM career guidance & automated parsing |
| **Deployment** | [Vercel](https://vercel.com/) | Global Edge Network, automated Vercel Cron Jobs |

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm**: `v9.0.0` or higher

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/amitkr26/BerojgarDegreeWala.git
   cd BerojgarDegreeWala/frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the `frontend/` directory with the following variables:
   ```env
   # --- App Config ---
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=https://berojgardegreewala.vercel.app
   NEXT_PUBLIC_APP_NAME=BerojgarDegreeWala
   NODE_ENV=development

   # --- Supabase (Primary Database & Auth) ---
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # --- Neon (Analytics & Mirror DB) ---
   DATABASE_URL=postgresql://user:password@ep-green-paper.neon.tech/neondb?sslmode=require
   NEON_DATABASE_URL=postgresql://user:password@ep-green-paper.neon.tech/neondb?sslmode=require

   # --- AI Providers ---
   GROQ_API_KEY=your-groq-api-key
   GEMINI_API_KEY=your-gemini-api-key
   OPENROUTER_API_KEY=your-openrouter-api-key

   # --- Cron & Communication ---
   CRON_SECRET=your-cron-secret
   RESEND_API_KEY=your-resend-api-key
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📡 API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/opportunities` | `GET` | Fetch verified opportunities with category, location, and search query filters |
| `/api/news` | `GET` | Fetch latest semiconductor and VLSI industry articles |
| `/api/news/sync` | `GET / POST` | Trigger automated RSS sync across IEEE Spectrum, EE Times, and Semi Engineering |
| `/api/scrapers/run-all` | `GET / POST` | Master scraper endpoint for DRDO, ISRO, CSIR, and corporate job portals |
| `/api/subscribe` | `POST` | Subscribe email/Telegram for daily job digest notifications |
| `/api/chat` | `POST` | AI Career Assistant completion stream |

---

## 📄 License & Community

This project is open-source under the [MIT License](LICENSE).

Made with ❤️ for the Indian Semiconductor & Electronics Community.

---

<div align="center">
  <sub>BerojgarDegreeWala — Empowering the Next Generation of Hardware Engineers.</sub>
</div>
