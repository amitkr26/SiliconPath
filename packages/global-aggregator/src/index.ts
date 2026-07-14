// ===========================================================================
// @siliconpath/global-aggregator — Public API
// ===========================================================================

// Types
export type * from "./types";

// Source Registry
export { sourceRegistry, SourceRegistry, CATEGORY_META, sources } from "./source-registry";

// Adapters
export {
  AdapterFactory,
  BaseAdapter,
  GreenhouseAdapter,
  LeverAdapter,
  WorkdayAdapter,
  SmartRecruitersAdapter,
  SuccessFactorsAdapter,
  OracleAdapter,
  AshbyAdapter,
  BambooHRAdapter,
  ICIMSAdapter,
  JobviteAdapter,
  TeamtailorAdapter,
  RecruiteeAdapter,
  ComeetAdapter,
  HTMLAdapter,
  RSSAdapter,
  SchemaAdapter,
  XMLAdapter,
  JSONAdapter,
  createCustomAdapter,
} from "./adapters";
export type { CustomAdapter } from "./adapters";

// Engine
export {
  ScrapeEngine,
  ScrapeQueue,
  DeadLetterQueue,
  RetryHandler,
  RateLimiter,
  WorkerPool,
  Scheduler,
  EngineHealth,
  IncrementalCrawler,
} from "./engine";
export type { EngineStatus } from "./engine";

// Pipeline
export {
  Pipeline,
  Deduplicator,
  Canonicalizer,
  ContentExtractor,
  MetadataExtractor,
  LanguageDetector,
  TimezoneNormalizer,
  DeadlineNormalizer,
  SalaryParser,
  EligibilityParser,
  CountryDetector,
  InstitutionDetector,
  TagClassifier,
} from "./pipeline";

// Validation
export {
  Validator,
  DeadLinkChecker,
  DuplicateDetector,
  ExpiredDetector,
  MalformedDetector,
  BrokenHtmlDetector,
  RedirectDetector,
  SpamDetector,
} from "./validation";
export type { ValidateAllResult } from "./validation";

// Classification
export { Classifier } from "./classification";

// Search
export { SearchEngine } from "./search";

// Notifications
export { NotificationEngine } from "./notifications";

// Monitoring
export { Monitor } from "./monitoring";

// Admin
export { AdminDashboard } from "./admin";
export type { LogEntry, ScrapeEngineInterface, PipelineInterface, ValidatorInterface } from "./admin";
