/*
 * SiliconPath — Central Design Tokens (v2.0 Professional Neo-Brutalism)
 * Single source of truth for shadows, radii, colors, typography, spacing, icons.
 * All components should reference these tokens instead of ad-hoc Tailwind values.
 *
 * Do NOT add competing token definitions. If a new semantic is needed, add it
 * to the appropriate category here — do NOT create a second file.
 */

// ============================================================
// SHADOW SYSTEM — exactly 3 semantic levels
// ============================================================
export const shadow = {
  // Subtle surface elevation (cards, boxes) — 3px offset
  card: "3px 3px 0px 0px #0F172A",
  // Interactive/important surface (buttons, hover states) — 4px offset
  elevated: "4px 4px 0px 0px #0F172A",
  // Dialogs/popovers/overlays — standard drop shadow (no brutal offset)
  modal: "0 4px 24px rgba(0, 0, 0, 0.15)",
} as const

export type ShadowKey = keyof typeof shadow

// ============================================================
// RADIUS SYSTEM — semantic + numeric levels
// ============================================================
export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  card: "12px",
  pill: "9999px",
  input: "12px",
} as const

export type RadiusKey = keyof typeof radius

// ============================================================
// COLOR SYSTEM — one primary accent + semantic status colors
// ============================================================
export const color = {
  // Single primary brand accent — Electric Blue
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primarySubtle: "rgba(37, 99, 235, 0.1)",

  // Semantic status colors
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  neutral: "#64748B",

  // Surface/background — Warm off-white + white cards
  bg: "#FAF9F6",
  surface: "#FFFFFF",
  surfaceElevated: "#F1F5F9",

  // Text — Deep Navy hierarchy
  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  textInverted: "#FFFFFF",

  // Border — Deep Navy
  border: "#0F172A",
  borderHover: "#000000",
  borderSubtle: "#E2E8F0",

  // Org colors — preserve as semantic keys
  orgIsro: "#A0784C",
  orgIntel: "#5B7DB1",
  orgTifr: "#8B6CB4",
  orgTata: "#4A8C6F",
  orgDrdo: "#B85450",
} as const

export type ColorKey = keyof typeof color

// ============================================================
// TYPOGRAPHY SYSTEM — semantic weight + size hierarchy
// ============================================================
export const typography = {
  // display: strong headline (28-32px, font-bold)
  display: "font-bold tracking-tight text-[30px] leading-tight",
  // heading: section headline (20-24px, font-bold)
  heading: "font-bold tracking-tight text-[22px] leading-snug",
  // subheading: card/section subheading (16-18px, font-semibold)
  subheading: "font-semibold text-[17px] leading-snug",
  // body: regular/medium for readability (14-15px, font-normal)
  body: "font-normal text-[15px] leading-relaxed",
  // label: semibold for form alignment
  label: "font-semibold text-xs uppercase tracking-wider",
  // caption: smaller, muted (12-13px, font-medium)
  caption: "font-medium text-[12px] text-slate-500",
} as const

export type TypographyKey = keyof typeof typography

// ============================================================
// SPACING SYSTEM — 4pt base scale
// ============================================================
export const spacing = {
  // 4pt base: 1rem = 16px
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
  xxxxl: "64px",
} as const

export type SpacingKey = keyof typeof spacing

// ============================================================
// ICON SYSTEM — semantic size scale
// ============================================================
export const icon = {
  // 14px — tiny inline actions
  xs: "w-3 h-3",
  // 18px — small inline
  sm: "w-4 h-4",
  // 22px — default inline
  md: "w-5 h-5",
  // 28px — interactive accent
  lg: "w-6 h-6",
  // 40px — hero/section accent
  xl: "w-8 h-8",
} as const

export type IconKey = keyof typeof icon

// ============================================================
// TYPE ALIASES — for TypeScript reuse
// ============================================================
export type ShadowValue = typeof shadow[keyof typeof shadow]
export type RadiusValue = typeof radius[keyof typeof radius]
export type ColorValue = typeof color[keyof typeof color]
export type TypographyValue = typeof typography[keyof typeof typography]
export type SpacingValue = typeof spacing[keyof typeof spacing]
export type IconValue = typeof icon[keyof typeof icon]
