/**
 * Safely parse AI/LLM output that is expected to contain JSON.
 *
 * LLMs frequently wrap JSON in markdown fences, prepend prose, or emit slightly
 * malformed output. A bare JSON.parse() throws and (previously) produced 500s in
 * matcher.ts, summarizer.ts and search-parser.ts. This helper degrades gracefully.
 */
export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  // 1. Direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* continue */
  }

  // 2. Extract from ```json ... ``` fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      /* continue */
    }
  }

  // 3. Grab the first balanced-looking object/array
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      /* continue */
    }
  }

  return fallback;
}

/**
 * Parse with an optional retry callback (e.g. re-prompt the model).
 */
export async function parseWithRetry<T>(
  raw: string,
  retryFn: () => Promise<string>,
  fallback: T,
  maxRetries = 1
): Promise<T> {
  const first = safeParseJSON<T | null>(raw, null);
  if (first !== null) return first as T;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const retry = await retryFn();
      const parsed = safeParseJSON<T | null>(retry, null);
      if (parsed !== null) return parsed as T;
    } catch {
      /* continue */
    }
  }

  return fallback;
}
