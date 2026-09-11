# `@berojgardegreewala/server`

Standalone Express REST API server for BerojgarDegreeWala / SiliconPath.

## Overview

A dedicated Node.js/Express service that provides a standalone alternative or replica to the Next.js internal API routes, designed for independent deployment on container or VM runtimes (e.g., Render, Docker).

- **Health & Metrics**: `/health`, `/ready` probes.
- **REST APIs**: Public opportunities endpoints with pagination, search, feed, and profiles.
- **Auth Guards**: Integrates with `@berojgardegreewala/api` for strict auth and rate limiting.

## Commands

```bash
# Start in development mode
npm run dev

# Build TypeScript
npm run build

# Run automated test suites
npm test

# Check types
npm run typecheck
```
