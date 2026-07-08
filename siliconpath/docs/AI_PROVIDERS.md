# AI Providers

Multi-provider fallback chain, built to avoid every failure mode from the prior build.

## Starter chain (order = fallback priority)
| # | Provider | Model slug | Verified | JSON mode |
|---|----------|-----------|----------|-----------|
| 1 | Groq | `llama-3.3-70b-versatile` | 2026-07-08 (Groq docs) | `response_format: json_object` |
| 2 | Gemini | `gemini-2.5-flash` | 2026-07-08 (`gemini-1.5-flash` is DEAD — 404) | `responseMimeType: application/json` |
| 3 | OpenRouter | `meta-llama/llama-3.3-70b-instruct:free` | 2026-07-08 (`:free` variant) | `response_format: json_object` |

Start with these 3 (all free-tier). **Do not** wire up 7 at once — add one at a time,
each verified live via `scripts/ai-check.ts` before it's trusted.

## Rules baked in
1. **Verify slugs before wiring.** Never hardcode from memory (the `gemini-1.5-flash`
   lesson). Re-verify each slug against the provider's current model list.
2. **JSON mode + regex fallback.** `callAI({ json: true })` requests native JSON;
   `extractJson()` tolerates code fences / prose. A raw parse error is never shown
   to a user — we retry or fall through.
3. **Failure cooldown.** A provider that errors is skipped for 10 min.
4. **Startup key check.** `assertProviderKeys()` / `scripts/ai-check.ts` catches a
   missing/expired key at boot or in CI, not via a user-facing failure.

## Adding a provider
1. Add the slug to `MODELS` (verified current) + its `ENV_KEY`.
2. Add a `callX` function and register it in `DISPATCH` + `ORDER`.
3. Run `npx tsx scripts/ai-check.ts` and confirm it returns `ok` before shipping.

## NOT VERIFIED
No real API key has been exercised in this environment. Slugs are verified current;
the KEYS are not (no key present here). Run `scripts/ai-check.ts` with real keys and
confirm every configured provider returns `ok` before relying on the chain.
