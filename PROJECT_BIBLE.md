# 📜 BerojgarDegreeWala — Project Bible & Master Architectural Specification

> **Version**: 3.0.0 (Enterprise Production Edition)  
> **Target Ecosystem**: Microelectronics, VLSI Design, Semiconductor Fabrication, Embedded Systems, & Global Scientific Research Careers  
> **Deployment Endpoint**: [https://berojgardegreewala.vercel.app](https://berojgardegreewala.vercel.app)  
> **Source Repository**: [https://github.com/amitkr26/BerojgarDegreeWala.git](https://github.com/amitkr26/BerojgarDegreeWala.git)

---

## 🧭 1. Vision & Core Objectives

**BerojgarDegreeWala** is built to empower India's engineering talent and global researchers with a 100% verified, real-time career intelligence platform. It bridges the gap between academic graduates (B.Tech, M.Tech, PhD, Postdoc) and **150+ national research laboratories, government organizations, defence PSUs, top engineering institutes, global semiconductor foundries, and EDA technology giants**.

### Key Pillars:
1. **100% Verified Opportunities**: No unverified scrapers or generic placeholders. Every listing includes verified eligibility, stipend/salary, official application URLs, and strict category indexing.
2. **Multi-Database Resilience**: Enterprise architecture featuring 2 Supabase databases + 2 Neon PostgreSQL poolers for zero downtime, sub-second search, and disaster recovery.
3. **VLSI Course & Industry Academy**: Dedicated module offering curated courses, video tutorials, and industry roadmaps for physical design, RTL design, DFT, and analog layout.
4. **Professional Engineering Network**: Verified `@username` profiles, direct messaging, connection requests, and technical community feed.
5. **AI Career Assistant**: Embedded Groq Llama-3.1 model providing instant opportunity summaries, eligibility eligibility checks, and resume alignment feedback.

---

## 🗄️ 2. Multi-Database Architecture Blueprint (4-Database Strategy)

The platform utilizes a **4-Database Distributed Architecture** combining Supabase DBs for Auth/Realtime features with Neon Serverless PostgreSQL Poolers for high-concurrency read queries and telemetry:

```
                               ┌──────────────────────────────────────────────┐
                               │       BerojgarDegreeWala Application        │
                               └──────────────────────┬───────────────────────┘
                                                      │
         ┌─────────────────────────┬──────────────────┴──────────────────┬─────────────────────────┐
         │                         │                                     │                         │
         ▼                         ▼                                     ▼                         ▼
┌───────────────────┐    ┌───────────────────┐                 ┌───────────────────┐    ┌───────────────────┐
│ Supabase DB 1     │    │ Supabase DB 2     │                 │ Neon DB 1         │    │ Neon DB 2         │
│ (Primary App DB)  │    │ (Backup & Storage)│                 │ (Pooler / Search) │    │ (Telemetry/Logs)  │
└───────────────────┘    └───────────────────┘                 └───────────────────┘    └───────────────────┘
```

### Detailed Database Roles:

| Database Instance | Service | Connection Reference | Primary Role & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Supabase DB 1 (Primary)** | `aqauempuwmbizqoaolop` | `NEXT_PUBLIC_SUPABASE_URL` | **Primary Application DB**: Manages User Authentication, `@username` Profiles, Connections, Direct Messages, Bookmarks, and Realtime WebSockets. |
| **Supabase DB 2 (Secondary)** | `jbqjipwanfsxyqkfrrpx` | `SUPABASE_SECONDARY_URL` | **Disaster Recovery & Storage**: Secondary automated backup mirror, resume PDF bucket storage, and verification certificate assets. |
| **Neon DB 1 (Primary)** | `plain-glade-52224468` | `NEON_PRIMARY_DATABASE_URL` | **High-Concurrency Connection Pooler**: Handles high-speed read-heavy queries for 10,000+ opportunity listings, instant keyword search, and fast category filtering. |
| **Neon DB 2 (Secondary)** | `jolly-haze-11306362` | `NEON_SECONDARY_DATABASE_URL` | **Telemetry & Analytics**: Stores automated scraper execution logs, audit trails, system performance metrics, and failover search mirror. |

---

## 🌐 3. 150+ Organization Global Matrix

### 🇮🇳 1. India (Govt, Defence PSUs, Telecom, Power, Railways, Universities)
- **Government & Defence Research**: DRDO, ISRO, BARC, DAE, IGCAR, RRCAT, VECC, NFC, AERB, ADA, CSIR (CEERI, NPL, CSIO, CMERI, NAL, 4PI, IIP, IMMT, IICT, NEERI, IHBT, CBRI, CCMB, CDRI, CFTRI, NIO, CLRI, NGRI, AMPRI), ICMR, DBT, DST, SERB (ANRF), TIFR, NCBS, JNCASR, ARCI, CSTEP, C-DAC, SAMEER, SCL Mohali, C-MET, NIELIT, STQC, ERNET, MeitY, Digital India Corporation, ISM (India Semiconductor Mission), C2S (Chips to Startup).
- **Defence PSUs**: HAL, BEL, BDL, MIDHANI, BEML, MDL, GSL, GRSE, CSL, AVNL, Yantra India, Munitions India, India Optel, Troop Comforts, AWEIL.
- **Electronics, Telecom & Power**: ECIL, ITI Limited, C-DOT, RailTel, BSNL, MTNL, BHEL, Power Grid, EIL.
- **Railways**: Indian Railways Central, RDSO, RVNL, IRCON, CRIS, DFCCIL.
- **Academic Institutes**: 23 IITs, All NITs, All IIITs, IISc Bangalore, All IISERs, Central & State Universities.

### 🇺🇸 2. United States
- **National Labs & Agencies**: DARPA, NASA, NIST, Sandia National Labs, Lawrence Berkeley National Lab (LBNL), Los Alamos National Lab (LANL), Oak Ridge National Lab (ORNL), Argonne National Lab.
- **Top Engineering Universities**: MIT, Stanford University, UC Berkeley, Caltech, Carnegie Mellon University (CMU), Georgia Tech, Purdue University, Cornell, UIUC, UCLA, University of Michigan.

### 🇪🇺 3. Europe
- **Research Labs & Universities**: CERN, IMEC Belgium, CEA-Leti France, Fraunhofer Society (IIS / IZM), Max Planck Society, CNRS France, ETH Zurich, EPFL Switzerland, TNO Netherlands, Cambridge University, Oxford University, Imperial College London.

### 🌏 4. Asia-Pacific & Global Industry Leaders
- **Japan**: RIKEN, AIST, JAXA, NIMS.
- **South Korea**: KAIST, KIST, ETRI.
- **China**: Chinese Academy of Sciences (CAS), Tsinghua University, Peking University.
- **Singapore**: A*STAR, NUS, NTU.
- **Taiwan**: ITRI, Academia Sinica, NTU.
- **Australia**: CSIRO.
- **Top Foundries & Semiconductor Giants**: TSMC, Intel, AMD, NVIDIA, Qualcomm, Broadcom, Samsung Semiconductor, SK hynix, Micron, Texas Instruments, NXP, Infineon, STMicroelectronics, Renesas, ADI, onsemi, GlobalFoundries, UMC, Tower, Wolfspeed, ARM Architecture, Microchip Technology, Espressif Systems, Bosch.
- **Top EDA & Equipment Leaders**: Cadence Design Systems, Synopsys, Siemens EDA, Ansys, Keysight, ASML Lithography, Applied Materials (AMAT), Lam Research, KLA Corporation, Tokyo Electron (TEL).

---

## 💻 4. Tech Stack & File Directory Blueprint

```
berojgardegreewala/
├── frontend/                     # Next.js 14 App Router Application
│   ├── src/
│   │   ├── app/                  # App Router Pages & API Routes
│   │   │   ├── (auth)/login/     # Professional Sign In Page
│   │   │   ├── academy/          # VLSI Courses & Tutorial Hub
│   │   │   ├── admin/            # Isolated Admin Control Center
│   │   │   ├── api/              # Scraper APIs, Feed, Messages, Bookmarks
│   │   │   ├── network/          # Professional Engineering Network
│   │   │   ├── opportunities/    # SEO Clean Opportunity Detail Pages
│   │   │   ├── feed/             # Community News & Technical Feed
│   │   │   └── ask-ai/           # Groq Llama-3.1 AI Career Assistant
│   │   ├── components/           # Reusable Modern Component System
│   │   ├── config/               # Scraper Source Configs (global-master-sources.json)
│   │   └── lib/
│   │       ├── db/multi-db.ts    # Multi-Database Client & Failover Routing
│   │       ├── scrapers/         # Master Scrapers (National & Global)
│   │       └── ai/               # AI Engine Client Setup
│   ├── Dockerfile                # Production Multi-Stage Dockerfile
│   └── next.config.mjs           # Next.js Configuration with Standalone Output
├── backend/                      # Node.js Express Service API
├── k8s/                          # Production Kubernetes Manifests
│   ├── configmap.yaml            # ConfigMaps & Base64 Secrets
│   ├── deployment.yaml           # 3-Replica Pod Deployment
│   ├── service.yaml              # ClusterIP Service
│   └── ingress.yaml              # NGINX Ingress Routing & TLS
├── scripts/                      # Database Seeding & Verification Scripts
├── docker-compose.yml            # Local Multi-Container Stack (Frontend + Postgres + Redis)
├── README.md                     # Enterprise Platform Overview & Deployment Guide
└── PROJECT_BIBLE.md              # Master Single Source of Truth Architecture Specification
```

---

## 🤖 5. Operating Instructions for AI Agents & Developers

When working on this repository, all AI agents **MUST** strictly adhere to the following directives:

1. **Preserve Terminology Integrity**: Never revert to vague terms such as "hardware network" or "silicon openings". Use exact professional terms: *Microelectronics*, *VLSI Design*, *JRF*, *SRF*, *Research Associate*, *Postdoc*, *Foundry Process*, *RTL Verification*, *STA*.
2. **SEO & Clean URL Rules**: All opportunity detail pages MUST follow clean kebab-case slugs (`/opportunities/drdo-jrf-microelectronics-2026`). UUIDs in public URLs are strictly forbidden.
3. **Multi-Database Integrity**: Use `multi-db.ts` for database operations. Ensure read-heavy opportunity queries leverage Neon Connection Poolers while user session and state queries use Supabase Primary.
4. **Verification Rule**: Never declare a task complete without executing verification test commands (`npm run build` or live endpoint verification).

---

&copy; 2026 **BerojgarDegreeWala**. Built for India's microelectronics, VLSI, and global semiconductor engineering ecosystem.
