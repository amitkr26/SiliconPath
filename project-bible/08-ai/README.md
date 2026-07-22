# AI Architecture

## Overview

BerojgarDegreeWala implements a centralized AI Gateway through which all AI requests must pass. No module is allowed to call an AI provider directly. The gateway provides automatic fallback, health monitoring, retry, and usage analytics.

## Current Implementation Status

**Current**: Multi-provider fallback chain exists in `src/lib/ai/providers.ts` with 7 providers and manual routing.
**Target**: Fully centralized AI Gateway with unified request/response contracts, automatic routing, caching, and streaming.

## Provider Chain (in order)

| Provider | Model | Purpose | Status |
|----------|-------|---------|--------|
| Groq | llama-3.1-8b-instruct (free) | Default text | ✅ Configured |
| OpenRouter | Various | Fallback 1 | ✅ Configured |
| Cloudflare Workers AI | Various | Fallback 2 | ✅ Configured |
| Gemini | gemini-pro | Fallback 3 | ✅ Configured |
| NVIDIA NIM | Various | Fallback 4 | ✅ Configured |
| AWS Bedrock | Various | Fallback 5 | ✅ Configured |
| HuggingFace | Various | Fallback 6 | ✅ Configured |

## AI Features

| Feature | File | Provider Preference |
|---------|------|-------------------|
| Search Parser | `src/lib/ai/search-parser.ts` | Groq |
| Opportunity Matching | `src/lib/ai/matcher.ts` | Full chain |
| Summarization | `src/lib/ai/summarizer.ts` | Gemini |
| Expiry Detection | `src/lib/ai/expiry-checker.ts` | Fallback chain |
| News Filter | `src/lib/ai/news-filter-ai.ts` | Groq |
| Newsletter Generation | `src/lib/ai/newsletter.ts` | Advanced chain |
| Content Enhancement | `src/app/api/ai/enhance/route.ts` | Gateway |
| Chat | `src/app/api/ai/chat/route.ts` | Gateway |

## AI Gateway Specification (Target Architecture)

The AI Gateway should provide:

```
Request → AI Gateway → Provider Router → Provider Chain
                ↓                           ↓
          Cache Check               Provider 1 (Groq)
                ↓                           ↓
          Rate Limit                  Provider 2 (OpenRouter)
                ↓                           ↓
          Usage Log                           ...
                ↓                           ↓
          Response ← Tolerant Parser ← Provider N (HuggingFace)
```

### Gateway Responsibilities
- Route requests to the appropriate provider based on capability and cost
- Handle provider failures with automatic fallback
- Respect provider rate limits and quotas
- Cache identical requests (configurable TTL)
- Log all usage for analytics and cost tracking
- Support streaming responses
- Support tool calling/function calling
- Implement prompt versioning

### Provider Contracts
Each provider must expose a uniform interface:
```typescript
interface AIProvider {
  name: string;
  call(prompt: string, options?: AIOptions): Promise<AIResponse>;
  isAvailable(): boolean;
  getQuota(): ProviderQuota;
}
```

## Safe Parsing

AI model outputs must never be parsed with bare `JSON.parse()`. Use the tolerant parser in `src/lib/ai/safe-parse.ts` which handles:
- Markdown code fences
- Mixed prose and JSON
- Partial/truncated JSON
- Leading explanatory text
- Multiple JSON objects in one response

## Cost Optimization

- Free tier providers are preferred (Groq, Cloudflare)
- Paid providers (OpenRouter paid models, Gemini, Bedrock) are fallbacks only
- Usage is logged to `ai_usage_log` for cost analysis
- Response caching reduces redundant calls
- Prompt optimization minimizes token usage

## Related Documents

- [ai-gateway.md](./ai-gateway.md) — Gateway specification
- [providers.md](./providers.md) — Provider configurations
- [prompts.md](./prompts.md) — Prompt standards
- [usage-analytics.md](./usage-analytics.md) — Usage tracking
- [provider-contracts.json](./provider-contracts.json) — Machine-readable contracts
