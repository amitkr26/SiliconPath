# 05-BACKEND-MAP — Standalone Backend Replica & OpenAPI

## 1. Backend Architecture
The backend package (`backend/`) provides an independent Node.js Express replication of the Next.js API surface deployed to Render (`https://berojgardegreewala-backend.onrender.com`).

## 2. Service Modules
- **`backend/server`**: Express 4 application exposing `/api/v1/*` endpoints matching Next.js route behavior.
- **`backend/ai-gateway`**: 9-provider LLM fallback gateway supporting Groq, Gemini 1.5, NVIDIA NIM, Cloudflare AI, AWS Bedrock, OpenRouter.
- **`backend/api`**: OpenAPI v3 specification contracts, content taxonomy tests, and SEO quality checks.
- **`backend/worker`**: Background cron job runner for automated news and opportunity scraping.

## 3. Test Coverage
- `backend/server`: 46/46 passing tests.
- `backend/api`: 97/97 passing tests.
- `backend/ai-gateway`: 15/15 passing tests.
