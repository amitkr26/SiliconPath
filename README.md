<div align="center">

# 🎓 BerojgarDegreeWala

### **India's Premier Verified Portal for Semiconductor, VLSI & Global Research Career Opportunities**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Orchestrated-326CE5?style=for-the-badge&logo=kubernetes)](https://kubernetes.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Deployment Status](https://img.shields.io/badge/Vercel-Live-000000?style=for-the-badge&logo=vercel)](https://berojgardegreewala.vercel.app)

[**Live Platform**](https://berojgardegreewala.vercel.app) • [**Jobs & Opportunities**](https://berojgardegreewala.vercel.app/opportunities) • [**VLSI Courses**](https://berojgardegreewala.vercel.app/academy) • [**Professional Network**](https://berojgardegreewala.vercel.app/network) • [**Admin Command Center**](https://berojgardegreewala.vercel.app/admin)

</div>

---

## 📌 Executive Summary

**BerojgarDegreeWala** is an enterprise-grade, unified career portal and technical learning ecosystem designed specifically for microelectronics, VLSI design, semiconductor manufacturing, embedded systems engineers, and scientific researchers.

By combining real-time multi-source career scrapers, automated RSS news aggregation, structured VLSI Courses, candidate `@username` verified profiles, employer portals, and an AI-driven career assistant, BerojgarDegreeWala bridges **150+ global national laboratories, universities, semiconductor foundries, and EDA leaders**.

---

## 🌐 150+ Global Master Source Matrix

### 1. 🇮🇳 India (Govt, Defence PSUs, Telecom, Power, Railways, Universities)
- **Space & Defence**: DRDO, ISRO, BARC, DAE, IGCAR, RRCAT, VECC, NFC, AERB, ADA, CSIR (CEERI, NPL, CSIO, CMERI, NAL, 4PI, IIP, IMMT, IICT, NEERI, IHBT, CBRI, CCMB, CDRI, CFTRI, NIO, CLRI, NGRI, AMPRI), ICMR, DBT, DST, SERB (ANRF), TIFR, NCBS, JNCASR, ARCI, CSTEP, C-DAC, SAMEER, SCL Mohali, C-MET, NIELIT, STQC, ERNET, MeitY, Digital India Corporation, ISM (India Semiconductor Mission), C2S (Chips to Startup).
- **Defence PSUs**: HAL, BEL, BDL, MIDHANI, BEML, MDL, GSL, GRSE, CSL, AVNL, Yantra India, Munitions India, India Optel, Troop Comforts, AWEIL.
- **Electronics, Telecom & Power**: ECIL, ITI Limited, C-DOT, RailTel, BSNL, MTNL, BHEL, Power Grid, EIL.
- **Railways**: Indian Railways Central, RDSO, RVNL, IRCON, CRIS, DFCCIL.
- **Academic Institutes**: 23 IITs, All NITs, All IIITs, IISc Bangalore, All IISERs, Central & State Universities.

### 2. 🇺🇸 United States
- **National Labs & Agencies**: DARPA, NASA, NIST, Sandia National Labs, Lawrence Berkeley National Lab (LBNL), Los Alamos National Lab (LANL), Oak Ridge National Lab (ORNL), Argonne National Lab.
- **Top Universities**: MIT, Stanford University, UC Berkeley, Caltech, Carnegie Mellon University (CMU), Georgia Tech, Purdue University, Cornell, UIUC, UCLA, University of Michigan.

### 3. 🇪🇺 Europe
- **Research Centers & Universities**: CERN, IMEC Belgium, CEA-Leti France, Fraunhofer Society (IIS / IZM), Max Planck Society, CNRS France, ETH Zurich, EPFL Switzerland, TNO Netherlands, Cambridge University, Oxford University, Imperial College London.

### 4. 🌏 Asia-Pacific & Global Leaders
- **Japan**: RIKEN, AIST, JAXA, NIMS.
- **South Korea**: KAIST, KIST, ETRI.
- **China**: Chinese Academy of Sciences (CAS), Tsinghua University, Peking University.
- **Singapore**: A*STAR, NUS, NTU.
- **Taiwan**: ITRI, Academia Sinica, NTU.
- **Australia**: CSIRO.
- **Top Foundries & Semiconductor Giants**: TSMC, Intel, AMD, NVIDIA, Qualcomm, Broadcom, Samsung Semiconductor, SK hynix, Micron, Texas Instruments, NXP, Infineon, STMicroelectronics, Renesas, ADI, onsemi, GlobalFoundries, UMC, Tower, Wolfspeed, ARM Architecture, Microchip Technology, Espressif Systems, Bosch.
- **Top EDA & Equipment Manufacturers**: Cadence Design Systems, Synopsys, Siemens EDA, Ansys, Keysight, ASML Lithography, Applied Materials (AMAT), Lam Research, KLA Corporation, Tokyo Electron (TEL).

---

## 💻 Tech Stack & Infrastructure Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend & API** | Next.js 14 (App Router, Standalone Build Output) |
| **Language** | TypeScript 5.4 |
| **Styling** | Custom Neo-Brutalist & Slate Dark Themes (Vanilla CSS + Tailwind CSS) |
| **Database & ORM** | Supabase PostgreSQL & Neon DB (Serverless Postgres) |
| **Caching & Rate Limit**| Redis 7 |
| **AI Integration** | Groq Llama-3.1 & OpenRouter Gateway with Fallback |
| **Containerization** | Docker Multi-Stage Builds & Docker Compose |
| **Orchestration** | Kubernetes (Deployment, Service, NGINX Ingress, Cert-Manager) |

---

## 🐳 Containerization & Kubernetes Deployment

### 1. Local Container Execution (Docker Compose)
```bash
# Build and launch multi-container stack (Frontend + PostgreSQL + Redis)
docker-compose up -d --build

# View container status and logs
docker-compose ps
docker-compose logs -f frontend
```

### 2. Kubernetes Deployment (`k8s/`)
```bash
# Apply ConfigMap, Secrets, and Deployments
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify pod replicas and ingress routing
kubectl get pods -n production
kubectl get ingress -n production
```

---

## ⚡ Quick Start & Development

### Prerequisites
- Node.js 18.x or 20.x
- npm / yarn / pnpm / Docker

### Local Development Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run local development server
npm run dev

# Run production build check
npm run build
```

---

&copy; 2026 BerojgarDegreeWala. Built for India's semiconductor and VLSI engineering revolution.
