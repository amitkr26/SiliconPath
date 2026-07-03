# ElectroBridge Web App Design System

This file contains the complete design specifications extracted from the Figma design files for ElectroBridge Web App Design.

## Color System

### Primary Colors
- **Background**: #0B1120 (dark charcoal)
- **Foreground**: #FFFFFF (white)
- **Card**: #1A2438 (dark blue)
- **Card Foreground**: #FFFFFF (white)
- **Popover**: #111827 (darker blue)
- **Popover Foreground**: #FFFFFF (white)

### Brand Colors
- **Primary (Cyan)**: #00E5FF
  - Used for main CTAs, accents, and primary actions
  - Text on primary: #0B1120 (dark navy)

- **Secondary (Blue)**: #3B82F6
  - Used for secondary actions, links
  - Text on secondary: #FFFFFF (white)

### Status Colors
- **Success (Green)**: #10B981
- **Warning (Orange/Amber)**: #F59E0B
- **Danger (Red)**: #EF4444
- **Danger Foreground**: #FFFFFF (white)

### Neutral Colors
- **Secondary (Dark Blue)**: #111827
- **Muted (Gray)**: #1F2937
- **Muted Foreground**: #94A3B8 (light gray)
- **Border (Gray)**: #1F2937
- **Input (Dark Blue)**: #111827
- **Input Background**: #1A2438

### Special Colors
- **Switch Background**: #1F2937
- **Ring (focus outline)**: #00E5FF

### Chart Colors
- **Chart 1**: #00E5FF (cyan)
- **Chart 2**: #3B82F6 (blue)
- **Chart 3**: #10B981 (green)
- **Chart 4**: #F59E0B (yellow/orange)
- **Chart 5**: #8B5CF6 (purple)

### Sidebar Colors
- **Sidebar Background**: #111827
- **Sidebar Foreground**: #FFFFFF
- **Sidebar Primary**: #00E5FF (cyan)
- **Sidebar Primary Foreground**: #0B1120
- **Sidebar Accent**: #1A2438
- **Sidebar Accent Foreground**: #FFFFFF
- **Sidebar Border**: #1F2937
- **Sidebar Ring**: #00E5FF

## Typography

### Font Families
- **Display Font**: Space Grotesk, sans-serif
  - Used for headings, page titles, and major UI elements
  - Available weights: Regular, Medium, Bold

- **Body Font**: Inter, sans-serif
  - Used for all body text, labels, and descriptions
  - Available weights: 300, 400, 500, 600, 700, 800, 900

### Font Sizes
- **HTML Root**: 16px (base font size)

### Font Weights
- **Medium**: 500
- **Normal**: 400

### Typography Scale (Tailwind-compatible)
```css
--text-2xl: 1.5rem (24px)
--text-xl: 1.25rem (20px)
--text-lg: 1.125rem (18px)
--text-base: 1rem (16px)
--text-sm: 0.875rem (14px)
```

## Spacing & Layout

### Border Radius
- **Card Radius**: 0.875rem (14px)
- **Small Radius**: calc(var(--radius) - 4px) = 0.375rem (6px)
- **Medium Radius**: calc(var(--radius) - 2px) = 0.625rem (10px)
- **Large Radius**: var(--radius) = 0.875rem (14px)
- **Extra Large Radius**: calc(var(--radius) + 4px) = 1.375rem (22px)

### Container Widths
- **Max Width**: 1270px (max-w-[1100px] used in Figma source)
- **With padding**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

### Gaps & Spacing
- **Default Gap**: gap-4 (16px)
- **Large Gap**: gap-6 (24px)
- **Extra Large Gap**: gap-8 (32px)
- **Margin Bottom**: mb-6, mb-8, mb-16, mb-20

## Shadows & Effects

### Box Shadows
- **Card Shadow**: 0 4px 24px rgba(0, 0, 0, 0.3) (subtle dark shadow)
- **Card Hover Shadow**: 0 0 20px rgba(0, 229, 255, 0.06) (cyan glow)
- **Card Hover 2**: 0 0 24px rgba(0, 229, 255, 0.08) (enhanced cyan glow)

### Glow Effects
- **Accent Glow**: 0 0 32px rgba(0, 229, 255, 0.2) (strong cyan glow)
- **Hero Gradient Glow**: Radial gradient with rgba(0, 229, 255, 0.05) and rgba(59, 130, 246, 0.08)

### Background Patterns
- **Gradient Overlay**: bg-gradient-to-b from-cyan/5 via-transparent to-transparent
- **Radial BG**: bg-radial-gradient from-cyan/5 to-transparent

## Component Styles

### Navbar
- **Background**: bg-navy/80 backdrop-blur-md border-b border-gray-800
- **Height**: h-16 (64px)
- **Logo**: Zap icon w-6 h-6 text-cyan
- **Dropdown**: bg-navy-light border border-gray-700 rounded-xl shadow-xl
- **Mobile Menu**: bg-navy/98 backdrop-blur-lg

### Cards
- **Background**: bg-navy-light border border-gray-800
- **Border Radius**: rounded-xl (16px) or rounded-2xl (20px)
- **Hover Effects**: hover:border-cyan/30, hover:-translate-y-[-2px]
- **Shadows**: Various shadow levels for different states

### Buttons
- **Primary Button**: bg-gradient-to-r from-cyan to-cyan/80, rounded-lg, px-6 py-3
- **Secondary Button**: border border-gray-700 rounded-lg, px-6 py-3
- **Hero CTA**: bg-[#00E5FF] text-[#0B1120] rounded-xl, shadow-[0_0_32px_rgba(0,229,255,0.25)]

### Badges & Tags
- **Default Badge**: px-2.5 py-1 rounded-full, text-xs, font-medium
- **Status Badge**: Various background colors based on status
- **Category Badge**: Small tags with categories

### Inputs & Forms
- **Input Background**: bg-[#111827] border border-[#1F2937]
- **Focus State**: focus-within:border-[#00E5FF]/40
- **Input Padding**: px-4 py-2.5
- **Input Border Radius**: rounded-xl

### Stats Cards
- **Background**: bg-navy-light border border-gray-800
- **Border Radius**: rounded-xl
- **Padding**: p-5
- **Content Alignment**: text-center

## Animations & Transitions

### Transition Durations
- **Fast**: transition-all duration-200
- **Normal**: transition-all duration-300
- **Slow**: transition-all duration-500

### Animations
- **Pulse**: animate-pulse (for loading states)
- **Spin**: Not used in Figma design
- **Bounce**: Not used in Figma design

### Hover States
- **Card Hover**: hover:border-cyan/30 hover:-translate-y-[-2px]
- **Button Hover**: Various color and shadow changes
- **Link Hover**: hover:text-cyan, hover:underline

## Visual Elements

### Grid Patterns
- **Grid Lines**: opacity-[0.03], stroke="#00E5FF", strokeWidth="0.5"
- **Pattern Size**: 40x40 units

### Gradients
- **Hero Gradient**: bg-gradient-to-b from-cyan/5 via-transparent to-transparent
- **Card Gradient**: bg-gradient-to-br from-cyan/10 to-purple/10
- **Icon Gradient**: bg-gradient-to-br from-cyan/20 to-purple/20

### Overlays
- **Dark Overlay**: bg-navy/80, bg-navy/98
- **Glass Effect**: backdrop-blur-md, backdrop-blur-lg
- **Gradient Overlay**: bg-gradient-to-br from-[#00E5FF]/5 to-[#3B82F6]/5

## Breakpoints & Responsive

- **Mobile**: < 768px - Single column layouts
- **Tablet**: ≥ 768px (md) - 2-3 column layouts
- **Desktop**: ≥ 1024px (lg) - 4-6 column layouts
- **Large Desktop**: ≥ 1280px (xl) - Full-width containers

## Component Structure Patterns

### Common Patterns
1. **Card with Avatar**: Avatar circle + content area
2. **Icon Button**: Icon with hover state
3. **Dropdown Menu**: Arrow indicator, hover dropdown
4. **Stat Cards**: Number + label + optional delta
5. **Section Headers**: Title + subtitle + action link

### Layout Patterns
1. **Hero Section**: Full-width gradient background with centered content
2. **Content Grid**: Multi-column responsive grid
3. **Feature Cards**: Equal-width cards in grid
4. **News Strip**: Horizontal scrolling with custom scrollbar

## Mobile-Specific Styles

- **Mobile Menu**: Full-screen overlay with fixed inset-0 top-16
- **Touch Targets**: Minimum 44px height for buttons
- **Safe Areas**: Proper padding for mobile notches
- **Custom Scrollbar**: scrollbar-hide for mobile-friendly scrolling

## Design Decisions Summary

1. **Color Scheme**: Dark theme with cyan (#00E5FF) as primary accent
2. **Typography**: Modern sans-serif fonts (Space Grotesk + Inter)
3. **Shadows**: Subtle dark shadows with cyan glow effects for interactivity
4. **Animations**: Smooth transitions and micro-interactions
5. **Gradients**: Multiple gradient overlays for depth and visual interest
6. **Responsive**: Fully responsive with mobile-first approach

## References

- Figma Source: `/workspaces/JobsAI/ElectroBridge Web App Design/`
- Design System Files:
  - src/styles/theme.css (dark theme)
  - default_shadcn_theme.css (light theme reference)
  - src/styles/fonts.css (font imports)