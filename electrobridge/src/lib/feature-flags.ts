// Feature flags — toggle features dynamically
export const FEATURES = {
  // LinkedIn-style features
  // Set NEXT_PUBLIC_LINKEDIN_ENABLED=true in environment to activate
  LINKEDIN_ENABLED: process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === 'true',

  // Community forum — active
  COMMUNITY_ENABLED: true,

  // AI features — active if API key is available
  AI_CHAT_ENABLED: !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY,
  AI_MATCH_ENABLED: !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY,
  AI_SEARCH_ENABLED: !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY,

  // Resume builder — active
  RESUME_ENABLED: true,

  // Telegram notifications
  TELEGRAM_ENABLED: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID),

  // Email digest
  EMAIL_DIGEST_ENABLED: !!process.env.RESEND_API_KEY,
} as const;
