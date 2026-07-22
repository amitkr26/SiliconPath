# ADR-004: Centralized AI Gateway with Fallback Chain

**Status**: Accepted
**Date**: 2024-02-10
**Author**: Architecture Board

## Context

Multiple features rely on AI: search parsing, opportunity matching, summarization, expiry detection, news filtering, and newsletter generation. Initially, each feature called providers directly, leading to duplicate code, inconsistent error handling, and no centralized monitoring.

## Decision

Create a centralized AI Gateway that all AI requests must pass through, with:

1. **7-provider fallback chain**: Groq → OpenRouter → Cloudflare → Gemini → Bedrock → HuggingFace → NVIDIA
2. **Free-tier preference**: Groq free tier is default; paid providers are fallbacks only
3. **Tolerant JSON parser**: Never use bare `JSON.parse()` on model output
4. **Usage logging**: All requests logged for cost analysis
5. **Graceful degradation**: If all providers fail, return a clear error

## Alternatives Considered

1. **Direct provider calls**: Duplicate, harder to maintain — rejected
2. **Single provider**: Vendor lock-in, single point of failure — rejected
3. **Gateway service**: External service (e.g., Portkey, Helicone) — adds cost and latency

## Consequences

**Positive:**
- Single place for provider configuration, retry logic, and monitoring
- Automatic fallback if primary provider is down
- Easy to add/remove providers
- Usage tracking for cost optimization

**Negative:**
- Gateway should maintain no state (stateless proxy pattern)
- Additional latency from fallback chain
- Provider SDK differences must be abstracted

**Implementation note**: The current implementation (`src/lib/ai/providers.ts`) has the chain but needs a unified interface. Target architecture is documented in `08-ai/ai-gateway.md`.
