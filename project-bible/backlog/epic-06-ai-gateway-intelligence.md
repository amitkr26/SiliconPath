# Epic 06: AI Gateway & Intelligence

**Priority**: P1 | **Estimated effort**: 18 days | **Dependencies**: Epic 01 (monorepo for shared package), Epic 04 (social for notifications)

## Description

Build the centralized AI Gateway through which all AI requests pass. Implement personalized recommendations, resume intelligence, and academy AI features. Replace the duplicate frontend/backend AI implementations with a single shared package.

## Feature 6.1: AI Gateway Package

### User Story 6.1.1
As a developer, I want a single AI Gateway that both apps can use.

#### Task 6.1.1.1: Create shared AI Gateway package
- **Description**: Extract `berojgardegreewala/src/lib/ai/` into `packages/ai-gateway/`. Create unified `AIProvider` interface: `call(prompt, options): Promise<AIResponse>`, `isAvailable(): boolean`, `getQuota(): ProviderQuota`. Implement for all 7 providers. Export as `@berojgardegreewala/ai-gateway`
- **Dependencies**: 1.1.1.1 (monorepo workspace)
- **Acceptance Criteria**: Both apps can import `@berojgardegreewala/ai-gateway`. All 7 providers implement the interface. Fallback chain works. Usage is logged
- **Database changes**: None
- **API changes**: AI routes import from package instead of local module
- **UI changes**: None
- **Testing requirements**: Test each provider call, fallback chain, usage logging
- **Documentation updates**: Add README to packages/ai-gateway

#### Task 6.1.1.2: Add response caching to AI Gateway
- **Description**: Implement response cache with configurable TTL. Cache key: hash of prompt + provider + model. Storage: in-memory Map (dev) or Upstash Redis (prod). Respects TTL per request type
- **Dependencies**: 6.1.1.1
- **Acceptance Criteria**: Identical requests return cached response within TTL. Cache miss calls provider. Cache hit bypasses provider
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test cache hit, miss, TTL expiry, cache invalidation
- **Documentation updates**: Add caching section to project-bible/08-ai/

#### Task 6.1.1.3: Add streaming support to AI Gateway
- **Description**: Implement streaming response support in gateway. All providers that support streaming should stream tokens. Return ReadableStream from `call()`. Client-side hook for consuming streams
- **Dependencies**: 6.1.1.1
- **Acceptance Criteria**: Streams tokens for supported providers. Falls back to non-streaming for providers that don't support it
- **Database changes**: None
- **API changes**: Chat/streaming endpoints use streaming
- **UI changes**: Chat UI shows streaming tokens
- **Testing requirements**: Test streaming, provider fallback without streaming
- **Documentation updates**: Add streaming section to project-bible/08-ai/

#### Task 6.1.1.4: Add prompt versioning to AI Gateway
- **Description**: Implement prompt versioning system. Each prompt template has a version field. Gateway logs which prompt version was used. Support prompt migration (v1 → v2) with deprecation warnings
- **Dependencies**: 6.1.1.1
- **Acceptance Criteria**: Each AI call logs prompt version. Deprecated prompts emit warnings
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Test version logging, deprecation
- **Documentation updates**: Add prompt versioning to project-bible/08-ai/

#### Task 6.1.1.5: Migrate frontend to use shared AI Gateway
- **Description**: Update `apps/web/src/lib/ai/` to import from `@berojgardegreewala/ai-gateway`. Remove local provider implementations. Update all 8 AI feature files to use gateway
- **Dependencies**: 6.1.1.1
- **Acceptance Criteria**: All AI features use shared gateway. No duplicate provider code. Tests pass
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: All AI feature tests pass with shared gateway
- **Documentation updates**: None

#### Task 6.1.1.6: Migrate backend to use shared AI Gateway
- **Description**: Update `apps/api/src/lib/` to import from `@berojgardegreewala/ai-gateway`. Remove `ai-providers.ts`. Backend scrapers use gateway for AI parsing
- **Dependencies**: 6.1.1.1
- **Acceptance Criteria**: Backend AI features use shared gateway. No duplicate provider code. Tests pass
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Backend AI tests pass
- **Documentation updates**: None

#### Task 6.1.1.7: Delete legacy AI provider files
- **Description**: Delete `berojgardegreewala/src/lib/ai/providers.ts` (after confirming migration). Delete `backend/src/lib/ai-providers.ts`
- **Dependencies**: 6.1.1.5, 6.1.1.6
- **Acceptance Criteria**: Legacy files no longer present. No broken imports
- **Database changes**: None
- **API changes**: None
- **UI changes**: None
- **Testing requirements**: Full test suite passes
- **Documentation updates**: None

## Feature 6.2: Personalized Recommendations

### User Story 6.2.1
As a user, I want AI-powered opportunity recommendations.

#### Task 6.2.2.1: Build recommendation engine
- **Description**: Implement recommendation logic in AI Gateway. Uses user profile (skills, interests, experience) to find matching opportunities. Returns scored results. Falls back to category-based if AI unavailable
- **Dependencies**: 6.1.1.5
- **Acceptance Criteria**: Returns personalized opportunities sorted by relevance score. Fallback works without AI. Caches results per user (TTL: 1 hour)
- **Database changes**: None
- **API changes**: May need new endpoint or extend existing matcher
- **UI changes**: Recommendation section on /feed and /opportunities
- **Testing requirements**: Test with complete profile, partial profile, AI unavailable
- **Documentation updates**: Add to project-bible/08-ai/

## Feature 6.3: Resume Intelligence

### User Story 6.3.1
As a user, I want AI-powered resume insights.

#### Task 6.3.3.1: Build resume skill extraction
- **Description**: When user uploads resume, AI extracts skills, experience, education. Fills profile fields automatically. Uses Document AI + AI Gateway
- **Dependencies**: 6.1.1.5, 2.2.2.1 (resume upload)
- **Acceptance Criteria**: Upload triggers AI extraction. Extracted fields pre-filled in profile. User can edit before saving. Error state if AI unavailable
- **Database changes**: None
- **API changes**: Enhance resume upload with AI extraction step
- **UI changes**: Extracted fields shown in profile after upload
- **Testing requirements**: Test with various resume formats, extraction errors
- **Documentation updates**: Add to project-bible/08-ai/

#### Task 6.3.3.2: Build skill gap analysis
- **Description**: Compare user's skills against target roles/opportunities. Identify missing skills. Suggest academy tracks to fill gaps. Uses AI Gateway's matcher
- **Dependencies**: 6.3.3.1, Epic 10 (academy data)
- **Acceptance Criteria**: Shows skill gaps for target role. Links to relevant academy tracks. Progress tracking for gap closure
- **Database changes**: None
- **API changes**: New AI endpoint for skill gap analysis
- **UI changes**: Skill gap section on resume/profile page
- **Testing requirements**: Test with different target roles, no gaps, AI unavailable
- **Documentation updates**: Add to project-bible/08-ai/

## Feature 6.4: AI-Powered Search

### User Story 6.4.1
As a user, I want natural language search for opportunities.

#### Task 6.4.4.1: Enhance search with AI parsing
- **Description**: Improve existing search parser. Accept natural language queries: "VLSI internships in Bangalore for 2025 grads". Parse into structured filters (category, location, type, deadline). Fall back to keyword search if AI unavailable
- **Dependencies**: 6.1.1.5
- **Acceptance Criteria**: Natural language query returns structured filters. Falls back to keyword search. Shows parsed query to user for editing
- **Database changes**: None
- **API changes**: Enhance /api/search with AI parsing step
- **UI changes**: Search bar shows parsed query pills
- **Testing requirements**: Test various query formats, AI fallback
- **Documentation updates**: Add to project-bible/08-ai/

## Master Execution Checklist — Epic 06

- [ ] 6.1.1.1 Create shared AI Gateway package
- [ ] 6.1.1.2 Add response caching
- [ ] 6.1.1.3 Add streaming support
- [ ] 6.1.1.4 Add prompt versioning
- [ ] 6.1.1.5 Migrate frontend to shared gateway
- [ ] 6.1.1.6 Migrate backend to shared gateway
- [ ] 6.1.1.7 Delete legacy AI provider files
- [ ] 6.2.2.1 Build recommendation engine
- [ ] 6.3.3.1 Build resume skill extraction
- [ ] 6.3.3.2 Build skill gap analysis
- [ ] 6.4.4.1 Enhance search with AI parsing
