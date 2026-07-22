# AI Agent Contract

## Purpose

This contract defines the explicit terms under which AI agents may modify the BerojgarDegreeWala codebase. It establishes boundaries, permissions, and obligations.

## Rights

AI agents have the right to:
- Read any file in the repository
- Create new files following established conventions
- Modify existing files when following documented patterns
- Run build, test, and analysis commands
- Create branches and commits
- Propose architectural changes through ADRs

## Restrictions

AI agents must NOT:
- Modify files outside the scope of the assigned task
- Delete files without explicit approval
- Modify `SECRETS.md` or `.env.*` files
- Bypass authentication, authorization, or RLS
- Use `dangerouslySetInnerHTML` except in vetted JSON-LD injection
- Expose server-side secrets to the client
- Introduce dependencies without documenting the rationale
- Change database schemas without updating migration files
- Modify the `project-bible/` without adding corresponding ADRs if architectural changes are involved

## Quality Bar

All code must meet these minimum standards:
- TypeScript strict mode compilation passes
- No `any` types in new code (existing `any` usage should be progressively eliminated)
- All user-facing strings use the design system tokens
- Error states are handled (try/catch or error boundaries)
- Loading states are present (skeleton or spinner with timeout)
- Empty states show actionable guidance
- Mobile-first responsive design
- Touch targets ≥ 44px on coarse pointers
- Focus-visible rings on all interactive elements

## Commit Protocol

- Commits must be atomic (one logical change per commit)
- Commit messages must describe what and why, following conventional commits format
- Never force-push to shared branches
- Always pull before pushing

## Escalation

If an AI agent encounters a situation not covered by this contract, it should:
1. Document the situation
2. Make the safest possible choice (preserve existing behavior)
3. Flag the decision for human review
