# Prompt for ClickUp AI — Build the BerojgarDegreeWala Project Bible

Paste into ClickUp AI/Brain² with GitHub access to `amitkr26/BerojgarDegreeWala` connected. Attach `00-ai-operating-manual.md` and `01-product.md` along with this prompt — these two documents are already final policy/vision documents; treat them as fixed authoritative input, do not rewrite or contradict them.

---

You are building out `project-bible/` inside this repository — a complete, AI-readable and human-readable documentation set covering the full BerojgarDegreeWala platform (aggregator + VLSI Academy + LinkedIn-style network with separate job-seeker and employer portals). The end goal: any future coding agent should be able to read this documentation set and understand the project without further explanation from the owner.

**Core rule for this entire task: documentation describing the current implementation must be grounded in actual, verified inspection of the live repository — never invented, assumed, or copied from aspirational planning notes without checking. Where the codebase doesn't yet match the intended design, document the gap explicitly rather than writing docs that describe the aspiration as if it were current reality.**

## PHASE 0 — Load Fixed Inputs, Resolve Open Questions (mandatory gate before anything else)

1. Read `00-ai-operating-manual.md` and `01-product.md` (attached) — these are final, do not modify them. Everything you write in Phases 1+ must be consistent with them.
2. Before writing any codebase-descriptive documentation, resolve these four open items by actually inspecting the current repo state — report findings with evidence for each:
   - **Codebase ownership:** confirm `berojgardegreewala/` is the single primary deployed codebase (Vercel) and `backend/` is a secondary Render-hosted proxy, per `00-ai-operating-manual.md` §6. Investigate the `berojgardegreewala/` directory's actual status (active code? legacy? something else?) and report what it is.
   - **Database architecture:** PR #18 changed the database count from 4 to 3. Report exactly what changed (which database was removed/merged, what tables moved where) and whether this is confirmed-approved or still an open decision. Do not write `06-database/` documentation assuming either the old 4-DB or new 3-DB architecture is correct until this is confirmed — report it as a decision point if still unresolved.
   - **Academy track structure:** PR #18 references "7 academy tracks." The project's established plan (per prior sessions) was 3 tracks (Digital Design/RTL, Verification SV+UVM, Physical Design+Interview Prep). Investigate what actually exists in the current codebase/seed data and report the discrepancy — do not silently pick one when writing `10-academy/`.
   - **Organization seed data:** PR #18 references "25 verified orgs." Query the actual current data and report what "verified" meant in practice (were career page URLs actually checked, or just names listed?) — cross-reference against the two source lists already compiled (`berojgardegreewala-expanded-global-source-list-v3.md`, ~400 entries) to see if the seeded 25 are a legitimate subset or a divergent, unreviewed list.

**Gate: report all four findings, with evidence, before proceeding to Phase 1. If any are still genuinely undecided, flag them as open decisions for the project owner rather than resolving them yourself per §2 and §4 of the AI Operating Manual (decisions affecting database architecture or core structure are not yours to make autonomously).**

## PHASE 1 — Foundation Documentation (grounded, low-ambiguity sections)

These sections describe policy/architecture that's mostly stable regardless of Phase 0's open questions — write these first:

- `02-design/` — design system, component library, layout rules, accessibility, responsive rules (base this on whatever design system actually exists in the codebase now — if a light-theme responsive overhaul was done per a prior PR, document what's actually there, not what was originally planned)
- `13-security/` — document actual current auth/RLS/secrets handling, cross-referenced against the security fixes claimed in PR #18 (verify each claimed fix is actually present in the code before documenting it as implemented)
- `14-devops/` — actual current Vercel/Render/Supabase/Neon/GitHub Actions setup, as it genuinely exists today

## PHASE 2 — Product & Engineering Documentation (requires Phase 0's answers)

Only proceed with these once Phase 0's four questions are resolved or explicitly documented as pending decisions:

- `04-frontend/`, `05-backend/` — actual folder structure, conventions, routing, state management as they exist in `berojgardegreewala/` today
- `06-database/` — the CONFIRMED database architecture (2, 3, or 4 — per Phase 0's finding), every table, every RLS policy, actual current migration files
- `07-api/` — every actual current endpoint, with real request/response examples pulled from the actual route handlers, not invented
- `09-scrapers/` — actual current source registry (cross-referenced against the two compiled source lists), actual adapter implementations, actual current yield/health status
- `10-academy/` — the CONFIRMED track structure (per Phase 0's finding), actual current seed content

## PHASE 3 — Platform & Operational Documentation

- `08-ai/` — actual AI provider configuration, actual fallback chain, actual current working/broken status per provider (verify each with a real test call, don't assume from documentation)
- `11-employers/`, `12-users/` — actual current implementation status of these features (built-and-working vs. scaffolded-but-broken vs. not yet started) — be honest about partial implementation, don't document aspirational completeness
- `15-testing/`, `16-operations/` — actual current test coverage and monitoring, not a target state

## PHASE 4 — Meta Documentation

- `17-project/` — roadmap (consistent with `01-product.md`'s roadmap section), changelog, decision log (include the Phase 0 findings from this task as dated decision-log entries)
- `18-knowledge/` — niche domain reference content (career paths, terminology) — this can be written without codebase grounding since it's general knowledge, not implementation-specific
- `19-prompts/` — a library of ready-to-use prompts for common tasks, cross-referencing `00-ai-operating-manual.md`'s rules so future prompts don't need to restate them
- `20-master-index.md` — index tying every section together, plus explicit "Implementation Status" tags per section (Complete / Partial / Planned) so a future reader immediately knows what's real vs. aspirational

## Constraints Throughout

- Work in the phase order above — report after each phase, don't produce all 21 sections in one uninterrupted pass.
- Every section must open with Purpose / Scope / Dependencies / Implementation Status, per the structure already specified, and close with a Known Limitations section — this is where honesty about gaps between plan and reality belongs.
- Do not resolve Phase 0's open questions by picking whichever answer is easier to document — report them accurately, including if the answer is "unclear, needs owner decision."
- This documentation task itself follows the same rule as code changes: no claim of a section being "accurate" or "complete" without it being grounded in actual verified inspection of the current repo.
