import type {
  OpportunityType,
  ClassificationLabel,
  EducationLevel,
  ExperienceLevel,
  WorkMode,
} from "../types";

interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  term: string;
}

function createNode(): TrieNode {
  return { children: new Map(), isEnd: false, term: "" };
}

const KNOWN_TERMS: string[] = [
  ...Object.values<OpportunityType>({
    job: "job", "research-position": "research-position", phd: "phd", ms: "ms",
    internship: "internship", postdoctoral: "postdoctoral", faculty: "faculty",
    teaching: "teaching", "government-job": "government-job", "psu-job": "psu-job",
    "industry-job": "industry-job", scholarship: "scholarship", fellowship: "fellowship",
    "research-grant": "research-grant", conference: "conference", workshop: "workshop",
    "training-program": "training-program", competition: "competition",
    hackathon: "hackathon", "open-call": "open-call",
    "research-assistantship": "research-assistantship",
  }),
  "India", "United States", "Germany", "United Kingdom", "Canada", "Japan",
  "China", "South Korea", "Singapore", "Australia", "France", "Netherlands",
  "Israel", "Taiwan", "Ireland", "Sweden", "Switzerland",
  "python", "java", "c++", "javascript", "typescript", "rust", "go",
  "machine learning", "deep learning", "nlp", "computer vision",
  "data science", "data engineering", "data analysis",
  "tensorflow", "pytorch", "keras",
  "aws", "azure", "gcp", "docker", "kubernetes",
  "verilog", "vhdl", "systemverilog", "fpga", "rtl",
  "vlsi", "asic", "soc", "eda",
  "semiconductor", "fabless", "equipment", "materials",
  "Intel", "Samsung", "TSMC", "Qualcomm", "NVIDIA", "AMD",
  "Broadcom", "MediaTek", "ARM", "ASML", "Cadence", "Synopsys",
  "remote", "hybrid", "onsite",
  "entry level", "mid level", "senior", "lead",
  "bachelor", "master", "phd", "postdoc",
  "IIT", "IISc", "NIT", "MIT", "Stanford", "Berkeley",
  "Google", "Microsoft", "Apple", "Amazon", "Meta",
];

export class SuggestionEngine {
  private readonly root: TrieNode;

  constructor() {
    this.root = createNode();
    for (const term of KNOWN_TERMS) {
      this.insert(term);
    }
  }

  suggest(prefix: string, maxResults = 10): string[] {
    const node = this.navigateToPrefix(prefix.toLowerCase());
    if (!node) return [];

    const results: string[] = [];
    this.collectTerms(node, results, maxResults);
    return results;
  }

  addTerm(term: string): void {
    this.insert(term);
  }

  private insert(term: string): void {
    let current = this.root;
    const lower = term.toLowerCase();
    for (const char of lower) {
      if (!current.children.has(char)) {
        current.children.set(char, createNode());
      }
      current = current.children.get(char)!;
    }
    current.isEnd = true;
    current.term = term;
  }

  private navigateToPrefix(prefix: string): TrieNode | null {
    let current = this.root;
    for (const char of prefix) {
      if (!current.children.has(char)) return null;
      current = current.children.get(char)!;
    }
    return current;
  }

  private collectTerms(node: TrieNode, results: string[], limit: number): void {
    if (results.length >= limit) return;
    if (node.isEnd) {
      results.push(node.term);
    }
    for (const [char, child] of node.children) {
      void char;
      if (results.length >= limit) return;
      this.collectTerms(child, results, limit);
    }
  }
}
