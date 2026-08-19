# MASTER INDEX — BerojgarDegreeWala Project Bible (v2, reconciled 2026-08-19)

Navigation map for the entire project bible. All links point to real files. Statuses: `current` = describes live state · `historical` = dated/planning artifact, preserved as evidence.

## Root control files (read first)

| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./README.md) | Repo map / entry point | current |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Authoritative architecture: CURRENT / TRANSITION / TARGET | current |
| [MASTER_INDEX.md](./MASTER_INDEX.md) | This index | current |
| [CHANGELOG.md](./CHANGELOG.md) | Dated change log (most recent at top) | current |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Honest feature matrix with evidence | current |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Issue register (ID, area, status) | current |
| [AGENT_STATE.md](./AGENT_STATE.md) | Concise machine-readable agent state | current |
| [AGENT_HANDOFF.md](./AGENT_HANDOFF.md) | Operational handoff: deploy mechanics, gotchas, cleanup contracts | current |
| [E2E_TEST_STATUS.md](./E2E_TEST_STATUS.md) | E2E suite status + canonical test accounts | current |

## Section 00: AI Operating Manual
| Document | Purpose |
|----------|---------|
| [README.md](./00-ai-operating-manual/README.md) | How AI agents should operate in this repository |
| [agent-contract.md](./00-ai-operating-manual/agent-contract.md) · [file-conventions.md](./00-ai-operating-manual/file-conventions.md) · [code-quality.md](./00-ai-operating-manual/code-quality.md) · [dependency-injection.md](./00-ai-operating-manual/dependency-injection.md) | Conventions (rules, not state) |

## Section 01: Product
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./01-product/README.md) | Product overview with current metrics | current |
| [vision.md](./01-product/vision.md) · [prd.md](./01-product/prd.md) · [user-stories.md](./01-product/user-stories.md) | Product intent | spec |
| [MASTER_IMPLEMENTATION_PLAN.md](./01-product/MASTER_IMPLEMENTATION_PLAN.md) | Master plan (2026-08-17) — largely executed; planning artifact | historical |

## Section 02–03: Design / UI
| Document | Purpose |
|----------|---------|
| [02-design/README.md](./02-design/README.md) | Design system, tokens |
| [03-ui/README.md](./03-ui/README.md) | Component catalog, page blueprints |

## Section 04: Frontend
| Document | Purpose |
|----------|---------|
| [README.md](./04-frontend/README.md) | Stack, routing, middleware, data flow (138 API route files) |

## Section 05: Backend
| Document | Purpose |
|----------|---------|
| [README.md](./05-backend/README.md) | Independent backend: api / ai-gateway / server workspaces, replication status |
| [backend/docs/FRONTEND-BACKEND-MAP.md](../backend/docs/FRONTEND-BACKEND-MAP.md) | Frontend capability → backend equivalent → status (2026-08-19) |
| [backend/docs/API-PARITY.md](../backend/docs/API-PARITY.md) | Full API inventory with COMPLETE/PARTIAL/MISSING statuses (2026-08-19) |

## Section 06: Database
| Document | Purpose |
|----------|---------|
| [README.md](./06-database/README.md) | 4-database topology (2 Supabase + 2 Neon), live columns, triggers, migrations |
| [er-diagram.md](./06-database/er-diagram.md) | Per-DB ER summary |

## Section 07: API
| Document | Purpose |
|----------|---------|
| [README.md](./07-api/README.md) | Route inventory (138 files, categories), cron reality (3 scheduled), response standards |

## Section 08: AI
| Document | Purpose |
|----------|---------|
| [README.md](./08-ai/README.md) | Gateway (9 providers, fallback order), grounding, endpoints, logging |

## Section 09: Scrapers
| Document | Purpose |
|----------|---------|
| [README.md](./09-scrapers/README.md) | 18 modules (8 real + 10 fabricated gated), ATS adapters, RSS, scheduling, verification pipeline |

## Section 10: Academy
| Document | Purpose |
|----------|---------|
| [README.md](./10-academy/README.md) | 7 tracks, gating, dual-table fallback, limitations |

## Section 11: Employers
| Document | Purpose |
|----------|---------|
| [README.md](./11-employers/README.md) | Partial portal: job posting implemented; ATS/review UI NOT |

## Section 12: Users
| Document | Purpose |
|----------|---------|
| [README.md](./12-users/README.md) | Auth (email/password + Google), profile, resume, saved, applications, network, messages, feed — implemented |

## Section 13: Security
| Document | Purpose |
|----------|---------|
| [README.md](./13-security/README.md) | AuthN/AuthZ, RBAC, admin/cron auth, rate limiting, CSRF, known issue #1 |
| [SECURITY.md](./13-security/SECURITY.md) | Full security posture, secret rotation history, env tables |

## Section 14: DevOps
| Document | Purpose |
|----------|---------|
| [README.md](./14-devops/README.md) | Vercel-only reality, 3 crons, docker-compose, env reference |
| [deploy-stack.txt](./14-devops/deploy-stack.txt) | Render-era Docker deploy notes | historical (deprecated header) |

## Section 15: Testing
| Document | Purpose |
|----------|---------|
| [README.md](./15-testing/README.md) | Playwright (6 specs) + jest (104) + node:test (16), accounts, cleanup contract |
| [TESTING.md](./15-testing/TESTING.md) | Test run instructions, canonical accounts amittest1/2 |

## Section 16–18: Operations / Project / Knowledge
| Document | Purpose |
|----------|---------|
| [16-operations/README.md](./16-operations/README.md) | Health endpoints, monitoring reality (Vercel + Sentry + Plausible) |
| [17-project/README.md](./17-project/README.md) | Phase statuses (Phase 1 done, Phase 2 employer partial) |
| [18-knowledge/README.md](./18-knowledge/README.md) | Domain knowledge, debugging guides |

## Section 19: Prompts
| Document | Purpose |
|----------|---------|
| [README.md](./19-prompts/README.md) | Prompt-library status (not yet built); 3 historical session prompts listed |

## Section 20: Machine Specs
| Document | Purpose |
|----------|---------|
| [README.md](./20-machine-specs/README.md) | Spec index (only real files listed) |
| [route-manifest.json](./20-machine-specs/route-manifest.json) · [env-schema.json](./20-machine-specs/env-schema.json) · [scraper-source-registry.json](./20-machine-specs/scraper-source-registry.json) · [state-machines.json](./20-machine-specs/state-machines.json) · [design-tokens.json](./20-machine-specs/design-tokens.json) | Machine-readable specs (reconciled 2026-08-19) |

## Section 21: Governance
| Document | Purpose |
|----------|---------|
| [README.md](./21-governance/README.md) | Agent rules, backend replication rule, doc lifecycle |

## Section 22: ADRs
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./22-adrs/README.md) | ADR index (only existing ADRs listed) | current |
| [adr-001-four-database-architecture.md](./22-adrs/adr-001-four-database-architecture.md) | 4-DB architecture | superseded (live topology differs) |
| [adr-002-nextjs-app-router.md](./22-adrs/adr-002-nextjs-app-router.md) | Next.js App Router decision | current |
| [adr-004-centralized-ai-gateway.md](./22-adrs/adr-004-centralized-ai-gateway.md) | Centralized AI gateway | implemented (9 providers) |
| [adr-011-free-tier-first-infrastructure.md](./22-adrs/adr-011-free-tier-first-infrastructure.md) · [adr-013-tolerant-json-parser.md](./22-adrs/adr-013-tolerant-json-parser.md) · [adr-014-project-bible-documentation.md](./22-adrs/adr-014-project-bible-documentation.md) | Other decisions | current |

## Section 23: Reference
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./23-reference/README.md) | Reference overview, repo URL (amitkr26/BerojgarDegreeWala) | current |
| [berojgardegreewala-master-specification.md](./23-reference/berojgardegreewala-master-specification.md) | Pre-08-16 spec | historical (status header) |
| [CONTENT_UPGRADE_PLAN.md](./23-reference/CONTENT_UPGRADE_PLAN.md) | Content quality plan V1–V10 | mostly resolved (status header) |
| [berojgardegreewala-expanded-global-source-list-v3.md](./23-reference/berojgardegreewala-expanded-global-source-list-v3.md) · [-v4.md](./23-reference/berojgardegreewala-expanded-global-source-list-v4.md) | Aspirational source registries | aspirational |
| [trusted_sources_v2.json](./23-reference/trusted_sources_v2.json) · [trusted_sources_v3.json](./23-reference/trusted_sources_v3.json) | Curation data (academy seed) | current |

## Backlog
| Document | Purpose |
|----------|---------|
| [README.md](./backlog/README.md) | Per-epic status annotations + backend replication active tasks |
| [epic-01…epic-12](./backlog/epic-01-infrastructure-monorepo.md) … [epic-12-documentation-machine-specs.md](./backlog/epic-12-documentation-machine-specs.md) | Epic planning docs (annotated in README) |
| [implementation-graph.md](./backlog/implementation-graph.md) · [master-execution-checklist.md](./backlog/master-execution-checklist.md) | Execution artifacts |

## Audit reports (docs/audit-reports/)
| Document | Purpose |
|----------|---------|
| [README.md](../docs/audit-reports/README.md) | Index |
| [2026-08-18-full-platform-audit-report.md](../docs/audit-reports/2026-08-18-full-platform-audit-report.md) | 27/27 platform audit (latest) |
| [2026-08-16-implementation-map.md](../docs/audit-reports/2026-08-16-implementation-map.md) | Master implementation audit (28 KB) |
| [2026-08-16-state-of-the-union.md](../docs/audit-reports/2026-08-16-state-of-the-union.md) | State of the union |
| 01–13 numbered audits | Historical audit trail (preserved as evidence) |

## Session reports (docs/session-reports/)
| Document | Purpose |
|----------|---------|
| [session-2026-08-19-backend-replication-docs-reconciliation.md](../docs/session-reports/session-2026-08-19-backend-replication-docs-reconciliation.md) | Latest (this reconciliation) |
| [session-2026-08-18-social-fix.md](../docs/session-reports/session-2026-08-18-social-fix.md) · [session-2026-08-17-full-implementation.md](../docs/session-reports/session-2026-08-17-full-implementation.md) · [AI-QUALITY-2026-08-13.md](../docs/session-reports/AI-QUALITY-2026-08-13.md) · [SECRETS-STATUS-2026-08-14.md](../docs/session-reports/SECRETS-STATUS-2026-08-14.md) · [session-2026-08-13-final-remediation.md](../docs/session-reports/session-2026-08-13-final-remediation.md) | Historical session trail |

---

**Count:** 79 files in `project-bible/` + `backend/docs/` (2) + `docs/audit-reports/` (19) + `docs/session-reports/` (5) — all real, all linked. The session report for 2026-08-19 is written at the end of the reconciliation it documents.
