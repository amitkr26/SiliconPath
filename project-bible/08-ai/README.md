**Last Verified:** 2026-08-30 · **Status:** Current · **Scope:** AI gateway and 9-provider architecture**

# AI Architecture

> Last reconciled: 2026-08-20 (groq model updated to qwen/qwen3.6-27b, verified live)

## Overview

All AI calls pass through a single gateway: workspace package `@berojgardegreewala/ai-gateway` (`backend/ai-gateway`). The frontend re-exports it via `frontend/src/lib/ai/providers.ts` and wires usage logging. No module calls an AI provider directly.

## Gateway (`backend/ai-gateway/src/gateway/index.ts`)

9 providers (model / env key):

| Provider | Model | Env |
|---|---|---|
| groq | qwen/qwen3.6-27b (2026-08-20; was llama-3.1-8b-instant — retired by Groq) | GROQ_API_KEY |
| gemini | gemini-1.5-flash | GEMINI_API_KEY |
| openrouter | meta-llama/llama-3.1-8b-instruct:free | OPENROUTER_API_KEY |
| nvidia | meta/llama-3.1-8b-instruct | NVIDIA_NIM_API_KEY |
| agentrouter | gpt-3.5-turbo | AGENTROUTER_API_KEY |
| omnirouter | auto | OMNIROUTER_BASE_URL (no key required) |
| cloudflare | @cf/meta/llama-3.1-8b-instruct | CLOUDFLARE_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID |
| bedrock | openai.gpt-oss-120b | AWS_BEARER_TOKEN_BEDROCK |
| huggingface | mistralai/Mistral-7B-Instruct-v0.3 | HUGGINGFACE_API_KEY |

- Fallback order: groq → gemini → openrouter → nvidia → agentrouter → omnirouter → cloudflare → bedrock → huggingface. A preferred provider (`request.model`) is moved to the front of the order.
- Providers with unset env keys are skipped (omnirouter exempt).
- 10-minute cooldown per provider after any failure.
- Params: max_tokens 1024, temperature 0.3 (huggingface uses max_new_tokens 512; nvidia adds top_p 0.7); per-call timeouts 4–5s (`AbortSignal.timeout`).
- Per-call cost estimate logged (bedrock $0.003/1k tokens, gemini $0.000075/1k; the rest are free-tier).
- API: `gateway.generate` (messages) and `gateway.generateAdvanced` (raw prompt).

## Frontend Wiring (`frontend/src/lib/ai/providers.ts`)

- Thin re-export of the gateway and `AIProvider` type.
- `gateway.setLogger(logAIUsage)` — logs each call to `ai_usage_log` on Supabase **db1** (migration 20260501000004); insert failure is silent and never blocks the AI call. Previously wrote to Neon where the table did not exist; repointed 2026-08-16.
- Wrappers: `callAI(prompt, systemPrompt?, { preferredProvider?, feature? })`, `callAIAdvanced(prompt, systemPrompt?)`.

## Feature Utilities (`frontend/src/lib/ai/`)

| File | Purpose |
|---|---|
| reasoning-sanitizer.ts | Defense-in-depth sanitization: strips `<think>`, `<thought>`, `<reflection>`, ````thought` blocks, and multi-line reasoning artifacts across streaming/batch responses |
| grounding.ts | Grounds chat answers in DB records: date-aware expiry filtering, extractSearchTerms, isOpportunityIntent, filterRelevantOpportunities, buildGroundedSystemPrompt, NO_MATCH_FALLBACK, sanitizeAnswerUrls (strips URLs outside the allowlist), allowedUrls. Returns `{ answer, opportunities, sources, freshness, grounded }` contract. |
| matcher.ts | Profile-to-opportunity matching, top-10 JSON output |
| summarizer.ts | Gemini JSON summarization |
| search-parser.ts | Groq JSON search-query parsing |
| expiry-checker.ts | Cloudflare yes/no deadline-expiry detection |
| news-filter-ai.ts | AI-assisted news filtering |
| newsletter.ts | Newsletter generation |

## API Endpoints (8 handlers, `frontend/src/app/api/ai/`)

chat (grounded & date-aware — returns structured payload `{ answer, opportunities, sources, freshness, grounded }`), classify, enhance, expire (expiry-checker), match (matcher), opportunity-summary/[slug], search (search-parser), summarize (summarizer). All sit behind the `ai` rate-limit bucket (20/min) and the middleware CSRF guard.

## Status

- Gateway provider chain: IMPLEMENTED
- Feature utilities: IMPLEMENTED
- Grounded date-aware chat with structured cards & source verification: IMPLEMENTED
- Spec/contract documents previously linked here (ai-gateway.md, providers.md, prompts.md, usage-analytics.md, provider-contracts.json) do not exist; removed. No streaming or tool-calling in the gateway (not built).
