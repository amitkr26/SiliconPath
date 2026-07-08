# Design System — SiliconPath

> **Last Updated:** July 4, 2026
>
> Dark-only theme. No light mode support. Built with Tailwind CSS v3.4.

---

## 1. Color Tokens

### 1.1 Background & Surface

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-bg-primary` / `bg-background` / `bg-navy` | `#0A0E1A` | Page background, outermost containers |
| `bg-bg-secondary` | `#0B0F1C` | Secondary container backgrounds |
| `bg-surface` / `bg-card` | `#111827` | Card, modal, dropdown backgrounds |
| `bg-surface-elevated` / `bg-popover` / `bg-secondary` / `bg-input` / `bg-navy-light` | `#141B2D` | Elevated surfaces, popovers, inputs |

### 1.2 Border

| Token | Hex | Usage |
|-------|-----|-------|
| `border-border` / `border-muted` | `#1E2A3F` | Default borders |
| `border-border-hover` | `#22D3EE33` | Hover state borders (cyan at 20% opacity) |

### 1.3 Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` / `primary` / `ring` / `cyan` | `#22D3EE` | Primary accent, links, focus rings, active states |
| `accent-hover` | `#06B6D4` | Accent hover/darker state |
| `accent-glow` | `rgba(34, 211, 238, 0.15)` | Subtle accent glow background |

### 1.4 Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Success states, green category badges |
| `warning` | `#F59E0B` | Warning states, approaching deadlines |
| `danger` / `destructive` | `#EF4444` | Error states, expired badges, urgent deadlines |

### 1.5 Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text-text-primary` / `text-foreground` / `text-card-foreground` / `text-secondary-foreground` / `text-destructive-foreground` | `#F8FAFC` | Primary body text, headings |
| `text-text-secondary` / `text-muted-foreground` | `#94A3B8` | Secondary text, metadata, captions |
| `text-text-muted` | `#64748B` | Muted/disabled text |

### 1.6 Organization Brand Colors

| Token | Hex | Organization |
|-------|-----|-------------|
| `org-isro` | `#A0784C` | ISRO |
| `org-intel` | `#5B7DB1` | Intel |
| `org-tifr` | `#8B6CB4` | TIFR |
| `org-tata` | `#4A8C6F` | Tata Electronics |
| `org-drdo` | `#B85450` | DRDO |

### 1.7 Chart Colors

| Token | Hex |
|-------|-----|
| `chart-1` | `#00E5FF` |
| `chart-2` | `#3B82F6` |
| `chart-3` | `#10B981` |
| `chart-4` | `#F59E0B` |
| `chart-5` | `#8B5CF6` |

---

## 2. Typography

### 2.1 Font Families

| Family | Name | Usage |
|--------|------|-------|
| Display | **Space Grotesk** | Headings, hero text, page titles |
| Body | **Inter** | Body copy, navigation, UI labels, cards |
| Mono | **Geist Mono** | Code snippets, technical data, monospace needs |

All fonts are loaded via `next/font` with `swap` display strategy.

### 2.2 Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xxs` | `0.625rem` (10px) | Tiny labels, badges, meta info |
| `text-xs` | `0.75rem` (12px) | Small captions, footnotes |
| `text-sm` | `0.875rem` (14px) | Body text default |
| `text-base` | `1rem` (16px) | Larger body text |
| `text-lg` | `1.125rem` (18px) | Subheadings |
| `text-xl` | `1.25rem` (20px) | Card titles |
| `text-2xl` | `1.5rem` (24px) | Section headings |
| `text-3xl` | `1.875rem` (30px) | Page titles |
| `text-4xl` | `2.25rem` (36px) | Hero headings |
| `text-5xl` | `3rem` (48px) | Large hero display |

### 2.3 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | `400` | Body text |
| Medium | `500` | Emphasized body, nav items |
| Semibold | `600` | Subheadings, button labels |
| Bold | `700` | Headings, section titles |
| Extrabold | `800` | Hero titles, display text |

---

## 3. Spacing, Border Radius & Shadows

### 3.1 Spacing Scale

| Token | Value | Example |
|-------|-------|---------|
| `xs` | `0.25rem` (4px) | Tight icon spacing |
| `sm` | `0.5rem` (8px) | Compact padding |
| `md` | `0.75rem` (12px) | Button padding |
| `lg` | `1rem` (16px) | Card padding |
| `xl` | `1.25rem` (20px) | Section spacing |
| `2xl` | `1.5rem` (24px) | Large gaps |
| `3xl` | `2rem` (32px) | Container padding |
| `4xl` | `2.5rem` (40px) | Page section separation |
| `5xl` | `3rem` (48px) | Hero section padding |

### 3.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `6px` | Small UI elements, inputs |
| `md` | `8px` | Buttons, badges |
| `lg` | `12px` | Cards, modals, dropdowns |
| `xl` | `16px` | Large containers |
| `2xl` | `24px` | Hero sections, large modals |
| `card` | `12px` | Dedicated card radius (same as `lg`) |
| `pill` / `full` | `9999px` | Pill badges, avatars, search input ends |

### 3.3 Box Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `card` | `0 1px 2px rgba(0,0,0,0.3)` | Default card shadow (subtle depth) |
| `card-hover` | `0 0 24px rgba(34, 211, 238, 0.08)` | Card hover state (cyan glow) |
| `glow-cyan` | `0 0 24px rgba(34, 211, 238, 0.15)` | Primary accent glow |
| `glow-sm` | `0 0 20px rgba(34, 211, 238, 0.06)` | Subtle glow for surfaces |
| `card-dark` | `0 4px 24px rgba(0, 0, 0, 0.3)` | Elevated card/modal shadow |
| `glow-btn` | `0 0 24px rgba(34, 211, 238, 0.2)` | Primary button glow |

---

## 4. Gradients

| Token | Gradient | Usage |
|-------|----------|-------|
| `gradient-hero` / `hero-text` | `linear-gradient(to right, #22D3EE, #3B82F6)` | Hero section titles, primary gradient |
| `gradient-deadline` / `deadline-bar` | `linear-gradient(to right, #F59E0B, #EF4444)` | Urgent deadline countdown bars |
| `gradient-card-border` / `card-border` | `linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)` | Card top border accent lines |
| `gradient-radial-cyan` / `ai-cta` | `radial-gradient(ellipse at center, rgba(34,211,238,0.05) 0%, transparent 70%)` | Background glow effects, AI call-to-action areas |

---

## 5. Component Inventory (23 Components)

### 5.1 Layout

| Component | Description |
|-----------|-------------|
| **Navbar** | Main navigation bar — glass morphism (`bg-bg-primary/80 backdrop-blur-2xl`), 9 items, search overlay, mobile drawer, auth dropdown with user menu. Features gradient bottom accent line on scroll. |
| **Footer** | Site footer with three-column link groups (Company, Resources, Legal), admin panel link, copyright. |

### 5.2 UI Primitives

| Component | Description |
|-----------|-------------|
| **CategoryBadge** | Color-coded category badge. JRF=cyan, SRF=purple, PhD=green, Govt Job=amber, Private Job=blue, Fellowship=rose. Renders as a small pill. |
| **CopyLinkButton** | Clipboard copy button. Uses `navigator.clipboard.writeText()`. Shows "Copied!" tooltip on success via sonner toast. |
| **DeadlineCountdown** | Urgency countdown timer. Color-coded: green (>14 days), yellow (3-14 days), red (<3 days or expired). Shows "X days remaining" or "Expired". |
| **LinkTypeIndicator** | Icon indicator for apply link type: direct, homepage, pdf, email, portal. Each type maps to a distinct lucide-react icon. |
| **LoadingSkeleton** | Animated placeholder shimmer for loading states. Uses Tailwind `animate-pulse` with dark surface color. |
| **SearchBar** | Text input with search icon and optional `⌘K` keyboard shortcut hint. Controlled component with `onSubmit` callback. |
| **ShareButtons** | WhatsApp and Twitter sharing links. Constructs share URLs with encoded page title and URL. Opens in new tab. |
| **VerificationBadge** | Verification status indicator: verified (green check), unverified (gray clock), link_unavailable (red X), expired (amber warning). |
| **OpportunityDisclaimer** | Pre-apply information box with tips (verify deadline, check eligibility, no fees) plus a "Report Issue" button that opens the report modal. |
| **SubscribeSection** | Compact email subscribe form with input + button. Used in footer and opportunity detail sidebar. |

### 5.3 Modal / Overlay

| Component | Description |
|-----------|-------------|
| **ReportIssueModal** | Modal dialog with form fields: report type (radio group: broken_link, wrong_info, expired, other), description textarea. Submits to `/api/report-issue`. |
| **SubscribeModal** | Full modal subscribe form with email input, keyword tags input, category checkboxes. Submits to `/api/subscribe`. |

### 5.4 Feature Components

| Component | Category | Description |
|-----------|----------|-------------|
| **AIAnalyticsPanel** | Admin | AI usage statistics panel. Displays charts from Neon db3 `ai_usage_log` — requests per provider, success rate, average latency. |
| **AIOpportunitySummary** | Opportunity | AI-generated insight panel shown on opportunity detail pages. Calls `/api/ai/opportunity-summary/[slug]`. |
| **ApplyButton** | Opportunity | Primary apply CTA. Increments `apply_clicks` via `/api/track-click` POST. Logs to user's applications if authenticated. |
| **ExpiringSoon** | Opportunity | Server-side banner shown on opportunities expiring within 7 days. Renders a warning strip with deadline countdown. |
| **FilterBar** | Opportunity | Sidebar filter panel. Checkbox groups for category, location, eligibility, deadline range. Updates URL search params. |
| **NewsCard** | News | Article card with source color indicator bar (left border), title, summary, date, source label. |
| **NewsImage** | News | Article image with error fallback (shows placeholder on broken URL). Uses `next/image` with fill layout. |
| **OpportunityCard** | Opportunity | Full metadata card — title, organization, category badge, stipend, deadline countdown, apply type indicator, tags row, verification badge. |
| **SimilarOpportunities** | Opportunity | Server-side related opportunities component. Renders 3-6 cards from same org or category. |

---

## 6. Card-Click UX Rule

All card components (`OpportunityCard`, `NewsCard`, `SimilarOpportunities` cards) follow a **full-card click** pattern:

```
<div
  onClick={() => router.push(`/opportunities/${slug}`)}
  className="cursor-pointer ..."
  role="link"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && router.push(...)}
>
```

- Entire card surface is clickable (not just a "Read More" link).
- Cards use `cursor-pointer` and include `role="link"` + `tabIndex={0}` for keyboard accessibility.
- Interactive children (buttons, links) inside cards use `e.stopPropagation()` to prevent card navigation when clicked.
- Hover state: `card-hover` shadow applied on hover.

---

## 7. Glass-Morphism Navbar Pattern

The navbar uses a **glass morphism** visual style:

```css
/* Equivalent Tailwind classes */
bg-bg-primary/80
backdrop-blur-2xl
border-b border-border
sticky top-0 z-50
```

- **Background:** `bg-bg-primary` at 80% opacity — dark background becomes semi-transparent.
- **Blur:** `backdrop-blur-2xl` — content behind the navbar blurs for depth.
- **Border:** `border-b border-border` — subtle 1px bottom border.
- **Glow (on scroll):** A gradient line (`gradient-hero`) fades in at the navbar bottom when the page is scrolled past 50px. Implemented via `useEffect` scroll listener that toggles a state class.
- **9 Nav Items:** Opportunities, News, Community, Organizations, Resources (dropdown), Feed, Network, Companies, AI Chat.
- **Search overlay:** `⌘K` shortcut opens a full-width search panel below the navbar with glass background.
- **Mobile drawer:** Right-slide panel with accordion dropdowns for nested items. Gradient blob decorations in the background.
- **Auth section:** Gradient "Get Started" button for unauthenticated users; user avatar dropdown with glass panel for authenticated users.

---

## 8. Responsive Behavior

### 8.1 Navbar Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `≥lg` (1024px) | Full horizontal nav with all 9 items visible, search icon, auth button/dropdown |
| `<lg` (1024px) | Compact nav: logo + mobile hamburger + auth button. Desktop items hidden. |

### 8.2 Mobile Drawer

- Slides in from the right edge when hamburger is toggled.
- `w-72` (288px) width.
- Background: `bg-bg-primary` with right-side gradient blobs.
- Accordion-style submenus for Resources (JRF guide, PhD guide, Fellowships, VLSI careers, NET vs GATE).
- Close button + backdrop overlay.
- Links call `router.push()` then close the drawer.

### 8.3 Grid Layouts

| Page | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Opportunity list | 3-column grid | 2-column grid | 1-column list |
| News list | 3-column grid | 2-column grid | 1-column list |
| Organizations | 4-column grid | 3-column grid | 2-column grid |
| Feed (home) | 3-column (left sidebar + feed + right sidebar) | 2-column (feed + right sidebar) | 1-column (feed only) |
| Community posts | 2-column grid | 2-column grid | 1-column list |
| Admin analytics | 2-column charts | 1-column stack | 1-column stack |

### 8.4 Responsive Patterns

- Sidebar filters on `/opportunities` collapse into a top filter bar on mobile.
- Detail pages use `max-w-4xl mx-auto` with `px-4` for consistent padding.
- Tables (admin panels) become horizontally scrollable on mobile with `overflow-x-auto`.
- Hero section stacks vertically on mobile (text above, CTA below).

---

## 9. Accessibility Baseline

### 9.1 Color Contrast

- **Text on background:** `#F8FAFC` (text-primary) on `#0A0E1A` (bg-primary) — contrast ratio ~15.5:1 (WCAG AAA).
- **Text on surface:** `#F8FAFC` on `#111827` (surface) — contrast ratio ~12.5:1 (WCAG AAA).
- **Secondary text:** `#94A3B8` on `#0A0E1A` — contrast ratio ~6.5:1 (WCAG AA).
- **Accent text:** `#22D3EE` on `#0A0E1A` — contrast ratio ~6.8:1 (WCAG AA).
- **Disabled/placeholder text:** `#64748B` on `#0A0E1A` — contrast ratio ~4.5:1 (WCAG AA minimum).
- All semantic colors (success, warning, danger) maintain ≥4.5:1 contrast against their intended backgrounds.

### 9.2 Focus States

- **Default focus:** `ring-2 ring-accent ring-offset-2 ring-offset-bg-primary` — cyan focus ring with 2px offset.
- **Focus visible:** All interactive elements (buttons, links, inputs, cards) have visible focus indicators.
- **Custom focus:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` on all focusable elements.
- Cards with `tabIndex={0}` show focus ring when keyboard-navigated.

### 9.3 Alt Text

- All images use `alt` attributes.
- Icon buttons (e.g., copy link, share) use `aria-label` for screen reader descriptions.
- Decorative images (gradient blobs, background patterns) use `alt=""` (empty) to be ignored by screen readers.
- Organization logos use `alt="{Organization name} logo"`.

### 9.4 ARIA Labels & Roles

| Element | Pattern |
|---------|---------|
| Navigation | `<nav aria-label="Main navigation">` |
| Search | Search input has `aria-label="Search opportunities"` |
| Mobile menu button | `aria-label="Open navigation menu"`, `aria-expanded="true/false"` |
| Cards | `role="link"` + `tabIndex={0}` |
| Modals | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title |
| Tab panels | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| Alerts/toasts | `role="alert"` |
| Badges | `aria-label="Category: {name}"` |
| Loading states | `aria-busy="true"` on container |
| Icons | `aria-hidden="true"` on decorative icons (lucide-react defaults to this) |

### 9.5 Keyboard Navigation

- All interactive elements reachable via Tab key in logical DOM order.
- Card components are keyboard-activatable via Enter/Space key handlers.
- Modals trap focus (Tab cycles within modal; Escape closes).
- Dropdown menus use arrow keys for item navigation.
- Search overlay closes on Escape.
- Mobile drawer closes on Escape + backdrop click.

### 9.6 Reduced Motion

- `prefers-reduced-motion` respected:
  - Loading skeleton pulse animation disabled.
  - Slide-in mobile drawer transitions disabled (instant appear).
  - Scroll-triggered animations disabled.
  - Hover transitions reduced to instant.

### 9.7 Semantic HTML

- Proper heading hierarchy (`h1` → `h2` → `h3`) on every page.
- `main` landmark on every page.
- `section` elements with `aria-label` for content grouping.
- Lists use `<ul>`/`<ol>` with `<li>` (not generic divs).
- Forms use `<label>` elements or `aria-label` on inputs.
- Error messages associated with inputs via `aria-describedby`.
