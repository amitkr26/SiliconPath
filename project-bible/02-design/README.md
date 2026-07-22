# Design System

## Overview

The BerojgarDegreeWala design system is a dark-first theme with cyan/teal accent colors, built on Tailwind CSS. The system uses OKLCH color space for perceptual uniformity and fluid typography for responsive scaling.

## Core Design Principles

1. **Dark-first**: The primary theme is dark (background `#0A0E1A`). Light mode is not implemented.
2. **Tinted neutrals**: All neutral colors carry a subtle blue hue (chroma ~0.004-0.008), never pure gray.
3. **Cyan accent**: The accent color is cyan (`#22D3EE`), used sparingly for interactive elements.
4. **Glassmorphism**: Used for cards and surfaces with subtle backdrop blur and border transparency.
5. **Cyber aesthetic**: Geometric patterns, subtle glow effects, and animated blobs for visual interest.

## Theme Tokens

All tokens are defined in `tailwind.config.ts` and `src/lib/design-tokens.ts`. Key values:

**Colors:**
- Background: `#0A0E1A` (bg-primary), `#0B0F1C` (bg-secondary)
- Surface: `#111827` (surface), `#141B2D` (surface-elevated)
- Border: `#1E2A3F` (border)
- Accent: `#22D3EE` (accent), `#06B6D4` (accent-hover)
- Success: `#10B981`, Warning: `#F59E0B`, Danger: `#EF4444`
- Text: `#F8FAFC` (primary), `#94A3B8` (secondary), `#64748B` (muted)

**Typography:**
- Display: Space Grotesk (headings)
- Body: Inter (body text)
- Mono: Geist Mono (code)
- Scale: 5-step via clamp (xs .75rem → 3xl ~3.4rem)

**Spacing:**
- 4pt base: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Use `gap`, not margins, for sibling spacing

**Border Radius:**
- sm: 6px, base: 10px, lg: 16px, xl: 24px

**Shadows:**
- card: subtle dark shadow
- card-hover: cyan glow on hover
- glow-cyan: prominent cyan glow for CTAs

## Category Colors

| Category | Color |
|----------|-------|
| JRF | Purple |
| SRF | Blue |
| PhD | Emerald |
| Government | Amber |
| Fellowship | Pink |
| Private | Cyan |
| Internship | Violet |
| Postdoc | Rose |
| International | Indigo |

## Banned Patterns

- No gradient text
- No side-stripe accent borders
- No identical endless card grids
- No modal-first interactions
- No glassmorphism on critical UI (reduces readability)

## Accessibility

- Color-contrast WCAG AA minimum (4.5:1 text, 3:1 large text)
- `text-wrap: balance` on headings
- `text-wrap: pretty` on prose
- Focus-visible rings on all interactive elements
- No information conveyed by color alone
