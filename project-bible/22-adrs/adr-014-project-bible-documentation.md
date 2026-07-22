# ADR-014: Dedicated Project Bible Documentation

**Status**: Accepted
**Date**: 2024-06-15
**Author**: Architecture Board

## Context

The BerojgarDegreeWala codebase had accumulated scattered documentation across:
- `/docs/` directory (38 numbered markdown files — deleted in commit `4f3b57b`)
- Inline code comments
- The `AGENTS.md` file at repository root
- Unwritten tribal knowledge

This created several problems:
1. AI agents could not get a complete picture of the system
2. Documentation was often stale or inconsistent with the code
3. No standard format or organization
4. No governance for documentation maintenance

After the docs directory was deleted in commit `4f3b57b` (45 files removed), only `docs/README.md` and `docs/SECURITY_AND_COMPLIANCE.md` survived. The codebase had no comprehensive documentation.

## Decision

Create a `project-bible/` directory at the repository root with 24 subdirectories covering all aspects of the platform. Each directory has a `README.md` index with cross-references. All documentation is version-controlled in the same repository.

### Key Design Decisions

1. **Branch isolation**: All project-bible work happens on `project-bible*` branches. Never commit project-bible docs to `main` until the owner explicitly requests it.

2. **24 subdirectories**: Numbered 00-23, each covering a specific domain (AI operating manual, product, design, frontend, backend, database, API, AI, scrapers, academy, security, DevOps, testing, operations, project, knowledge, prompts, machine specs, governance, ADRs, reference).

3. **Every directory has a README.md**: Each README indexes its contents, provides a 1-paragraph overview, sections for relevant facts, and links to sub-documents.

4. **MASTER_INDEX.md at root**: Complete inventory of all 100+ documents with one-line purposes.

5. **Machine-readable specs**: Design tokens JSON, OpenAPI spec, database DDL, state machines, env JSON Schema, route manifest.

6. **ADRs for all decisions**: Every architectural decision has an ADR in `22-adrs/`.

### The Golden Rule

Any future AI coding agent must be able to clone this repository and continue development without asking the owner for any information. Every decision, pattern, configuration, and workaround must be documented.

## Consequences

**Positive:**
- Complete system understanding from a single entry point (`MASTER_INDEX.md`)
- AI agents can self-onboard by reading `00-ai-operating-manual/`
- Machine specs enable code generation and validation
- ADRs capture the reasoning behind decisions
- Cross-references prevent stale documentation

**Negative:**
- 100+ documents to maintain
- Risk of docs drifting from code without active maintenance
- Documentation development took significant initial effort

**Mitigation**: Governance rules in `21-governance/` mandate monthly stale-doc review. AI agents are expected to update docs when they discover discrepancies.
