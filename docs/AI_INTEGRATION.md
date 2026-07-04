# AI Integration

## 1. Overview

SiliconPath uses a **7-provider fallback architecture** where AI calls cascade through providers until one succeeds. This multi-provider approach provides:

- **Redundancy**: If the primary provider is rate-limited or down, traffic automatically falls through to alternatives
- **Free-tier maximization**: All 7 providers offer generous free tiers, keeping operating costs at ~$0/month
- **Cost optimization**: Lower-cost providers handle high-volume, low-complexity tasks (search, classification) while higher-quality providers handle user-facing features (chat, matching)
- **Geographic distribution**: Providers span AWS (US-East), Google Cloud, Cloudflare edge, and independent API services

The system achieves ~99% AI call success rate (Bedrock handles ~60% of traffic, fallbacks catch the remainder).

### Architecture

```
User Request
    ↓
callAI() / callAIAdvanced()
    ↓
Try Provider 1 (Bedrock) ──→ Success? → Return
    ↓ Fail
Try Provider 2 (Groq) ─────→ Success? → Return
    ↓ Fail
Try Provider 3 (NVIDIA) ───→ Success? → Return
    ↓ Fail
... cascade through all 7
    ↓ All fail
Throw "All AI providers failed"
```

---

## 2. Provider Details

### 1. AWS Bedrock (Primary)

| Property | Value |
|----------|-------|
| **Role** | Primary — ~60% of all AI traffic |
| **Model** | `openai.gpt-oss-120b` |
| **Endpoint** | `https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions` |
| **Auth** | Bearer token via `AWS_BEARER_TOKEN_BEDROCK` |
| **API Format** | OpenAI-compatible `/v1/chat/completions` |
| **Used For** | Chatbot, Opportunity Matcher, ATS Scoring |
| **Quota Limit** | Provisioned token — no hard free-tier cap |
| **Rate Limit Detection** | Any non-2xx → catch block, logged as error |

Request format:
```json
{
  "model": "openai.gpt-oss-120b",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 1024,
  "temperature": 0.3
}
```

### 2. Groq (First Fallback)

| Property | Value |
|----------|-------|
| **Role** | First fallback — fastest inference speed |
| **Model** | `llama-3.1-8b-instant` |
| **Endpoint** | `https://api.groq.com/openai/v1/chat/completions` |
| **Auth** | API key via `GROQ_API_KEY` |
| **API Format** | OpenAI-compatible |
| **Used For** | Summarizer, NL Search Parser, News Filter |
| **Quota Limit** | 14,400 requests/day free |
| **Rate Limit Detection** | HTTP 429 (too many requests) |

### 3. NVIDIA NIM

| Property | Value |
|----------|-------|
| **Role** | Second fallback — generous free credits |
| **Model** | `meta/llama-3.1-8b-instruct` |
| **Endpoint** | `https://integrate.api.nvidia.com/v1/chat/completions` |
| **Auth** | API key via `NVIDIA_NIM_API_KEY` |
| **API Format** | OpenAI-compatible |
| **Used For** | News Relevance Classifier, advanced/callAIAdvanced |
| **Quota Limit** | Generous free credits (no hard published cap) |
| **Rate Limit Detection** | Non-2xx with error text parsing |

Additional model in `callAIAdvanced`: `mistralai/mistral-7b-instruct-v0.3` at `max_tokens: 2048`, `temperature: 0.5`.

### 4. Google Gemini

| Property | Value |
|----------|-------|
| **Role** | Third fallback — low cost, long context |
| **Model** | `gemini-1.5-flash` |
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` |
| **Auth** | Query parameter API key via `GEMINI_API_KEY` |
| **API Format** | Proprietary Google format (not OpenAI-compatible) |
| **Used For** | NL Search, Weekly Digest (long context) |
| **Quota Limit** | 1,500 requests/day free |
| **Rate Limit Detection** | Any non-2xx status |

Request format differs from OpenAI — uses `contents[{parts[{text}]}]` instead of `messages[]`. System prompt is prepended to the user prompt as plain text.

### 5. OpenRouter

| Property | Value |
|----------|-------|
| **Role** | Fourth fallback — access to open models |
| **Model** | `meta-llama/llama-3.1-8b-instruct:free` |
| **Endpoint** | `https://openrouter.ai/api/v1/chat/completions` |
| **Auth** | API key via `OPENROUTER_API_KEY` |
| **API Format** | OpenAI-compatible |
| **Used For** | NL Search (secondary) |
| **Quota Limit** | Free tier with rate limits |
| **Rate Limit Detection** | Non-2xx status codes |

Additional headers: `HTTP-Referer`, `X-Title` for API tracking.

### 6. Cloudflare Workers AI

| Property | Value |
|----------|-------|
| **Role** | Fifth fallback — lightweight, edge-deployed |
| **Model** | `@cf/meta/llama-3.1-8b-instruct` |
| **Endpoint** | `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct` |
| **Auth** | Bearer token via `CLOUDFLARE_AI_TOKEN` + Account ID via `CLOUDFLARE_ACCOUNT_ID` |
| **API Format** | Proprietary Cloudflare format |
| **Used For** | Expiry Detection (lightweight classification) |
| **Quota Limit** | 10,000 neurons/day free |
| **Rate Limit Detection** | Non-2xx status codes |

Response format is non-standard — returns `data.result.response` instead of `data.choices[0].message.content`.

### 7. HuggingFace Inference API

| Property | Value |
|----------|-------|
| **Role** | Last resort — always available, slowest |
| **Model** | `mistralai/Mistral-7B-Instruct-v0.3` |
| **Endpoint** | `https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3` |
| **Auth** | Bearer token via `HUGGINGFACE_API_KEY` |
| **API Format** | Proprietary HuggingFace format |
| **Used For** | Last-resort fallback only |
| **Quota Limit** | Generous free tier |
| **Rate Limit Detection** | Non-2xx status codes |

Request uses `{ inputs: prompt, parameters: { max_new_tokens, temperature } }`. Response is either an array `[{ generated_text }]` or direct object.

---

## 3. Fallback Chain

### Primary Chain (`callAI`)

| Order | Provider | Reason | Feature Priority |
|-------|----------|--------|-----------------|
| 1 | Bedrock | Highest quality model, provisioned capacity | Chatbot, Matcher, ATS |
| 2 | Groq | Fastest inference, 14K req/day free | Summarizer, Search Parser |
| 3 | NVIDIA | Generous free credits, good quality | News Classifier |
| 4 | Gemini | 1,500 req/day free, long context | NL Search, Weekly Digest |
| 5 | OpenRouter | Open models, backup for NL search | Search fallback |
| 6 | Cloudflare | Lightweight, 10K neurons/day | Expiry Detection |
| 7 | HuggingFace | Always available, no strict cap | Last resort |

### Preferred Provider Override

Each AI feature can specify a `preferredProvider`. When set, that provider is tried first (moved to index 0), followed by the remaining 6 in order. This ensures features land on their optimal provider while retaining the full fallback chain:

```typescript
const order = options?.preferredProvider
  ? [options.preferredProvider, ...PROVIDER_ORDER.filter(p => p !== options.preferredProvider)]
  : PROVIDER_ORDER;
```

### Advanced Chain (`callAIAdvanced`)

Used for the weekly digest (requires longer output, higher quality):
1. NVIDIA (callNvidiaAdvanced — Mistral 7B, 2048 tokens)
2. Gemini (same as standard)
3. Groq (same as standard)

---

## 4. Quota / Error Detection

### HTTP Status Code Handling

| Status Code | Meaning | Action |
|-------------|---------|--------|
| **429** | Rate limited / quota exceeded | Skip provider, continue to next |
| **401** | Unauthorized (bad API key) | Skip provider (env key likely missing or rotated) |
| **403** | Forbidden (insufficient permissions) | Skip provider |
| **500** | Server error (provider-side) | Skip and retry next provider |
| **503** | Service unavailable | Skip and retry next provider |

All errors are caught in the `catch` block of `callAI()`, logged via `logAIUsage()`, and the next provider in the chain is tried.

### Cooldown Mechanism

Currently, the system does not implement per-provider cooldowns in the primary chain. Each failure immediately tries the next provider. A `cooldownUntil` timestamp map is available for future implementation:

```typescript
// Planned implementation pattern
const providerCooldowns = new Map<AIProvider, number>();
```

Target cooldown durations by error type:
- 429 (rate limit): 60s cooldown
- 401/403 (auth error): 300s cooldown (likely needs manual key rotation)
- 500/503 (server error): 30s cooldown

### Provider Skip Conditions

Providers are skipped if their env var is missing:

```typescript
if (!process.env[envKey[provider]] || (extraEnv[provider] && !process.env[extraEnv[provider]!])) continue;
```

Cloudflare requires both `CLOUDFLARE_AI_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to be set.

---

## 5. AI Feature to Provider Mapping

| Feature | Preferred Provider | Why This Provider | Fallback |
|---------|-------------------|-------------------|----------|
| **Chatbot** (`/api/ai/chat`) | Bedrock | Low latency needed, highest quality responses | Full chain |
| **Opportunity Matcher** (`/api/ai/match`) | Groq (in code) / Bedrock (desired) | Fast structured JSON output | Full chain |
| **NL Search** (`/api/ai/search`) | Groq | Fast inference, simple classification task | Full chain |
| **Summarizer** (`/api/ai/summarize`) | Gemini (in code) / Groq (desired) | Fast structured output, JSON parsing | Full chain |
| **Expiry Detection** (`/api/ai/expire`) | Cloudflare | Lightweight classification, cheap | Full chain |
| **ATS Scoring** (`/api/resume`) | Bedrock | Quality needed for scoring accuracy | Full chain |
| **Opportunity Summary** | Groq | Fast inference, short output | Full chain |
| **Weekly Digest** (`callAIAdvanced`) | NVIDIA → Gemini → Groq | Long context, quality output | Advanced chain only |
| **News Relevance Classifier** | Groq | Fast binary classification | Full chain |

---

## 6. Logging & Observability

### ai_usage_log Table Schema

All AI calls are logged to the `ai_usage_log` table in **Neon Primary** (db3):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (auto) | Primary key |
| `feature` | TEXT | Feature name: `chatbot`, `matcher`, `summarizer`, `search-parser`, `expiry-checker`, `news-filter`, `advanced`, `ats-scoring` |
| `provider` | TEXT | Provider name: `bedrock`, `groq`, `nvidia`, `gemini`, `openrouter`, `cloudflare`, `huggingface` |
| `model` | TEXT | Model string used (e.g., `llama-3.1-8b-instant`) |
| `prompt_length` | INTEGER | Character length of input prompt |
| `response_length` | INTEGER | Character length of output text (0 on failure) |
| `success` | BOOLEAN | Whether the call succeeded |
| `error_message` | TEXT | Error message string, null on success |
| `created_at` | TIMESTAMPTZ | Auto-set timestamp |

### Logging Implementation

```typescript
interface AILogEntry {
  feature: string;
  provider: AIProvider;
  model: string | null;
  prompt_length: number;
  response_length: number;
  success: boolean;
  error_message: string | null;
}

async function logAIUsage(entry: AILogEntry) {
  await neonPrimary`
    INSERT INTO ai_usage_log (feature, provider, model, prompt_length, response_length, success, error_message)
    VALUES (${entry.feature}, ${entry.provider}, ${entry.model},
            ${entry.prompt_length}, ${entry.response_length},
            ${entry.success}, ${entry.error_message})
  `;
}
```

Logging failures are silently caught — they never block or affect the AI response returned to the user.

### Monitoring

- **Admin analytics panel** (`/api/analytics/ai-usage`): Returns aggregated provider usage stats for the admin dashboard
- Health endpoint `/api/health` tracks overall system status but does not monitor individual provider health
- Current gap: No proactive alerting when a provider's error rate exceeds threshold

---

## 7. Implementation Notes

### Request/Response Format Differences

| Provider | Request Format | Response Path |
|----------|---------------|---------------|
| Bedrock | OpenAI chat completions | `data.choices[0].message.content` (or `.reasoning`) |
| Groq | OpenAI chat completions | `data.choices[0].message.content` |
| NVIDIA | OpenAI chat completions | `data.choices[0].message.content` |
| Gemini | Google `contents[{parts[{text}]}]` | `data.candidates[0].content.parts[0].text` |
| OpenRouter | OpenAI chat completions | `data.choices[0].message.content` |
| Cloudflare | Proprietary `{ messages }` | `data.result.response` |
| HuggingFace | `{ inputs, parameters }` | `data[0].generated_text` or `data.generated_text` |

OpenAI-compatible providers (Bedrock, Groq, NVIDIA, OpenRouter) share a common format and can be swapped with minimal code changes. Gemini, Cloudflare, and HuggingFace have dedicated `call*` functions that handle their specific formats.

### Timeout Handling

There is currently no explicit request timeout per provider. The default Vercel serverless function timeout (10s on Hobby, 60s on Pro) acts as the upper bound. A future improvement would add per-provider timeouts (e.g., 5s for Groq, 10s for HuggingFace).

### Error Fallback Flow

1. User request comes to an API route
2. Route calls `callAI(prompt, systemPrompt, { preferredProvider, feature })`
3. `callAI` iterates through provider order
4. For each provider:
   - Skip if env vars missing
   - Call the provider-specific function
   - On success: log to `ai_usage_log`, return response immediately
   - On error: log failure to `ai_usage_log`, print warning to console, continue to next provider
5. If all 7 providers fail: throw `"All AI providers failed. Please try again later."`
6. API route catches the error and returns a 503 response to the client

### JSON Output Handling

AI features that require structured output (matcher, summarizer, search parser) use prompts instructing the model to return JSON only. The response is sanitized with `response.text.replace(/```json|```/g, "").trim()` before JSON parsing. If parsing fails, the feature returns a safe fallback (empty array for matcher, null filters for search parser).

### System Prompt Strategy

- Most features pass a detailed system prompt that defines the role (e.g., "You are a career advisor for electronics researchers") and output format
- Features with preferred providers may pass system prompts as separate parameters (supported by OpenAI-compatible APIs) or prepended to the user prompt (Gemini workaround)
- Temperature is set to `0.3` for most calls to balance creativity with consistency, and `0.5` for `callAIAdvanced` where more varied output is desired
