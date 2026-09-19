/*
 * SiliconPath — Design System Tokens
 * Technical & Editorial Engineering Platform
 * Single source of truth for shadows, radii, colors, typography, spacing, icons.
 */

// ============================================================
// SHADOW SYSTEM — restrained technical elevation
// ============================================================
export const shadow = {
  // Flat/subtle surface elevation (cards, technical panels)
  card: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  // Interactive surface (hover states, dropdown menus)
  elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  // Dialogs, modals, floating popovers
  modal: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
} as const;

export type ShadowKey = keyof typeof shadow;

// ============================================================
// RADIUS SYSTEM — restrained geometric hierarchy (no bubble shapes)
// ============================================================
export const radius = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  card: "12px",
  badge: "6px",
  pill: "9999px",
  input: "8px",
} as const;

export type RadiusKey = keyof typeof radius;

// ============================================================
// COLOR SYSTEM — calm technical palette with intentional accents
// ============================================================
export const color = {
  // Brand accent — Precision Royal Blue (restrained to primary actions & active links)
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primarySubtle: "rgba(37, 99, 235, 0.08)",

  // Semantic status colors
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  neutral: "#64748B",

  // Background & Surfaces — clean technical neutrals
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  surfaceElevated: "#FFFFFF",
  terminal: "#0B1120",

  // Text hierarchy
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverted: "#FFFFFF",

  // Subtle borders — standard 1px clean separators
  border: "#E2E8F0",
  borderHover: "#94A3B8",
  borderSubtle: "#F1F5F9",

  // Org colors — preserved for ecosystem tags
  orgIsro: "#A0784C",
  orgIntel: "#5B7DB1",
  orgTifr: "#8B6CB4",
  orgTata: "#4A8C6F",
  orgDrdo: "#B85450",
} as const;

export type ColorKey = keyof typeof color;

// ============================================================
// TYPOGRAPHY SYSTEM — technical clarity and scannable hierarchy
// ============================================================
export const typography = {
  // display: restrained editorial headline
  display: "font-display font-bold tracking-tight text-3xl sm:text-4xl text-slate-900 leading-tight",
  // heading: section headline
  heading: "font-display font-semibold tracking-tight text-xl sm:text-2xl text-slate-900 leading-snug",
  // subheading: card / subsection title
  subheading: "font-display font-semibold text-base sm:text-lg text-slate-900 leading-snug",
  // body: high readability body copy
  body: "font-sans font-normal text-sm sm:text-base text-slate-600 leading-relaxed",
  // label: technical metadata / tags
  label: "font-sans font-semibold text-xs uppercase tracking-wider text-slate-500",
  // caption: small supporting metadata
  caption: "font-sans font-medium text-xs text-slate-400",
} as const;

export type TypographyKey = keyof typeof typography;

// ============================================================
// SPACING SYSTEM — 4pt base scale
// ============================================================
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
  xxxxl: "64px",
} as const;

export type SpacingKey = keyof typeof spacing;

// ============================================================
// ICON SYSTEM — standard inline proportions
// ============================================================
export const icon = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
} as const;

export type IconKey = keyof typeof icon;

// ============================================================
// TYPE ALIASES
// ============================================================
export type ShadowValue = typeof shadow[keyof typeof shadow];
export type RadiusValue = typeof radius[keyof typeof radius];
export type ColorValue = typeof color[keyof typeof color];
export type TypographyValue = typeof typography[keyof typeof typography];
export type SpacingValue = typeof spacing[keyof typeof spacing];
export type IconValue = typeof icon[keyof typeof icon];

export const designTokens = {
  color,
  shadow,
  radius,
  typography,
  spacing,
  icon,
} as const;

export default designTokens;
