# Governance

## Overview

Governance rules for the BerojgarDegreeWala project-bible documentation and repository. These rules define how documentation is maintained, reviewed, versioned, and deprecated. They apply to all AI agents and human contributors working on this project.

## The Golden Rule

**Any future AI coding agent must be able to clone this repository and continue development without asking the owner for any information.** Every decision, pattern, configuration, and workaround must be documented. If it's not in the project-bible, it doesn't exist.

## Documentation Principles

1. **Single source of truth**: Every fact exists in exactly one place
2. **Cross-reference, don't duplicate**: Use relative links instead of copying content
3. **Keep it current**: Docs older than 60 days must be reviewed
4. **Document why, not what**: The code says what — docs explain why
5. **Machine-first, human-readable**: Format for AI parsing first, humans second
6. **ADRs for significant decisions**: Any decision affecting architecture must have an ADR
7. **Readme first**: Every directory has a `README.md` that indexes its contents
8. **No secrets**: Never commit API keys, tokens, or passwords to docs

## Review Process

### Weekly Review
- Check for stale docs (> 60 days)
- Verify cross-references are valid
- Update MASTER_INDEX.md if new files added
- Review AI agent suggestions for gaps

### Change Process
1. Create branch `docs/*` from `main`
2. Make changes following file conventions
3. Update MASTER_INDEX.md if adding/removing files
4. Verify all links are valid
5. Create PR with `[docs]` prefix
6. Merge after review

## Lifecycle

Each document has a status in its YAML front matter:
- **active**: Current and maintained
- **draft**: In progress, not yet reviewed
- **stale**: Needs review (older than 60 days)
- **deprecated**: Superseded by newer doc, kept for reference
- **archived**: No longer relevant, moved to `23-reference/archived/`

## File Naming

- Convention: `kebab-case`
- README indexes: `README.md`
- ADRs: `adr-NNN-title.md` (NNN = zero-padded 3-digit number)
- Machine specs: descriptive name (e.g., `design-tokens.json`, `openapi.json`)
- Prompts: descriptive name (e.g., `search-parser.md`)

## Directory Ownership

| Directory | Primary Steward |
|-----------|----------------|
| 00-ai-operating-manual | AI Agent onboarding |
| 01-product | Product owner |
| 02-design, 03-ui | Designer |
| 04-frontend, 05-backend, 07-api | Lead developer |
| 06-database | Database administrator |
| 08-ai, 19-prompts | ML engineer |
| 09-scrapers | Data engineer |
| 10-academy | Content team |
| 11-employers, 12-users | Product owner |
| 13-security | Security engineer |
| 14-devops, 16-operations | DevOps engineer |
| 15-testing | QA lead |
| 17-project | Project manager |
| 18-knowledge | All contributors |
| 20-machine-specs | Lead developer |
| 21-governance, 22-adrs | Architecture board |
| 23-reference | Lead developer |

## Related Documents

- [contribution-guide.md](./contribution-guide.md) — How to contribute
- [review-checklist.md](./review-checklist.md) — Documentation review checklist
- [lifecycle-policy.md](./lifecycle-policy.md) — Document lifecycle
