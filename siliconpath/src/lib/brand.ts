/**
 * Single source of truth for brand identity. Every surface (navbar, footer,
 * metadata, emails, OG images) imports from here so the old name can never leak
 * through on one forgotten page (a real prior-build bug).
 */
export const BRAND = {
  name: "SiliconPath",
  tagline: "Semiconductor, VLSI & electronics careers — all in one place. No login required.",
  url: "https://siliconpath.vercel.app",
} as const;
