import { z } from "zod";

export const CATEGORIES = [
  "All",
  "jrf",
  "srf",
  "phd",
  "govt-job",
  "fellowship",
  "private",
  "internship",
  "postdoc",
  "international",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  jrf: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  srf: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  phd: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "govt-job": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  fellowship: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  private: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  internship: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  postdoc: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  international: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

export const ELIGIBILITY_OPTIONS = [
  "All",
  "B.Tech",
  "M.Tech",
  "PhD",
  "M.Sc",
  "B.Sc",
  "Diploma",
  "Any Graduate",
];

export const LOCATIONS = [
  "All India",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi / NCR",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Multiple Locations",
  "Remote / WFH",
  "Abroad",
];

export const DEADLINE_FILTERS = [
  "Any Deadline",
  "Within 7 days",
  "Within 14 days",
  "Within 30 days",
  "Expired",
];

export const VERIFICATION_STATUS_VALUES = [
  "verified",
  "pending",
  "rejected",
  "expired",
  "link_unavailable",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS_VALUES)[number];

export const OPPORTUNITY_CATEGORIES = [
  "JRF",
  "SRF",
  "PhD",
  "Govt Job",
  "Private Job",
  "Fellowship",
  "Internship",
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export const FEATURES = {
  LINKEDIN_ENABLED: process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === "true",
  COMMUNITY_ENABLED: true,
  AI_CHAT_ENABLED: !!(
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NVIDIA_NIM_API_KEY ||
    process.env.AWS_BEARER_TOKEN_BEDROCK ||
    process.env.CLOUDFLARE_AI_TOKEN
  ),
  AI_MATCH_ENABLED: !!(
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NVIDIA_NIM_API_KEY ||
    process.env.AWS_BEARER_TOKEN_BEDROCK ||
    process.env.CLOUDFLARE_AI_TOKEN
  ),
  AI_SEARCH_ENABLED: !!(
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NVIDIA_NIM_API_KEY ||
    process.env.AWS_BEARER_TOKEN_BEDROCK ||
    process.env.CLOUDFLARE_AI_TOKEN
  ),
  RESUME_ENABLED: true,
  TELEGRAM_ENABLED: !!(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID
  ),
  EMAIL_DIGEST_ENABLED: !!process.env.RESEND_API_KEY,
} as const;

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_2_URL: z.string().url().optional(),
  SUPABASE_2_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEON_1_DATABASE_URL: z.string().min(1).optional(),
  NEON_2_DATABASE_URL: z.string().min(1).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  CLOUDFLARE_AI_TOKEN: z.string().min(1).optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  NVIDIA_NIM_API_KEY: z.string().min(1).optional(),
  AWS_BEARER_TOKEN_BEDROCK: z.string().min(1).optional(),
  HUGGINGFACE_API_KEY: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  SCRAPER_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  PORT: z.string().optional(),
  LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === "invalid_type")
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      console.warn(`[Config] Missing env vars: ${missing.join(", ")}`);
    }
  }
  return result.data ?? {};
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
