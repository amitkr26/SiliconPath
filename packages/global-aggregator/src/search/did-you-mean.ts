const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "can", "could", "should", "may", "might", "shall", "not",
  "no", "nor", "so", "if", "then", "than", "that", "this", "these",
  "those", "it", "its", "all", "each", "every", "both", "neither",
  "either", "how", "what", "when", "where", "which", "who", "whom",
  "why", "about", "into", "over", "after", "before", "between", "under",
  "above", "below", "up", "down", "out", "off", "just", "also", "very",
  "too", "more", "most", "such", "only", "own", "same", "other",
  "new", "good", "first", "last", "long", "great", "little", "big",
  "high", "different", "small", "large", "next", "early", "young",
  "important", "few", "many", "much", "some", "any", "here", "there",
]);

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export class DidYouMean {
  private readonly dictionary: string[] = [];

  addTerms(terms: string[]): void {
    for (const term of terms) {
      const lower = term.toLowerCase().trim();
      if (lower.length >= 2 && !STOP_WORDS.has(lower) && !this.dictionary.includes(lower)) {
        this.dictionary.push(lower);
      }
    }
  }

  correct(query: string): string | null {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const corrections: string[] = [];
    let hasCorrection = false;

    for (const token of tokens) {
      if (token.length < 2 || STOP_WORDS.has(token)) {
        corrections.push(token);
        continue;
      }

      if (this.dictionary.includes(token)) {
        corrections.push(token);
        continue;
      }

      let bestMatch: string | null = null;
      let bestDistance = Infinity;

      for (const word of this.dictionary) {
        if (Math.abs(word.length - token.length) > 3) continue;
        const dist = editDistance(token, word);
        if (dist < bestDistance && dist <= 2) {
          bestDistance = dist;
          bestMatch = word;
        }
      }

      if (bestMatch) {
        corrections.push(bestMatch);
        hasCorrection = true;
      } else {
        corrections.push(token);
      }
    }

    if (!hasCorrection) return null;
    return corrections.join(" ");
  }

  suggest(query: string): string[] {
    const suggestions: { suggestion: string; score: number }[] = [];
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      if (token.length < 2 || STOP_WORDS.has(token)) continue;

      for (const word of this.dictionary) {
        const dist = editDistance(token, word);
        if (dist <= 2 && dist > 0) {
          suggestions.push({ suggestion: word, score: 1 / (1 + dist) });
        }
      }
    }

    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, 5).map((s) => s.suggestion);
  }

  size(): number {
    return this.dictionary.length;
  }
}
