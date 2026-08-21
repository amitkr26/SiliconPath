/**
 * Unified Design Tokens for BerojgarDegreeWala
 * Single TypeScript source of truth mirroring tailwind.config.ts and globals.css
 */

export const colors = {
  bg: {
    primary: "#FAF9F6",
    secondary: "#F1F5F9",
  },
  surface: {
    default: "#FFFFFF",
    elevated: "#FFFFFF",
  },
  border: {
    default: "#0F172A",
    hover: "#000000",
  },
  accent: {
    default: "#2563EB",
    hover: "#1D4ED8",
    glow: "rgba(37, 99, 235, 0.08)",
  },
  status: {
    success: "#059669",
    warning: "#D97706",
    danger: "#DC2626",
  },
  text: {
    primary: "#0F172A",
    secondary: "#334155",
    muted: "#64748B",
  },
  org: {
    isro: "#A0784C",
    intel: "#5B7DB1",
    tifr: "#8B6CB4",
    tata: "#4A8C6F",
    drdo: "#B85450",
  },
} as const;

export const shadows = {
  sm: "2px 2px 0px 0px #0F172A",
  default: "4px 4px 0px 0px #0F172A",
  lg: "6px 6px 0px 0px #0F172A",
  card: "4px 4px 0px 0px #0F172A",
  cardHover: "6px 6px 0px 0px #0F172A",
} as const;

export const radii = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "14px",
  "2xl": "18px",
  card: "12px",
  pill: "9999px",
  full: "9999px",
} as const;

export const typography = {
  fontFamily: {
    display: "var(--font-space-grotesk), sans-serif",
    body: "var(--font-inter), sans-serif",
    mono: "Geist Mono, monospace",
  },
} as const;
