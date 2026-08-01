<div align="center">

# 🎓 BerojgarDegreeWala

### **India's Premier Verified Platform for Semiconductor & VLSI Engineers**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment Status](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Silicon Openings**](https://berojgardegreewala.vercel.app/opportunities) • [**VLSI Courses**](https://berojgardegreewala.vercel.app/academy) • [**Hardware Network**](https://berojgardegreewala.vercel.app/network font) • [**Admin Command Center**](https://berojgardegreewala.vercel.app/admin)

</div>

---

## 📌 Executive Summary

**BerojgarDegreeWala** (SiliconPath Engine) is India's dedicated unified career ecosystem and learning platform built specifically for microelectronics, VLSI design, semiconductor manufacturing, and embedded systems engineers.

By combining real-time multi-source web scrapers, automated RSS ingestion, structured VLSI Courses, unique `@username` candidate profiles, organization portals, and an AI-driven hardware copilot, BerojgarDegreeWala connects research institutions (**DRDO**, **ISRO**, **CSIR**, **IIT Bombay**, **IIT Madras**, **IISc**) with global semiconductor leaders (**Intel**, **Qualcomm**, **AMD**, **TSMC**, **Arm**, **Texas Instruments**, **C-DAC**, **SCL**).

---

## ✨ Core Platform Architecture & Features

### 🎯 1. Silicon Openings Engine (`/opportunities`)
- **Direct Official Verification**: Every listing links directly to official government recruitment notifications (`rac.gov.in`, `isro.gov.in`, `csir.res.in`, `iitb.ac.in`) or corporate career portals.
- **Categorized Roles**: JRF (Junior Research Fellowship), SRF, PhD admissions, Postdoc, DRDO/ISRO Scientist vacancies, Private VLSI/ASIC Engineer roles, and Internships.
- **Ponytail Lazy Loading**: Heavy interactive client components utilize `nextDynamic` loading for high performance and hydration safety.

### 📚 2. VLSI Courses (`/academy`)
- **Structured Self-Paced Tracks**:
  1. *Digital Logic & SystemVerilog Fundamentals*
  2. *RTL Verification with SystemVerilog & UVM*
  3. *Physical Design, Floorplanning & Primetime STA*
  4. *FPGA Architecture, Xilinx Vivado & IP Cores*
  5. *RISC-V Microarchitecture & Custom Instruction Extension*
  6. *Analog IC Design & Cadence Virtuoso Fundamentals*
- **Curated Open Resources**: Direct integration with NPTEL (IIT Kharagpur/Madras), ChipVerify tutorials, HDLBits auto-graded labs, and OpenLANE Sky130 PDK flows.

### 🌐 3. Hardware Network & Direct Messaging (`/network`, `/messages`)
- **Unique `@username` Profiles**: Candidates and researchers claim verified unique handles (e.g. `@ananya_vlsi`) for direct talent matching.
- **Employer Portals**: Organizations post JRF, PhD, and microelectronics roles under official organization handles.
- **Instant Messaging & Connection Approvals**: Full multi-threaded direct messaging and connection request management (`accepted`, `declined`).

### 🛡️ 4. Standalone Admin Command Center (`/admin`)
- **Isolated Layout**: Fully separated from public website navigation with a dark executive theme (`Slate-950`).
- **25+ Monitored Scraper Sources & RSS Feeds**: Real-time sync logs for DRDO RAC, ISRO Careers, CSIR Labs, IIT Microelectronics, IEEE Spectrum, EE Times, Semiconductor Engineering, EDN, SemiWiki, and Electronics Weekly.

---

## 💻 Tech Stack & Engineering Standards

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.4 |
| **Styling** | Custom Neo-Brutalist & Slate Dark Themes (Vanilla CSS + Tailwind CSS) |
| **Database** | Supabase PostgreSQL & Neon DB |
| **Lazy Loading** | Ponytail Lazy Loading Pattern (`nextDynamic`) |
| **Icons** | Lucide React |

---

## ⚡ Quick Start & Deployment

### Prerequisites
- Node.js 18.x or 20.x
- npm / yarn / pnpm

### Environment Setup (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation & Execution
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle
npm run build
```

---

&copy; 2026 BerojgarDegreeWala. Built for India's semiconductor and VLSI revolution.
