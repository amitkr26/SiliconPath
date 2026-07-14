export class SynonymEngine {
  private readonly synonymMap = new Map<string, string[]>();
  private readonly canonicalMap = new Map<string, string>();

  constructor() {
    this.addGroup([
      "phd", "doctorate", "doctoral", "ph.d", "doctor of philosophy",
    ]);
    this.addGroup([
      "ms", "master", "masters", "master's", "m.s.", "master of science",
    ]);
    this.addGroup([
      "internship", "intern", "trainee", "apprenticeship", "apprentice",
    ]);
    this.addGroup([
      "postdoc", "post-doctoral", "post doctoral", "postdoctoral",
    ]);
    this.addGroup([
      "faculty", "professor", "prof", "academic", "lecturer", "instructor",
    ]);
    this.addGroup([
      "scholarship", "scholarships", "fellowship", "stipend",
    ]);
    this.addGroup([
      "grant", "funding", "award", "research grant", "research funding",
    ]);
    this.addGroup([
      "remote", "work from home", "wfh", "telecommute", "telecommuting", "distributed",
    ]);
    this.addGroup([
      "hybrid", "flexible", "partially remote", "mixed",
    ]);
    this.addGroup([
      "onsite", "on-site", "in-office", "on premises", "office based",
    ]);
    this.addGroup([
      "semiconductor", "chip", "microchip", "silicon", "integrated circuit", "ic design",
    ]);
    this.addGroup([
      "vlsi", "very large scale integration", "asic", "soc", "system on chip",
    ]);
    this.addGroup([
      "machine learning", "ml", "artificial intelligence", "ai", "deep learning", "neural network",
    ]);
    this.addGroup([
      "software", "software engineering", "software development", "programming", "coding",
    ]);
    this.addGroup([
      "data science", "data scientist", "data analytics", "data analysis",
    ]);
    this.addGroup([
      "engineering", "engineer", "developer",
    ]);
    this.addGroup([
      "entry level", "junior", "fresher", "graduate", "early career",
    ]);
    this.addGroup([
      "senior", "sr", "staff", "principal", "lead",
    ]);
    this.addGroup([
      "manager", "management", "director", "head",
    ]);
    this.addGroup([
      "government", "public sector", "govt", "government job",
    ]);
    this.addGroup([
      "research", "r&d", "research and development", "rd",
    ]);
  }

  addGroup(terms: string[]): void {
    if (terms.length === 0) return;
    const canonical = terms[0].toLowerCase();
    const lower = terms.map((t) => t.toLowerCase());
    for (const term of lower) {
      if (!this.synonymMap.has(term)) {
        this.synonymMap.set(term, []);
      }
      const existing = this.synonymMap.get(term)!;
      for (const synonym of lower) {
        if (synonym !== term && !existing.includes(synonym)) {
          existing.push(synonym);
        }
      }
      this.canonicalMap.set(term, canonical);
    }
  }

  getSynonyms(term: string): string[] {
    const lower = term.toLowerCase();
    return this.synonymMap.get(lower) ?? [];
  }

  getCanonical(term: string): string {
    const lower = term.toLowerCase();
    return this.canonicalMap.get(lower) ?? term;
  }

  expand(query: string): string {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const expanded = new Set<string>();
    for (const token of tokens) {
      expanded.add(token);
      const synonyms = this.getSynonyms(token);
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
    return Array.from(expanded).join(" ");
  }
}
