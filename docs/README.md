# SiliconPath Documentation

This folder is the **single source of truth** for SiliconPath. It is written so that an AI agent (or a new engineer) can build the entire platform from these documents alone, with no external input required.

## Numbered docs (read in order)

| # | Doc | Purpose |
|---|-----|---------|
| 00 | [00-README.md](00-README.md) | Master overview. Start here. |
| 01 | [01-vision.md](01-vision.md) | Why this exists. Problem, vision, mission, users. |
| 02 | [02-product-principles.md](02-product-principles.md) | Non-negotiable product rules. |
| 03 | [03-prd.md](03-prd.md) | Full product requirements: every page, feature, flow. |
| 04 | [04-user-stories.md](04-user-stories.md) | Stories per role. |
| 05 | [05-ux-specification.md](05-ux-specification.md) | Per-page UX: layout, states, responsive, a11y. |
| 06 | [06-design-system.md](06-design-system.md) | Colors, type, components, tokens. |
| 07 | [07-architecture.md](07-architecture.md) | System design, data flow, deployment topology. |
| 08 | [08-folder-structure.md](08-folder-structure.md) | Exact repo layout. |
| 09 | [09-database.md](09-database.md) | Every table, column, index, RLS policy. |
| 10 | [10-api-spec.md](10-api-spec.md) | Every endpoint: method, input, output, errors. |
| 11 | [11-authentication.md](11-authentication.md) | Auth model, roles, sessions. |
| 12 | [12-security.md](12-security.md) | Threats, mitigations, RLS, secrets. |
| 13 | [13-environment-variables.md](13-environment-variables.md) | Every env var. |
| 22 | [22-roadmap.md](22-roadmap.md) | Phases 0-4 + future. |
| 26 | [26-feature-matrix.md](26-feature-matrix.md) | What each role can access. |

## Reference docs (supplemental)

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deep architecture overview |
| [API_REFERENCE.md](API_REFERENCE.md) | API endpoint reference |
| [API_SPEC.md](API_SPEC.md) | API specification |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guidelines |
| [DATABASE.md](DATABASE.md) | Database schema reference |
| [DATA_MODEL.md](DATA_MODEL.md) | Data model overview |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel/Render deployment details |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Design system reference |
| [FEATURE_SPEC.md](FEATURE_SPEC.md) | Feature specification |
| [GLOSSARY.md](GLOSSARY.md) | Terminology |
| [PRD.md](PRD.md) | Product requirements document |
| [ROADMAP.md](ROADMAP.md) | Development roadmap |
| [SECURITY.md](SECURITY.md) | Security & RLS policies |
| [SECURITY_AND_COMPLIANCE.md](SECURITY_AND_COMPLIANCE.md) | Security & compliance |
| [SECURITY_INCIDENT_REPORT.md](SECURITY_INCIDENT_REPORT.md) | Security incident report |
| [SEO_AEO_GEO_STRATEGY.md](SEO_AEO_GEO_STRATEGY.md) | Search optimization strategy |
| [TESTING.md](TESTING.md) | Testing strategy |
| [AI_INTEGRATION.md](AI_INTEGRATION.md) | AI integration details |
| [CONTENT_SOURCES_AND_SCRAPING.md](CONTENT_SOURCES_AND_SCRAPING.md) | Content sources & scraping |

> **Note:** Docs numbered 14-21 and docs 23-27 are not yet written. Their content is distributed across the reference docs and `CHANGELOG.md` at the repo root. Duplicates exist: `10-api-spec.md` / `10-api-specification.md` and `13-environment.md` / `13-environment-variables.md` — the hyphenated versions are canonical.
