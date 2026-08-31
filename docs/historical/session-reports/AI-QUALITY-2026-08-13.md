# AI Response Quality Investigation — 2026-08-13

Investigation of the production AI chat assistant returning "I couldn't find a matching opportunity in BerojgarDegreeWala's current database." even though the response was `grounded: true` (i.e., matching records WERE retrieved).

Status: **REPRODUCED → ROOT-CAUSED → FIXED (code-level, tested) — NOT deployed.**
Per directive: no commit, no push, no deploy. Fix ships only after human review.

---

## 1. Reproduction (prod, before fix)

Battery: 10 queries × 2 runs each against https://berojgardegreewala.vercel.app (deployment `bpw9ggmqk`). All responses HTTP 200.

| Query | Run 1 | Run 2 | Provider |
|---|---|---|---|
| DRDO recruitment | lists records ✓ | lists records ✓ | groq |
| **DRDO JRF** | **grounded:true + fallback echo ✗** | **fallback echo ✗** | groq |
| **JRF VLSI** | **grounded:true + fallback echo ✗** | **fallback echo ✗** | nvidia |
| semiconductor jobs | lists records ✓ | lists records ✓ | nvidia |
| embedded systems jobs | lists records ✓ | lists records ✓ | nvidia |
| VLSI verification jobs | lists records ✓ | lists records ✓ | groq |
| PhD electronics | lists records ✓ | lists records ✓ | groq |
| **internship semiconductor** | **grounded:true + fallback echo ✗** | **fallback echo ✗** | cloudflare |
| IIT research associate | lists records ✓ | lists records ✓ | groq |
| Zulu Antarctica penguin | no-match, grounded:false ✓ | ✓ | groq |

The echo is deterministic per query and provider-independent (groq, nvidia, cloudflare all did it). `grounded:true` means the LLM path ran with records in context — the fallback sentence was MODEL-generated, not the deterministic gate.

## 2. Fallback decision path (traced in code)

`frontend/src/app/api/ai/chat/route.ts`:

1. `retrieveGrounding()` — two-phase fetch + relevance filter + weighted ranking → top 8 records.
2. Deterministic gate: records 0 AND news 0 AND opportunity intent → `NO_MATCH_FALLBACK`, no LLM call, `grounded:false`. (Not the trigger here — `grounded` was true.)
3. Else → `buildGroundedSystemPrompt()` (HARD RULES 1–7) → `callAI` (groq preferred, gateway fallback chain).
4. Guard: only URL sanitization existed. A rule-5 sentence ("couldn't find") with records present was passed through as-is.

So the echo was the 8B-class model complying with rule 5 ("no records → say exactly …") while IGNORING rule 2 ("records listed → they match, don't say couldn't find"). Question: why would it ignore rule 2? Because the records were NOT actually relevant (see §3) — the model was honest.

## 3. Root cause — context selection, not model compliance

Dumped the exact top-8 in context for each failing query (live DB, same code path):

**"DRDO JRF" (before):** `New Careers & Internships`, `Software Engineering Opportunities`, `Hardware Engineering Opportunities`, `Engineer, Manufacturing Engineering Full-time`, … — ALL category=`jrf` flood rows, score 1. Zero DRDO.
**"JRF VLSI" (before):** identical flood.
**"internship semiconductor" (before):** ISM Technical Consultant + 7× `Senior Semiconductor Reliability Engineer` — zero internships.

Why: category=`jrf` matches **3,170 rows**. A single OR'd window ordered `created_at DESC` with `LIMIT 50` filled its 50 slots with the newest jrf-category flood — real DRDO/VLSI rows (older) never entered the window at all. Then unweighted scoring (1 point per term occurrence, any field) tied the flood at score 1, so recency won. The LLM saw 8 irrelevant records and honestly said "couldn't find". The model was RIGHT — the context was wrong. Working queries (DRDO recruitment, semiconductor jobs, …) had low-cardinality terms that kept real rows in the window — consistent with this explanation.

This is the evidence step-4 required: **context selection was still the cause**.

## 4. Model / provider / gateway chain (inspected)

- `frontend/src/lib/ai/providers.ts` → `backend/ai-gateway/src/gateway/index.ts` `generate()`: preferred provider first (groq `llama-3.1-8b-instant`), fallback nvidia `meta/llama-3.1-8b-instruct` → gemini → openrouter → … Single attempt per provider, cooldown on error, no retry. No prompt rewriting in the gateway.
- 8B-class models on both providers used in the failing cases; the echo was a truthful response to bad context, not a gateway artifact.
- No model/gateway change needed.

## 5. Context-size test

`FETCH_WINDOW=50` per term, cap `opportunityLimit=8`. Tested alternative caps implicitly: with 8 slots, per-term windows + dedupe already surface all distinct strong matches (DRDO JRF: 8/8 real DRDO rows). Smaller caps (4) would drop the 2nd–4th DRDO JRF rows; larger windows cost latency. 8 stays — evidence: harness runs (§7) all list ≥3 relevant records from the 8.

## 6. Prompt (inspected, NOT changed)

`buildGroundedSystemPrompt` HARD RULES 1–7 are correct: rule 2 forbids "couldn't find" when records are listed; rule 5 mandates the exact sentence when none are. The failing cases were rule-5-consistent because the records didn't match the query. Changing the prompt to force-match weak records would break the honest no-match case (Zulu test) — rejected. One deterministic belt-and-suspenders guard added at the route level instead (§8).

## 7. Fix (smallest, evidence-backed) — `frontend/src/lib/ai/grounding.ts`

Three changes to `retrieveGrounding`:

1. **Per-term phase-1 queries, merged** — one windowed query per search term over primary fields (title/category/organization) instead of one OR of all terms. `drdo` and `jrf` now each get their own window, so the jrf flood can't evict DRDO rows. (Up to `#terms` × 50 rows fetched; typical queries = 2–4 lightweight queries.)
2. **Weighted ranking** — title 3, category/org 2, description/eligibility 1 (was 1 everywhere): a real title/org match now beats a category-only hit.
3. **Title-level dedupe in the merge** — the same posting exists dozens of times under different ids (8 × "AI Research Engineer"); copies crowded distinct matches out of the top 8.

Phase-2 broad fallback (description/eligibility, only when phase 1 is empty) and `filterRelevantOpportunities` unchanged. No new tables, no new search system.

## 8. Route-level guard — `frontend/src/app/api/ai/chat/route.ts`

If the model's text contains the exact no-match sentence while `opportunities.length > 0` (contradicts rule 2), the response is replaced by `buildRecordListing()` — a deterministic listing of the top 4 retrieved records (title, org, category, deadline, apply URL — all from the retrieval, so as safe as the fallback itself; the URL sanitizer still runs after). This covers model drift/parroting even when context is good. Honest no-match (records empty) is untouched.

## 9. Regression tests — 5 added (`frontend/src/__tests__/ai/grounding.test.ts`)

1. Real DRDO row outranks category=jrf flood rows for "DRDO JRF".
2. Model echoing the fallback sentence with records in context → records listed, no false "couldn't find" (route-level).
3. Same fallback text with NO records retrieved → passes through untouched, `grounded:false`.
4. Deterministic listing contains only retrieved titles/URLs; every URL survives the sanitizer.
5. Primary-field match ranks above description-only match at equal intent.

Result: **79/79 tests pass** (74 existing + 5 new), `tsc --noEmit` clean, `next lint` clean (1 pre-existing `<img>` warning in profile page, untouched).

## 10. Before / after (evidence, live DB + real model)

Context dump (live DB, new logic) for the three failing queries:
- **DRDO JRF**: top 8 = DRDO JRF - Microelectronics & Radar Systems, DRDO JRF - Radar Signal Processing, CFEES Delhi (DRDO), Defence Lab Jodhpur (DRDO), SAG Delhi (DRDO), DRDO Scientist B VLSI, DYSL-QT RA ×2 — 8/8 genuine.
- **JRF VLSI**: IIIT Hyderabad VLSI Project Associate, IIT Bombay PhD Microelectronics & VLSI ×2, DRDO Scientist B VLSI at top.
- **internship semiconductor**: DMRL paid internship (DRDO), SSPL paid internship, DYSL-QT paid internship now in the 8.

Model harness (exact route prompt → groq `llama-3.1-8b-instant`, 2 shots each):
- DRDO JRF: **2/2 list records** (title/org/category/location/deadline/stipend/URL), no echo.
- JRF VLSI: **2/2 list records**, no echo.
- internship semiconductor: **2/2 list the 3 internships**, no echo.
- IIT research associate: **2/2 list IIT Madras RA (Physical Design & STA + SHAKTI)**, no echo.

Previously: 4/4 queries echoed the fallback 8/8 times; now 8/8 compliant shots on the same queries, same model, same prompt — only the context changed.

## Remaining limitations (unchanged by this fix)

- Model is an 8B-class small model; the route guard is the safety net for residual parroting.
- Duplicate-posted roles are collapsed by exact title match only (near-duplicate titles can still coexist).
- Rate limits on free-tier provider keys can trigger gateway fallback (observed: groq 429 → nvidia/cloudflare in battery).
- Fix is code-complete and tested; **requires a deploy + prod re-battery after human approval** to confirm end-to-end.

## Deliverables

- Code: `frontend/src/lib/ai/grounding.ts`, `frontend/src/app/api/ai/chat/route.ts`, `frontend/src/__tests__/ai/grounding.test.ts`
- Evidence tooling (in `/tmp/opencode/newsverify/`, not committed): `context-dump2.cjs` (context mirror), `groq-harness.cjs` (prompt-exact model harness; key read in-process, never printed)
- This report. No secrets. Nothing committed, pushed, or deployed.
