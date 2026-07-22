# ADR-013: Tolerant JSON Parser for AI Output

**Status**: Accepted
**Date**: 2024-04-20
**Author**: Architecture Board

## Context

AI model outputs frequently contain JSON embedded in natural language, wrapped in markdown code fences, truncated mid-response, or containing stray characters. Repeated production incidents involved `JSON.parse()` failures crashing features.

## Decision

Never use `JSON.parse()` directly on AI model output. Always use the tolerant parser in `src/lib/ai/safe-parse.ts` which handles:

1. **Markdown code fences**: Strip ```json ... ``` before parsing
2. **Leading text**: Extract JSON from conversational responses
3. **Trailing text**: Ignore text after closing bracket/brace
4. **Partial content**: Parse what's available if truncated
5. **Escape handling**: Fix common escape issues in model output
6. **Multiple JSON objects**: Return only the first valid object
7. **Deep recovery**: Try to extract valid JSON from corrupted strings

```typescript
// Never do this:
const result = JSON.parse(aiResponse); // DANGEROUS

// Always do this:
const result = tolerantParse(aiResponse); // SAFE
```

## Consequences

**Positive:**
- Near-zero parse failures from AI output
- Works with any model, even poorly prompted ones
- Enables the 7-provider fallback chain to work reliably

**Negative:**
- Minor performance cost of regex-based extraction
- May silently return null on truly unparseable output (caller must handle null)
- Can mask prompt quality issues (bad prompts return partial data instead of errors)

**Implementation**: See `src/lib/ai/safe-parse.ts` for the full implementation with tests.
