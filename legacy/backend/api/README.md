# `@berojgardegreewala/api`

Core shared business logic, authentication, schema validation, rate-limiting, and response contracts for the BerojgarDegreeWala / SiliconPath monorepo.

## Overview

This workspace provides shared infrastructure consumed across the monorepo:
- **`src/auth`**: Edge-safe and server-side RBAC, constant-time `safeEqual` secret comparison, and Web Crypto HMAC session verification.
- **`src/validation`**: Zod schemas for opportunities, pagination, sorting, query filtering, and payload sanitization.
- **`src/rate-limit`**: Memory-bounded LRU rate limiters with expired-entry pruning.
- **`src/response`**: Standardized JSON response envelopes (`success`, `created`, `unauthorized`, `forbidden`, `notFound`, etc.).
- **`src/openapi`**: Dynamic OpenAPI 3.0 specification generators.

## Commands

```bash
# Run tests
npm test

# Typecheck TypeScript definitions
npm run typecheck

# Generate OpenAPI specs
npm run openapi
```
