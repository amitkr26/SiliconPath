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
    "organizations",
    "news_articles",
    "resources",
    "academy_tracks",
    "academy_days",
    "track_checkpoints",
    "user_learning_progress",
    "subscribers",
    "scrape_sources",
    "scrape_runs",
    "link_check_results",
    "opportunity_reports",
    "user_profiles",
    "connections",
    "feed_posts",
    "messages",
    "notifications",
    "saved_opportunities",
    "applications",
    "company_profiles",
    "resumes",
    "community_posts",
  ] as const,
  DB2: ["news_archive", "subscribers_overflow"] as const,
  NEON1: ["page_views", "search_queries", "click_events", "ai_usage_log"] as const,
  NEON2: [] as const,
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
