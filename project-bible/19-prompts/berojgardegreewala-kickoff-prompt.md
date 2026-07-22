# Antigravity Prompt — BerojgarDegreeWala Kickoff: Questions → Documentation → Build

Paste into Antigravity along with `00-ai-operating-manual.md`, `01-product.md`, `berojgardegreewala-master-specification.md`, and `berojgardegreewala-phase1-db-backend-prompt.md`. Read all four fully before doing anything else.

---

## What This Project Is (context from everything decided so far)

**BerojgarDegreeWala** is a fresh rebuild of a platform previously called BerojgarDegreeWala/BerojgarDegreeWala. The prior repository accumulated real architectural drift (duplicate schema generations, swapped database roles, contradictory "production ready" claims from prior audits that didn't match live reality) — this is a clean restart, not a continuation of that codebase.

**Core vision:** A single platform for the global semiconductor/VLSI/electronics/embedded/materials-science community that aggregates jobs, internships, PhD positions, fellowships, and scholarships directly from company/university/institution career pages — browsable and applyable without login — plus a free structured learning path (three tracks: Digital Design/RTL, Verification SystemVerilog+UVM, Physical Design+Interview Prep), plus a full LinkedIn-style professional network (profiles, connections, feed, messaging, employer job-posting) that's fully built and immediately available to anyone who registers, but de-emphasized (not forced) for anonymous visitors.

**Non-negotiables:** $0/month forever, free for users forever. Legitimate data sourcing only (no LinkedIn/Indeed scraping, no defeating anti-bot protection). Foundation and data integrity before feature expansion. Batch rollout, never big-bang. No claim of "done" without live evidence.

**Architecture decided so far:** 4 databases with strict single-purpose roles (Supabase Primary = core live data, Supabase Secondary = archive only, Neon Primary = analytics only, Neon Secondary = read-replica only), Next.js App Router with co-located API routes as the backend (no separate proxy service), 7-provider AI fallback chain routed through a single centralized gateway, database + backend built and verified before any frontend work.

**Full detail lives in the attached documents — read them fully, don't work from this summary alone.**

---

## Your Task, In Order

### Step 1 — Ask Questions Before Doing Anything Else

Before writing a single document or line of code, identify every place where:
- The attached documents are ambiguous, silent, or could reasonably be interpreted more than one way.
- You (Antigravity) see a genuinely better technical or product approach than what's currently decided — **don't silently substitute your own judgment; surface it as a question or a proposed alternative with your reasoning, and let the human decide.** This applies especially to anything the AI Operating Manual flags as requiring approval: database architecture, authentication/authorization design, core structural decisions.
- Something practical and necessary for actually starting isn't yet specified (e.g., exact tech stack versions, hosting account specifics, naming conventions, testing framework choice, CI/CD approach).

Group your questions sensibly (don't ask 40 scattered questions one at a time — batch them by topic: e.g., "Technical Stack Questions," "Product Scope Questions," "Sequencing Questions"). For anything where you have a genuinely well-reasoned recommendation, state it alongside the question rather than just asking open-endedly — e.g., "I'd recommend X for reason Y, unless you have a preference otherwise" is more useful than a bare open question.

**Do not proceed past this step until the questions are answered.**

### Step 2 — Produce the Full Documentation Set

Once Step 1's questions are resolved, build out the complete documentation structure (following the 21-section Project Bible pattern already established: AI Operating Manual, Product, Design, UI, Frontend, Backend, Database, APIs, AI, Scrapers, Academy, Employers, Users, Security, DevOps, Testing, Operations, Project Management, Knowledge Base, Prompts, Master Index) — adapted for this fresh repository and incorporating the answers from Step 1.

This documentation must describe the intended, agreed design at this stage (since no code exists yet, there's nothing to verify against live reality yet) — but structure every section so that once code exists, "Implementation Status" can be honestly updated (Planned → In Progress → Complete), rather than writing it in a way that later has to be rewritten wholesale.

Where you're documenting something you proposed and got approval for in Step 1 that differs from the attached reference documents, note explicitly that it's a deliberate deviation with the reasoning, so this isn't lost context for future sessions.

### Step 3 — Begin Building (Database & Backend First)

Only after Step 2's documentation is in place, begin implementation following `berojgardegreewala-phase1-db-backend-prompt.md` — database and backend/API foundation first, verified working, before any frontend code. Report progress phase by phase per that document's structure.

**Do not skip ahead to frontend work even if it feels faster or more visually satisfying — the sequencing (docs → database → backend → frontend) is deliberate, based on what went wrong in the prior attempt at this project.**

---

## Standing Rules (apply throughout, not just at kickoff)

- Every claim of "done" or "working" needs live evidence, not just a description of intended behavior.
- Security gate (credential scan, `.gitignore` verification) before any git commit or push.
- No big-bang: don't build 10 features in one pass when 1 verified feature at a time is safer.
- If you find yourself about to make a consequential architectural decision unilaterally, stop and ask instead — this includes anything touching the 4-database split, authentication design, or core data models.
- You are encouraged to think critically and propose better approaches where you genuinely have them — the goal is a good outcome, not blind adherence to a spec written before any code existed. But propose, don't silently substitute.

Begin with Step 1.
