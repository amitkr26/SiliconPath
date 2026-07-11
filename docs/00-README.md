# SiliconPath Documentation

This folder is the **single source of truth** for SiliconPath. It is written so an AI
agent (or a new engineer) can build and operate the entire platform from these files
alone, with no external context required.

## Read order

**Start here every time:** [`14-ai-rules.md`](14-ai-rules.md) and [`MASTER_PROMPT.md`](MASTER_PROMPT.md).

| # | Doc | Purpose |
|---|-----|---------|
| 01 | [vision.md](01-vision.md) | Why the product exists; what it will and won't be |
| 02 | [product-principles.md](02-product-principles.md) | Non-negotiable product rules |
| 03 | [prd.md](03-prd.md) | Every page, feature, role, flow |
| 04 | [user-stories.md](04-user-stories.md) | Stories per role |
| 05 | [ux-specification.md](05-ux-specification.md) | Page-by-page UX, states, responsive |
| 06 | [design-system.md](06-design-system.md) | Tokens, components, typography |
| 07 | [architecture.md](07-architecture.md) | System + data-flow architecture |
| 08 | [folder-structure.md](08-folder-structure.md) | Exact repo layout |
| 09 | [database.md](09-database.md) | Every table, column, index, RLS |
| 10 | [api-specification.md](10-api-specification.md) | Every endpoint |
| 11 | [authentication.md](11-authentication.md) | Auth, roles, sessions |
| 12 | [security.md](12-security.md) | Security model + checklist |
| 13 | [environment-variables.md](13-environment-variables.md) | Every env var |
| 14 | [ai-rules.md](14-ai-rules.md) | Rules the agent MUST follow |
| 15 | [coding-standards.md](15-coding-standards.md) | Naming, TS, React, SQL, commits |
| 16 | [promptbook.md](16-promptbook.md) | Ready-made task prompts |
| 17 | [definition-of-done.md](17-definition-of-done.md) | Done criteria per feature |
| 18 | [deployment.md](18-deployment.md) | Vercel + Render + Supabase + Neon |
| 19 | [ci-cd.md](19-ci-cd.md) | GitHub Actions, branches, rollback |
| 20 | [monitoring.md](20-monitoring.md) | Logs, alerts, analytics |
| 21 | [testing.md](21-testing.md) | Unit, integration, e2e, a11y |
| 22 | [roadmap.md](22-roadmap.md) | Phases + current status |
| 23 | [feature-matrix.md](23-feature-matrix.md) | Access per role |
| 24 | [source-registry.md](24-source-registry.md) | Scrape source list |
| 25 | [scraper-specification.md](25-scraper-specification.md) | Adapters, retry, scheduling |
| 26 | [academy-curriculum.md](26-academy-curriculum.md) | 7 tracks, days, assessments |
| 27 | [adrs.md](27-adrs.md) | Architecture Decision Records |
| 28 | [changelog.md](28-changelog.md) | Change history pointer |
| ⭐ | [MASTER_PROMPT.md](MASTER_PROMPT.md) | The one prompt to hand an AI agent |

## Ground truth snapshot (11 Jul 2026)

- **Live:** https://siliconpath.vercel.app
- **Repo:** github.com/amitkr26/SiliconPath
- **Status:** infra ~70%, user-facing ~40%. Two known live breakages: opportunities
  list shows stale garbage rows; academy page serves a stale build. See
  [22-roadmap.md](22-roadmap.md).
