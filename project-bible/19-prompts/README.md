# Prompt Library

## Overview

This directory contains the master prompt library for AI agent interactions within the BerojgarDegreeWala project. These prompts are optimized for specific tasks and follow the patterns defined in the AI Operating Manual.

## Prompt Categories

### Development Prompts
Prompts for AI coding agents working on the BerojgarDegreeWala codebase:
- `new-route.md` — Scaffold a new API route
- `new-component.md` — Scaffold a new UI component
- `new-scraper-source.md` — Add a new source to the scraper config
- `new-migration.md` — Create a new database migration
- `fix-bug.md` — Debug and fix a known issue type

### Analysis Prompts
Prompts for analyzing the codebase:
- `explain-architecture.md` — Explain how a subsystem works
- `find-issue.md` — Search for a specific pattern or bug
- `code-review.md` — Review code changes
- `security-audit.md` — Scan for security issues

### AI Gateway Prompts
System prompts for the AI Gateway LLM interactions:
- `search-parser.md` — Parse natural language search queries
- `opportunity-matcher.md` — Match opportunities to users
- `summarizer.md` — Summarize opportunity descriptions
- `expiry-detection.md` — Detect expired opportunities
- `news-filter.md` — Filter and categorize news articles
- `newsletter-generator.md` — Generate weekly newsletter content

### Documentation Prompts
Prompts for maintaining the project bible:
- `update-adr.md` — Write a new ADR
- `update-readme.md` — Update a section README
- `add-knowledge.md` — Add to the knowledge base

## Prompt Standards

Every prompt must follow:
- **Clear objective**: What should the AI accomplish?
- **Input format**: What data is provided?
- **Output format**: Exactly what structure should the response follow?
- **Constraints**: What must be avoided?
- **Examples**: At least 1 input/output example
- **Fallback behavior**: What to do if the task cannot be completed as specified?

## Prompt Versioning

Prompts are versioned with a YAML front matter block:
```yaml
---
version: 1.0.0
last_updated: 2024-06-15
author: AI Agent
status: active
applies_to: [ai-gateway, search-parser]
---
```

## Related Documents

- [development-prompts/](./development-prompts/) — Development task prompts
- [analysis-prompts/](./analysis-prompts/) — Analysis prompts
- [ai-gateway-prompts/](./ai-gateway-prompts/) — AI Gateway system prompts
- [documentation-prompts/](./documentation-prompts/) — Documentation prompts
