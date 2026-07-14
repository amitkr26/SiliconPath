// ===========================================================================
// Global Aggregator — Shared Type Definitions
// ===========================================================================

export type OpportunityType =
  | "job"
  | "research-position"
  | "phd"
  | "ms"
  | "internship"
  | "postdoctoral"
  | "faculty"
  | "teaching"
  | "government-job"
  | "psu-job"
  | "industry-job"
  | "scholarship"
  | "fellowship"
  | "research-grant"
  | "conference"
  | "workshop"
  | "training-program"
  | "competition"
  | "hackathon"
  | "open-call"
  | "research-assistantship";

export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";

export type AdapterType =
  | "greenhouse"
  | "lever"
  | "workday"
  | "smartrecruiters"
  | "successfactors"
  | "oracle"
  | "ashby"
  | "bamboohr"
  | "icims"
  | "jobvite"
  | "teamtailor"
  | "recruitee"
  | "comeet"
  | "html"
  | "rss"
  | "schema"
  | "xml"
  | "json"
  | "custom";

export type SourceStatus = "active" | "inactive" | "paused" | "error";

export type SourceHealth = "healthy" | "degraded" | "unhealthy" | "unknown";

export type ValidationStatus = "pending" | "verified" | "rejected" | "expired";

export type ClassificationLabel =
  | "semiconductor-idm"
  | "fabless"
  | "equipment"
  | "materials"
  | "osat"
  | "power-auto"
  | "memory-storage"
  | "test-measurement"
  | "eda"
  | "networking-chip"
  | "national-lab-india"
  | "national-lab-intl"
  | "university-india"
  | "university-na"
  | "university-europe"
  | "university-asia"
  | "university-rest"
  | "government-india"
  | "government-intl"
  | "psu-india"
  | "rss-feed"
  | "funding-agency"
  | "nonprofit"
  | "startup"
  | "defense"
  | "space"
  | "energy"
  | "healthcare"
  | "automotive"
  | "aerospace"
  | "telecom"
  | "ai-ml"
  | "research-lab";

export type EducationLevel =
  | "high-school"
  | "bachelor"
  | "master"
  | "phd"
  | "postdoc"
  | "any";

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | "any";

// ===========================================================================
// Source Registry
// ===========================================================================

export interface SourceConfig {
  id: string;
  name: string;
  category: ClassificationLabel;
  country: string;
  priority: number;
  adapter: AdapterType;
  health: SourceHealth;
  status: SourceStatus;
  retryStrategy: RetryStrategy;
  scheduling: SchedulingConfig;
  rateLimits: RateLimitConfig;
  authentication: AuthConfig;
  validationRules: ValidationRule[];
  owner: string;
  notes: string;
}

export interface RetryStrategy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface SchedulingConfig {
  interval: string;
  cron?: string;
  batchId: number;
  priority: number;
  maxConcurrent: number;
  timeWindow?: { start: string; end: string };
  timezone?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  concurrency: number;
}

export interface AuthConfig {
  type: "none" | "api-key" | "basic" | "bearer" | "oauth2" | "custom";
  credentials?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ValidationRule {
  field: string;
  rule: string;
  severity: "error" | "warn";
}

// ===========================================================================
// Scraped Opportunity
// ===========================================================================

export interface RawScrapedOpportunity {
  title: string;
  organization: string;
  sourceId: string;
  sourceUrl: string;
  applyLink: string | null;
  location: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  deadline: string | null;
  postedDate: string | null;
  salary: string | null;
  eligibility: string | null;
  type: string | null;
  workMode: WorkMode;
  department: string | null;
  employmentType: string | null;
  tags: string[];
  rawHtml?: string;
  language?: string;
}

export interface NormalizedOpportunity {
  id?: string;
  title: string;
  organization: string;
  sourceId: string;
  sourceUrl: string;
  canonicalUrl: string;
  applyLink: string;
  location: string;
  country: string;
  city: string;
  state: string;
  description: string;
  requirements: string;
  responsibilities: string;
  deadline: string | null;
  postedDate: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  eligibility: string[];
  type: OpportunityType;
  workMode: WorkMode;
  department: string;
  employmentType: string;
  educationLevel: EducationLevel;
  experienceLevel: ExperienceLevel;
  categories: ClassificationLabel[];
  skills: string[];
  domains: string[];
  tags: string[];
  language: string;
  timezone: string;
  isRemote: boolean;
  isGovernment: boolean;
  isActive: boolean;
  verificationStatus: ValidationStatus;
  hash: string;
  scrapedAt: string;
}

// ===========================================================================
// Engine
// ===========================================================================

export interface ScrapeJob {
  id: string;
  sourceId: string;
  status: "queued" | "running" | "completed" | "failed" | "retrying";
  startedAt: string | null;
  completedAt: string | null;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  itemsScraped: number;
  itemsValidated: number;
  itemsInserted: number;
  createdAt: string;
}

export interface ScrapeResult {
  jobId: string;
  sourceId: string;
  sourceName: string;
  success: boolean;
  count: number;
  errors: string[];
  durationMs: number;
  items: NormalizedOpportunity[];
  timestamp: string;
}

export interface QueueItem {
  id: string;
  sourceId: string;
  priority: number;
  scheduledAt: string;
  status: "queued" | "processing" | "completed" | "failed" | "dlq";
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerConfig {
  id: string;
  concurrency: number;
  pollIntervalMs: number;
  maxRetries: number;
  heartbeatMs: number;
}

// ===========================================================================
// Pipeline
// ===========================================================================

export interface PipelineConfig {
  deduplication: { enabled: boolean; windowHours: number };
  canonicalization: { enabled: boolean };
  contentExtraction: { enabled: boolean; minLength: number };
  metadataExtraction: { enabled: boolean };
  languageDetection: { enabled: boolean; fallback: string };
  timezoneNormalization: { enabled: boolean; defaultTimezone: string };
  deadlineNormalization: { enabled: boolean };
  salaryParsing: { enabled: boolean; defaultCurrency: string };
  eligibilityParsing: { enabled: boolean };
  countryDetection: { enabled: boolean };
  institutionDetection: { enabled: boolean };
  tagClassification: { enabled: boolean; maxTags: number };
}

// ===========================================================================
// Validation
// ===========================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ===========================================================================
// Classification
// ===========================================================================

export interface ClassificationResult {
  type: OpportunityType;
  categories: ClassificationLabel[];
  domains: string[];
  skills: string[];
  countries: string[];
  educationLevel: EducationLevel;
  experienceLevel: ExperienceLevel;
  workMode: WorkMode;
  isGovernment: boolean;
  isIndustry: boolean;
  isResearch: boolean;
  confidence: number;
}

// ===========================================================================
// Search
// ===========================================================================

export interface SearchQuery {
  q: string;
  types?: OpportunityType[];
  categories?: ClassificationLabel[];
  countries?: string[];
  skills?: string[];
  educationLevel?: EducationLevel;
  experienceLevel?: ExperienceLevel;
  workMode?: WorkMode;
  isRemote?: boolean;
  isGovernment?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  deadlineBefore?: string;
  deadlineAfter?: string;
  postedAfter?: string;
  sortBy?: "relevance" | "date" | "deadline" | "salary";
  sortOrder?: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface SearchResult {
  items: NormalizedOpportunity[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
  suggestions: string[];
}

export interface SearchFacets {
  types: FacetCount[];
  categories: FacetCount[];
  countries: FacetCount[];
  workModes: FacetCount[];
  educationLevels: FacetCount[];
  experienceLevels: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// ===========================================================================
// Notifications
// ===========================================================================

export interface NotificationConfig {
  email: { enabled: boolean };
  digest: { enabled: boolean; frequency: "daily" | "weekly" | "never" };
  instantAlerts: { enabled: boolean };
  savedSearchAlerts: { enabled: boolean };
  keywordAlerts: { enabled: boolean };
  deadlineAlerts: { enabled: boolean; daysBefore: number[] };
}

export interface SavedSearch {
  id: string;
  userId: string;
  query: SearchQuery;
  name: string;
  notify: boolean;
  frequency: "instant" | "daily" | "weekly";
  createdAt: string;
}

// ===========================================================================
// Monitoring
// ===========================================================================

export interface MonitoringStats {
  sourcesTotal: number;
  sourcesActive: number;
  sourcesHealthy: number;
  sourcesDegraded: number;
  sourcesUnhealthy: number;
  scrapesToday: number;
  scrapesThisHour: number;
  scrapeSuccessRate: number;
  avgCrawlTimeMs: number;
  itemsScrapedToday: number;
  itemsValidatedToday: number;
  itemsClassifiedToday: number;
  queueDepth: number;
  dlqDepth: number;
  workersActive: number;
  workersIdle: number;
  lastUpdated: string;
}

export interface AdapterHealthReport {
  adapter: AdapterType;
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  status: SourceHealth;
}

export interface SourceHealthReport {
  sourceId: string;
  sourceName: string;
  adapter: AdapterType;
  status: SourceStatus;
  health: SourceHealth;
  lastScrapedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  successRate: number;
  itemsCount: number;
  batchId: number;
  priority: number;
}
