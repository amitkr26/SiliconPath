/**
 * Safely parse AI model output that may contain JSON.
 *
 * LLMs frequently return malformed JSON, markdown code fences, or JSON mixed
 * with prose. A bare JSON.parse() on this output throws and returns a 500 to
 * the user. These helpers degrade gracefully instead.
 */
export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  // 1. Direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }

  // 2. Extract from markdown code fences ```json ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }

  // 3. Grab the first balanced-looking object or array
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      /* fall through */
    }
  }

  // 4. Strip common LLM preambles then retry
  const trimmed = raw
    .replace(/^(Here's|Here is|The|This|I've|Based on|Sure)[\s\S]*?[:\n]/i, "")
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  return fallback;
}

/**
 * Parse AI output, retrying the generation once if the first result is unparseable.
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
      /* try again */
    }
  }

  return fallback;
}
