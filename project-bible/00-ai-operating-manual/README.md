# AI Operating Manual

## Purpose

This manual defines how AI coding agents should operate within the BerojgarDegreeWala repository. It establishes the contract between human developers and AI agents, ensuring consistent, safe, and effective contributions.

## Scope

All AI agents interacting with this repository must follow these operating procedures. This includes code generation, documentation writing, testing, debugging, and architectural analysis.

## Core Principles

### 1. Read Before Writing
Always read the relevant documentation in `project-bible/` before modifying any code. The documentation is the single source of truth. If documentation does not exist for the area you are working on, create it before making changes.

### 2. Understand Before Changing
Read the existing code thoroughly before making modifications. Understand the data flow, dependencies, and side effects. Use the exploration tools available to you to build a complete mental model.

### 3. Document Justifications
Every architectural decision must be documented with:
- The problem being solved
- Alternatives considered
- Why the chosen approach was selected
- Tradeoffs and limitations

### 4. Preserve Working Code
Do not refactor working code without a clear, documented reason. If you see technical debt, document it in the relevant section and propose a plan rather than making changes ad-hoc.

### 5. Follow Conventions
Every file, function, and component must follow the conventions documented in this bible. When in doubt, look at existing code in the same area for patterns.

### 6. Test Your Changes
Run the type checker (`tsc --noEmit`) and existing tests before committing. Add tests for new functionality.

### 7. Don't Break the Build
Never commit code that fails to compile. If a change is complex, make it incrementally with compile checks between steps.

### 8. Document Drift
If you find that the code differs from the documentation, update the documentation to match. The documentation must always reflect reality.

### 9. Security First
Never introduce code that:
- Exposes secrets or API keys
- Bypasses authentication or authorization
- Allows injection attacks (SQL, NoSQL, template, command)
- Leaks user data
- Uses unvalidated input in security-sensitive contexts

### 10. Free Tier Discipline
All infrastructure decisions must work on free-tier services by default. Cloud credits (Google Cloud $300, AWS Free Tier) may only be used for optional, experimental, or temporary workloads.

## Communication Protocol

When an AI agent encounters ambiguity:

1. Read the `project-bible/` documentation for guidance.
2. If the documentation is silent on the matter, examine existing code for patterns.
3. If patterns are inconsistent, document the inconsistency and make a reasoned choice.
4. Leave comments in the code explaining why the choice was made.

## Error Recovery

If an AI agent makes an error:
1. Revert the change immediately.
2. Document what went wrong and why.
3. Adjust your understanding before retrying.

## Documentation Standards

All documents must include:
- **Purpose**: What this document is for
- **Scope**: What is covered and what is not
- **Dependencies**: What other documents or systems this depends on
- **Inputs/Outputs**: What data flows in and out
- **Architecture**: How things work
- **Acceptance Criteria**: How to know when implementation is complete
- **Testing Requirements**: How to verify correctness
- **Future Enhancements**: What could be improved later
- **Known Limitations**: What this does not handle

## Related Documents

- [file-conventions.md](./file-conventions.md)
- [code-quality.md](./code-quality.md)
- [agent-contract.md](./agent-contract.md)
