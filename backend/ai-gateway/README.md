# @berojgardegreewala/ai-gateway

Multi-provider resilient LLM router for BerojgarDegreeWala.

## Overview

The AI Gateway provides a unified interface to 10 LLM providers with automatic fallback, cooldown management, and telemetry:

1. **BDW** — OpenAI-compatible endpoint (BDW Career Intelligence)
2. **Groq** — `qwen/qwen3.6-27b`
3. **Gemini** — Google AI
4. **NVIDIA NIM** — NVIDIA inference
5. **OpenRouter** — Multi-model router
6. **Cloudflare** — Workers AI
7. **HuggingFace** — Inference API
8. **AWS Bedrock** — Amazon managed models
9. **AgentRouter** — Agent-based routing
10. **OmniRouter** — Local fallback

## Usage

```typescript
import { AIGateway } from "@berojgardegreewala/ai-gateway";

const gateway = new AIGateway();
const response = await gateway.generate("What JRF positions are available in VLSI?", systemPrompt);
```

## BDW Provider

When `BDW_AI_ENABLED=true` and `BDW_AI_BASE_URL` is set, the gateway routes through the BDW Career Intelligence endpoint first. Falls back to other providers gracefully when BDW is unavailable.

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `BDW_AI_ENABLED` | No | Set to `true` to enable BDW provider |
| `BDW_AI_BASE_URL` | Yes (if enabled) | BDW AI endpoint URL |
| `BDW_AI_MODEL` | No | Model name (default: auto) |
| `BDW_AI_API_KEY` | Yes (if enabled) | BDW AI API key |
| `BDW_AI_TIMEOUT_MS` | No | Request timeout (default: 30000) |
| `GROQ_API_KEY` | No | Groq API key |
| `GEMINI_API_KEY` | No | Google AI key |

## Testing

```bash
npm test
```

19 tests covering provider selection, cooldown, health checks, and BDW integration.
