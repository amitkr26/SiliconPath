import type { NormalizedOpportunity } from "../types";

interface TFIDFResult {
  docId: string;
  score: number;
}

interface InvertedIndexEntry {
  docId: string;
  field: string;
  count: number;
}

interface TermEntry {
  docId: string;
  tf: number;
}

interface DocFieldWeights {
  field: string;
  weight: number;
}

const FIELD_WEIGHTS: DocFieldWeights[] = [
  { field: "title", weight: 3 },
  { field: "skills", weight: 2 },
  { field: "organization", weight: 2 },
  { field: "tags", weight: 1.5 },
  { field: "description", weight: 1 },
  { field: "requirements", weight: 1 },
];

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "this", "that",
  "these", "those", "it", "its", "we", "our", "you", "your", "they",
  "their", "he", "she", "his", "her", "not", "no", "nor", "if", "then",
  "than", "so", "as", "up", "out", "about", "into", "through", "during",
  "before", "after", "above", "below", "between", "under", "again",
  "further", "once", "here", "there", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "also", "just",
]);

export class FullTextIndex {
  private readonly invertedIndex = new Map<string, InvertedIndexEntry[]>();
  private readonly docTermCounts = new Map<string, Map<string, Map<string, number>>>();
  private readonly docCount = new Map<string, number>();
  private totalDocs = 0;

  index(items: NormalizedOpportunity[]): void {
    this.clear();
    for (const item of items) {
      this.add(item);
    }
  }

  add(item: NormalizedOpportunity): void {
    const id = item.id ?? item.hash;
    this.totalDocs++;

    const termCounts = new Map<string, Map<string, number>>();

    for (const { field, weight } of FIELD_WEIGHTS) {
      const text = this.extractFieldText(item, field);
      const tokens = this.tokenize(text);
      const fieldCounts = new Map<string, number>();

      for (const token of tokens) {
        fieldCounts.set(token, (fieldCounts.get(token) ?? 0) + 1);
      }

      termCounts.set(field, fieldCounts);

      for (const [term, count] of fieldCounts) {
        const entries = this.invertedIndex.get(term) ?? [];
        entries.push({ docId: id, field, count: count * weight });
        this.invertedIndex.set(term, entries);
      }
    }

    this.docTermCounts.set(id, termCounts);
    this.docCount.set(id, tokens(item.title + " " + item.description).length);
  }

  remove(id: string): void {
    const termCounts = this.docTermCounts.get(id);
    if (!termCounts) return;

    for (const [, fieldCounts] of termCounts) {
      for (const [term, count] of fieldCounts) {
        const entries = this.invertedIndex.get(term);
        if (!entries) continue;
        const idx = entries.findIndex((e) => e.docId === id);
        if (idx !== -1) {
          entries.splice(idx, 1);
          if (entries.length === 0) this.invertedIndex.delete(term);
        }
        void count;
      }
    }

    this.docTermCounts.delete(id);
    this.docCount.delete(id);
    this.totalDocs = Math.max(0, this.totalDocs - 1);
  }

  search(query: string): Map<string, number> {
    const queryTokens = this.tokenize(query);
    const scores = new Map<string, number>();

    for (const token of queryTokens) {
      const entries = this.invertedIndex.get(token);
      if (!entries) continue;

      const df = this.getDocumentFrequency(token);
      const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;

      for (const entry of entries) {
        const docLength = this.docCount.get(entry.docId) ?? 1;
        const tf = entry.count / docLength;
        const weightedTf = tf * this.getFieldWeight(entry.field);
        const score = weightedTf * idf;
        scores.set(entry.docId, (scores.get(entry.docId) ?? 0) + score);
      }
    }

    return scores;
  }

  private clear(): void {
    this.invertedIndex.clear();
    this.docTermCounts.clear();
    this.docCount.clear();
    this.totalDocs = 0;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-_/.,;:!?()[\]{}'"@#$%^&*+=|\\<>/~`]+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  }

  private extractFieldText(item: NormalizedOpportunity, field: string): string {
    switch (field) {
      case "title":
        return item.title;
      case "description":
        return item.description;
      case "requirements":
        return item.requirements;
      case "skills":
        return item.skills.join(" ");
      case "organization":
        return item.organization;
      case "tags":
        return item.tags.join(" ");
      default:
        return "";
    }
  }

  private getDocumentFrequency(term: string): number {
    return this.invertedIndex.get(term)?.length ?? 0;
  }

  private getFieldWeight(field: string): number {
    return FIELD_WEIGHTS.find((f) => f.field === field)?.weight ?? 1;
  }
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/.,;:!?()[\]{}'"@#$%^&*+=|\\<>/~`]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}
