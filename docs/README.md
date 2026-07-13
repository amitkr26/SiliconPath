# SiliconPath Documentation

Single source of truth for all project documentation.

## Platform Overview

SiliconPath is a **two-tier career platform** for the semiconductor, VLSI, and research ecosystem:

1. **Public Tier (No Login):** Aggregates opportunities from DRDO, ISRO, BARC, IITs, NITs, semiconductor companies, and research labs into one searchable interface. Users browse and apply directly.
2. **Registered Tier (LinkedIn Features):** Full professional networking with profiles, connections, messaging, feed, company pages, resume builder, application tracking, and community.

---

## Documentation Map

### Vision & Strategy
| Doc | Purpose |
|-----|--------|
| [01-vision.md](./01-vision.md) | Product vision and mission |
| [03-prd.md](./03-prd.md) | Product Requirements Document |
| [04-user-stories.md](./04-user-stories.md) | User stories and personas |
| [02-product-principles.md](./02-product-principles.md) | Core product principles |
| [22-roadmap.md](./22-roadmap.md) | Development roadmap |
| [26-feature-matrix.md](./26-feature-matrix.md) | Feature matrix by tier |

### Design & UX
| Doc | Purpose |
|-----|--------|
| [05-ux-specification.md](./05-ux-specification.md) | UX flows and wireframes |
| [06-design-system.md](./06-design-system.md) | Design system overview |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Detailed design tokens and components |

### Architecture & Technical
| Doc | Purpose |
|-----|--------|
| [07-architecture.md](./07-architecture.md) | System architecture |
| [08-folder-structure.md](./08-folder-structure.md) | Monorepo folder structure |
| [09-database.md](./09-database.md) | Database architecture (4 DBs) |
| [DATA_MODEL.md](./DATA_MODEL.md) | Complete data model reference |
| [10-api-spec.md](./10-api-spec.md) | API specification |
| [API_SPEC.md](./API_SPEC.md) | Detailed API endpoints |

### Features & Integration
| Doc | Purpose |
|-----|--------|
| [FEATURE_SPEC.md](./FEATURE_SPEC.md) | Detailed feature specifications |
| [AI_INTEGRATION.md](./AI_INTEGRATION.md) | AI/ML integration details |
| [CONTENT_SOURCES_AND_SCRAPING.md](./CONTENT_SOURCES_AND_SCRAPING.md) | Scraping sources and strategy |
| [SEO_AEO_GEO_STRATEGY.md](./SEO_AEO_GEO_STRATEGY.md) | SEO/AEO/GEO strategy |

### Security & Auth
| Doc | Purpose |
|-----|--------|
| [11-authentication.md](./11-authentication.md) | Authentication flows |
| [12-security.md](./12-security.md) | Security overview |
| [SECURITY_AND_COMPLIANCE.md](./SECURITY_AND_COMPLIANCE.md) | Full security & compliance |
| [SECURITY_INCIDENT_REPORT.md](./SECURITY_INCIDENT_REPORT.md) | Incident response |

### Operations
| Doc | Purpose |
|-----|--------|
| [13-environment-variables.md](./13-environment-variables.md) | Environment configuration |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
| [TESTING.md](./TESTING.md) | Testing strategy |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [GLOSSARY.md](./GLOSSARY.md) | Domain glossary |

---

## Database Architecture (4 Databases)

| Database | Provider | Purpose |
|----------|----------|--------|
| DB1 | Supabase | Core: opportunities, news, companies, categories, scrape sources |
| DB2 | Supabase | Social: user profiles, connections, messages, posts, applications |
| Neon DB1 | Neon | Analytics: page views, click tracking, search metrics, AI usage |
| Neon DB2 | Neon | Backend: scraper state, job queues, cron logs |

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vercel
- **Backend:** Express.js, TypeScript, Render
- **Auth:** Supabase Auth (Google, GitHub, Email)
- **AI:** OpenAI GPT-4, Google Gemini (opportunity matching, resume analysis, content curation)
- **Scraping:** Playwright, Cheerio, RSS feeds
