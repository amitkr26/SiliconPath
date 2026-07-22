# Epic 01: Infrastructure & Monorepo Restructure

**Priority**: P0 | **Estimated effort**: 12 days | **Dependencies**: None

## Description

Restructure the repository from a flat layout to a monorepo with shared packages. Extract common code (types, database schemas, AI gateway, scraper configs) into reusable packages that both the web frontend and API backend can import.

## Feature 1.1: Monorepo Workspace Setup

### User Story 1.1.1
As a developer, I want a monorepo workspace so that both apps can share code through local packages.

#### Task 1.1.1.1: Create root package.json with workspaces
- **Description**: Add root `package.json` with `"workspaces"` pointing to `apps/*` and `packages/*`
- **Dependencies**: None
- **Acceptance Criteria**: `npm install` from root installs all dependencies for all workspaces
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify `npm test` runs tests from all workspaces
- **Documentation updates**: Update root README.md with monorepo structure

#### Task 1.1.1.2: Create apps/web from berojgardegreewala/
- **Description**: Move `berojgardegreewala/` to `apps/web/`. Update all internal paths. Create `apps/web/package.json` with workspace name `@berojgardegreewala/web`
- **Dependencies**: 1.1.1.1
- **Acceptance Criteria**: `npm run dev` from root starts web dev server
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: All existing tests pass
- **Documentation updates**: Update build instructions

#### Task 1.1.1.3: Create apps/api from backend/
- **Description**: Move `backend/` to `apps/api/`. Update Dockerfile and render.yaml paths. Create `apps/api/package.json` with workspace name `@berojgardegreewala/api`
- **Dependencies**: 1.1.1.1
- **Acceptance Criteria**: Backend starts and passes health check
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Backend tests pass
- **Documentation updates**: Update deployment instructions

#### Task 1.1.1.4: Create packages/types shared package
- **Description**: Extract all TypeScript interfaces from `berojgardegreewala/src/types/index.ts` into `packages/types/`. Export as `@berojgardegreewala/types`. Create separate files per domain (opportunity.ts, academy.ts, user.ts, etc.)
- **Dependencies**: 1.1.1.1
- **Acceptance Criteria**: Both `apps/web` and `apps/api` can import from `@berojgardegreewala/types`
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Types compile without errors in both apps
- **Documentation updates**: Add README to packages/types

#### Task 1.1.1.5: Create packages/database shared package
- **Description**: Move all migration files from `berojgardegreewala/supabase/migrations/` to `packages/database/migrations/`. Move seed files. Move `neon/schema.sql` to `packages/database/neon1-schema.sql`. Standardize migration naming to `YYYYMMDD_HHMMSS_description.sql`
- **Dependencies**: 1.1.1.1
- **Acceptance Criteria**: All migrations listed in a single manifest, ordered chronologically
- **Database changes**: Migration files relocated (no schema changes)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Database docs point to packages/database/ instead of berojgardegreewala/supabase/

## Feature 1.2: CI/CD Updates

### User Story 1.2.1
As a developer, I want CI/CD pipelines that understand the monorepo structure.

#### Task 1.2.1.1: Update GitHub Actions for monorepo
- **Description**: Update `ci.yml` to run from root with workspace awareness. Add caching for node_modules across workspaces. Split into separate jobs for `apps/web` and `apps/api`
- **Dependencies**: 1.1.1.2, 1.1.1.3
- **Acceptance Criteria**: CI runs lint, typecheck, test, build for both apps in parallel
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: CI passes on PR
- **Documentation updates**: Update CI docs in project-bible/14-devops/

#### Task 1.2.1.2: Add backend ESLint configuration
- **Description**: Add `.eslintrc.json` to `apps/api/` with TypeScript rules matching the frontend config. Add lint script to api package.json
- **Dependencies**: 1.1.1.3
- **Acceptance Criteria**: `npm run lint` from apps/api reports TypeScript and style errors
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Lint passes on CI
- **Documentation updates**: None

#### Task 1.2.1.3: Remove destructive reset migrations
- **Description**: Delete `20260710_000_reset_core.sql` and `20260710_001_reset_social.sql` from migrations. These DROP tables and should never be run accidentally
- **Dependencies**: None
- **Acceptance Criteria**: Reset migrations no longer present in migration directory
- **Database changes**: None (migrations deleted)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Note removal in CHANGELOG

#### Task 1.2.1.4: Add make targets for workspace commands
- **Description**: Update `Makefile` with workspace-aware targets: `make dev`, `make test`, `make lint`, `make typecheck`, `make build`
- **Dependencies**: 1.1.1.1
- **Acceptance Criteria**: Each make target runs the corresponding command across all workspaces
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Verify each make target
- **Documentation updates**: Update root README.md with make targets

## Feature 1.3: Clean Up Dead Files

### User Story 1.3.1
As a developer, I want unnecessary files removed from the repository.

#### Task 1.3.1.1: Remove default Next.js assets
- **Description**: Delete `apps/web/public/next.svg`, `apps/web/public/vercel.svg`, `apps/web/public/auth-sync.html`
- **Dependencies**: None
- **Acceptance Criteria**: Assets no longer present; no broken references
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Build succeeds without these files
- **Documentation updates**: None

#### Task 1.3.1.2: Remove skills-lock.json
- **Description**: Delete `apps/web/skills-lock.json` — AI agent config artifact not needed in repo
- **Dependencies**: None
- **Acceptance Criteria**: File no longer present
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: None

## Master Execution Checklist — Epic 01

- [ ] 1.1.1.1 Create root package.json with workspaces
- [ ] 1.1.1.2 Create apps/web from berojgardegreewala/
- [ ] 1.1.1.3 Create apps/api from backend/
- [ ] 1.1.1.4 Create packages/types shared package
- [ ] 1.1.1.5 Create packages/database shared package
- [ ] 1.2.1.1 Update GitHub Actions for monorepo
- [ ] 1.2.1.2 Add backend ESLint configuration
- [ ] 1.2.1.3 Remove destructive reset migrations
- [ ] 1.2.1.4 Add make targets for workspace commands
- [ ] 1.3.1.1 Remove default Next.js assets
- [ ] 1.3.1.2 Remove skills-lock.json
