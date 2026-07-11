# SiliconPath Documentation

This folder is the **single source of truth** for SiliconPath. It is written so that an AI agent (or a new engineer) can build the entire platform from these documents alone, with no external input required.

## Read in this order

| # | Doc | Purpose |
|---|-----|---------|
| 00 | [MASTER_PROMPT.md](MASTER_PROMPT.md) | The one-shot prompt to hand an AI agent. Start here. |
| 01 | [01-vision.md](01-vision.md) | Why this exists. Problem, vision, mission, users. |
| 02 | [02-product-principles.md](02-product-principles.md) | Non-negotiable product rules. |
| 03 | [03-prd.md](03-prd.md) | Full product requirements: every page, feature, flow. |
| 04 | [04-user-stories.md](04-user-stories.md) | Stories per role. |
| 05 | [05-ux-spec.md](05-ux-spec.md) | Per-page UX: layout, states, responsive, a11y. |
| 06 | [06-design-system.md](06-design-system.md) | Colors, type, components, tokens. |
| 07 | [07-architecture.md](07-architecture.md) | System design, data flow, deployment topology. |
| 08 | [08-folder-structure.md](08-folder-structure.md) | Exact repo layout. |
| 09 | [09-database.md](09-database.md) | Every table, column, index, RLS policy. |
| 10 | [10-api-spec.md](10-api-spec.md) | Every endpoint: method, input, output, errors. |
| 11 | [11-authentication.md](11-authentication.md) | Auth model, roles, sessions. |
| 12 | [12-security.md](12-security.md) | Threats, mitigations, RLS, secrets. |
| 13 | [13-environment.md](13-environment.md) | Every env var. |
| 14 | [14-ai-rules.md](14-ai-rules.md) | Hard rules for any AI agent working here. |
| 15 | [15-coding-standards.md](15-coding-standards.md) | Naming, TS, React, SQL, commits. |
| 16 | [16-promptbook.md](16-promptbook.md) | Reusable task prompts. |
| 17 | [17-definition-of-done.md](17-definition-of-done.md) | Ship checklist. |
| 18 | [18-deployment.md](18-deployment.md) | Vercel, Render, Supabase, Neon. |
| 19 | [19-ci-cd.md](19-ci-cd.md) | GitHub Actions, branches, rollback. |
| 20 | [20-monitoring.md](20-monitoring.md) | Logs, alerts, analytics. |
| 21 | [21-testing.md](21-testing.md) | Unit, integration, e2e, a11y. |
| 22 | [22-roadmap.md](22-roadmap.md) | Phases 1-4 + future. |
| 23 | [23-source-registry.md](23-source-registry.md) | Scraper source list. |
| 24 | [24-scraper-spec.md](24-scraper-spec.md) | Adapter behavior, health, scheduling. |
| 25 | [25-academy-curriculum.md](25-academy-curriculum.md) | 7 tracks, days, assessments. |
| 26 | [26-feature-matrix.md](26-feature-matrix.md) | What each role can access. |
| 27 | [27-changelog.md](27-changelog.md) | Change history. |
| - | [adrs/README.md](adrs/README.md) | Architecture Decision Records. |

## Ground truth vs. aspiration

Docs marked **(CURRENT)** describe the live system as of July 2026. Docs marked **(TARGET)** describe the intended end state. Where they differ, the gap is the work remaining (see `22-roadmap.md`).
