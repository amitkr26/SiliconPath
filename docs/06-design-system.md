# 06 — Design System

## Theme
Light-first. Dark mode only if explicitly built (intentional, not inverted).

## Color (OKLCH, tinted neutrals toward brand hue ~265)
Tailwind tokens already in codebase: `bg-bg-primary`, `bg-bg-secondary`, `border-border`,
`text-text-primary`, `text-text-secondary`, `text-text-muted`, `accent`, plus semantic
`success`, `warning`, `danger`.

Reference palette:
- primary `oklch(45% 0.20 265)`, hover `oklch(40% 0.22 265)`, light `oklch(95% 0.03 265)`
- surfaces tinted (chroma ~0.004-0.008), never pure #000/#fff
- category tags: jrf/srf indigo, phd purple, industry green, fellowship amber, govt red, intern teal

## Typography
Inter (system fallback). 5-step scale via clamp: xs .75, sm .875, base 1, lg ~1.25, xl 1.6,
2xl 2.4, 3xl fluid to ~3.4rem. Weight contrast >=1.25 ratio. tabular-nums for stats/tables.

## Spacing
4pt base: 4,8,12,16,24,32,48,64,96. Use `gap`, not margins, for sibling spacing.

## Components (canonical)
Button (primary/ghost/large), Input, Textarea, Select, Card, Tag/Badge, OpportunityCard,
OpportunityRow, TrackCard, Stepper, Tabs, Toaster (sonner), EmptyState, ErrorState, Skeleton,
Nav, Footer. See [30 component library note in 23-feature-matrix / codebase components/].

## Radius / shadow
radius sm 6 / base 10 / lg 16. Shadows subtle (sm/md/lg). No glassmorphism by default.

## Bans
No gradient text, no side-stripe accent borders, no identical endless card grids, no modal-first.
