# 11-AI-SYSTEM-MAP — Multi-Provider AI Architecture

## 1. 9-Provider Fallback Cascade
1. **Groq** (`qwen/qwen3.6-27b`, `llama-3.3-70b-versatile`)
2. **Google Gemini** (`gemini-1.5-pro`, `gemini-1.5-flash`)
3. **NVIDIA NIM** (`meta/llama-3.1-70b-instruct`)
4. **HuggingFace** (`meta-llama/Llama-3.3-70B-Instruct`)
5. **Cloudflare Workers AI** (`@cf/meta/llama-3.1-70b-instruct`)
6. **AWS Bedrock** (`anthropic.claude-3-5-sonnet`)
7. **OpenRouter** (`meta-llama/llama-3.3-70b-instruct`)
8. **OpenCode** (`opencode-default`)

## 2. Grounding & RAG
- Queries against live Supabase database rows.
- URL sanitization preventing prompt injection.
- Circuit breaker cooldowns on rate limits (HTTP 429) or server errors (HTTP 500).
