# MASTER INDEX — BerojgarDegreeWala Project Bible (v1)

## Section 00: AI Operating Manual
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./00-ai-operating-manual/README.md) | How AI agents should operate in this repository | ✅ |
| [agent-contract.md](./00-ai-operating-manual/agent-contract.md) | Contract between AI agents and the codebase | ✅ |
| [file-conventions.md](./00-ai-operating-manual/file-conventions.md) | File naming, structure, and organization conventions | ✅ |
| [code-quality.md](./00-ai-operating-manual/code-quality.md) | Code quality standards and review criteria | ✅ |
| [dependency-injection.md](./00-ai-operating-manual/dependency-injection.md) | Manual DI pattern (no framework) | ✅ |

## Section 01: Product
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./01-product/README.md) | Product overview | ✅ |
| [vision.md](./01-product/vision.md) | Product vision, mission, strategic goals | ✅ |
| [prd.md](./01-product/prd.md) | Product Requirements Document | ✅ |
| [user-stories.md](./01-product/user-stories.md) | User story catalog by persona | ✅ |

## Section 02: Design
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./02-design/README.md) | Design system overview, tokens, banned patterns | ✅ |

## Section 03: UI
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./03-ui/README.md) | Component catalog (90 components), page blueprints, responsive breakpoints | ✅ |

## Section 04: Frontend
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./04-frontend/README.md) | Architecture: stack, routing, data flow, middleware, perf | ✅ |

## Section 05: Backend
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./05-backend/README.md) | Express backend: dir structure, API, concurrency, Docker | ✅ |

## Section 06: Database
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./06-database/README.md) | 4-database map, key schema decisions, known issues | ✅ |

## Section 07: API
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./07-api/README.md) | 74 routes by category, response patterns, status codes | ✅ |

## Section 08: AI
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./08-ai/README.md) | AI Gateway: providers, features, safe parsing, cost optimization | ✅ |

## Section 09: Scrapers
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./09-scrapers/README.md) | 332 sources, 7 adapter types, data quality pipeline, scheduling | ✅ |

## Section 10: Academy
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./10-academy/README.md) | 7 tracks, assessment gating, fallback system, known limitations | ✅ |

## Section 11: Employers
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./11-employers/README.md) | Employer features (planned), company profiles, applications | ✅ |

## Section 12: Users
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./12-users/README.md) | Auth, profile, bookmarks, resume, social features | ✅ |

## Section 13: Security
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./13-security/README.md) | AuthN/AuthZ, RLS, input validation, rate limiting, threat model | ✅ |

## Section 14: DevOps
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./14-devops/README.md) | Free tier services, CI/CD, cron, monitoring, backups | ✅ |

## Section 15: Testing
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./15-testing/README.md) | Test pyramid, priorities, mock strategy, CI integration | ✅ |

## Section 16: Operations
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./16-operations/README.md) | Monitoring, incident response, maintenance, capacity | ✅ |

## Section 17: Project
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./17-project/README.md) | Phases, RICE prioritization, branch strategy, PR process | ✅ |

## Section 18: Knowledge
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./18-knowledge/README.md) | Domain knowledge, debugging guides, common errors, lessons learned | ✅ |

## Section 19: Prompts
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./19-prompts/README.md) | Prompt library structure, standards, versioning | ✅ |

## Section 20: Machine Specs
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./20-machine-specs/README.md) | Machine-readable spec overview | ✅ |
| [design-tokens.json](./20-machine-specs/design-tokens.json) | Design tokens (colors, typography, spacing, shadows, breakpoints) | ✅ |
| [state-machines.json](./20-machine-specs/state-machines.json) | State machines (opportunity, connection, application, scrape) | ✅ |
| [scraper-source-registry.json](./20-machine-specs/scraper-source-registry.json) | Source registry (332 sources, 17 batches, 7 adapter types) | ✅ |
| [route-manifest.json](./20-machine-specs/route-manifest.json) | Route manifest (74 routes with methods, auth, params) | ✅ |
| [env-schema.json](./20-machine-specs/env-schema.json) | Environment variable JSON Schema | ✅ |

## Section 21: Governance
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./21-governance/README.md) | Governance rules, golden rule, document lifecycle | ✅ |

## Section 22: ADRs
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./22-adrs/README.md) | ADR index and template | ✅ |
| [adr-001-four-database-architecture.md](./22-adrs/adr-001-four-database-architecture.md) | 4-database architecture (2 Supabase + 2 Neon) | ✅ |
| [adr-002-nextjs-app-router.md](./22-adrs/adr-002-nextjs-app-router.md) | Next.js App Router for frontend | ✅ |
| [adr-004-centralized-ai-gateway.md](./22-adrs/adr-004-centralized-ai-gateway.md) | Centralized AI Gateway with fallback chain | ✅ |
| [adr-011-free-tier-first-infrastructure.md](./22-adrs/adr-011-free-tier-first-infrastructure.md) | Free-tier-first infrastructure policy | ✅ |
| [adr-013-tolerant-json-parser.md](./22-adrs/adr-013-tolerant-json-parser.md) | Tolerant JSON parser for AI output | ✅ |
| [adr-014-project-bible-documentation.md](./22-adrs/adr-014-project-bible-documentation.md) | Dedicated project bible documentation | ✅ |

## Section 23: Reference
| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](./23-reference/README.md) | Reference docs overview, key facts, quick commands | ✅ |

---

**44 documents total**. Each `README.md` references sub-documents (component catalog, source registry, etc.) that are embedded within the README itself for v1. Future iterations can extract into standalone files as content grows.
