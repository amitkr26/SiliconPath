import type { NormalizedOpportunity, BooleanClause, ParsedQuery } from "../types";

interface InvertedIndexEntry {
  docId: string;
  field: string;
  count: number;
}

const FIELD_WEIGHTS: { field: string; weight: number }[] = [
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
  private readonly items = new Map<string, NormalizedOpportunity>();
  private totalDocs = 0;

  index(items: NormalizedOpportunity[]): void {
    this.clear();
    for (const item of items) this.add(item);
  }

  add(item: NormalizedOpportunity): void {
    const id = item.id ?? item.hash;
    this.items.set(id, item);
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
    this.docCount.set(id, this.tokenize(item.title + " " + item.description).length);
  }

  remove(id: string): void {
    const termCounts = this.docTermCounts.get(id);
    if (!termCounts) return;
    for (const [, fieldCounts] of termCounts) {
      for (const [term] of fieldCounts) {
        const entries = this.invertedIndex.get(term);
        if (!entries) continue;
        const idx = entries.findIndex((e) => e.docId === id);
        if (idx !== -1) {
          entries.splice(idx, 1);
          if (entries.length === 0) this.invertedIndex.delete(term);
        }
      }
    }
    this.docTermCounts.delete(id);
    this.docCount.delete(id);
    this.items.delete(id);
    this.totalDocs = Math.max(0, this.totalDocs - 1);
  }

  search(query: string): Map<string, number> {
    const queryTokens = this.tokenize(query);
    const scores = new Map<string, number>();
    for (const token of queryTokens) {
      const entries = this.invertedIndex.get(token);
      if (!entries) continue;
      const df = entries.length;
      const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
      for (const entry of entries) {
        const docLength = this.docCount.get(entry.docId) ?? 1;
        const tf = entry.count / docLength;
        const fieldWeight = this.getFieldWeight(entry.field);
        scores.set(entry.docId, (scores.get(entry.docId) ?? 0) + tf * fieldWeight * idf);
      }
    }
    return scores;
  }

  searchBoolean(parsed: ParsedQuery): Map<string, number> {
    if (!parsed.hasBoolean) {
      const combined = [parsed.text, ...parsed.phrases, ...parsed.fieldQueries.map((fq) => fq.term)].join(" ");
      return this.search(combined);
    }

    const positiveScore = new Map<string, number>();
    const negativeDocs = new Set<string>();
    const andClauses: { term: string; token: string }[][] = [];
    const orClauses: { term: string; token: string }[] = [];
    const notClauses: string[] = [];

    for (const clause of parsed.booleanClauses) {
      const tokens = this.tokenize(clause.term);
      if (clause.operator === "NOT") {
        notClauses.push(clause.term);
      } else if (clause.operator === "OR") {
        for (const token of tokens) {
          orClauses.push({ term: clause.term, token });
        }
      } else {
        const tokenObjs = tokens.map((token) => ({ term: clause.term, token }));
        andClauses.push(tokenObjs);
      }
    }

    for (const tokenGroup of andClauses) {
      for (const { token } of tokenGroup) {
        const entries = this.invertedIndex.get(token);
        if (!entries) continue;
        const df = entries.length;
        const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
        for (const entry of entries) {
          const docLength = this.docCount.get(entry.docId) ?? 1;
          const tf = entry.count / docLength;
          const fieldWeight = this.getFieldWeight(entry.field);
          positiveScore.set(entry.docId, (positiveScore.get(entry.docId) ?? 0) + tf * fieldWeight * idf);
        }
      }
    }

    for (const { token } of orClauses) {
      const entries = this.invertedIndex.get(token);
      if (!entries) continue;
      const df = entries.length;
      const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
      for (const entry of entries) {
        const docLength = this.docCount.get(entry.docId) ?? 1;
        const tf = entry.count / docLength;
        const fieldWeight = this.getFieldWeight(entry.field);
        positiveScore.set(entry.docId, (positiveScore.get(entry.docId) ?? 0) + tf * fieldWeight * idf);
      }
    }

    if (andClauses.length > 0) {
      const andDocIds = new Set<string>();
      let first = true;
      for (const tokenGroup of andClauses) {
        const docIdsForGroup = new Set<string>();
        for (const { token } of tokenGroup) {
          const entries = this.invertedIndex.get(token);
          if (!entries) continue;
          for (const entry of entries) {
            docIdsForGroup.add(entry.docId);
          }
        }
        if (first) {
          for (const id of docIdsForGroup) andDocIds.add(id);
          first = false;
        } else {
          for (const id of Array.from(andDocIds)) {
            if (!docIdsForGroup.has(id)) andDocIds.delete(id);
          }
        }
      }
      for (const docId of Array.from(positiveScore.keys())) {
        if (!andDocIds.has(docId) && !orClauses.some(({ token }) => {
          const entries = this.invertedIndex.get(token);
          return entries?.some((e) => e.docId === docId) ?? false;
        })) {
          positiveScore.delete(docId);
        }
      }
    }

    for (const notTerm of notClauses) {
      const notTokens = this.tokenize(notTerm);
      for (const token of notTokens) {
        const entries = this.invertedIndex.get(token);
        if (!entries) continue;
        for (const entry of entries) {
          negativeDocs.add(entry.docId);
        }
      }
    }

    for (const docId of negativeDocs) {
      positiveScore.delete(docId);
    }

    if (parsed.hasPhrases) {
      for (const phrase of parsed.phrases) {
        for (const [id, item] of this.items) {
          const text = (item.title + " " + item.description).toLowerCase();
          if (!text.includes(phrase.toLowerCase())) {
            positiveScore.delete(id);
          } else {
            positiveScore.set(id, (positiveScore.get(id) ?? 0) + 2);
          }
        }
      }
    }

    if (parsed.hasFields) {
      for (const fq of parsed.fieldQueries) {
        for (const [id, item] of this.items) {
          const fieldText = this.extractFieldText(item, fq.field).toLowerCase();
          if (!fieldText.includes(fq.term.toLowerCase())) {
            positiveScore.delete(id);
          } else {
            positiveScore.set(id, (positiveScore.get(id) ?? 0) + 3);
          }
        }
      }
    }

    return positiveScore;
  }

  searchPhrase(phrase: string): Map<string, number> {
    const phraseLower = phrase.toLowerCase();
    const phraseTokens = this.tokenize(phrase);
    if (phraseTokens.length === 0) return new Map();
    if (phraseTokens.length === 1) return this.search(phrase);

    const scores = new Map<string, number>();
    for (const [id, item] of this.items) {
      const text = (item.title + " " + item.description).toLowerCase();
      if (text.includes(phraseLower)) {
        scores.set(id, (scores.get(id) ?? 0) + 3);
      }
    }
    return scores;
  }

  searchField(field: string, term: string): Map<string, number> {
    const scores = new Map<string, number>();
    const termLower = term.toLowerCase();
    for (const [id, item] of this.items) {
      const fieldText = this.extractFieldText(item, field).toLowerCase();
      if (fieldText.includes(termLower)) {
        scores.set(id, 1);
      }
    }
    return scores;
  }

  getItemCount(): number {
    return this.items.size;
  }

  getTotalTerms(): number {
    let total = 0;
    for (const [, entries] of this.invertedIndex) {
      total += entries.length;
    }
    return total;
  }

  getUniqueTerms(): number {
    return this.invertedIndex.size;
  }

  clear(): void {
    this.invertedIndex.clear();
    this.docTermCounts.clear();
    this.docCount.clear();
    this.items.clear();
    this.totalDocs = 0;
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-_/.,;:!?()[\]{}'"@#$%^&*+=|\\<>/~`]+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  }

  getItems(): Map<string, NormalizedOpportunity> {
    return this.items;
  }

  getDocLength(id: string): number {
    return this.docCount.get(id) ?? 0;
  }

  private extractFieldText(item: NormalizedOpportunity, field: string): string {
    switch (field) {
      case "title": return item.title;
      case "description": return item.description;
      case "requirements": return item.requirements;
      case "skills": return item.skills.join(" ");
      case "organization": return item.organization;
      case "tags": return item.tags.join(" ");
      case "location": return item.location;
      case "department": return item.department;
      case "employmentType": return item.employmentType;
      case "responsibilities": return item.responsibilities;
      case "country": return item.country;
      case "city": return item.city;
      case "state": return item.state;
      default: return "";
    }
  }

  private getFieldWeight(field: string): number {
    return FIELD_WEIGHTS.find((f) => f.field === field)?.weight ?? 1;
  }
}
