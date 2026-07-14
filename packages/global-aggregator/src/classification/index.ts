import type {
  ClassificationResult,
  ClassificationLabel,
  EducationLevel,
  ExperienceLevel,
  NormalizedOpportunity,
  OpportunityType,
  WorkMode,
} from "../types";
import { gateway, safeParseJSON } from "@siliconpath/ai-gateway";

interface ClassifierStats {
  totalClassified: number;
  aiClassified: number;
  ruleClassified: number;
}

interface AIClassificationResponse {
  type?: OpportunityType;
  categories?: ClassificationLabel[];
  domains?: string[];
  skills?: string[];
  educationLevel?: EducationLevel;
  experienceLevel?: ExperienceLevel;
  workMode?: WorkMode;
  isGovernment?: boolean;
  isIndustry?: boolean;
  isResearch?: boolean;
  confidence?: number;
}

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

const TYPE_KEYWORDS: string[][] = [
  ["phd", "doctoral", "doctorate"],
  ["postdoc", "post-doctoral", "post doctoral"],
  ["intern", "internship"],
  ["professor", "faculty", "lecturer"],
  ["scholarship"],
  ["fellowship", "fellow"],
  ["grant", "funding"],
  ["conference"],
  ["workshop"],
  ["training"],
  ["hackathon"],
  ["competition"],
  ["research assistant", "ra"],
  ["teaching", "teacher"],
  ["government", "ias", "ips", "upsc"],
];

const TYPE_MAP: Record<string, OpportunityType> = {
  "phd": "phd",
  "doctoral": "phd",
  "doctorate": "phd",
  "postdoc": "postdoctoral",
  "post-doctoral": "postdoctoral",
  "post doctoral": "postdoctoral",
  "intern": "internship",
  "internship": "internship",
  "professor": "faculty",
  "faculty": "faculty",
  "lecturer": "faculty",
  "scholarship": "scholarship",
  "fellowship": "fellowship",
  "fellow": "fellowship",
  "grant": "research-grant",
  "funding": "research-grant",
  "conference": "conference",
  "workshop": "workshop",
  "training": "training-program",
  "hackathon": "hackathon",
  "competition": "competition",
  "research assistant": "research-assistantship",
  "ra": "research-assistantship",
  "teaching": "teaching",
  "teacher": "teaching",
  "government": "government-job",
  "ias": "government-job",
  "ips": "government-job",
  "upsc": "government-job",
};

const CATEGORY_KEYWORDS: Record<ClassificationLabel, string[]> = {
  "semiconductor-idm": ["intel", "samsung", "tsmc", "semiconductor", "foundry", "fabrication"],
  "fabless": ["fabless", "qualcomm", "broadcom", "nvidia", "amd", "mediatek", "arm"],
  "equipment": ["equipment", "asml", "lam research", "applied materials", "tokyo electron"],
  "materials": ["materials", "chemical", "substrate", "wafer", "silicon"],
  "osat": ["osat", "packaging", "assembly", "test", "ASE"],
  "power-auto": ["power electronics", "automotive", "ev", "electric vehicle", "battery"],
  "memory-storage": ["memory", "storage", "dram", "nand", "ssd", "hbm"],
  "test-measurement": ["test", "measurement", "keysight", "teradyne", "national instruments"],
  "eda": ["eda", "cadence", "synopsys", "mentor", "design automation", "vlsi"],
  "networking-chip": ["networking", "switch", "router", "ethernet", "phy"],
  "national-lab-india": ["barc", "dae", "drdo", "isro", "csir", "national lab"],
  "national-lab-intl": ["cern", "fermibnl", "argonne", "oak ridge", "pnnl", "lbl"],
  "university-india": ["iit", "iisc", "nit", "bits", "iiser"],
  "university-na": ["mit", "stanford", "berkeley", "cmu", "caltech", "harvard"],
  "university-europe": ["oxford", "cambridge", "eth zurich", "imperial", "epfl"],
  "university-asia": ["ntu", "nus", "tsinghua", "peking", "tokyo"],
  "university-rest": ["university", "college", "institute"],
  "government-india": ["government of india", "ministry", "ias", "ips", "upsc"],
  "government-intl": ["government", "federal", "state agency"],
  "psu-india": ["psu", "public sector", "navratna", "maharatna"],
  "rss-feed": ["rss", "feed"],
  "funding-agency": ["nsf", "darpa", "erc", "funding", "grant agency"],
  "nonprofit": ["nonprofit", "ngo", "foundation"],
  "startup": ["startup", "seed", "series a", "series b"],
  "defense": ["defense", "military", "army", "navy", "air force", "mod"],
  "space": ["space", "satellite", "orbit", "launch", "astro"],
  "energy": ["energy", "renewable", "solar", "wind", "nuclear", "oil", "gas"],
  "healthcare": ["healthcare", "medical", "pharma", "biotech", "clinical"],
  "automotive": ["automotive", "vehicle", "car", "toyota", "bmw", "tesla"],
  "aerospace": ["aerospace", "aviation", "boeing", "airbus", "aircraft"],
  "telecom": ["telecom", "telecommunications", "5g", "6g", "wireless"],
  "ai-ml": ["artificial intelligence", "machine learning", "deep learning", "neural", "llm"],
  "research-lab": ["research lab", "research center", "research institute"],
};

const SKILL_KEYWORDS = [
  "python", "java", "c++", "c#", "javascript", "typescript", "rust", "go", "golang",
  "scala", "kotlin", "swift", "ruby", "php", "perl", "matlab", "r",
  "machine learning", "deep learning", "nlp", "natural language processing",
  "computer vision", "data science", "data analysis", "data engineering",
  "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
  "hadoop", "spark", "kafka", "flink", "airflow", "dbt",
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ansible", "jenkins", "ci/cd", "devops",
  "sql", "nosql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "react", "angular", "vue", "node", "express", "fastapi", "django", "flask",
  "rest api", "graphql", "grpc",
  "linux", "unix", "bash", "shell scripting",
  "verilog", "vhdl", "systemverilog", "fpga", "rtl", "digital design",
  "analog", "mixed-signal", "rf", "microwave", "photonics",
  "vlsi", "asic", "soc", "chip design", "layout",
  "cadence", "synopsys", "mentor graphics", "xilinx", "altera",
  "signal processing", "image processing", "control systems",
  "blockchain", "web3", "solidity",
  "git", "svn", "agile", "scrum", "jira",
  "technical writing", "project management",
];

const EDUCATION_PATTERNS: Array<{ pattern: RegExp; level: EducationLevel }> = [
  { pattern: /\b(ph\.?d|phd|doctorate|doctoral)\b/i, level: "phd" },
  { pattern: /\b(postdoc|post-doctoral|postdoctoral)\b/i, level: "postdoc" },
  { pattern: /\b(master'?s?|m\.?s\.?|m\.?tech|mba|meng)\b/i, level: "master" },
  { pattern: /\b(bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?|bca|bsc|be)\b/i, level: "bachelor" },
  { pattern: /\b(high school|12th|secondary)\b/i, level: "high-school" },
];

const EXPERIENCE_PATTERNS: Array<{ pattern: RegExp; level: ExperienceLevel }> = [
  { pattern: /\b(executive|c-?suite|vp|director|chief)\b/i, level: "executive" },
  { pattern: /\b(lead|principal|staff|architect)\b/i, level: "lead" },
  { pattern: /\b(senior|sr\.?|experienced)\b/i, level: "senior" },
  { pattern: /\b(\d+)\+?\s*years?\b/i, level: "mid" },
  { pattern: /\b(mid[- ]level|intermediate)\b/i, level: "mid" },
  { pattern: /\b(entry|junior|jr\.?|fresh|graduate|recent)\b/i, level: "entry" },
];

const EXPERIENCE_YEAR_THRESHOLDS: Array<{ max: number; level: ExperienceLevel }> = [
  { max: 2, level: "entry" },
  { max: 5, level: "mid" },
  { max: 10, level: "senior" },
  { max: 15, level: "lead" },
  { max: Infinity, level: "executive" },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/.,;:!?()[\]{}'"@#$%^&*+=|\\<>/~`]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function detectType(item: NormalizedOpportunity): OpportunityType {
  const text = `${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase();

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as Array<[string, string[]]>) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return TYPE_MAP[kw] ?? "job";
      }
    }
  }

  return "job";
}

function detectCategories(item: NormalizedOpportunity): ClassificationLabel[] {
  const text = `${item.title} ${item.organization} ${item.description} ${item.department}`.toLowerCase();
  const matched: ClassificationLabel[] = [];

  for (const [label, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<[ClassificationLabel, string[]]>) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matched.push(label);
        break;
      }
    }
  }

  return matched;
}

function extractSkills(item: NormalizedOpportunity): string[] {
  const text = `${item.title} ${item.description} ${item.requirements} ${(item as unknown as { skills?: string[] }).skills?.join(" ") ?? item.tags?.join(" ") ?? ""}`.toLowerCase();
  const found: string[] = [];

  for (const skill of SKILL_KEYWORDS) {
    if (text.includes(skill)) {
      found.push(skill);
    }
  }

  const unique = new Set(found);
  return Array.from(unique);
}

function detectEducationLevel(item: NormalizedOpportunity): EducationLevel {
  const text = `${item.title} ${item.requirements} ${item.description}`.toLowerCase();
  for (const { pattern, level } of EDUCATION_PATTERNS) {
    if (pattern.test(text)) return level;
  }
  return "any";
}

function detectExperienceLevel(item: NormalizedOpportunity): ExperienceLevel {
  const text = `${item.title} ${item.requirements} ${item.description}`.toLowerCase();

  for (const { pattern, level } of EXPERIENCE_PATTERNS) {
    if (pattern.test(text)) return level;
  }

  const yearMatch = text.match(/(\d+)\+?\s*years?/);
  if (yearMatch) {
    const years = Number.parseInt(yearMatch[1], 10);
    for (const { max, level } of EXPERIENCE_YEAR_THRESHOLDS) {
      if (years <= max) return level;
    }
  }

  return "any";
}

function detectWorkMode(item: NormalizedOpportunity): WorkMode {
  if (item.workMode !== "unknown") return item.workMode;
  const text = `${item.title} ${item.description} ${item.location}`.toLowerCase();
  if (text.includes("remote")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  if (text.includes("onsite") || text.includes("on-site") || text.includes("in-office")) return "onsite";
  return "unknown";
}

function detectSector(item: NormalizedOpportunity): {
  isGovernment: boolean;
  isIndustry: boolean;
  isResearch: boolean;
} {
  const cats = item.categories;
  const text = `${item.title} ${item.organization} ${item.description}`.toLowerCase();

  const isGovernment =
    cats.some((c) => c.startsWith("government") || c === "psu-india") ||
    text.includes("government") ||
    text.includes("ministry") ||
    text.includes("public sector");

  const isResearch =
    cats.some((c) => c.startsWith("university") || c.startsWith("national-lab") || c === "research-lab" || c === "funding-agency") ||
    text.includes("research") ||
    text.includes("laboratory") ||
    text.includes("institute");

  const isIndustry = !isGovernment && !isResearch;

  return { isGovernment, isIndustry, isResearch };
}

function extractDomains(item: NormalizedOpportunity): string[] {
  const domains = new Set<string>();
  const text = `${item.title} ${item.description} ${item.department} ${item.tags.join(" ")}`.toLowerCase();

  const domainMap: Array<{ pattern: RegExp; domain: string }> = [
    { pattern: /\b(software|web|mobile|app)\b/, domain: "software-engineering" },
    { pattern: /\b(data|analytics|database|sql)\b/, domain: "data-engineering" },
    { pattern: /\b(machine learning|ml|ai|artificial intelligence|deep learning|nlp)\b/, domain: "ai-ml" },
    { pattern: /\b(hardware|chip|silicon|vlsi|fpga|asic)\b/, domain: "hardware-engineering" },
    { pattern: /\b(quantum)\b/, domain: "quantum-computing" },
    { pattern: /\b(cyber|security|infosec)\b/, domain: "cybersecurity" },
    { pattern: /\b(cloud|devops|infrastructure|sre)\b/, domain: "cloud-infrastructure" },
    { pattern: /\b(network|telecom|5g|6g)\b/, domain: "networking" },
    { pattern: /\b(photonic|optical|photonics)\b/, domain: "photonics" },
    { pattern: /\b(power|energy|analog)\b/, domain: "power-electronics" },
    { pattern: /\b(biotech|bio|genomic|pharma)\b/, domain: "biotechnology" },
    { pattern: /\b(space|aerospace|satellite|rocket)\b/, domain: "space-aerospace" },
    { pattern: /\b(automotive|vehicle|ev)\b/, domain: "automotive" },
    { pattern: /\b(blockchain|web3|defi)\b/, domain: "blockchain" },
    { pattern: /\b(research|science|laboratory)\b/, domain: "research" },
  ];

  for (const { pattern, domain } of domainMap) {
    if (pattern.test(text)) {
      domains.add(domain);
    }
  }

  return Array.from(domains);
}

function buildRuleBasedResult(item: NormalizedOpportunity): ClassificationResult {
  const type = item.type !== "job" ? item.type : detectType(item);
  const categories = detectCategories(item);
  const skills = extractSkills(item);
  const domains = extractDomains(item);
  const educationLevel = item.educationLevel !== "any" ? item.educationLevel : detectEducationLevel(item);
  const experienceLevel = item.experienceLevel !== "any" ? item.experienceLevel : detectExperienceLevel(item);
  const workMode = detectWorkMode(item);
  const { isGovernment, isIndustry, isResearch } = detectSector(item);

  return {
    type,
    categories,
    domains,
    skills,
    countries: [item.country].filter((c) => c.length > 0),
    educationLevel,
    experienceLevel,
    workMode,
    isGovernment,
    isIndustry,
    isResearch,
    confidence: 0.7,
  };
}

const AI_CACHE = new Map<string, ClassificationResult>();

export class Classifier {
  private totalClassified = 0;
  private aiClassified = 0;
  private ruleClassified = 0;

  async classify(item: NormalizedOpportunity): Promise<ClassificationResult> {
    this.totalClassified++;

    const cached = AI_CACHE.get(item.hash);
    if (cached) return cached;

    const ruleResult = buildRuleBasedResult(item);

    if (ruleResult.confidence >= 0.8) {
      this.ruleClassified++;
      return ruleResult;
    }

    try {
      const aiResult = await this.classifyWithAI(item);
      AI_CACHE.set(item.hash, aiResult);
      this.aiClassified++;
      return aiResult;
    } catch {
      this.ruleClassified++;
      return ruleResult;
    }
  }

  async classifyBatch(items: NormalizedOpportunity[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];
    for (const item of items) {
      results.push(await this.classify(item));
    }
    return results;
  }

  getStats(): ClassifierStats {
    return {
      totalClassified: this.totalClassified,
      aiClassified: this.aiClassified,
      ruleClassified: this.ruleClassified,
    };
  }

  private async classifyWithAI(item: NormalizedOpportunity): Promise<ClassificationResult> {
    const prompt = [
      `Title: ${item.title}`,
      `Organization: ${item.organization}`,
      `Description: ${item.description.slice(0, 1000)}`,
      `Requirements: ${item.requirements.slice(0, 500)}`,
      `Location: ${item.location}`,
      `Tags: ${item.tags.join(", ")}`,
    ].join("\n");

    const systemPrompt = [
      "You are an expert job/opportunity classifier for the semiconductor and technology industry.",
      "Classify the given opportunity and return ONLY a JSON object with these fields:",
      `- "type": one of "job","research-position","phd","ms","internship","postdoctoral","faculty","teaching","government-job","psu-job","industry-job","scholarship","fellowship","research-grant","conference","workshop","training-program","competition","hackathon","open-call","research-assistantship"`,
      `- "categories": array of ClassificationLabel values from: "semiconductor-idm","fabless","equipment","materials","osat","power-auto","memory-storage","test-measurement","eda","networking-chip","national-lab-india","national-lab-intl","university-india","university-na","university-europe","university-asia","university-rest","government-india","government-intl","psu-india","rss-feed","funding-agency","nonprofit","startup","defense","space","energy","healthcare","automotive","aerospace","telecom","ai-ml","research-lab"`,
      `- "domains": array of relevant domain strings`,
      `- "skills": array of technical skills mentioned`,
      `- "educationLevel": one of "high-school","bachelor","master","phd","postdoc","any"`,
      `- "experienceLevel": one of "entry","mid","senior","lead","executive","any"`,
      `- "workMode": one of "remote","hybrid","onsite","unknown"`,
      `- "isGovernment": boolean`,
      `- "isIndustry": boolean`,
      `- "isResearch": boolean`,
      `- "confidence": number between 0 and 1`,
    ].join(" ");

    const response = await gateway.generate(prompt, {
      systemPrompt,
      temperature: 0.1,
      maxTokens: 512,
      responseFormat: "json",
    });

    const text = typeof response.text === "string" ? response.text : JSON.stringify(response.text);
    const parsed = safeParseJSON<AIClassificationResponse>(text, {});

    return {
      type: parsed.type && isValidType(parsed.type) ? parsed.type : "job",
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      domains: Array.isArray(parsed.domains) ? parsed.domains : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      countries: [item.country].filter((c) => c.length > 0),
      educationLevel: isValidEducationLevel(parsed.educationLevel) ? parsed.educationLevel : "any",
      experienceLevel: isValidExperienceLevel(parsed.experienceLevel) ? parsed.experienceLevel : "any",
      workMode: isValidWorkMode(parsed.workMode) ? parsed.workMode : "unknown",
      isGovernment: Boolean(parsed.isGovernment),
      isIndustry: Boolean(parsed.isIndustry),
      isResearch: Boolean(parsed.isResearch),
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
  }
}

const VALID_TYPES: Set<string> = new Set([
  "job", "research-position", "phd", "ms", "internship", "postdoctoral",
  "faculty", "teaching", "government-job", "psu-job", "industry-job",
  "scholarship", "fellowship", "research-grant", "conference", "workshop",
  "training-program", "competition", "hackathon", "open-call",
  "research-assistantship",
]);

function isValidType(v: string | undefined): v is OpportunityType {
  return v !== undefined && VALID_TYPES.has(v);
}

function isValidEducationLevel(v: string | undefined): v is EducationLevel {
  return v !== undefined && ["high-school", "bachelor", "master", "phd", "postdoc", "any"].includes(v);
}

function isValidExperienceLevel(v: string | undefined): v is ExperienceLevel {
  return v !== undefined && ["entry", "mid", "senior", "lead", "executive", "any"].includes(v);
}

function isValidWorkMode(v: string | undefined): v is WorkMode {
  return v !== undefined && ["remote", "hybrid", "onsite", "unknown"].includes(v);
}
