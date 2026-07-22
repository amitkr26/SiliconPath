# ⚡ SiliconPath — VLSI Academy & Hardware Professional Network

> **The Dedicated Professional Network and VLSI Academy for Semiconductor, Electronics, and Hardware Engineers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-emerald)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Production%20Status-100%25%20Verified%20%26%20Live-brightgreen)](https://siliconpath.vercel.app/)

---

## 🚀 Overview & Product Scope

**SiliconPath** is a standalone, targeted platform designed specifically for hardware and semiconductor engineers to learn, network, and advance their careers. It combines structured VLSI educational tracks with a LinkedIn-style social layer.

### 🌟 Core Features

1. 🎓 **VLSI Academy (`/academy`)**
   - 7 Structured, Self-Paced Learning Tracks:
     - **Digital Logic Fundamentals**
     - **Verilog HDL**
     - **SystemVerilog for Verification**
     - **Universal Verification Methodology (UVM)**
     - **RTL Design & Synthesis**
     - **Physical Design & Backend (OpenLane/SkyWater 130nm)**
     - **VLSI Interview Preparation**
   - Interactive day-wise lesson plans, code snippets, quizzes, and track progress tracking.

2. 👥 **Professional Hardware Network (`/network`, `/feed`, `/messages`)**
   - Dedicated engineering social feed (`/feed`) to share RTL designs, tapeout updates, and hardware projects.
   - Professional connection cards, connection requests, and search (`/network`).
   - Direct real-time messaging threads (`/messages`).

3. 📄 **AI-Powered Resume Builder (`/resume`)**
   - Built-in ATS resume optimization and hardware-specific skill summary suggestions.

4. 🤖 **AI Engineering Assistant (`/chat`)**
   - Full-screen AI assistant with multi-model fallback chain for hardware explanations, Verilog debugging, and interview prep.

---

## 🛠️ Repository Structure

```text
SiliconPath/
├── frontend/                     # Next.js 14 Web Application (App Router)
│   ├── src/app/                  # Routes: /academy, /feed, /network, /messages, /profile, /resume, /chat
│   ├── src/components/           # Navbar, Feed Cards, Academy Layouts, Network Cards
│   └── src/lib/                  # Supabase, AI providers, Utilities
└── vercel.json                   # Deployment configurations
```

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/amitkr26/SiliconPath.git
cd SiliconPath/frontend

# Install dependencies and start local dev server
npm install
npm run dev
```

Live Production Site: **[https://siliconpath.vercel.app/](https://siliconpath.vercel.app/)**
