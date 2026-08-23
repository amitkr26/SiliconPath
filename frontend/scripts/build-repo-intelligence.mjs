import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
const targetDir = path.resolve(rootDir, 'project-bible/00-repository-intelligence');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Writing Repository Intelligence System to:', targetDir);

// 1. 00-REPOSITORY-MAP.md
const doc00 = `# 00-REPOSITORY-MAP — Master Repository Topography

**Project:** SiliconPath / BerojgarDegreeWala  
**Domain:** Semiconductors, VLSI, Embedded Systems, Deep-Tech Career Intelligence  
**Pattern:** Next.js 14 Modular Monolith (Vercel) + Standalone Express Backend Replica (Render) + Dual Database (Supabase PostgreSQL + Neon Analytics) + 9-Provider AI Gateway  

---

## 1. Top-Level Directory Topology

\`\`\`
SiliconPath / BerojgarDegreeWala Root
├── frontend/                  [Production Core] Next.js 14 App Router, UI, API Routes, Tailwind/CSS
│   ├── src/app/              App Router pages, layouts, and 165 API route handlers
│   ├── src/components/       Reusable UI components (Profile, ATS, Jobs, Feed, Layout)
│   ├── src/lib/              Universal auth, Supabase/Neon clients, scrapers, validation
│   ├── src/types/            Authoritative TypeScript data schemas and entity interfaces
│   ├── supabase/migrations/  PostgreSQL DDL schema migrations (32 migration files)
│   └── scripts/              Forensic audit suites, E2E runners, database probing tools
├── backend/                   [Replica & Microservices] Standalone Express, OpenAPI, AI Gateway
│   ├── server/               Express 4 REST server replicating Next.js API endpoints
│   ├── api/                  OpenAPI specifications, taxonomy validation, SEO linking tests
│   ├── ai-gateway/           9-provider LLM fallback engine with rate limiting & cooldowns
│   ├── worker/               Background scraper cron workers & queue processors
│   └── docs/                 Frontend-to-backend API mapping and parity matrices
├── project-bible/             [Permanent Engineering Intelligence] Specifications, ADRs, Section Guides
│   ├── 00-repository-intelligence/ Permanent self-documenting intelligence layer
│   ├── 00-ai-operating-manual/ Operational guidelines and LLM constraints
│   ├── 01-product/ to 23-reference/ Modular architectural section guides
│   └── *.md                  Root architectural snapshots, changelogs, handoffs, and state files
├── docs/                      [Historical Audits & Evidence] Verification reports & audit logs
│   ├── audit-reports/        Historical gate verification evidence
│   └── session-reports/      Chronological session logs
├── neon/                      [Analytics DDL] Schema definitions for Neon PostgreSQL analytics mirror
└── package.json               Root workspace orchestration manifest
\`\`\`

---

## 2. Directory Matrix & Responsibilities

| Directory | Primary Purpose | Runtime Environment | Production Critical | Maintenance Model |
| :--- | :--- | :--- | :--- | :--- |
| \`frontend/\` | End-to-end web platform serving Public, Candidate, Employer, and Admin portals | Vercel Edge / Serverless (Node.js 20) | **YES (Authoritative)** | Active Primary Codebase |
| \`frontend/src/app/api/\` | 165 Next.js API Route Handlers for full platform CRUD and AI | Vercel Serverless Functions | **YES (Authoritative)** | Active Primary API |
| \`frontend/supabase/\` | Live database migrations, DDL, RLS policies, and triggers | Supabase PostgreSQL 15 | **YES (Authoritative)** | Active Schema Source |
| \`backend/server/\` | Independent Express REST server replicating Next.js endpoints | Render Web Service | Secondary (Replica) | Continuous Parity |
| \`backend/ai-gateway/\` | High-resilience 9-provider LLM gateway | Render / Standalone package | Shared Component | Active Provider Engine |
| \`backend/api/\` | OpenAPI contracts, content validation suites | CI / Build verification | Verification Layer | Active Contract Store |
| \`project-bible/\` | Canonical system documentation, ADRs, specs | Documentation / IDE | **YES (Knowledge Layer)** | Updated on Every Change |
| \`docs/\` | Archived audit reports and historical session logs | Archive | Reference | Read-Only Historical |
`;

fs.writeFileSync(path.join(targetDir, '00-REPOSITORY-MAP.md'), doc00);
console.log('✅ Created 00-REPOSITORY-MAP.md');
`;

fs.writeFileSync(path.resolve(__dirname, 'build-repo-intelligence.mjs'), doc00);
console.log('Initialized generator helper.');
