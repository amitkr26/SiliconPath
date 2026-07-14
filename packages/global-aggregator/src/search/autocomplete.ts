import { SuggestionEngine } from "./suggestions";

interface FrequencyEntry {
  term: string;
  frequency: number;
}

export class Autocomplete {
  private readonly engine: SuggestionEngine;
  private readonly frequencies = new Map<string, number>();

  constructor(engine?: SuggestionEngine) {
    this.engine = engine ?? new SuggestionEngine();
  }

  complete(prefix: string): string[] {
    const suggestions = this.engine.suggest(prefix, 20);
    const entries: FrequencyEntry[] = suggestions.map((term) => ({
      term,
      frequency: this.frequencies.get(term.toLowerCase()) ?? 0,
    }));

    entries.sort((a, b) => b.frequency - a.frequency);
    return entries.map((e) => e.term);
  }

  recordSelection(term: string): void {
    const key = term.toLowerCase();
    this.frequencies.set(key, (this.frequencies.get(key) ?? 0) + 1);
  }

  getFrequency(term: string): number {
    return this.frequencies.get(term.toLowerCase()) ?? 0;
  }

  resetFrequencies(): void {
    this.frequencies.clear();
  }
}
