# ⚡ BerojgarDegreeWala (BerojgarDegreeWala)

> **The Premier 3-in-1 Opportunity Aggregator, Professional Network, and VLSI Academy for Semiconductor, Electronics, and Hardware Engineers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Production%20Status-100%25%20Verified%20%26%20Live-brightgreen)](#)

---

## 🚀 Key Highlights & Architectural Overview

BerojgarDegreeWala eliminates the need to visit 100+ separate websites (DRDO, ISRO, CSIR, IITs, IISc, BARC, semiconductor foundries, EDA software providers, and global chipmakers). Everything is aggregated, verified, and updated daily in one place.

### 🌟 Core Features

1. 💼 **Opportunity Aggregator (100% Verified)**
   - **104+ Active Verified Opportunities** across **88 Registered Organizations** (TSMC, Intel, Qualcomm, NVIDIA, AMD, Texas Instruments, Tata Electronics, Micron, Synopsys, Cadence, Arm, ASML, CEERI, IIT Bombay, IISc, etc.).
   - **Direct Official Career Links**: Every opportunity features direct, tested links to official application portals — zero search wrappers or broken links.
   - **Daily Auto-Cleanup**: Automated daily cron jobs (`/api/cron/cleanup`) de-activate expired postings automatically.

2. 🤖 **Full-Screen ChatGPT / Claude / Gemini Style AI Assistant (`/chat`)**
   - Dedicated full-screen chat interface with **Collapsible History Sidebar** (`+ New Chat`, past session list, and model selection).
   - 🎙️ **Voice Assistant (Speech-to-Text)**: Click the mic icon to speak queries in Hindi/English; text auto-populates and submits.
   - 🔊 **Read Aloud (Text-to-Speech)**: Click the speaker button on AI responses to hear step-by-step technical explanations spoken aloud.
   - **Multi-Tier Zero-Cost AI Gateway**: 9-tier fallback chain (OpenRouter, NVIDIA NIM, Gemini 1.5 Flash, Groq, Cloudflare, AWS Bedrock, HuggingFace, AgentRouter, and local **OmniRouter Gateway on Port 20128**).

3. 🎓 **VLSI Academy (`/academy`)**
   - 7 Structured, Self-Paced Learning Tracks:
     - **Digital Logic Fundamentals**
     - **Verilog HDL**
     - **SystemVerilog for Verification**
     - **Universal Verification Methodology (UVM)**
     - **RTL Design & Synthesis**
     - **Physical Design & Backend (OpenLane/SkyWater 130nm)**
     - **VLSI Interview Preparation**
   - Day-wise lesson plans, code snippets, quizzes, and track completion progress tracking.

4. 📰 **Live Semiconductor & Electronics News Feed (`/news`)**
   - Live RSS scraper engine parsing **IEEE Spectrum, Semiconductor Engineering, EE Times, Electronics Weekly, SemiWiki, and Electronics For You**.
   - Direct **"Read Original Source"** buttons (`target="_blank"`) on every article card.
   - Real-time topic tag filtering (*Semiconductor, VLSI, AI Chips, Research, India, Industry, Jobs*).

5. 👥 **Professional Hardware Network (`/network`, `/feed`, `/messages`)**
   - LinkedIn-style professional networking for hardware engineers.
   - Connection cards, pending requests, direct message threads (`/messages`), and engineering social feed (`/feed`).

6. 📄 **AI-Powered Resume Builder (`/resume`)**
   - Built-in resume builder with AI summary generation (`/api/resume/ai-suggest`).

---

## 🛠️ Repository & Microservices Structure

```text
BerojgarDegreeWala/
├── frontend/                     # Next.js 14 Web Application (App Router)
│   ├── src/app/                  # 16+ Verified Routes & REST API Endpoints
│   │   ├── (public routes)       # /, /opportunities, /news, /organizations, /resources
│   │   ├── (product routes)      # /academy, /chat, /network, /messages, /feed, /profile, /resume
│   │   └── api/                  # 30+ REST & Automated Cron Endpoints
│   ├── src/components/           # Reusable Component System
│   └── src/lib/                  # Supabase, Neon DB, AI providers, Scrapers, Utilities
├── backend/
│   ├── ai-gateway/               # Centralized Multi-Provider AI Package
│   └── api/                      # Shared API Utilities & Validation Schemas
├── scripts/
│   ├── omnirouter-gateway.js     # Zero-Cost Local AI Fallback Gateway (Port 20128)
│   └── auto-daily-scraper.js     # Automated Daily Scraper Service
├── vercel.json                   # Vercel Production Cron Configurations
└── project-bible/                # Complete Architectural Specifications
```

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- Node.js 18+
- npm or pnpm
- Local dev server (`http://localhost:3000`)

### 2. Frontend & AI Gateway Launch
```bash
# Clone the repository
git clone https://github.com/amitkr26/BerojgarDegreeWala.git
cd BerojgarDegreeWala

# Install dependencies & run local dev server
cd frontend
npm install
npm run dev
```

### 3. Start Local OmniRouter Zero-Cost AI Gateway (Port 20128)
```bash
# Run OmniRouter local proxy
npm run omnirouter
```

---

## ⏰ Automated Daily Scraper Crons (`vercel.json`)

| Endpoint | Schedule (UTC) | Description |
|---|---|---|
| `/api/cron/scrape-india` | `0 0 * * *` (00:00 Daily) | Aggregates DRDO, ISRO, CSIR, BARC & IIT openings |
| `/api/cron/scrape-global` | `0 4 * * *` (04:00 Daily) | Aggregates global semiconductor & fabless jobs |
| `/api/cron/scrape-news` | `0 6 * * *` (06:00 Daily) | Parses IEEE Spectrum, SemiEngineering, EE Times RSS feeds |
| `/api/cron/digest` | `0 8 * * *` (08:00 Daily) | Sends personalized daily job digests |
| `/api/cron/cleanup` | `0 2 * * 0` (Weekly / Daily) | Automatically deactivates expired opportunities |

---

## 📄 Documentation & Audit Report

For complete system audits and detailed technical specifications:
- 🛡️ **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** — Comprehensive System Audit & Production Readiness Report.
- 📖 **[Project Bible](./project-bible)** — Architecture & API specs.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.
