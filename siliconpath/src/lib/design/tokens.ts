// Single source of design tokens (dark theme). Reused everywhere so branding
// never drifts. Colors/typography carried over from the prior build's liked theme.
export const tokens = {
  color: {
    bg: "#0A0E1A",
    bgAlt: "#0B0F1C",
    surface: "#111827",
    surfaceAlt: "#141B2D",
    accent: "#22D3EE",
    text: "#E5E7EB",
    textMuted: "#94A3B8",
    border: "#1E293B",
  },
  font: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'Geist Mono', ui-monospace, monospace",
  },
} as const;
