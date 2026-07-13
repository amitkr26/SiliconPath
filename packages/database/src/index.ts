export {
  createDatabaseClients,
  getClients,
  resetClients,
  getClientForPurpose,
  checkAllDatabases,
} from "./client";
export type {
  DatabaseClient,
  NeonClient,
  DbPurpose,
  DatabaseClients,
} from "./client";

export type { Repository, QueryOptions, SupabaseRepository } from "./repository";

export const MIGRATIONS_DIR = "../migrations";

export const DB_TABLES = {
  DB1: [
    "opportunities",
    "companies",
    "news_articles",
    "scraper_sources",
    "subscribers",
    "suggestions",
    "link_check_results",
    "opportunity_reports",
    "user_profiles",
    "user_resumes",
    "saved_opportunities",
    "applications",
    "user_alerts",
    "user_follows",
    "connection_requests",
    "feed_posts",
    "feed_post_likes",
    "feed_post_comments",
    "feed_post_reposts",
    "conversations",
    "messages",
    "notifications",
    "skill_endorsements",
    "recommendations",
    "company_pages",
    "company_followers",
    "community_posts",
    "community_comments",
    "community_votes",
    "learning_tracks",
    "learning_days",
    "learning_resources",
    "learning_questions",
    "track_assessments",
    "user_learning_progress",
    "user_track_assessment_results",
  ] as const,
  DB2: ["news_archive", "subscribers_overflow"] as const,
  NEON1: ["ai_usage_log", "link_check_logs", "platform_events", "scrape_logs"] as const,
  NEON2: ["opportunities_mirror", "news_mirror"] as const,
} as const;

export type DbTable = typeof DB_TABLES;

export function getTableList(db: keyof typeof DB_TABLES): readonly string[] {
  return DB_TABLES[db];
}

export const KNOWN_COLUMN_ALIASES = {
  apply_link: "apply_url",
  stipend: "salary_range",
} as const;

export function resolveColumnAlias(
  row: Record<string, unknown>,
  preferred: string,
  alias: string
): unknown {
  return row[preferred] ?? row[alias] ?? null;
}

export const BRIDGE_FIELDS = [
  "organization",
  "org_slug",
  "stipend",
  "apply_link",
  "posted_at",
] as const;

export function mapDbRow<T extends Record<string, unknown>>(
  dbRow: T | null,
  overrides?: Partial<T>
): T | null {
  if (!dbRow) return null;
  return { ...dbRow, ...overrides };
}
