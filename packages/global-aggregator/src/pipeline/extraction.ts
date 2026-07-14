export class ContentExtractor {
  extractText(html: string | null | undefined): string {
    if (!html) return "";
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&\w+;/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }

  extractSentences(text: string, maxSentences: number = 3): string {
    if (!text) return "";
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return sentences.slice(0, maxSentences).join(" ");
  }

  extractKeywords(text: string, maxKeywords: number = 10): string[] {
    if (!text) return [];

    const stopWords = new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "shall",
      "should",
      "may",
      "might",
      "must",
      "can",
      "could",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "and",
      "but",
      "or",
      "nor",
      "not",
      "so",
      "yet",
      "both",
      "either",
      "neither",
      "each",
      "every",
      "all",
      "any",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "only",
      "own",
      "same",
      "than",
      "too",
      "very",
      "this",
      "that",
      "these",
      "those",
      "i",
      "me",
      "my",
      "we",
      "our",
      "you",
      "your",
      "he",
      "him",
      "his",
      "she",
      "her",
      "it",
      "its",
      "they",
      "them",
      "their",
      "what",
      "which",
      "who",
      "whom",
      "where",
      "when",
      "why",
      "how",
      "if",
      "then",
      "else",
      "about",
      "up",
      "out",
      "also",
      "just",
      "over",
      "new",
      "one",
      "two",
      "first",
      "last",
      "long",
      "great",
      "little",
      "own",
      "other",
      "old",
      "right",
      "big",
      "high",
      "different",
      "small",
      "large",
      "next",
      "early",
      "young",
      "important",
      "public",
      "bad",
      "same",
      "able",
      "get",
      "make",
      "go",
      "come",
      "take",
      "use",
      "find",
      "give",
      "tell",
      "work",
      "call",
      "try",
      "ask",
      "need",
      "feel",
      "become",
      "leave",
      "put",
      "mean",
      "keep",
      "let",
      "begin",
      "show",
      "hear",
      "play",
      "run",
      "move",
      "live",
      "believe",
      "hold",
      "bring",
      "happen",
      "must",
      "back",
      "great",
      "year",
      "many",
      "way",
      "well",
      "even",
      "new",
      "want",
      "because",
      "any",
      "these",
      "give",
      "day",
      "us",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s+#]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }
}
