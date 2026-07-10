/**
 * Safely parse AI model output that may contain JSON. LLMs frequently return
 * malformed JSON, markdown fences, or JSON mixed with prose. These helpers
 * degrade gracefully instead of throwing a 500.
 */
export function safeParseJSON<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    /* fall through */
  }

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      /* fall through */
    }
  }

  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      /* fall through */
    }
  }

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
