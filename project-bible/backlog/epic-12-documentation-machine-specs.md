# Epic 12: Documentation & Machine Specs

**Priority**: P2 | **Estimated effort**: 6 days | **Dependencies**: Epic 02 (API routes complete), Epic 03 (UI components built)

## Description

Complete the remaining machine-readable specifications. Generate the OpenAPI 3.1 spec, database DDL, component manifest, and AI provider contracts. Update project bible documentation to reflect any changes made during implementation.

## Feature 12.1: OpenAPI Specification

### User Story 12.1.1
As an API consumer, I want a complete OpenAPI spec.

#### Task 12.1.1.1: Generate OpenAPI 3.1 spec
- **Description**: Create `project-bible/20-machine-specs/openapi.json`. Document all 74 routes with: method, path, parameters, request body schemas, response schemas, auth requirements, error responses. Use $ref for shared schemas. Include server URLs for production, preview, local
- **Dependencies**: Epic 02 (all 74 routes complete)
- **Acceptance Criteria**: Valid OpenAPI 3.1 spec. Validates without errors. Covers all 74 routes. Renders correctly in Swagger UI
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Validate with openapi-schema-validator
- **Documentation updates**: Spec lives in project-bible/20-machine-specs/

## Feature 12.2: Database DDL

### User Story 12.2.1
As a developer, I want the complete database schema as DDL.

#### Task 12.2.2.1: Generate full database DDL
- **Description**: Create `project-bible/20-machine-specs/database-schema.sql`. Run `pg_dump --schema-only` on each database (DB1, DB2, Neon 1, Neon 2). Combine into single file with clear section headers. Add comments explaining each table's purpose
- **Dependencies**: Epic 07 (schema stabilized)
- **Acceptance Criteria**: DDL reflects actual live schema. All tables, indexes, constraints, RLS policies documented
- **Database changes**: None (read-only)
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Update project-bible/06-database/ to reference this file

## Feature 12.3: AI Provider Contracts

### User Story 12.3.1
As a developer, I want machine-readable AI provider configuration.

#### Task 12.3.3.1: Create AI provider contracts JSON
- **Description**: Create `project-bible/20-machine-specs/ai-provider-contracts.json`. Each provider: name, models, capabilities (chat, streaming, function-calling), rate limits, cost per token (if applicable), env var keys, fallback order
- **Dependencies**: Epic 06 (AI Gateway done)
- **Acceptance Criteria**: JSON validates against a defined schema. All 7 providers documented. Matches actual configuration
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Validate JSON schema
- **Documentation updates**: Reference in project-bible/08-ai/

## Feature 12.4: Component Manifest

### User Story 12.4.1
As a UI developer, I want a complete component inventory.

#### Task 12.4.4.1: Create component manifest JSON
- **Description**: Create `project-bible/20-machine-specs/component-manifest.json`. Each component: name, props interface, dependencies, usage examples, status (planned/built/deprecated). Include all ~90 components from the spec
- **Dependencies**: Epic 03 (all 90 components built)
- **Acceptance Criteria**: All components documented. Props match actual implementation. Statuses accurate
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Spot-check against actual components
- **Documentation updates**: Reference in project-bible/03-ui/

## Feature 12.5: Post-Implementation Documentation Update

### User Story 12.5.1
As a future developer, I want documentation that reflects the actual codebase.

#### Task 12.5.5.1: Audit project bible for accuracy
- **Description**: Review all 44 project bible documents. Update any content that is now inaccurate due to implementation work. Check: API routes list matches actual, component catalog matches actual, database docs match actual schema, security controls match implementation
- **Dependencies**: All implementation epics
- **Acceptance Criteria**: Every project bible document is accurate. Cross-references are valid. No TODO or placeholder sections
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: None
- **Documentation updates**: Comprehensive project bible update

## Master Execution Checklist — Epic 12

- [ ] 12.1.1.1 Generate OpenAPI 3.1 spec
- [ ] 12.2.2.1 Generate full database DDL
- [ ] 12.3.3.1 Create AI provider contracts JSON
- [ ] 12.4.4.1 Create component manifest JSON
- [ ] 12.5.5.1 Audit project bible for accuracy
