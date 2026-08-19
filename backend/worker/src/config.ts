import "dotenv/config";

export interface WorkerEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  newsSyncIntervalMs: number;
  nodeEnv: string;
}

export function loadEnv(): WorkerEnv {
  return {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    newsSyncIntervalMs: parseInt(process.env.NEWS_SYNC_INTERVAL_MS || "3600000", 10), // 1h default
    nodeEnv: process.env.NODE_ENV || "development",
  };
}
