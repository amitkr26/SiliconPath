import type { Config } from "tailwindcss";
import {
  shadow as shadowTokens,
  radius as radiusTokens,
  color as colorTokens,
} from "./src/styles/design-tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // --- Border width: single source of truth ---
      borderWidth: {
        3: "3px",
      },

      // --- Colors: derive from centralized tokens ---
      colors: {
        // Semantic core (derived from design-tokens.ts)
        "bg-primary": colorTokens.bg,
        "bg-secondary": colorTokens.surfaceElevated,
        surface: colorTokens.surface,
        "surface-elevated": colorTokens.surfaceElevated,
        border: colorTokens.border,
        "border-hover": colorTokens.borderHover,
        primary: colorTokens.primary,
        "primary-foreground": colorTokens.textInverted,
        secondary: colorTokens.surfaceElevated,
        "secondary-foreground": colorTokens.text,
        muted: colorTokens.borderSubtle,
        "muted-foreground": colorTokens.textMuted,
        accent: colorTokens.primary,
        "accent-foreground": colorTokens.textInverted,
        "accent-hover": colorTokens.primaryHover,
        "accent-glow": colorTokens.primarySubtle,
        success: colorTokens.success,
        warning: colorTokens.warning,
        danger: colorTokens.danger,
        destructive: colorTokens.danger,
        "destructive-foreground": colorTokens.textInverted,
        input: colorTokens.surface,
        ring: colorTokens.primary,

        // Org colors — preserve as semantic keys (no ad-hoc blue/cyan flattening)
        "org-isro": colorTokens.orgIsro,
        "org-intel": colorTokens.orgIntel,
        "org-tifr": colorTokens.orgTifr,
        "org-tata": colorTokens.orgTata,
        "org-drdo": colorTokens.orgDrdo,

        // Legacy dark-era aliases — kept for migration only
        navy: colorTokens.bg, // resolves to page bg
        "navy-light": colorTokens.surfaceElevated,
        cyan: colorTokens.primary,
      },

      // --- Font family ---
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },

      // --- Border radius: derive from unified radius tokens ---
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: radiusTokens.lg, // 12px
        xl: radiusTokens.xl, // 16px
        "2xl": "18px",
        full: "9999px",
        card: radiusTokens.card, // ← single source of truth
        pill: radiusTokens.pill,
      },

      // --- Box shadow: derive from unified shadow tokens ---
      boxShadow: {
        brutal: shadowTokens.card,
        "brutal-lg": shadowTokens.elevated,
        "brutal-sm": shadowTokens.card, // alias to card
        card: shadowTokens.card,
        "card-sm": "1px 1px 0px 0px #0F172A", // subtle elevation for badges, small elements
        "card-hover": shadowTokens.elevated,
        elevated: shadowTokens.elevated,
      },

      // --- backgroundImage: remove decorative gradients ---
      backgroundImage: {
        // Deliberately empty — decorative gradients removed in Phase 7.7.
        // Re-add only if a genuine illustration pattern is needed.
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;