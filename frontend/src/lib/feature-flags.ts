// Feature flags — toggle features dynamically
export const FEATURES = {
  // LinkedIn-style features
  // Set NEXT_PUBLIC_LINKEDIN_ENABLED=true in environment to activate
  LINKEDIN_ENABLED: process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === 'true',

  // Community forum — active
  COMMUNITY_ENABLED: true,

  // AI features — active if API key is available
  // ponytail: single AI_ENABLED covers all AI features; split per-feature if granularity needed
  AI_ENABLED: !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.NVIDIA_NIM_API_KEY || process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.CLOUDFLARE_AI_TOKEN),

  // Resume builder — active
  RESUME_ENABLED: true,

  // Telegram notifications
  TELEGRAM_ENABLED: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID),

  // Email digest
  EMAIL_DIGEST_ENABLED: !!process.env.RESEND_API_KEY,
} as const;
