# Machine Specifications

## Overview

This directory contains machine-readable specifications that enable automated tooling, code generation, validation, and documentation. These specs are the single source of truth for their respective domains.

## Spec Index

| Spec | Format | Purpose | Auto-generated |
|------|--------|---------|----------------|
| `design-tokens.json` | JSON | Design tokens (colors, typography, spacing, radius, shadows) | Manual |
| `openapi.json` | OpenAPI 3.1 | Complete API specification with schemas | Manual |
| `database-schema.sql` | DDL | Full database schema (all 4 databases) | Manual |
| `state-machines.json` | JSON | State machine definitions (opportunity, connection, application) | Manual |
| `ai-provider-contracts.json` | JSON | AI provider configuration + capabilities | Manual |
| `scraper-source-registry.json` | JSON | Complete source configuration in JSON | Manual |
| `route-manifest.json` | JSON | API route manifest with methods, auth, params | Manual |
| `component-manifest.json` | JSON | Component inventory with props and dependencies | Manual |
| `env-schema.json` | JSON Schema | Environment variable definitions with types | Manual |

## Usage

These specs are consumed by:
- **Code generators**: Generate TypeScript types, validation schemas, API clients
- **Documentation generators**: Generate API docs, component catalogs
- **Validation tools**: Validate environment variables, API responses, configuration files
- **AI agents**: Provide a complete machine-readable understanding of the platform

## OpenAPI Specification

The OpenAPI spec at `openapi.json` follows OpenAPI 3.1 and includes:
- All 74 API routes organized by tag
- Request/response schemas for all endpoints
- Auth schemes (bearer, cookie, admin header)
- Error response schemas
- Server URLs (production, preview, local)

## State Machines

The state machines in `state-machines.json` define valid state transitions for:
1. **Opportunity verification**: draft → pending → verified/rejected/expired
2. **Connection request**: pending → accepted/rejected
3. **Application status**: submitted → reviewed → shortlisted → accepted/rejected
4. **Scrape run**: queued → running → completed/failed

## Database Schema

`database-schema.sql` contains the full DDL for all tables across all 4 databases. This is the canonical schema — always update this file when making schema changes.

## Related Documents

- [design-tokens.json](./design-tokens.json) — Design tokens
- [openapi.json](./openapi.json) — OpenAPI specification
- [state-machines.json](./state-machines.json) — State machine definitions
- [env-schema.json](./env-schema.json) — Environment variable schema
