import type {
  RawScrapedOpportunity,
  NormalizedOpportunity,
  SourceConfig,
  PipelineConfig,
  WorkMode,
  OpportunityType,
  EducationLevel,
  ExperienceLevel,
  ClassificationLabel,
  ValidationStatus,
} from "../types";
import { createHash } from "node:crypto";
import { Deduplicator } from "./deduplication";
import { Canonicalizer } from "./canonicalization";
import { ContentExtractor } from "./extraction";
import { MetadataExtractor } from "./metadata";
import { LanguageDetector } from "./language";
import { TimezoneNormalizer } from "./timezone";
import { DeadlineNormalizer } from "./deadline";
import { SalaryParser } from "./salary";
import { EligibilityParser } from "./eligibility";
import { CountryDetector } from "./country";
import { InstitutionDetector } from "./institution";
import { TagClassifier } from "./tags";

export class Pipeline {
  private readonly deduplicator: Deduplicator;
  private readonly canonicalizer: Canonicalizer;
  private readonly extractor: ContentExtractor;
  private readonly metadataExtractor: MetadataExtractor;
  private readonly languageDetector: LanguageDetector;
  private readonly timezoneNormalizer: TimezoneNormalizer;
  private readonly deadlineNormalizer: DeadlineNormalizer;
  private readonly salaryParser: SalaryParser;
  private readonly eligibilityParser: EligibilityParser;
  private readonly countryDetector: CountryDetector;
  private readonly institutionDetector: InstitutionDetector;
  private readonly tagClassifier: TagClassifier;
  private readonly config: PipelineConfig;

  constructor(
    deduplicator: Deduplicator,
    canonicalizer: Canonicalizer,
    extractor: ContentExtractor,
    metadataExtractor: MetadataExtractor,
    languageDetector: LanguageDetector,
    timezoneNormalizer: TimezoneNormalizer,
    deadlineNormalizer: DeadlineNormalizer,
    salaryParser: SalaryParser,
    eligibilityParser: EligibilityParser,
    countryDetector: CountryDetector,
    institutionDetector: InstitutionDetector,
    tagClassifier: TagClassifier,
    config?: Partial<PipelineConfig>,
  ) {
    this.deduplicator = deduplicator;
    this.canonicalizer = canonicalizer;
    this.extractor = extractor;
    this.metadataExtractor = metadataExtractor;
    this.languageDetector = languageDetector;
    this.timezoneNormalizer = timezoneNormalizer;
    this.deadlineNormalizer = deadlineNormalizer;
    this.salaryParser = salaryParser;
    this.eligibilityParser = eligibilityParser;
    this.countryDetector = countryDetector;
    this.institutionDetector = institutionDetector;
    this.tagClassifier = tagClassifier;
    this.config = {
      deduplication: { enabled: true, windowHours: 168 },
      canonicalization: { enabled: true },
      contentExtraction: { enabled: true, minLength: 20 },
      metadataExtraction: { enabled: true },
      languageDetection: { enabled: true, fallback: "en" },
      timezoneNormalization: { enabled: true, defaultTimezone: "UTC" },
      deadlineNormalization: { enabled: true },
      salaryParsing: { enabled: true, defaultCurrency: "" },
      eligibilityParsing: { enabled: true },
      countryDetection: { enabled: true },
      institutionDetection: { enabled: true },
      tagClassification: { enabled: true, maxTags: 15 },
      ...config,
    };
  }

  async process(
    raw: RawScrapedOpportunity,
    source: SourceConfig,
  ): Promise<NormalizedOpportunity | null> {
    const description = this.extractor.extractText(raw.description);
    const requirements = this.extractor.extractText(raw.requirements);
    const responsibilities = this.extractor.extractText(raw.responsibilities);

    if (
      this.config.contentExtraction.enabled &&
      description.length < this.config.contentExtraction.minLength &&
      (raw.title ?? "").length < 5
    ) {
      return null;
    }

    const canonicalUrl = this.config.canonicalization.enabled
      ? this.canonicalizer.canonicalize(raw.sourceUrl)
      : raw.sourceUrl;

    const applyLink = raw.applyLink
      ? this.config.canonicalization.enabled
        ? this.canonicalizer.canonicalize(raw.applyLink)
        : raw.applyLink
      : "";

    const location = raw.location ?? "";
    const parts = this.parseLocation(location);
    const country =
      this.config.countryDetection.enabled
        ? this.countryDetector.detect(location, source.scheduling.timezone)
        : source.country;
    const timezone =
      this.config.timezoneNormalization.enabled
        ? this.timezoneNormalizer.normalize(country, source.scheduling.timezone)
        : source.scheduling.timezone ?? "UTC";

    const postedDate =
      this.config.metadataExtraction.enabled
        ? this.metadataExtractor.extractPostedDate(raw)
        : raw.postedDate;

    const deadline =
      this.config.deadlineNormalization.enabled
        ? this.deadlineNormalizer.normalize(raw.deadline, postedDate)
        : raw.deadline;

    const salary =
      this.config.salaryParsing.enabled
        ? this.salaryParser.parse(raw.salary)
        : { min: null, max: null, currency: "" };

    const eligibility =
      this.config.eligibilityParsing.enabled
        ? this.eligibilityParser.parse(raw.eligibility)
        : [];

    const language =
      this.config.languageDetection.enabled
        ? this.languageDetector.detect(raw.description ?? raw.title ?? "")
        : this.config.languageDetection.fallback;

    const institution =
      this.config.institutionDetection.enabled
        ? this.institutionDetector.detect(raw.organization, raw.sourceUrl)
        : null;

    const type = this.classifyType(raw.type, raw.title, description);
    const workMode = raw.workMode ?? "unknown";
    const isRemote = workMode === "remote";

    const categories: ClassificationLabel[] = [source.category];
    if (institution) {
      categories.push(institution.type);
    }

    const domains =
      this.config.tagClassification.enabled
        ? this.tagClassifier.classify({
            title: raw.title,
            description,
            requirements,
            domains: [],
            skills: raw.tags,
          })
        : [];

    const skills = this.extractSkills(raw.tags, raw.requirements, description);

    const educationLevel = this.classifyEducationLevel(eligibility);
    const experienceLevel = this.classifyExperienceLevel(eligibility, description);

    const tags =
      this.config.tagClassification.enabled
        ? this.tagClassifier.classify({
            title: raw.title,
            description,
            requirements,
            domains,
            skills,
          })
        : raw.tags;

    const hash = this.computeHash({
      title: raw.title,
      organization: raw.organization,
      sourceUrl: raw.sourceUrl,
      canonicalUrl,
    });

    const normalized: NormalizedOpportunity = {
      title: raw.title.trim(),
      organization: raw.organization.trim(),
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      canonicalUrl,
      applyLink,
      location,
      country,
      city: parts.city,
      state: parts.state,
      description,
      requirements,
      responsibilities,
      deadline,
      postedDate,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryCurrency: salary.currency,
      eligibility,
      type,
      workMode,
      department: this.metadataExtractor.extractDepartment(raw) ?? "",
      employmentType: raw.employmentType ?? "",
      educationLevel,
      experienceLevel,
      categories,
      skills,
      domains,
      tags,
      language,
      timezone,
      isRemote,
      isGovernment: this.isGovernment(raw.organization, source.category),
      isActive: true,
      verificationStatus: "pending" as ValidationStatus,
      hash,
      scrapedAt: new Date().toISOString(),
    };

    if (
      this.config.deduplication.enabled &&
      this.deduplicator.isDuplicate(normalized)
    ) {
      return null;
    }

    if (this.config.deduplication.enabled) {
      this.deduplicator.markSeen(normalized);
    }

    return normalized;
  }

  async processBatch(
    raws: RawScrapedOpportunity[],
    source: SourceConfig,
  ): Promise<NormalizedOpportunity[]> {
    const results: NormalizedOpportunity[] = [];
    for (const raw of raws) {
      const normalized = await this.process(raw, source);
      if (normalized) results.push(normalized);
    }
    return results;
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  private parseLocation(location: string): {
    city: string;
    state: string;
  } {
    if (!location) return { city: "", state: "" };
    const parts = location.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return { city: parts[0], state: parts[1] };
    }
    return { city: parts[0] ?? "", state: "" };
  }

  private classifyType(
    rawType: string | null,
    title: string,
    description: string,
  ): OpportunityType {
    if (rawType) {
      const valid: OpportunityType[] = [
        "job", "research-position", "phd", "ms", "internship",
        "postdoctoral", "faculty", "teaching", "government-job",
        "psu-job", "industry-job", "scholarship", "fellowship",
        "research-grant", "conference", "workshop", "training-program",
        "competition", "hackathon", "open-call", "research-assistantship",
      ];
      if (valid.includes(rawType as OpportunityType)) {
        return rawType as OpportunityType;
      }
    }

    const text = `${title} ${description}`.toLowerCase();

    if (/\bph\.?d\.?\b/.test(text) || /\bdoctoral\b/.test(text)) return "phd";
    if (/\bpostdoc/.test(text)) return "postdoctoral";
    if (/\bm\.?tech\b/.test(text) || /\bms\b/.test(text)) return "ms";
    if (/\bintern/.test(text)) return "internship";
    if (/\bfaculty\b/.test(text) || /\bprofessor\b/.test(text)) return "faculty";
    if (/\bteaching\b/.test(text) || /\blecturer\b/.test(text)) return "teaching";
    if (/\bscholarship\b/.test(text) || /\bfellowship\b/.test(text)) return "scholarship";
    if (/\bgrant\b/.test(text) || /\bfunding\b/.test(text)) return "research-grant";
    if (/\bconference\b/.test(text)) return "conference";
    if (/\bworkshop\b/.test(text)) return "workshop";
    if (/\bcompetition\b/.test(text) || /\bcontest\b/.test(text)) return "competition";
    if (/\bhackathon\b/.test(text)) return "hackathon";
    if (/\bresearch\b/.test(text)) return "research-position";

    return "job";
  }

  private classifyEducationLevel(eligibility: string[]): EducationLevel {
    const text = eligibility.join(" ").toLowerCase();
    if (/\bph\.?d\.?\b/.test(text) || /\bdoctoral\b/.test(text)) return "phd";
    if (/\bpostdoc/.test(text)) return "postdoc";
    if (/\bm\.?tech\b/.test(text) || /\bmaster/.test(text) || /\bm\.?sc\b/.test(text)) return "master";
    if (/\bb\.?tech\b/.test(text) || /\bbachelor/.test(text) || /\bbe\b/.test(text) || /\bb\.?sc\b/.test(text)) return "bachelor";
    if (/\bhigh\s*school\b/.test(text) || /\b12th\b/.test(text)) return "high-school";
    return "any";
  }

  private classifyExperienceLevel(
    eligibility: string[],
    description: string,
  ): ExperienceLevel {
    const text = `${eligibility.join(" ")} ${description}`.toLowerCase();
    if (/\b(\d+)\s*\+?\s*years?\b/.test(text)) {
      const match = text.match(/\b(\d+)\s*\+?\s*years?\b/);
      if (match) {
        const years = parseInt(match[1], 10);
        if (years <= 2) return "entry";
        if (years <= 5) return "mid";
        if (years <= 10) return "senior";
        return "lead";
      }
    }
    if (/\bfresher\b/.test(text) || /\bentry[\s-]*level\b/.test(text)) return "entry";
    if (/\bsenior\b/.test(text) || /\bprincipal\b/.test(text)) return "senior";
    if (/\blead\b/.test(text) || /\bhead\b/.test(text)) return "lead";
    if (/\bexecutive\b/.test(text) || /\bvp\b/.test(text) || /\bdirector\b/.test(text)) return "executive";
    return "any";
  }

  private extractSkills(
    tags: string[],
    requirements: string | null,
    description: string,
  ): string[] {
    const skills = new Set(tags);

    const text = `${requirements ?? ""} ${description}`.toLowerCase();
    const skillPatterns = [
      "python", "c++", "c", "java", "javascript", "typescript", "go", "rust",
      "kotlin", "swift", "matlab", "r", "scala", "perl", "ruby", "php",
      "verilog", "vhdl", "systemverilog", "systemc",
      "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
      "sql", "nosql", "mongodb", "postgresql", "mysql", "redis",
      "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
      "linux", "git", "jenkins", "ci/cd",
      "html", "css", "react", "angular", "vue", "node",
      "machine learning", "deep learning", "nlp", "computer vision",
      "rtl", "synthesis", "sta", "dft", "physical design",
      "uvm", "verification", "simulation",
    ];

    for (const skill of skillPatterns) {
      if (text.includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    }

    return Array.from(skills);
  }

  private isGovernment(
    organization: string,
    category: ClassificationLabel,
  ): boolean {
    const govCategories: ClassificationLabel[] = [
      "government-india",
      "government-intl",
      "psu-india",
      "national-lab-india",
      "national-lab-intl",
      "defense",
      "space",
    ];
    if (govCategories.includes(category)) return true;

    const lower = organization.toLowerCase();
    return (
      /\bgovernment\b/.test(lower) ||
      /\bgovt\.?\b/.test(lower) ||
      /\bministry\b/.test(lower) ||
      /\bnational\b/.test(lower) ||
      /\bfederal\b/.test(lower) ||
      /\bpublic\s*sector\b/.test(lower)
    );
  }

  private computeHash(data: {
    title: string;
    organization: string;
    sourceUrl: string;
    canonicalUrl: string;
  }): string {
    const parts = [
      data.title.toLowerCase().trim(),
      data.organization.toLowerCase().trim(),
      data.sourceUrl,
      data.canonicalUrl,
    ];
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }
}

export { Deduplicator } from "./deduplication";
export { Canonicalizer } from "./canonicalization";
export { ContentExtractor } from "./extraction";
export { MetadataExtractor } from "./metadata";
export { LanguageDetector } from "./language";
export { TimezoneNormalizer } from "./timezone";
export { DeadlineNormalizer } from "./deadline";
export { SalaryParser } from "./salary";
export { EligibilityParser } from "./eligibility";
export { CountryDetector } from "./country";
export { InstitutionDetector } from "./institution";
export { TagClassifier } from "./tags";
