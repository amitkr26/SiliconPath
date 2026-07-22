# `@berojgardegreewala/ai-gateway`

Centralized AI Provider Abstraction Layer & Fallback Engine for BerojgarDegreeWala.

## Overview
`@berojgardegreewala/ai-gateway` provides unified model routing, structured JSON response parsing, error isolation, and multi-tier provider fallbacks.

## Optimal AI Provider Fallback Chain

```text
1. Groq (llama-3.1-8b-instant / ~800 tokens/sec ultra-fast)
   └─► 2. Gemini 1.5 Flash (Google AI Studio)
         └─► 3. OpenRouter (Meta Llama 3.1 8B Instruct / Free)
               └─► 4. NVIDIA NIM (meta/llama-3.1-8b-instruct)
                     └─► 5. AgentRouter (gpt-3.5-turbo endpoint)
                           └─► 6. OmniRouter Local Proxy (http://localhost:20128/v1)
                                 └─► 7. Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct)
                                       └─► 8. AWS Bedrock (openai.gpt-oss-120b)
                                             └─► 9. HuggingFace Serverless API
```

## Features
- **Maximum Speed & Zero-Cost Priority**: Prioritizes Groq (~800 tokens/sec) and Gemini 1.5 Flash first for near-instant responses.
- **Guaranteed Zero-Cost Uptime**: If external provider quotas run out, fallback routes automatically to local OmniRouter proxy server running on port 20128.
- **Structured JSON Parsing**: Sanitizes markdown code blocks and raw responses into validated JSON.
- **Neon Usage Logging**: Automatically logs AI call metrics, token estimates, response latency, and provider used to Neon PostgreSQL `ai_usage_log` table.

## Usage Example

```typescript
import { completeText } from "@berojgardegreewala/ai-gateway";

const response = await completeText({
  prompt: "Explain SystemVerilog constraint randomization for ASIC verification.",
  featureName: "chat-assistant",
});

console.log(response.text);
```
